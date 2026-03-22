<script>
  let { wipGroups = [], onOpenGroup = () => {} } = $props();
</script>

<div class="list">
  {#if wipGroups.length === 0}
    <div class="empty">No WIP entries. Move some parts to WIP first.</div>
  {:else}
    {#each wipGroups as entry (entry.partId)}
      <div class="wip-card">
        <div class="top">
          <div>
            <strong>{entry.partName}</strong>
            <small>{entry.sourceLocationNames.join(', ') || 'No source'}</small>
          </div>
          <div class="qty-pill">{entry.totalQty}</div>
        </div>

        <div class="meta">
          <span>Bulk: {entry.bulkQty}</span>
          <span>Serialized: {entry.serializedCount}</span>
        </div>

        <button class="subentry" type="button" onclick={() => onOpenGroup(entry)}>
          <div>
            <strong>View staged items</strong>
            <small>{entry.rawEntries.length} entries</small>
          </div>
          <div class="qty-mini">→</div>
        </button>
      </div>
    {/each}
  {/if}
</div>

<style>
  .list { display: grid; gap: 10px; }
  .wip-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 12px;
  }
  .top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .meta { margin-top: 8px; color: #6b7280; display: flex; gap: 12px; font-size: 0.9rem; }
  .subentry {
    margin-top: 10px;
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    background: #f9fafb;
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .subentry small { color: #6b7280; }
  .qty-pill {
    min-width: 36px;
    height: 28px;
    border-radius: 8px;
    background: #111827;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }
  .qty-mini { min-width: 24px; text-align: right; }
  .empty { background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px; padding: 14px; text-align: center; color: #6b7280; }
</style>
