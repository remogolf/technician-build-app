<script>
	import { onMount, onDestroy } from 'svelte';
	import ScreenHeader from '$lib/components/ScreenHeader.svelte';
	import { searchStock } from '$lib/api/builds';
	import Card from '$lib/components/Card.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import BucketList from '$lib/components/workbench/BucketList.svelte';
	import { workbench } from '$lib/state/workbench.svelte.js';

	onMount(() => {
		document.documentElement.style.overflow = 'hidden';
		document.documentElement.style.height = '100%';
		document.body.style.overflow = 'hidden';
		document.body.style.height = '100%';
	});

	onDestroy(() => {
		document.documentElement.style.overflow = '';
		document.documentElement.style.height = '';
		document.body.style.overflow = '';
		document.body.style.height = '';
	});

	let activeTab = $state('search');

	const tabs = [
		{ id: 'search', label: 'Search', icon: 'search' },
		{ id: 'bucket', label: 'My Bucket', icon: 'inbox' }
	];

	let searchQuery = $state('');
	let results = $state([]);
	let loading = $state(false);
	let hasSearched = $state(false);

	async function handleSearch() {
		if (!searchQuery.trim()) return;
		loading = true;
		hasSearched = true;
		try {
			results = await searchStock(searchQuery);
		} catch (e) {
			console.error('Inventory search failed', e);
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Enter') {
			handleSearch();
		}
	}

	const bucketId = $derived(workbench.wipLocationId);
</script>

