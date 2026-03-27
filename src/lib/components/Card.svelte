<script>
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 * @property {(event: MouseEvent) => any} [onclick]
	 * @property {string} [class]
	 * @property {string} [accentColor]
	 */

	/** @type {Props} */
	let { children, onclick, class: className = '', accentColor = null } = $props();
</script>

{#if onclick}
	<button type="button" class="card clickable {className}" style:--card-accent={accentColor} {onclick}>
		{@render children?.()}
	</button>
{:else}
	<div class="card {className}" style:--card-accent={accentColor}>
		{@render children?.()}
	</div>
{/if}

<style>
	.card {
		background: var(--surface-container-high);
		border-radius: var(--radius-md);
		border: 1px solid var(--outline-variant);
		border-top: 3px solid var(--card-accent, var(--outline-variant));
		padding: var(--space-lg);
		overflow: hidden;
		width: 100%;
		display: block;
		text-align: left;
		color: var(--on-surface);
		font-family: inherit;
	}

	.clickable {
		transition:
			transform 0.1s ease,
			background-color 0.1s ease;
	}

	.clickable:active {
		transform: scale(0.98);
		background-color: var(--surface-container-highest);
	}
</style>
