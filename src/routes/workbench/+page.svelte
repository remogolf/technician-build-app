<script>
	import { workbench } from '$lib/state/workbench.svelte.js';
	import ScreenHeader from '$lib/components/ScreenHeader.svelte';
	import WorkbenchHeader from '$lib/components/workbench/WorkbenchHeader.svelte';
	import NeedsList from '$lib/components/workbench/NeedsList.svelte';
	import BucketList from '$lib/components/workbench/BucketList.svelte';
	import UnitsList from '$lib/components/workbench/UnitsList.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { fetchStockItemById, transferStock } from '$lib/api/builds';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';

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

	let activeTab = $state('units');
	let scanQuery = $state('');
	let scanning = $state(false);
	let scanError = $state(null);

	const boId = $derived(workbench.buildOrderId);
	const bucketId = $derived(workbench.wipLocationId);

	const tabs = [
		{ id: 'needs', label: 'Needs', icon: 'clipboard' },
		{ id: 'bucket', label: 'Bucket', icon: 'inbox' },
		{ id: 'units', label: 'Units', icon: 'wrench' }
	];

	async function handleScan(e) {
		if (e.key !== 'Enter' || !scanQuery.trim()) return;

		const id = scanQuery.trim();
		scanQuery = '';
		scanError = null;
		scanning = true;

		try {
			const item = await fetchStockItemById(id);
			if (item) {
				const itemName = item.part_detail?.full_name || item.part_detail?.name || `Item ${id}`;
				if (confirm(`Move ${item.quantity}x ${itemName} to WIP Bucket?`)) {
					await transferStock(
						[{ pk: item.pk, quantity: item.quantity }],
						bucketId,
						'Scanned into WIP'
					);
							activeTab = activeTab;
				}
			}
		} catch (err) {
			console.error('Scan failed', err);
			scanError = `Scan failed: ${err.message || 'Item not found'}`;
		} finally {
			scanning = false;
		}
	}
</script>

<div class="workbench-screen">
	<ScreenHeader title="Workbench" showLogout={true} />
	<WorkbenchHeader />

	{#if !boId || !bucketId}
		<div class="workbench-body-scroll">
			<div class="setup-state">
				<div class="setup-card">
					<Icon name="wrench" size={40} />
					<h2>Workbench Setup</h2>
					<p>You need an active Build Order and a WIP Bucket to start working.</p>
					<div class="setup-actions">
						{#if !boId}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<button class="setup-btn" onclick={() => goto('/orders')}>
								Select Build Order
							</button>
						{:else if !bucketId}
							<div class="setup-hint">
								Order selected: <strong>{workbench.buildOrderRef}</strong>
							</div>
							<p class="setup-sub">Tap the settings icon above to set your WIP Bucket.</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="scan-bar">
			<div class="scan-input-wrapper">
				<span class="scan-icon"><Icon name="search" size={16} /></span>
				<input
					type="text"
					placeholder="Scan Stock ID..."
					bind:value={scanQuery}
					onkeydown={handleScan}
					disabled={scanning}
				/>
				{#if scanning}
					<div class="busy-indicator">BUSY</div>
				{/if}
			</div>
		</div>
		{#if scanError}
			<p class="scan-error">{scanError}</p>
		{/if}

		<div class="tabs-header">
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

		<div class="workbench-body-scroll">
			<main class="content">
				{#if activeTab === 'needs'}
					<NeedsList {boId} {bucketId} />
				{:else if activeTab === 'bucket'}
					<BucketList locationId={bucketId} />
				{:else if activeTab === 'units'}
					<UnitsList {boId} {bucketId} />
				{/if}
			</main>
		</div>
	{/if}
</div>

<style>
	.workbench-screen {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		height: 100vh;
		background: var(--surface);
	}

	.workbench-body-scroll {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-gutter: stable;
		padding-bottom: calc(140px + env(safe-area-inset-bottom));
	}

	/* Setup state */
	.setup-state {
		padding: var(--space-xl) var(--space-lg);
	}

	.setup-card {
		background: var(--surface-container-high);
		border: 1px dashed var(--outline-variant);
		border-radius: var(--radius-xl);
		padding: var(--space-xl);
		text-align: center;
	}

	.setup-card :global(svg) {
		color: var(--text-muted);
		opacity: 0.4;
		margin-bottom: var(--space-lg);
	}

	.setup-card h2 {
		margin: 0 0 var(--space-sm);
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--on-surface);
		letter-spacing: -0.02em;
	}

	.setup-card p {
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 500;
		margin: 0 0 var(--space-xl);
	}

	.setup-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.setup-btn {
		width: 100%;
		padding: var(--space-lg);
		min-height: var(--space-12);
		background: var(--primary);
		color: var(--on-primary);
		border-radius: var(--radius-md);
		font-weight: 800;
		font-size: 1rem;
		box-shadow: var(--shadow-ambient);
		transition: transform 0.1s ease;
	}

	.setup-btn:active {
		transform: scale(0.98);
	}

	.setup-hint {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--primary-fixed-dim);
	}

	.setup-sub {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 500;
		margin: 0;
	}

	/* Scan bar */
	.scan-bar {
		padding: var(--space-md) var(--space-lg);
		background: var(--surface-container-low);
		flex-shrink: 0;
	}

	.scan-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.scan-icon {
		position: absolute;
		left: 10px;
		display: flex;
		align-items: center;
		color: var(--text-muted);
		pointer-events: none;
	}

	.scan-bar input {
		width: 100%;
		background: var(--surface-container-highest);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		color: var(--on-surface);
		padding: 10px 12px 10px 36px;
		font-family: monospace;
		font-size: 0.875rem;
		font-weight: 700;
		outline: none;
	}

	.scan-bar input:focus {
		border-bottom-color: var(--primary);
		background: var(--surface-container-high);
	}

	.busy-indicator {
		position: absolute;
		right: 12px;
		font-size: 0.625rem;
		font-weight: 900;
		color: var(--primary);
		letter-spacing: 0.1em;
		animation: pulse 1s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	/* Tabs */
	.tabs-header {
		background: var(--surface);
		border-bottom: 1px solid var(--outline-variant);
		flex-shrink: 0;
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

	.content {
		padding: var(--space-lg);
		max-width: 480px;
		margin: 0 auto;
	}

	.scan-error {
		padding: 0 var(--space-lg);
		margin: var(--space-sm) 0 0;
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--tertiary);
	}
</style>
