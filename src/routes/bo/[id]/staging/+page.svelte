<script>
  /**
   * @typedef {Object} BulkSelection
   * @property {string} stockId
   * @property {number} qty
   *
   * @typedef {Object} SerializedSelection
   * @property {string[]} stockIds
   *
   * @typedef {BulkSelection | SerializedSelection} SourceSelection
   */
  import ScreenHeader from '$lib/components/ScreenHeader.svelte';
  import BottomActionBar from '$lib/components/BottomActionBar.svelte';
  import RequiredTab from '$lib/components/staging/RequiredTab.svelte';
  import WipTab from '$lib/components/staging/WipTab.svelte';
  import AllStockTab from '$lib/components/staging/AllStockTab.svelte';
  import SourcePickerSheet from '$lib/components/SourcePickerSheet.svelte';
  import WipReturnSheet from '$lib/components/WipReturnSheet.svelte';
  import {
    getBuildOrder,
    getRequiredPartsState,
    getReadyCount,
    canStageFullRun,
    getBomLineSourceOptions,
    getWipDisplayEntries,
    moveFromSourceToWip,
    // getWipEntriesGrouped,
    getAllSourcePartsSummary,
    returnFromWip,
    getReturnDestinationsForWipEntry,
    getActiveRun,
    getBomLineState
    } from '$lib/state/app-state.svelte.js';

  let { data } = $props();

  let bo = $derived(getBuildOrder(data.bo.id));
  let requiredLines = $derived(bo ? getRequiredPartsState(bo.id) : []);
  let readyCount = $derived(bo ? getReadyCount(bo.id) : 0);
  let run = $derived(bo ? getActiveRun(bo.id) : null);
  let readyToAssemble = $derived(bo ? canStageFullRun(bo.id) : false);
  let wipGroups = $derived(bo ? getWipDisplayEntries(bo.id) : []);
  let sourceGroups = $derived(bo ? getAllSourcePartsSummary(bo.id) : []);
    let useOriginalReturnSource = $state(true);
    let selectedReturnDestinationStockId = $state('');


  let activeTab = $state('required');

  let sourceSheetOpen = $state(false);
  let selectedPartId = $state('');
  let selectedStockId = $state('');

  let selectedLine = $derived(
    bo && selectedPartId
      ? getBomLineState(bo.id, selectedPartId)
      : null
  );

  let returnSheetOpen = $state(false);
  let selectedWipEntryId = $state('');
  let selectedWipEntry = $derived(
    bo && selectedWipEntryId
      ? bo.wipEntries.find((/** @type {any} */ entry) => entry.wipEntryId === selectedWipEntryId) ?? null
      : null
  );

  /**
   * @param {any} line
   */
  function openRequiredLine(line) {
    selectedPartId = line.partId;
    selectedStockId = '';
    sourceSheetOpen = true;
  }

  function closeSourceSheet() {
    sourceSheetOpen = false;
    selectedPartId = '';
    selectedStockId = '';
  }

  /**
   * @param {SourceSelection} selection
   */
  function confirmMoveToWip(selection) {
    if (!bo || !selection) return;

    if ('stockIds' in selection && selection.stockIds?.length > 0) {
      for (const stockId of selection.stockIds) {
        moveFromSourceToWip(bo.id, stockId, 1);
      }
      closeSourceSheet();
      return;
    }

    if ('stockId' in selection && selection.stockId && selection.qty > 0) {
      moveFromSourceToWip(bo.id, selection.stockId, selection.qty);
      closeSourceSheet();
    }
  }

  /**
   * @param {any} entry
   */
/** @param {any} entry */
  function openWipEntry(entry) {
    selectedWipEntryId = entry?.wipEntryId;
    useOriginalReturnSource = true;
    selectedReturnDestinationStockId = entry?.sourceStockId || '';
    returnSheetOpen = true;
  }

  /** @param {any} group */
  function handleWipGroupOpen(group) {
    if (!group?.rawEntries?.length) return;
    openWipEntry(group.rawEntries[0]);
  }

function closeReturnSheet() {
  returnSheetOpen = false;
  selectedWipEntryId = '';
  useOriginalReturnSource = true;
  selectedReturnDestinationStockId = '';
}

  /**
   * @param {number} qty
   */
/**
 * @param {string} [destinationStockId]
 * @param {number} [qty]
 */
