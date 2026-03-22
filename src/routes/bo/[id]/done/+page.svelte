<script>
  /* eslint-disable svelte/no-navigation-without-resolve */
  import ScreenHeader from '$lib/components/ScreenHeader.svelte';
  import { getBuildOrder } from '$lib/state/app-state.svelte.js';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let bo = $derived(getBuildOrder($page.params.id));
</script>

{#if bo}
  <ScreenHeader
    title="Unit completed"
    subtitle={bo.id}
    backHref="/"
  />

  <section class="content">
    <div class="success">
      <div class="icon">✅</div>
      <h2>Assembly recorded</h2>
      <p>{bo.built} / {bo.target} units completed</p>
    </div>

    <div class="actions">
      <button
        class="primary"
        type="button"
        onclick={async (event) => {
          event.preventDefault();
          const opts = /** @type {any} */ ({ resolve: true });
          await goto(`/bo/${bo.id}`, opts);
        }}
      >
        Build next unit
      </button>
      <button
        class="secondary"
        type="button"
        onclick={async (event) => {
          event.preventDefault();
          const opts = /** @type {any} */ ({ resolve: true });
          await goto('/', opts);
        }}
      >
        Back to dashboard
      </button>
    </div>
  </section>
{/if}

<style>
  .content {
    padding: 24px 16px;
  }

  .success {
    background: white;
    border-radius: 20px;
    padding: 28px 20px;
    text-align: center;
  }

  .icon {
    font-size: 2rem;
    margin-bottom: 12px;
  }

  h2 {
    margin: 0 0 8px;
  }

  p {
    margin: 0;
    color: #6b7280;
  }

  .actions {
    margin-top: 16px;
    display: grid;
    gap: 12px;
  }

  .primary,
  .secondary {
    display: flex;
    min-height: 52px;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    text-decoration: none;
    font-weight: 700;
  }

  .primary {
    background: #111827;
    color: white;
  }

  .secondary {
    background: white;
    color: #111827;
  }
</style>