<script>
  import ScreenHeader from '$lib/components/ScreenHeader.svelte';
  import { getBuildOrder, getRunOutputs } from '$lib/state/app-state.svelte.js';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let bo = $derived(getBuildOrder($page.params.id));
  let outputs = $derived(bo ? getRunOutputs(bo.id) : []);

  /** @param {any} output */
  function isAssigned(output) {
    return !!output.serial?.trim();
  }
</script>

{#if bo}
  <ScreenHeader
    title="Outputs"
    subtitle={bo.id}
    backHref={`/bo/${bo.id}/assemble`}
  />

  <section class="content">
    {#if outputs.length === 0}
      <div class="panel">
        <p class="hint">No outputs have been created yet.</p>
      </div>
    {:else}
      <div class="list">
        {#each outputs as output (output.outputId)}
          <button
            type="button"
            class="output-card"
            onclick={() => {
              // eslint-disable-next-line svelte/no-navigation-without-resolve
              goto(`/bo/${bo.id}/outputs/${output.outputId}`, /** @type {any} */ ({ resolve: true }));
            }}
          >
            <div class="row-head">
              <h2>Unit #{output.unitNumber}</h2>

              <div
                class:assigned={isAssigned(output)}
                class:not-assigned={!isAssigned(output)}
                class="status-pill"
              >
                {isAssigned(output) ? 'Serial assigned' : 'Needs serial'}
              </div>
            </div>

            <div class="meta-row">
              <span>Serial</span>
              <strong>{output.serial || '—'}</strong>
            </div>
          </button>
        {/each}
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
  }

  .list {
    display: grid;
    gap: 12px;
  }

  .output-card {
    display: block;
    text-decoration: none;
    color: inherit;
    background: white;
    border-radius: 16px;
    padding: 16px;
  }

  .row-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  h2 {
    margin: 0;
    font-size: 1rem;
  }

  .status-pill {
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .assigned {
    background: #dcfce7;
    color: #15803d;
  }

  .not-assigned {
    background: #fef3c7;
    color: #b45309;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .meta-row span {
    color: #6b7280;
  }

  .hint {
    margin: 0;
    color: #6b7280;
  }
</style>
