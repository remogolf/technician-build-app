<script>
  import ScreenHeader from '$lib/components/ScreenHeader.svelte';
  import { getBuildOrder, getBoRemainingQty, startRun } from '$lib/state/app-state.svelte.js';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let bo = $derived(getBuildOrder($page.params.id));
  let remaining = $derived(bo ? getBoRemainingQty(bo.id) : 0);
  let qty = $state(1);

  $effect(() => {
    if (remaining > 0) {
      qty = Math.min(5, remaining);
    }
  });

  async function confirmStartRun() {
    if (!bo || remaining <= 0) return;
    startRun(bo.id, qty);
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    await goto(`/bo/${bo.id}/staging`, /** @type {any} */ ({ resolve: true }));
  }
</script>

{#if bo}
  <ScreenHeader
    title="Start run"
    subtitle={bo.id}
    backHref={`/bo/${bo.id}`}
  />

  <section class="content">
    <div class="panel">
      <div class="row">
        <span>Build order remaining</span>
        <strong>{remaining}</strong>
      </div>
    </div>

    <div class="panel">
      <h2>Run target quantity</h2>

      <div class="qty-row">
        <button type="button" onclick={() => qty = Math.max(1, qty - 1)}>-</button>
        <div class="qty">{qty}</div>
        <button type="button" onclick={() => qty = Math.min(remaining, qty + 1)}>+</button>
      </div>

      <button
        type="button"
        class="primary"
        onclick={confirmStartRun}
        disabled={remaining <= 0}
      >
        Start run
      </button>
    </div>
  </section>
{/if}

<style>
  .content {
    padding: 12px 16px 24px;
  }

  .panel {
    background: white;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 12px;
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  h2 {
    margin: 0 0 14px;
    font-size: 1rem;
  }

  .qty-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .qty-row button {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 12px;
    background: #111827;
    color: white;
    font-size: 1.2rem;
  }

  .qty {
    min-width: 64px;
    text-align: center;
    font-size: 1.2rem;
    font-weight: 700;
  }

  .primary {
    width: 100%;
    min-height: 50px;
    border: none;
    border-radius: 14px;
    background: #111827;
    color: white;
    font-weight: 700;
  }
</style>