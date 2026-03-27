<script>
	import { goto, invalidateAll } from '$app/navigation';
	import ScreenHeader from '$lib/components/ScreenHeader.svelte';
	import BuildOrderCard from '$lib/components/BuildOrderCard.svelte';
	import Card from '$lib/components/Card.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data } = $props();

	let buildOrders = $derived(data.buildOrders);
	let error = $derived(data.error);
</script>

<div class="orders-page">
	<ScreenHeader title="Build Orders" subtitle={`${buildOrders?.length || 0} active orders`} />

	<main class="content">
		{#if error}
			<Card class="error-card">
				<div class="error-state">
					<Icon name="alert" size={36} />
					<p class="error-msg">{error}</p>
					<button class="retry-btn" onclick={async () => await invalidateAll()}>Retry Connection</button>
				</div>
			</Card>
		{:else if buildOrders.length === 0}
			<div class="empty-state">
				<Icon name="clipboard" size={36} />
				<p>No build orders found.</p>
			</div>
		{:else}
			<div class="orders-list">
				{#each buildOrders as bo (bo.id)}
					<BuildOrderCard {bo} onclick={async () => await goto(`/orders/${bo.id}`)} />
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	.orders-page {
		background: var(--surface);
	}

	.content {
		padding: var(--space-lg);
	}

	.orders-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.empty-state,
	.error-state {
		text-align: center;
		padding: var(--space-xl) var(--space-lg);
		color: var(--text-muted);
	}

	.empty-state :global(svg),
	.error-state :global(svg) {
		margin-bottom: var(--space-md);
		opacity: 0.35;
		color: var(--text-muted);
	}

	:global(.error-card) {
		border: none !important;
		background: var(--surface-container-low) !important;
	}

	.error-msg {
		color: var(--tertiary);
		margin-bottom: var(--space-lg);
		font-weight: 700;
	}

	.retry-btn {
		padding: var(--space-md) var(--space-xl);
		min-height: var(--space-12);
		background: var(--surface-container-highest);
		color: var(--on-surface);
		border-radius: var(--radius-md);
		font-weight: 700;
		border: 1px solid var(--outline-variant);
		transition: transform 0.1s ease;
	}

	.retry-btn:active {
		transform: scale(0.98);
	}
</style>
