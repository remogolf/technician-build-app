<script>
  let { title, subtitle = '', qty, extra = '', onclick = null } = $props();
</script>

<button class="card" onclick={onclick}>
  <div>
    <h3>{title}</h3>
    {#if subtitle}
      <p>{subtitle}</p>
    {/if}
    {#if extra}
      <small>{extra}</small>
    {/if}
  </div>

  <div class="qty">{qty}</div>
</button>

<style>
  .card {
    width: 100%;
    border: none;
    border-radius: 16px;
    background: white;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    text-align: left;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
  }

  p {
    margin: 4px 0 0;
    color: #6b7280;
  }

  small {
    display: block;
    margin-top: 6px;
    color: #6b7280;
  }

  .qty {
    min-width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #111827;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }
</style>