<div class="inventory-screen">
	<ScreenHeader title="Inventory" subtitle="Stock management" />

	<div class="tabs-bar">
		<div class="tabs">
			{#each tabs as tab (tab.id)}
				<button
					class="tab-item"
					class:active={activeTab === tab.id}
					onclick={() => (activeTab = tab.id)}
				>
					<span class="tab-icon"><Icon name={tab.icon} size={18} /></span>
					<span class="tab-label">{tab.label}</span>
				</button>
			{/each}
		</div>
	</div>

	{#if activeTab === 'search'}
		<div class="search-bar">
			<div class="input-wrapper">
				<input
					type="text"
					placeholder="Search part, SKU, or serial..."
					bind:value={searchQuery}
					onkeydown={handleKeydown}
				/>
				<button class="search-btn" onclick={handleSearch} disabled={loading}>
					{loading ? '...' : 'Search'}
				</button>
			</div>
		</div>
	{/if}

	<div class="scroll-area">
		{#if activeTab === 'search'}
			<div class="results-area">
				{#if loading}
					<div class="status-text">Searching inventory...</div>
				{:else if results.length > 0}
					<div class="results-list">
						{#each results as item (item.pk)}
							<Card class="result-card">
								<div class="result-top">
									<div class="result-info">
										<div class="part-name">{item.part_detail?.full_name || 'Unknown Part'}</div>
										<div class="sku-label">SKU: {item.part_detail?.SKU || 'N/A'}</div>
									</div>
									<div class="qty-display">
										<span class="qty-value">{item.quantity}</span>
										<span class="qty-unit">{item.part_detail?.unit || ''}</span>
									</div>
								</div>

								{#if item.serial}
									<div class="serial-tag">SN: {item.serial}</div>
								{/if}

								<div class="location-row">
									<Icon name="map-pin" size={12} />
									<span class="location-text">
										{item.location_detail?.pathstring ||
											item.location_detail?.name ||
											'No Location'}
									</span>
								</div>
							</Card>
						{/each}
					</div>
				{:else if hasSearched}
					<div class="status-text">No matching items found.</div>
				{:else}
					<div class="empty-prompt">
						<Icon name="search" size={36} />
						<p>Enter a part name, SKU, or serial number to begin searching.</p>
					</div>
				{/if}
			</div>
		{:else if activeTab === 'bucket'}
			<div class="bucket-section">
				{#if bucketId}
					<div class="bucket-banner">
						<span class="bucket-label">Active Bucket</span>
						<span class="bucket-name">{workbench.wipLocationName}</span>
					</div>
					<BucketList locationId={bucketId} />
				{:else}
					<div class="empty-prompt">
						<Icon name="inbox" size={36} />
						<p>No WIP Bucket selected.</p>
						<p class="sub-note">Go to the Workbench to configure your session.</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.inventory-screen {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		height: 100vh;
		background: var(--surface);
	}

	/* Tabs */
	.tabs-bar {
		flex-shrink: 0;
		background: var(--surface);
		border-bottom: 1px solid var(--outline-variant);
	}

	.tabs {
		display: flex;
		max-width: 480px;
		margin: 0 auto;
	}

	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-sm) 0;
		background: none;
		border-bottom: 3px solid transparent;
		transition: color 0.15s ease, border-color 0.15s ease;
		color: var(--text-muted);
		gap: 2px;
	}

	.tab-item.active {
		color: var(--primary-fixed-dim);
		border-bottom-color: var(--primary);
	}

	.tab-icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tab-label {
		font-size: 0.625rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	/* Search bar (fixed, not in scroll area) */
	.search-bar {
		flex-shrink: 0;
		padding: var(--space-lg);
		background: var(--surface);
		border-bottom: 1px solid var(--outline-variant);
		max-width: 480px;
		width: 100%;
		align-self: center;
		box-sizing: border-box;
	}

	.input-wrapper {
		display: flex;
		gap: var(--space-sm);
	}

	.search-bar input {
		flex: 1;
		padding: var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--surface-container-highest);
		font-weight: 600;
		color: var(--on-surface);
	}

	.search-bar input:focus {
		border-bottom-color: var(--primary);
		background: var(--surface-container-high);
	}

	.search-btn {
		padding: 0 var(--space-lg);
		background: var(--surface-container-high);
		color: var(--on-surface);
		border-radius: var(--radius-md);
		font-weight: 800;
		font-size: 0.875rem;
		border: 1px solid var(--outline-variant);
		min-height: var(--space-12);
		transition: transform 0.1s ease;
	}

	.search-btn:active {
		transform: scale(0.96);
	}

	/* Scroll area — only this scrolls */
	.scroll-area {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-gutter: stable;
		padding-bottom: calc(88px + env(safe-area-inset-bottom));
		max-width: 480px;
		width: 100%;
		align-self: center;
		box-sizing: border-box;
	}

	/* Results */
	.results-area {
		padding: var(--space-lg);
	}

	.results-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	:global(.result-card) {
		display: flex !important;
		flex-direction: column !important;
	}

	.result-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-md);
	}

	.part-name {
		font-weight: 800;
		color: var(--on-surface);
		font-size: 0.9375rem;
		line-height: 1.2;
	}

	.sku-label {
		font-size: 0.625rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-top: var(--space-xs);
	}

	.qty-display {
		text-align: right;
		flex-shrink: 0;
	}

	.qty-value {
		font-size: 1.25rem;
		font-weight: 900;
		color: var(--primary-fixed-dim);
		line-height: 1;
	}

	.qty-unit {
		font-size: 0.625rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
	}

	.serial-tag {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 700;
		background: var(--surface-container-highest);
		color: var(--on-surface);
		padding: 2px var(--space-sm);
		border-radius: var(--radius-sm);
		border: 1px solid var(--outline-variant);
		display: inline-block;
		margin-top: var(--space-md);
	}

	.location-row {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--outline-variant);
		color: var(--text-muted);
	}

	.location-text {
		font-size: 0.75rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* States */
	.status-text {
		text-align: center;
		padding: var(--space-xl);
		color: var(--text-muted);
		font-weight: 600;
	}

	.empty-prompt {
		text-align: center;
		padding: var(--space-xl) var(--space-lg);
		color: var(--text-muted);
		margin-top: var(--space-xl);
	}

	.empty-prompt :global(svg) {
		margin-bottom: var(--space-lg);
		opacity: 0.35;
		color: var(--text-muted);
	}

	.empty-prompt p {
		max-width: 240px;
		margin: 0 auto;
		font-weight: 600;
		line-height: 1.4;
	}

	.sub-note {
		font-size: 0.75rem;
		opacity: 0.7;
		margin-top: var(--space-sm) !important;
	}

	/* Bucket section */
	.bucket-section {
		padding: var(--space-lg);
	}

	.bucket-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md);
		background: var(--surface-container-low);
		border: 1px solid var(--outline-variant);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-lg);
	}

	.bucket-label {
		font-size: 0.625rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--primary-fixed-dim);
	}

	.bucket-name {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--on-surface);
	}
</style>
