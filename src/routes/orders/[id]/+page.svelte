<script>
	import { goto } from '$app/navigation';
	import ScreenHeader from '$lib/components/ScreenHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import { workbench } from '$lib/state/workbench.svelte.js';

	let { data } = $props();

	const bo = $derived(data.bo);
	const error = $derived(data.error);
	const isActive = $derived(bo && String(workbench.buildOrderId) === String(bo.id));

	function handleLoad() {
		workbench.selectOrder(bo.id, bo.reference);
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto('/workbench');
	}
</script>

{#if error}
	<ScreenHeader title="Error" backHref="/orders" />
	<div class="content">
		<Card>{error}</Card>
	</div>
{:else if bo}
	<ScreenHeader title={bo.reference} backHref="/orders" />

	<div class="content">
		<Card class="detail-card">
			<div class="top-row">
				<div class="part-name">{bo.partName}</div>
				<StatusChip status={bo.status} />
			</div>
			<div class="qty-row">
				<span class="built">{bo.built} / {bo.target} built</span>
				{#if isActive}
					<Badge variant="success">Active</Badge>
				{:else}
					<strong class="remaining" class:warning={bo.remaining > 0}>{bo.remaining} remaining</strong>
				{/if}
			</div>
			<ProgressBar value={bo.built} max={bo.target} />
		</Card>
	</div>

	<div class="actions-footer">
		{#if isActive}
			<button
				class="primary-btn"
				onclick={() => {
					// eslint-disable-next-line svelte/no-navigation-without-resolve
					goto('/workbench');
				}}
			>
				Go to Workbench
			</button>
		{:else}
			<button class="primary-btn" onclick={handleLoad}>Load into Workbench</button>
		{/if}
	</div>
{/if}

<style>
	.content {
		padding: var(--space-lg);
		padding-bottom: calc(var(--space-16) * 2 + env(safe-area-inset-bottom));
	}

	:global(.detail-card) {
		border-top: var(--space-1) solid var(--primary) !important;
		padding-top: calc(var(--space-lg) - var(--space-1)) !important;
	}

	.top-row {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		align-items: flex-start;
	}

	.part-name {
		color: var(--text-muted);
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

	.actions-footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--surface-variant);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		padding: var(--space-lg);
		padding-bottom: calc(var(--space-lg) + env(safe-area-inset-bottom));
		border-top: 1px solid var(--outline-variant);
		z-index: 1000;
		max-width: 480px;
		margin: 0 auto;
	}

	.primary-btn {
		width: 100%;
		padding: var(--space-lg);
		background: var(--primary);
		color: var(--on-primary);
		border-radius: var(--radius-lg);
		font-weight: 900;
		font-size: 1rem;
		box-shadow: var(--shadow-ambient);
		transition: transform 0.1s ease;
	}

	.primary-btn:active {
		transform: scale(0.98);
	}
</style>
