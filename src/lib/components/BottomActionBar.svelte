<script>
  /* eslint-disable svelte/no-navigation-without-resolve */
  import { goto } from '$app/navigation';
  let { href = '', label = 'Continue', disabled = false } = $props();
</script>

<div class="bar">
  {#if href && !disabled}
    <a
      class="button"
      href={href}
      onclick={(event) => {
        event.preventDefault();
        const opts = /** @type {any} */ ({ resolve: true });
        goto(href, opts);
      }}
    >
      {label}
    </a>
  {:else}
    <button class="button" disabled>{label}</button>
  {/if}
</div>

<style>
  .bar {
    position: sticky;
    bottom: 0;
    padding: 12px 16px 16px;
    background: linear-gradient(to top, white 70%, rgba(255,255,255,0));
  }

  .button {
    display: flex;
    width: 100%;
    min-height: 52px;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    text-decoration: none;
    border: none;
    background: #111827;
    color: white;
    font-size: 1rem;
    font-weight: 700;
  }

  .button:disabled {
    opacity: 0.45;
  }
</style>