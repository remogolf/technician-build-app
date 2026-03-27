<script>
	/**
	 * @typedef {Object} Props
	 * @property {'default' | 'success' | 'warning' | 'info' | 'error' | 'gray'} [variant]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { variant = 'default', children } = $props();
</script>

<span class="badge variant-{variant}">
	{@render children?.()}
</span>

<style>
	.badge {
		font-size: 0.625rem;
		font-weight: 800;
		padding: 3px 9px;
		border-radius: var(--radius-sm);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
		border: 1px solid transparent;
	}

	.variant-default,
	.variant-gray {
		background: var(--secondary-container);
		color: var(--text-muted);
		border-color: var(--secondary-container);
	}

	/* Outlined style: color signal lives in border + text */
	.variant-success {
		background: transparent;
		color: var(--secondary-fixed-dim);
		border-color: var(--secondary);
	}

	.variant-warning {
		background: transparent;
		color: var(--tertiary);
		border-color: var(--tertiary);
	}

	.variant-info {
		background: transparent;
		color: var(--primary-fixed-dim);
		border-color: var(--primary-fixed-dim);
	}

	/* Error: solid fill to distinguish from warning outline */
	.variant-error {
		background: var(--tertiary);
		color: var(--on-tertiary-container);
		border-color: var(--tertiary);
	}
</style>
