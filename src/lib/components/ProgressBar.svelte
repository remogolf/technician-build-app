<script>
  let { value = 0, max = 1 } = $props();
  let percent = $derived(Math.max(0, Math.min(100, (value / max) * 100)));
</script>

<div class="track">
  <div class="fill" style={`width:${percent}%`}></div>
</div>

<style>
  .track {
    width: 100%;
    height: 10px;
    background: #e5e7eb;
    border-radius: 999px;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: #111827;
    border-radius: 999px;
  }
</style>