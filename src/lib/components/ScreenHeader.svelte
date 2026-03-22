<script>
  /* eslint-disable svelte/no-navigation-without-resolve */
  import { goto } from '$app/navigation';
  let { title = '', subtitle = '', backHref = '' } = $props();

  function handleBack(/** @type {MouseEvent} */ event) {
    event.preventDefault();
    if (!backHref) return;
    const opts = /** @type {any} */ ({ resolve: true });
    goto(backHref, opts);
  }
</script>

<header class="header">
  <div class="row">
    {#if backHref}
      <a class="back" href={backHref} onclick={handleBack}>←</a>
    {/if}
    <div>
      <h1>{title}</h1>
      {#if subtitle}
        <p>{subtitle}</p>
      {/if}
    </div>
  </div>
</header>

<style>
  .header {
    padding: 16px 16px 8px;
    background: white;
    position: sticky;
    top: 0;
    z-index: 5;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .back {
    display: inline-flex;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: #111;
    background: #f3f4f6;
    font-size: 20px;
  }

  h1 {
    margin: 0;
    font-size: 1.25rem;
  }

  p {
    margin: 2px 0 0;
    color: #666;
    font-size: 0.9rem;
  }
</style>