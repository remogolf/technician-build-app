<script>
  let {
    open = false,
    line = null,
    sourceEntries = [],
    selectedStockId = '',
    /** @type {(stockId: string) => void} */
    onSelectStock = () => {},
    /** @type {(event: MouseEvent) => void} */
    onClose = /** @type {(event: MouseEvent) => void} */ (() => {}),
    /**
     * @type {(selection: {stockId?: string, qty?: number, stockIds?: string[]}) => void}
     */
    onConfirm = () => {}
  } = $props();

  let qty = $state(1);
  let search = $state('');
  let selectedStockIds = $state(/** @type {string[]} */ ([]));

  let selectedEntry = $derived(
    sourceEntries.find((entry) => String(entry.stockId) === String(selectedStockId)) ?? null
  );

  let maxQty = $state(1);

  $effect(() => {
    if (!selectedEntry || !line) {
      maxQty = 1;
      return;
    }

    maxQty = selectedEntry.isSerialized
      ? 1
      : Math.max(1, Math.min(selectedEntry.qty, line.missing));
  });

  $effect(() => {
    if (open) {
      qty = 1;
      search = '';
      selectedStockIds = [];
      selectedStockId = '';
    }
  });

  $effect(() => {
    if (selectedEntry?.isSerialized) {
      qty = 1;
    } else if (qty > maxQty) {
      qty = maxQty;
    }
  });

  let filteredGroups = $state(/** @type {any[]} */ ([]));

  $effect(() => {
    const q = String(search ?? '').trim().toLowerCase();
    /** @type {Record<string, any>} */
    const byLocation = {};

    for (const entry of sourceEntries) {
      const location = entry.locationName ?? 'Unknown location';
      const isMatch = !q ||
        String(entry.serial ?? '').toLowerCase().includes(q) ||
        String(entry.stockId).toLowerCase().includes(q);

      if (!isMatch) continue;

      if (!byLocation[location]) {
        byLocation[location] = {
          locationName: location,
          entries: [],
          totalQty: 0,
          serializedCount: 0,
          bulkQty: 0
        };
      }

      const group = byLocation[location];
      group.entries.push(entry);
      group.totalQty += entry.qty;

      if (entry.isSerialized) {
        group.serializedCount += 1;
      } else {
        group.bulkQty += entry.qty;
      }
    }

    filteredGroups = Object.values(byLocation);
  });

  /** @param {string | number} stockId */
  function isSerialSelected(stockId) {
    return selectedStockIds.includes(String(stockId));
  }

  /** @param {string | number} stockId */
  function toggleSerial(stockId) {
    if (!line) return;

    const id = String(stockId);
    let next = [...selectedStockIds];

    if (next.includes(id)) {
      next = next.filter((item) => item !== id);
    } else {
      if (line.missing === 1) {
        next = [];
      }

      if (next.length < line.missing) {
        next.push(id);
      }
    }

    selectedStockIds = next;
  }

  function canConfirm() {
    if (!line) return false;

    if (selectedStockIds.length > 0) {
      return selectedStockIds.length <= line.missing;
    }

    return Boolean(selectedStockId && qty > 0);
  }

  function handleConfirm() {
    if (selectedStockIds.length > 0) {
      onConfirm({ stockIds: [...selectedStockIds] });
    } else {
      onConfirm({ stockId: selectedStockId, qty });
    }
  }
</script>

