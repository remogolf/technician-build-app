<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';

  import ScreenHeader from '$lib/components/ScreenHeader.svelte';
  import StatusChip from '$lib/components/StatusChip.svelte';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import { auth } from '$lib/stores/auth';
  import { fetchBuildOrders } from '$lib/api/build-orders';

  let loading = true;
  let error = '';
  /** @type {Array<any>} */
  let buildOrders = [];

  async function loadBuildOrders() {
    loading = true;
    error = '';

    try {
      const session = get(auth);
      console.log('loadBuildOrders session', session);

      if (!session?.token || !session?.serverUrl) {
        console.warn('No authenticated session; redirecting to login');
        await goto('/login');
        return;
      }

      buildOrders = await fetchBuildOrders();
      console.log('loadBuildOrders result', buildOrders);
    } catch (/** @type {any} */ err) {
      console.error('Failed to load build orders', err);
      error = err?.message || 'Failed to load build orders';
    } finally {
      loading = false;
    }
  }

  onMount(loadBuildOrders);
</script>

<ScreenHeader
  title="Build Orders"
  subtitle={loading ? 'Loading…' : `${buildOrders.length} orders`}
/>

<section class="content">
  {#if loading}
    <div class="panel">
      <p>Loading build orders…</p>
    </div>
  {:else if error}
    <div class="panel">
      <p class="error">{error}</p>
      <button class="retry" on:click={loadBuildOrders}>Retry</button>
    </div>
  {:else if buildOrders.length === 0}
    <div class="panel">
      <p>No build orders found.</p>
    </div>
  {:else}
    {#each buildOrders as bo}
      <button class="card" on:click={() => goto(`/bo/${bo.id}`)}>
        <div class="top-row">
          <div>
            <div class="ref">{bo.reference}</div>
            <div class="name">{bo.partName}</div>
          </div>
          <StatusChip status={bo.status} />
        </div>

        <div class="qty-row">
          <span>{bo.built} / {bo.target} completed</span>
          <strong>{bo.remaining} remaining</strong>
        </div>

        <div class="progress-wrap">
          <ProgressBar value={bo.built} max={bo.target} />
        </div>
      </button>
    {/each}
  {/if}
</section>

<style>
  .content {
    padding: 12px 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .panel,
  .card {
    background: white;
    border-radius: 16px;
    padding: 16px;
    border: none;
    width: 100%;
    text-align: left;
    box-sizing: border-box;
  }

  .card {
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  .top-row,
  .qty-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .qty-row {
    margin: 12px 0 10px;
    font-size: 0.95rem;
  }

  .ref {
    font-weight: 700;
    font-size: 1rem;
  }

  .name {
    color: #555;
    margin-top: 2px;
  }

  .progress-wrap {
    margin-top: 8px;
  }

  .error {
    color: #c62828;
    margin-bottom: 12px;
  }

  .retry {
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid #ddd;
    background: white;
  }
</style>