function confirmReturn(destinationStockId, qty = 1) {
  if (!bo || !selectedWipEntry) return;

  const destination = destinationStockId
    || (useOriginalReturnSource ? selectedWipEntry.sourceStockId : selectedReturnDestinationStockId);

  if (!destination) return;

  const actualQty = selectedWipEntry.serial || selectedWipEntry.serialNumber ? 1 : qty;

  const ok = returnFromWip(bo.id, selectedWipEntry.wipEntryId, actualQty, destination);
  if (!ok) return;

  closeReturnSheet();
}

let returnDestinations = $derived(
  bo && selectedWipEntry
    ? getReturnDestinationsForWipEntry(bo.id, selectedWipEntry.wipEntryId)
    : []
);

  let selectedLineSources = $derived(
    bo && selectedPartId
      ? getBomLineSourceOptions(bo.id, selectedPartId)
      : []
  );
</script>

{#if bo}
  <ScreenHeader
    title="Staging"
    subtitle={bo.id}
    backHref={`/bo/${bo.id}`}
  />

  <section class="content">
    <div class="summary">
      <div><span>WIP bucket</span><strong>{bo.wipLocation}</strong></div>
      <div><span>Run target</span><strong>{run ? run.targetQty : '-'}</strong></div>
      <div><span>Ready lines</span><strong>{readyCount} / {bo.bom.length}</strong></div>
    </div>

    {#if !run}
      <div class="empty">No active run. Start a run first.</div>
    {:else}
      <div class="tabs">
        <button class:active={activeTab === 'required'} onclick={() => (activeTab = 'required')}>
          Required
        </button>
        <button class:active={activeTab === 'wip'} onclick={() => (activeTab = 'wip')}>
          WIP
        </button>
        <button class:active={activeTab === 'source'} onclick={() => (activeTab = 'source')}>
          All Stock
        </button>
      </div>

      {#if activeTab === 'required'}
        <RequiredTab requiredLines={requiredLines} onSelectLine={openRequiredLine} />
      {/if}

      {#if activeTab === 'wip'}
        <WipTab wipGroups={wipGroups} onOpenGroup={handleWipGroupOpen} />
      {/if}

      {#if activeTab === 'source'}
        <AllStockTab sourceGroups={sourceGroups} onSelectStockLine={openRequiredLine} />
      {/if}
    {/if}
  </section>

  <BottomActionBar
    href={readyToAssemble ? `/bo/${bo.id}/assemble` : ''}
    label="Go to assembly"
    disabled={!readyToAssemble}
  />

  <SourcePickerSheet
    open={sourceSheetOpen && !!selectedLine}
    line={selectedLine}
    sourceEntries={selectedLineSources}
    selectedStockId={selectedStockId}
    onSelectStock={(/** @type {string} */ stockId) => (selectedStockId = stockId)}
    onClose={closeSourceSheet}
    onConfirm={confirmMoveToWip}
  />

<WipReturnSheet
  open={returnSheetOpen}
  entry={selectedWipEntry}
  destinations={returnDestinations}
  selectedDestinationStockId={selectedReturnDestinationStockId}
  useOriginalSource={useOriginalReturnSource}
  onToggleMode={(/** @type {boolean} */ value) => {
    useOriginalReturnSource = value;
    if (value && selectedWipEntry) {
      selectedReturnDestinationStockId = selectedWipEntry.sourceStockId;
    }
  }}
  onSelectDestination={(/** @type {string} */ stockId) => {
    selectedReturnDestinationStockId = stockId;
  }}
  onClose={closeReturnSheet}
  onConfirmReturn={confirmReturn}
/>
{/if}

<style>
  .content {
    padding: 12px 16px 24px;
  }

  .summary {
    background: white;
    border-radius: 16px;
    padding: 16px;
    display: grid;
    gap: 10px;
    margin-bottom: 12px;
  }

  .summary div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .summary span {
    color: #6b7280;
  }

  .tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }

  .tabs button {
    min-height: 42px;
    border: none;
    border-radius: 12px;
    background: #e5e7eb;
    font-weight: 700;
  }

  .tabs button.active {
    background: #111827;
    color: white;
  }

  .empty {
    background: white;
    border-radius: 16px;
    padding: 18px;
    color: #6b7280;
    text-align: center;
  }



</style>