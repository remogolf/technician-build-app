<script>
  let { line, onclick = null } = $props();
</script>

<button class="card" onclick={onclick}>
  <div class="top">
    <div>
      <h3>{line.name}</h3>
      <p>Per unit {line.perUnitRequired} · Run target {line.runTargetQty}</p>
    </div>

    <div class={`status ${line.ready ? 'ready' : 'missing'}`}>
      {#if line.ready}
        Ready
      {:else}
        Missing {line.missing}
      {/if}
    </div>
  </div>

  <div class="meta">
    <div><span>Need total</span><strong>{line.runRequired}</strong></div>
    <div><span>In WIP</span><strong>{line.wip}</strong></div>
    <div><span>Sources</span><strong>{line.sourceEntriesCount}</strong></div>
  </div>
</button>

<style>
  .card {
    width: 100%;
    border: none;
    border-radius: 16px;
    background: white;
    padding: 16px;
    text-align: left;
  }

  .top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
  }

  p {
    margin: 4px 0 0;
    color: #6b7280;
  }

  .status {
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .ready {
    background: #dcfce7;
    color: #15803d;
  }

  .missing {
    background: #fee2e2;
    color: #b91c1c;
  }

  .meta {
    margin-top: 12px;
    display: flex;
    gap: 18px;
    flex-wrap: wrap;
  }

  .meta div {
    display: grid;
    gap: 4px;
  }

  .meta span {
    font-size: 0.8rem;
    color: #6b7280;
  }
</style>