<script>
  let {
    open = false,
    entry = null,
    destinations = [],
    selectedDestinationStockId = '',
    useOriginalSource = true,
    /** @type {(value: boolean) => void} */
    onToggleMode = () => {},
    /** @type {(stockId: string) => void} */
    onSelectDestination = () => {},
    /** @type {(event: MouseEvent) => void} */
    onClose = /** @type {(event: MouseEvent) => void} */ (() => {}),
    /** @type {(destinationStockId: string, qty: number) => void} */
    onConfirmReturn = () => {}
  } = $props();

  let qty = $state(1);
  let destSearch = $state('');

  let filteredDestinations = $state(/** @type {any[]} */ ([]));

  $effect(() => {
    const q = String(destSearch).trim().toLowerCase();

    const hits = destinations
      .filter((dest) => {
        if (!q) return true;
        const stockId = String(dest.stockId ?? '').toLowerCase();
        const location = String(dest.locationName ?? '').toLowerCase();
        return stockId.includes(q) || location.includes(q);
      })
      .sort((a, b) => String(a.locationName).localeCompare(String(b.locationName)));

    /** @type {Array<{locationName:string,entries:any[],totalQty:number}>} */
    const grouped = [];

    for (const dest of hits) {
      const loc = dest.locationName ?? 'Unknown location';
      let group = grouped.find((g) => g.locationName === loc);
      if (!group) {
        group = { locationName: loc, entries: [], totalQty: 0 };
        grouped.push(group);
      }
      group.entries.push(dest);
      group.totalQty += dest.qty ?? 0;
    }

    filteredDestinations = grouped;
  });

  $effect(() => {
    if (open) {
      qty = 1;
      destSearch = '';
    }
  });

  $effect(() => {
    if (!entry) return;
    if (entry.serial || entry.serialNumber) {
      qty = 1;
    } else if (qty > (entry.qty || 0)) {
      qty = entry.qty;
    }
  });
</script>

{#if open && entry}
  <button
    type="button"
    class="overlay"
    onclick={onClose}
    onkeydown={(event) => event.key === 'Escape' && onClose()}
    aria-label="Close return sheet"
  ></button>

  <div class="sheet">
    <div class="grabber"></div>

    <h2>Return {entry.partName}</h2>

    <div class="summary">
      <div><span>WIP qty</span><strong>{entry.qty}</strong></div>
      <div><span>Original source</span><strong>{entry.sourceLocationName}</strong></div>
      {#if entry.serial || entry.serialNumber}
        <div><span>Serial</span><strong>{entry.serial ?? entry.serialNumber}</strong></div>
      {/if}
    </div>

    <div class="section">
      <h3>Destination</h3>
      <div class="mode-list">
        <button
          type="button"
          class:mode-selected={useOriginalSource}
          class="mode"
          onclick={() => onToggleMode(true)}
        >
          <div>
            <strong>Original source</strong>
            <small>{entry.sourceLocationName || 'Unknown source'}</small>
          </div>
          <div>{useOriginalSource ? '✓' : '○'}</div>
        </button>

        <button
          type="button"
          class:mode-selected={!useOriginalSource}
          class="mode"
          onclick={() => onToggleMode(false)}
        >
          <div>
            <strong>Another location</strong>
            <small>Select destination below</small>
          </div>
          <div>{!useOriginalSource ? '✓' : '○'}</div>
        </button>
      </div>
    </div>

    {#if !useOriginalSource}
      <div class="section">
        <h3>Search destination</h3>
        <input
          type="text"
          placeholder="Search location or stock ID"
          bind:value={destSearch}
        />
      </div>

      <div class="destinations">
        {#if filteredDestinations.length === 0}
          <p class="hint">No destinations found.</p>
        {/if}

        {#each filteredDestinations as group (group.locationName)}
          <div class="location-group">
            <div class="location-header">
              <strong>{group.locationName}</strong>
              <small>{group.totalQty} available</small>
            </div>

            {#each group.entries as dest (dest.stockId)}
              <button
                type="button"
                class:selected={String(dest.stockId) === String(selectedDestinationStockId)}
                class="destination"
                onclick={() => onSelectDestination(String(dest.stockId))}
              >
                <div>
                  <strong>{dest.locationName}</strong>
                  <small>{dest.stockId}</small>
                </div>
                <div class="qty-pill">{dest.qty ?? '-'}</div>
              </button>
            {/each}
          </div>
        {/each}
      </div>

      <p class="hint">Selected destination: {selectedDestinationStockId || 'None'}</p>
    {/if}

    <div class="section">
      <h3>Quantity</h3>
      {#if !entry.serial && !entry.serialNumber}
        <div class="qty-row">
          <button type="button" onclick={() => (qty = Math.max(1, qty - 1))}>−</button>
          <div class="qty">{qty}</div>
          <button type="button" onclick={() => (qty = Math.min(entry.qty || 0, qty + 1))}>+</button>
        </div>
      {:else}
        <p class="hint">Serialized item — quantity fixed to 1</p>
      {/if}
    </div>

    <button
      type="button"
      class="primary"
      disabled={useOriginalSource ? !entry.sourceStockId : !selectedDestinationStockId}
      onclick={() => {
        const destination = useOriginalSource ? entry.sourceStockId : selectedDestinationStockId;
        if (!destination) return;
        const actualQty = entry.serial || entry.serialNumber ? 1 : qty;
        onConfirmReturn(destination, actualQty);
      }}
    >
      Return
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

  .mode-list,
  .destinations {
    display: grid;
    gap: 8px;
  }

  .mode,
  .destination {
    width: 100%;
    border: 2px solid transparent;
    border-radius: 14px;
    background: #f9fafb;
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    text-align: left;
  }

  .mode-selected,
  .destination.selected {
    border-color: #111827;
    background: #fff;
  }

  .mode small,
  .destination small {
    display: block;
    margin-top: 4px;
    color: #6b7280;
  }

  .qty-pill {
    min-width: 42px;
    height: 42px;
    border-radius: 12px;
    background: #111827;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
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

</style>