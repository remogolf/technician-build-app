<script>
	import Card from './Card.svelte';
	import StatusChip from './StatusChip.svelte';
	import ProgressBar from './ProgressBar.svelte';

	/**
	 * @typedef {Object} BuildOrderCardProps
	 * @property {any} bo - Build Order data object
	 * @property {(event: MouseEvent) => any} onclick
	 */
	/** @type {BuildOrderCardProps} */
	let { bo, onclick } = $props();
</script>

<Card {onclick} accentColor="var(--primary)">
	<div class="top-row">
		<div class="info">
			<div class="ref">{bo.reference}</div>
			<div class="name">{bo.partName}</div>
		</div>
		<StatusChip status={bo.status} />
	</div>

	<div class="qty-row">
		<span class="built">{bo.built} / {bo.target} built</span>
		<strong class="remaining" class:warning={bo.remaining > 0}>{bo.remaining} missing</strong>
	</div>

	<div class="progress-wrap">
		<ProgressBar value={bo.built} max={bo.target} />
	</div>
</Card>

<style>
	.top-row {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		align-items: flex-start;
	}

	.ref {
		font-weight: 700;
		font-family: var(--font-display);
		font-size: 1.125rem;
		color: var(--on-surface);
		letter-spacing: -0.01em;
	}

	.name {
		color: var(--text-muted);
		margin-top: 2px;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.qty-row {
		margin: var(--space-lg) 0 var(--space-sm);
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.built {
		color: var(--text-muted);
		font-weight: 600;
	}

	.remaining {
		color: var(--success);
		font-weight: 800;
	}

	.remaining.warning {
		color: var(--warning);
	}

	.progress-wrap {
		margin-top: var(--space-sm);
	}
</style>
