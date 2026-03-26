<script>
	import Card from '../Card.svelte';

	let { output, onclick } = $props();

	const isComplete = $derived(!output.is_building);
	const hasSerial = $derived(!!output.serial);
</script>

<Card {onclick} class="unit-card {isComplete ? 'complete' : ''}">
	<div class="top-row">
		<div>
			<div class="unit-label">Unit #{output.pk}</div>
			<div class="serial-value">
				{#if hasSerial}
					<span class="serial-tag">SN: {output.serial}</span>
				{:else}
					<span class="serial-empty">No serial assigned</span>
				{/if}
			</div>
		</div>
		<div class="status-badge" class:complete={isComplete}>
			{isComplete ? 'READY' : 'WIP'}
		</div>
	</div>

	<div class="bottom-row">
		<div class="action-label" class:active={!isComplete}>
			{isComplete ? 'View details →' : 'Continue build →'}
		</div>
		{#if !isComplete}
			<div class="pulse-dot"></div>
		{/if}
	</div>
</Card>

<style>
	:global(.unit-card) {
		border-top: var(--space-1) solid var(--primary) !important;
		margin-bottom: var(--space-sm);
		padding-top: calc(var(--space-lg) - var(--space-1)) !important;
	}
	:global(.unit-card.complete) {
		border-top-color: var(--success) !important;
	}

	.top-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.unit-label {
		font-size: 0.625rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		margin-bottom: var(--space-xs);
	}

	.serial-tag {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		font-weight: 700;
		background: var(--surface-container-highest);
		color: var(--on-surface);
		padding: 2px var(--space-sm);
		border-radius: var(--radius-sm);
		border: 1px solid var(--outline-variant);
	}

	.serial-empty {
		color: var(--text-muted);
		font-style: italic;
		font-weight: 500;
		font-size: 0.8125rem;
	}

	.status-badge {
		font-size: 0.625rem;
		font-weight: 800;
		padding: 3px 8px;
		border-radius: var(--radius-sm);
		background: var(--primary-fixed-dim);
		color: var(--surface);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		flex-shrink: 0;
	}

	.status-badge.complete {
		background: transparent;
		color: var(--success);
		border: 1px solid var(--success);
	}

	.bottom-row {
		margin-top: var(--space-lg);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.action-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.action-label.active {
		color: var(--primary-fixed-dim);
	}

	.pulse-dot {
		width: 8px;
		height: 8px;
		background: var(--primary);
		border-radius: 50%;
		animation: pulse 2s infinite;
		flex-shrink: 0;
	}

	@keyframes pulse {
		0% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
		}
		70% {
			transform: scale(1);
			box-shadow: 0 0 0 6px rgba(37, 99, 235, 0);
		}
		100% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
		}
	}
</style>
