<script>
  /* eslint-disable svelte/no-navigation-without-resolve */
  import StatusChip from './StatusChip.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import { goto } from '$app/navigation';

  let { bo } = $props();
</script>

<a
  class="card"
  href={`/bo/${bo.id}`}
  onclick={(event) => {
    event.preventDefault();
    const opts = /** @type {any} */ ({ resolve: true });
    goto(`/bo/${bo.id}`, opts);
  }}
>
  <div class="top">
    <div>
      <h2>{bo.id}</h2>
      <p>{bo.built} / {bo.target} built</p>
    </div>
    <StatusChip status={bo.status} />
  </div>

  <ProgressBar value={bo.built} max={bo.target} />

  <div class="footer">
    <span>{bo.status === 'done' ? 'View' : 'Open'}</span>
    <span>→</span>
  </div>
</a>

<style>
  .card {
    display: block;
    text-decoration: none;
    color: inherit;
    background: white;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  }

  .top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  h2 {
    margin: 0;
    font-size: 1.05rem;
  }

  p {
    margin: 4px 0 0;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .footer {
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    color: #111827;
    font-weight: 600;
  }
</style>