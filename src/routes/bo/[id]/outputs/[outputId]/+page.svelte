<script>
  import ScreenHeader from '$lib/components/ScreenHeader.svelte';
  import {
    getBuildOrder,
    getRunOutputById,
    assignSerialToOutput,
    reassignOutputSerial,
    reassignOutputChildStockEntry,
    getAvailableSerializedWipEntriesForBomLine
  } from '$lib/state/app-state.svelte.js';
  import { page } from '$app/stores';

  let bo = $derived(getBuildOrder($page.params.id));
  let output = $derived(
    bo ? getRunOutputById(bo.id, $page.params.outputId) : null
  );

  let serialInput = $state('');
  /** @type {Record<string, string>} */
  let selectedReplacements = $state({});

  $effect(() => {
    if (output) {
      serialInput = output.serial ?? '';
    }
  });

  function saveSerial() {
    if (!bo || !output) return;

    const value = (serialInput ?? '').trim();
    if (!value) return;

    if (output.status === 'built') {
      reassignOutputSerial(bo.id, output.outputId, value);
    } else {
      assignSerialToOutput(bo.id, output.outputId, value);
    }
  }

  /** @param {string} bomLineId @param {string} oldEntryId */
  function replaceChildSerial(bomLineId, oldEntryId) {
    if (!bo || !output) return;

    const key = `${bomLineId}-${oldEntryId}`;
    const newEntryId = (selectedReplacements[key] ?? '').trim();
    if (!newEntryId || newEntryId === oldEntryId) return;

    reassignOutputChildStockEntry(bo.id, output.outputId, bomLineId, oldEntryId, newEntryId);
  }

  function isAssigned() {
    return !!output?.serial?.trim();
  }

  function isDirty() {
    return (serialInput ?? '').trim() !== (output?.serial ?? '').trim();
  }
</script>

{#if bo && output}
  <ScreenHeader
    title={`Unit #${output.unitNumber}`}
    subtitle={bo.id}
    backHref={`/bo/${bo.id}/outputs`}
  />

  <section class="content">
    <div class="panel">
      <div class="info-row">
        <span>Output ID</span>
        <strong>{output.outputId}</strong>
      </div>

      <div class="info-row">
        <span>Status</span>
        <strong>
          {#if isDirty()}
            Unsaved changes
          {:else if isAssigned()}
            Serialized
          {:else}
            Awaiting serial
          {/if}
        </strong>
      </div>

      <div class="info-row">
        <span>Created</span>
        <strong>{new Date(output.createdAt).toLocaleString()}</strong>
      </div>
    </div>

    <div class="panel">
      <h2>Serial number</h2>

      <input
        class="serial-input"
        type="text"
        bind:value={serialInput}
        placeholder="Enter serial number"
      />

      <button
        type="button"
        class="primary"
        onclick={saveSerial}
        disabled={!serialInput.trim() || output.status !== 'built'}
      >
        {isAssigned() ? 'Update serial' : 'Save serial'}
      </button>
    </div>

    <div class="panel">
      <h2>Paired serialized components</h2>

      {#if output.childSerialAssignments?.length > 0}
        {#each output.childSerialAssignments as child (child.bomLineId)}
          <div class="child-panel">
            <div class="info-row">
              <span>{child.bomLineId}</span>
              <strong>Qty {child.stockEntryIds.length}</strong>
            </div>

            <ul>
              {#each child.stockEntryIds as eid (eid)}
                <li>
                  {eid}
                  <select
                    class="child-select"
                    bind:value={selectedReplacements[`${child.bomLineId}-${eid}`]}
                  >
                    <option value="">Replace</option>
                    {#each getAvailableSerializedWipEntriesForBomLine(bo.id, child.bomLineId) as cand (cand.wipEntryId)}
                      <option value={cand.wipEntryId}>{cand.partName} ({cand.wipEntryId})</option>
                    {/each}
                  </select>
                  <button
                    type="button"
                    class="secondary"
                    onclick={() => replaceChildSerial(child.bomLineId, eid)}
                    disabled={output.status !== 'built'}
                  >
                    Replace
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      {:else}
        <p class="hint">No child serial assignments recorded.</p>
      {/if}
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

  .info-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-row span {
    color: #6b7280;
  }

  h2 {
    margin: 0 0 12px;
    font-size: 1rem;
  }

  .serial-input {
    width: 100%;
    min-height: 48px;
    border: 1px solid #d1d5db;
    border-radius: 14px;
    padding: 0 14px;
    font-size: 1rem;
  }

  .primary {
    width: 100%;
    min-height: 48px;
    border: none;
    border-radius: 14px;
    font-weight: 700;
    margin-top: 12px;
    background: #111827;
    color: white;
  }

  .primary:disabled {
    opacity: 0.45;
  }
</style>
