<script>
	import { fetchStockInLocation } from '$lib/api/builds';
	import StockItemCard from '$lib/components/StockItemCard.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { locationId, refreshKey = 0 } = $props();

	let stockItems = $state([]);
	let loading = $state(true);

	async function loadData() {
		if (!locationId) return;
		loading = true;
		try {
			stockItems = await fetchStockInLocation(locationId);
		} catch (e) {
			console.error('Failed to load BucketList data', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (locationId) {
			void refreshKey; // re-run when parent increments this after a scan transfer
			loadData();
		}
	});
</script>

<div class="bucket-list">
	{#if loading}
		<p class="empty-text">Loading bucket...</p>
	{:else if stockItems.length === 0}
		<div class="empty-state">
			<Icon name="inbox" size={36} />
			<p>The bucket is empty.</p>
		</div>
	{:else}
		{#each stockItems as item (item.pk)}
			<StockItemCard {item} onRefresh={loadData} />
		{/each}
	{/if}
</div>

<style>
	.bucket-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.empty-text {
		text-align: center;
		color: var(--text-muted);
		padding: var(--space-xl);
		font-weight: 500;
	}

	.empty-state {
		text-align: center;
		padding: var(--space-xl);
		color: var(--text-muted);
	}

	.empty-state :global(svg) {
		margin-bottom: var(--space-md);
		opacity: 0.35;
		color: var(--text-muted);
	}
</style>
