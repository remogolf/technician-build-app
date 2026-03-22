<script>
  import ScreenHeader from '$lib/components/ScreenHeader.svelte';
  import StatusChip from '$lib/components/StatusChip.svelte';
  import BottomActionBar from '$lib/components/BottomActionBar.svelte';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import {
    getBuildOrder,
    getReadyCount,
    getActiveRun
  } from '$lib/state/app-state.svelte.js';
  import { page } from '$app/stores';

  let bo = $derived(getBuildOrder($page.params.id));
  let readyCount = $derived(bo ? getReadyCount(bo.id) : 0);
  let run = $derived(bo ? getActiveRun(bo.id) : null);
</script>

{#if bo}
  <ScreenHeader
    title={bo.id}
    subtitle={`${bo.built} / ${bo.target} completed`}
    backHref="/"
  />

  <section class="content">
    <div class="panel">
      <div class="row">
        <StatusChip status={bo.status} />
        <strong>{bo.built} / {bo.target}</strong>
      </div>

      <div class="spacer"></div>
      <ProgressBar value={bo.built} max={bo.target} />
    </div>

    <div class="panel">
      <h2>Production staging</h2>
      <div class="info-row">
        <span>WIP bucket</span>
        <strong>{bo.wipLocation}</strong>
      </div>
      <div class="info-row">
        <span>Ready BOM lines</span>
        <strong>{readyCount} / {bo.bom.length}</strong>
      </div>
      <div class="info-row">
        <span>Source entries</span>
        <strong>{bo.stockEntries.length}</strong>
      </div>
      {#if run}
        <div class="info-row">
          <span>Active run</span>
          <strong>{run.completedQty} / {run.targetQty}</strong>
        </div>
      {/if}
    </div>
  </section>

  <BottomActionBar
    href={run ? `/bo/${bo.id}/staging` : `/bo/${bo.id}/run`}
    label={run ? 'Resume run' : 'Start run'}
  />
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

  .row,
  .info-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .info-row {
    padding: 10px 0;
    border-bottom: 1px solid #eee;
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .spacer {
    height: 12px;
  }

  h2 {
    margin: 0 0 10px;
    font-size: 1rem;
  }
</style>