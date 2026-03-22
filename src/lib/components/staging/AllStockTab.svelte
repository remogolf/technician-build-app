<script>
  let { sourceGroups = [], onSelectStockLine = () => {} } = $props();
</script>

<div class="list">
  {#if sourceGroups.length === 0}
    <div class="empty">No stock data available.</div>
  {:else}
    {#each sourceGroups as group (group.partId)}
      <button type="button" class="item" onclick={() => onSelectStockLine(group)}>
        <div>
          <strong>{group.partName}</strong>
          <small>{group.entries.length} stock entries</small>
        </div>
        <div class="qty-pill">{group.totalQty}</div>
      </button>
    {/each}
  {/if}
</div>

<style>
  .list { display: grid; gap: 10px; }
  .item {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .item small { color: #6b7280; }
  .qty-pill {
    min-width: 36px;
    height: 28px;
    border-radius: 8px;
    background: #111827;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 700;
  }
  .empty { background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px; padding: 14px; text-align: center; color: #6b7280; }
</style>
