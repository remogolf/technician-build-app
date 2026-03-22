<script>
  let { requiredLines = [], onSelectLine = () => {} } = $props();
</script>

<div class="list">
  {#if requiredLines.length === 0}
    <div class="empty">No required BOM lines available.</div>
  {:else}
    {#each requiredLines as line (line.partId)}
      <button type="button" class="item" onclick={() => onSelectLine(line)}>
        <div>
          <strong>{line.partName}</strong>
          <small>{line.wip} / {line.required} in WIP</small>
        </div>
        <div class="qty-pill">{line.missing}</div>
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
    text-align: left;
  }
  .item small { color: #6b7280; }
  .qty-pill {
    min-width: 36px;
    height: 32px;
    border-radius: 10px;
    background: #111827;
    color: white;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .empty {
    background: #f9fafb;
    border: 1px dashed #d1d5db;
    border-radius: 12px;
    padding: 14px;
    color: #6b7280;
    text-align: center;
  }
</style>