{#if open && line}
  <button
    type="button"
    class="overlay"
    onclick={onClose}
    onkeydown={(event) => event.key === 'Escape' && onClose()}
    aria-label="Close source picker"
  ></button>

  <div class="sheet">
    <div class="grabber"></div>

    <h2>Move {line.name}</h2>

    <div class="summary">
      <div><span>Required</span><strong>{line.required}</strong></div>
      <div><span>Currently in WIP</span><strong>{line.wip}</strong></div>
      <div><span>Missing</span><strong>{line.missing}</strong></div>
    </div>

    <div class="section">
      <h3>Search source</h3>
      <input
        type="text"
        placeholder="Search serial or stock ID"
        bind:value={search}
      />
    </div>

    <div class="section">
      <h3>Source results</h3>

      {#if filteredGroups.length === 0}
        <p class="hint">No matching source entries.</p>
      {:else}
        {#each filteredGroups as group (group.locationName)}
          <div class="location-group">
            <div class="location-header">
              <strong>{group.locationName}</strong>
              <small>{group.totalQty} available</small>
            </div>

            <div class="entry-list">
              {#each group.entries as entry (entry.stockId)}
                <button
                  class:row-selected={isSerialSelected(entry.stockId)}
                  class="entry-row"
                  type="button"
      onclick={() => {
                    if (entry.isSerialized) {
                      toggleSerial(entry.stockId);
                      selectedStockId = '';

                    } else {
                      selectedStockIds = [];
                      selectedStockId = String(entry.stockId);
                      qty = Math.min(Math.max(1, qty), entry.qty);
                      onSelectStock(String(entry.stockId));
                    }
                  }}
                >
                  <div>
                    <div>{entry.serial ?? `Stock ${entry.stockId}`}</div>
                    <small>
                      {#if entry.isSerialized}
                        {entry.stockId}
                      {:else}
                        {entry.labelSecondary} · {entry.qty} qty
                      {/if}
                    </small>
                  </div>

                  <div class="selector">
                    {#if entry.isSerialized}
                      {#if isSerialSelected(entry.stockId)} ✓ {:else} ○ {/if}
                    {:else}
                      {entry.qty}
                    {/if}
                  </div>
                </button>
              {/each}
            </div>

            <hr />
          </div>
        {/each}
      {/if}
    </div>

    <div class="section">
      <div class="selection-summary">
        <span>
          Selected {selectedStockIds.length || (selectedStockId ? 1 : 0)} / {line.missing}
        </span>
      </div>
    </div>

    {#if selectedStockIds.length > 0}
      <div class="section">
        <h3>Selected</h3>
        <p class="hint">Selected {selectedStockIds.length} / {line.missing}</p>
      </div>
    {:else if selectedStockId && selectedEntry && !selectedEntry.isSerialized}
      <div class="section">
        <h3>Quantity</h3>
        <div class="qty-row">
          <button type="button" onclick={() => (qty = Math.max(1, qty - 1))}>−</button>
          <div class="qty">{qty}</div>
          <button type="button" onclick={() => (qty = Math.min(maxQty, qty + 1))}>+</button>
        </div>
        <p class="hint">Available in selected source: {selectedEntry.qty}</p>
      </div>
    {:else if selectedStockId && selectedEntry && selectedEntry.isSerialized}
      <div class="section">
        <h3>Selected serial</h3>
        <p class="hint">{selectedEntry.serial ?? 'Serialized item'} — quantity fixed to 1</p>
      </div>
    {/if}

    <button
      class="primary"
      disabled={!canConfirm()}
      onclick={handleConfirm}
    >
      Move to WIP
    </button>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 20;
  }

  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    max-width: 480px;
    margin: 0 auto;
    background: white;
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    padding: 12px 16px 20px;
    z-index: 21;
    max-height: 85vh;
    overflow: auto;
  }

  .grabber {
    width: 48px;
    height: 5px;
    border-radius: 999px;
    background: #d1d5db;
    margin: 0 auto 14px;
  }

  h2 {
    margin: 0 0 16px;
    text-align: center;
  }

  .summary {
    display: grid;
    gap: 10px;
    margin-bottom: 16px;
  }

  .summary div {
    display: flex;
    justify-content: space-between;
    background: #f9fafb;
    border-radius: 12px;
    padding: 12px 14px;
  }

  .section {
    margin-top: 16px;
  }

  h3 {
    margin: 0 0 10px;
    font-size: 0.95rem;
  }

  .location-group {
    margin-bottom: 10px;
    border-top: 1px solid #e5e7eb;
    padding-top: 10px;
  }

  .location-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: #374151;
    margin-bottom: 6px;
  }

  .entry-list {
    display: grid;
    gap: 4px;
  }

  .entry-row {
    width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: white;
    padding: 8px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .entry-row.row-selected {
    border-color: #2563eb;
    background: #e0e7ff;
  }

  .selector {
    font-weight: 700;
    color: #111827;
  }

  .selection-summary {
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #f9fafb;
  }

  .qty-row {
    display: flex;
    justify-content: center;
    gap: 12px;
    align-items: center;
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
    min-width: 56px;
    text-align: center;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .hint {
    margin: 10px 0 0;
    color: #6b7280;
    text-align: center;
  }

  .location-group {
    margin-bottom: 10px;
    border-top: 1px solid #e5e7eb;
    padding-top: 10px;
  }

  .location-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: #374151;
    margin-bottom: 6px;
  }

  .entry-list {
    display: grid;
    gap: 4px;
  }

  .entry-row {
    width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: white;
    padding: 8px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .entry-row.row-selected {
    border-color: #2563eb;
    background: #e0e7ff;
  }

  .selector {
    font-weight: 700;
    color: #111827;
  }

  .selection-summary {
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #f9fafb;
  }

  .primary {
    margin-top: 18px;
    width: 100%;
    min-height: 50px;
    border: none;
    border-radius: 14px;
    background: #111827;
    color: white;
    font-weight: 700;
  }

  .primary:disabled {
    opacity: 0.45;
  }
</style>