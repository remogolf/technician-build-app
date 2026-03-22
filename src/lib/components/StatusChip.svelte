<script>
  /** @typedef {'not_started'|'in_progress'|'done'} Status */
  let { status = 'not_started' } = $props();

  /** @type {{ not_started: string; in_progress: string; done: string }} */
  const map = {
    not_started: 'Not started',
    in_progress: 'In progress',
    done: 'Done'
  };

  /** @type {{ not_started: string; in_progress: string; done: string }} */
  const cls = {
    not_started: 'blue',
    in_progress: 'yellow',
    done: 'green'
  };
</script>

{#if status === 'not_started' || status === 'in_progress' || status === 'done'}
  <span class={`chip ${cls[/** @type {'not_started'|'in_progress'|'done'} */ (status)]}`}>
    {map[/** @type {'not_started'|'in_progress'|'done'} */ (status)]}
  </span>
{:else}
  <span class="chip blue">{status}</span>
{/if}

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .blue { background: #dbeafe; color: #1d4ed8; }
  .yellow { background: #fef3c7; color: #b45309; }
  .green { background: #dcfce7; color: #15803d; }
</style>