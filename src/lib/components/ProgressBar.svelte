<script>
	let { value = 0, max = 1 } = $props();
	let percent = $derived(Math.max(0, Math.min(100, (value / max) * 100)));
</script>

<div class="track" role="progressbar" aria-valuenow={value} aria-valuemin="0" aria-valuemax={max}>
	<div class="fill" style:width="{percent}%"></div>
</div>

<style>
	.track {
		width: 100%;
		height: 8px;
		background: var(--surface-container-low);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.fill {
		height: 100%;
		background: var(--primary);
		border-radius: var(--radius-md);
		transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}
</style>
