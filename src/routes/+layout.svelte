<script>
  let { children } = $props();
</script>

<div class="app-shell">
  {@render children()}
</div>

<style>
  :global(body) {
    margin: 0;
    background: #f3f4f6;
    color: #111827;
    font-family: Inter, system-ui, sans-serif;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .app-shell {
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    background: #f9fafb;
  }
</style>