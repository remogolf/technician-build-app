<script>
  import ScreenHeader from '$lib/components/ScreenHeader.svelte';
  import {
    getBuildOrder,
    getActiveRun,
    getRunStagedOutputs,
    createStagedOutput,
    updateStagedOutputSerial,
    getSerializedTrackedBomLines,
    getAvailableSerializedWipEntriesForBomLine,
    assignSerializedChildToStagedOutput,
    removeSerializedChildFromStagedOutput,
    deleteOrCancelStagedOutput,
    isStagedOutputReady,
    completeStagedOutput,
    getNextStagedUnitNumber
  } from '$lib/state/app-state.svelte.js';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let bo = $derived(getBuildOrder($page.params.id));
  let run = $derived(bo ? getActiveRun(bo.id) : null);
  let stagedOutputs = $derived(bo ? getRunStagedOutputs(bo.id) : []);
  let stagedBomLines = $derived(bo ? getSerializedTrackedBomLines(bo.id) : []);
  let instruction = $derived(bo?.assemblyInstruction ?? null);

  /** @type {Record<string, string>} */
  let selectedCandidate = $state({});

  function createStaged() {
    if (!bo || !run) return;

    const remainingQty = run.targetQty - run.completedQty;
    const activeStagedCount = stagedOutputs.filter((/** @type {{ status: string }} */ stage) => stage.status !== 'cancelled').length;
    if (activeStagedCount >= remainingQty) return;

    const hasWip = bo.wipEntries.some((/** @type {{ qty: number }} */ entry) => entry.qty > 0);
    if (!hasWip) return;

    createStagedOutput(bo.id, getNextStagedUnitNumber(bo.id));
  }

  /** @param {any} shownStage */
  function completeStage(shownStage) {
    if (!bo || !run) return;
    if (!isStagedOutputReady(bo.id, shownStage.stagedId)) return;

    completeStagedOutput(bo.id, shownStage.stagedId);
  }

  function goToOutputs() {
    if (!bo) return;
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(`/bo/${bo.id}/outputs`, /** @type {any} */ ({ resolve: true }));
  }
</script>

{#if bo}
  <ScreenHeader
    title="Assemble"
    subtitle={`BO ${bo.id}`}
    backHref={`/bo/${bo.id}/staging`}
  />

  <section class="content">
    {#if run}
      <div class="panel">
        <h2>Run progress</h2>

        <div class="info-row">
          <span>Target</span>
          <strong>{run.targetQty}</strong>
        </div>

        <div class="info-row">
          <span>Completed</span>
          <strong>{run.completedQty}</strong>
        </div>

        <div class="info-row">
          <span>Remaining</span>
          <strong>{run.targetQty - run.completedQty}</strong>
        </div>
      </div>

      <div class="panel">
        <h2>Assembly instruction</h2>

        {#if instruction?.url}
          <div class="info-row">
            <span>Document</span>
            <strong>{instruction.title || 'Assembly Instruction'}</strong>
          </div>

          {#if instruction.revision}
            <div class="info-row">
              <span>Revision</span>
              <strong>{instruction.revision}</strong>
            </div>
          {/if}

          <button
            type="button"
            class="instruction-link"
            onclick={() => {
              // eslint-disable-next-line svelte/no-navigation-without-resolve
              goto(instruction.url, /** @type {any} */ ({ replaceState: false }));
            }}
          >
            Open assembly instruction
          </button>
        {:else}
          <p class="hint">No assembly instruction linked.</p>
        {/if}
      </div>

      <div class="panel">
        <h2>Staged outputs</h2>

        <button
          type="button"
          class="primary"
          onclick={createStaged}
          disabled={!run || run.completedQty >= run.targetQty || stagedOutputs.filter((/** @type {{ status: string }} */ stage) => stage.status !== 'cancelled').length >= (run.targetQty - run.completedQty)}
        >
          Create staged output
        </button>

        <button
          type="button"
          class="secondary"
          onclick={goToOutputs}
          disabled={!run || !stagedOutputs.length}
        >
          View outputs
        </button>
      </div>

      {#if stagedOutputs.length > 0}
        <div class="panel">
          <h2>Active staged outputs</h2>

          {#each stagedOutputs as stage (stage.stagedId)}
            <div class="stage-card">
              <div class="stage-header">
                <strong>Unit #{stage.unitNumber}</strong>
                <span class="stage-status">{stage.status}</span>
              </div>

              <div class="info-row">
                <span>Output serial</span>
                <input
                  type="text"
                  class="serial-input"
                  value={stage.outputSerial}
                  oninput={(e) => updateStagedOutputSerial(bo.id, stage.stagedId, e.currentTarget.value)}
                />
              </div>

              <div class="child-grid">
                {#each stagedBomLines as line (line.partId)}
                  <div class="child-row">
                    <div>{line.name} ×{line.required}</div>

                    <select
                      class="child-select"
                      bind:value={selectedCandidate[`${stage.stagedId}-${line.partId}`]}
                    >
                      <option value="">Choose</option>
                      {#each getAvailableSerializedWipEntriesForBomLine(bo.id, line.partId) as entry (entry.wipEntryId)}
                        <option value={entry.wipEntryId}>{entry.partName} ({entry.wipEntryId})</option>
                      {/each}
                    </select>

                    <button
                      type="button"
                      class="secondary"
                      onclick={() => {
                        const selected = selectedCandidate[`${stage.stagedId}-${line.partId}`];
                        if (!selected) return;
                        assignSerializedChildToStagedOutput(bo.id, stage.stagedId, line.partId, selected);
                      }}
                    >
                      Add
                    </button>

                    <div class="assigned-list">
                      {#each (stage.childSerialAssignments || []).filter((/** @type {{ bomLineId:string }} */ ch) => ch.bomLineId === line.partId)[0]?.assignedStockEntryIds || [] as assignedId (assignedId)}
                        <span>{assignedId}</span>
                        <button
                          type="button"
                          class="text-btn"
                          onclick={() => removeSerializedChildFromStagedOutput(bo.id, stage.stagedId, line.partId, assignedId)}
                        >
                          Remove
                        </button>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>

              <div class="stage-actions">
                <button
                  type="button"
                  class="primary"
                  onclick={() => completeStage(stage)}
                  disabled={!isStagedOutputReady(bo.id, stage.stagedId)}
                >
                  Complete unit
                </button>
                <button
                  type="button"
                  class="secondary"
                  onclick={() => deleteOrCancelStagedOutput(bo.id, stage.stagedId)}
                >
                  Cancel
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="panel">
        <p class="hint">No active run found.</p>
      </div>
    {/if}
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

  h2 {
    margin: 0 0 12px;
    font-size: 1rem;
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

  .instruction-link,
  .primary,
  .secondary {
    display: flex;
    width: 100%;
    min-height: 48px;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    text-decoration: none;
    border: none;
    font-weight: 700;
    margin-top: 12px;
  }

  .instruction-link,
  .primary {
    background: #111827;
    color: white;
  }

  .secondary {
    background: #e5e7eb;
    color: #111827;
  }

  .primary:disabled,
  .secondary:disabled {
    opacity: 0.45;
  }

  .hint {
    margin: 0;
    color: #6b7280;
  }
</style>
