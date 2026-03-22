<script>
  import ScreenHeader from '$lib/components/ScreenHeader.svelte';
  import {
    getBuildOrder,
    getActiveRun,
    getWipEntriesGrouped,
    clearRun
  } from '$lib/state/app-state.svelte.js';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let bo = $derived(getBuildOrder($page.params.id));
  let run = $derived(bo ? getActiveRun(bo.id) : null);
  let wipGroups = $derived(bo ? getWipEntriesGrouped(bo.id) : []);

  /* eslint-disable svelte/no-navigation-without-resolve */
  async function finishRun() {
    if (!bo) return;
    clearRun(bo.id);
    const opts = /** @type {any} */ ({ resolve: true });
    await goto(`/bo/${bo.id}`, opts);
  }
</script>

{#if bo}
  <ScreenHeader
    title="Run summary"
    subtitle={bo.id}
    backHref={`/bo/${bo.id}/serial`}
  />

  <section class="content">
    {#if run}
      <div class="panel">
        <div class="info-row">
          <span>Run target</span>
          <strong>{run.targetQty}</strong>
        </div>
        <div class="info-row">
          <span>Completed</span>
          <strong>{run.completedQty}</strong>
        </div>
        <div class="info-row">
          <span>Serialized outputs</span>
          <strong>{run.outputs.length}</strong>
        </div>
      </div>
    {/if}

    <div class="panel">
      <h2>Leftovers in WIP</h2>

      {#if wipGroups.length === 0}
        <p class="hint">No leftover stock remains in WIP.</p>
      {:else}
        <div class="list">
          {#each wipGroups as group (group.partId)}
            <div class="wip-row">
              <span>{group.partName}</span>
              <strong>{group.totalQty}</strong>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="panel">
      <button type="button" class="primary" onclick={finishRun}>
        Finish run
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

  .info-row,
  .wip-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
  }

  .info-row:last-child,
  .wip-row:last-child {
    border-bottom: none;
  }

  h2 {
    margin: 0 0 12px;
    font-size: 1rem;
  }

  .hint {
    margin: 0;
    color: #6b7280;
  }

  .primary {
    width: 100%;
    min-height: 48px;
    border: none;
    border-radius: 14px;
    background: #111827;
    color: white;
    font-weight: 700;
  }
</style>