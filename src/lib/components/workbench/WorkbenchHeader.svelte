<script>
	import { onMount } from 'svelte';
	import { workbench } from '$lib/state/workbench.svelte.js';
	import { fetchLocations, fetchBuildOrders } from '$lib/api/builds';
	import Modal from '$lib/components/Modal.svelte';

	let isPickingOrder = $state(false);
	let isConfiguring = $state(false);
	let locations = $state([]);
	let buildOrders = $state([]);
	let loadingLocations = $state(false);
	let loadingOrders = $state(false);

	onMount(async () => {
		try {
			[locations, buildOrders] = await Promise.all([fetchLocations(), fetchBuildOrders()]);
		} catch (e) {
			console.error('Failed to prefetch workbench header data', e);
		}
	});

	async function openOrderPicker() {
		isPickingOrder = true;
		if (buildOrders.length === 0) {
			loadingOrders = true;
			try {
				buildOrders = await fetchBuildOrders();
			} catch (e) {
				console.error('Failed to fetch build orders', e);
			} finally {
				loadingOrders = false;
			}
		}
	}

	async function openConfig() {
		isConfiguring = true;
		if (locations.length === 0) {
			loadingLocations = true;
			try {
				locations = await fetchLocations();
			} catch (e) {
				console.error('Failed to fetch locations', e);
			} finally {
				loadingLocations = false;
			}
		}
	}

	function handleOrderSelect(bo) {
		workbench.selectOrder(bo.id, bo.reference);
		workbench.setOrderDetails(bo.target, bo.built);
		isPickingOrder = false;
	}

	function handleLocationChange(loc) {
		workbench.setWipLocation(loc.id, loc.name);
	}

	function handleQtyChange(e) {
		workbench.setWorkQuantity(Number(e.target.value));
	}

	const boTarget = $derived(workbench.buildOrderTarget);
	const boBuilt = $derived(workbench.buildOrderBuilt);
</script>

<div class="workbench-header">
	<button class="bo-btn" onclick={openOrderPicker} aria-label="Select build order">
		<span class="label">BUILD ORDER</span>
		<span class="value">{workbench.buildOrderRef || 'None Selected'}</span>
		{#if boTarget > 0}
			<span class="bo-built">{boBuilt} / {boTarget} built</span>
		{/if}
	</button>
	<div class="divider"></div>
	<div class="session-info">
		<div class="item qty">
			<span class="label">GOAL QTY</span>
			<div class="qty-row">
				<input
					type="number"
					min="1"
					max={boTarget > 0 ? boTarget : undefined}
					value={workbench.workQuantity}
					onchange={handleQtyChange}
					class="qty-input"
				/>
				{#if boTarget > 0}
					<span class="qty-of">/ {boTarget}</span>
				{/if}
			</div>
		</div>
	</div>
	<button class="config-btn" onclick={openConfig} aria-label="Configure WIP bucket">
		<div class="bucket-info">
			<span class="label">BUCKET</span>
			<span class="value">{workbench.wipLocationName || 'Pick Location'}</span>
		</div>
	</button>
</div>

<!-- Build order picker modal -->
<Modal isOpen={isPickingOrder} title="Build Order" onClose={() => (isPickingOrder = false)}>
	<div class="picker-modal">
		{#if loadingOrders}
			<div class="loading">Loading orders...</div>
		{:else if buildOrders.length === 0}
			<div class="loading">No build orders found.</div>
		{:else}
			<div class="picker-list">
				{#each buildOrders as bo (bo.id)}
					<button
						class="picker-card"
						class:active={String(bo.id) === String(workbench.buildOrderId)}
						onclick={() => handleOrderSelect(bo)}
					>
						<span class="picker-ref">{bo.reference}</span>
						<span class="picker-sub">{bo.partName}</span>
					</button>
				{/each}
			</div>
		{/if}

		<div class="modal-footer">
			<button
				class="clear-btn"
				onclick={() => {
					workbench.clear();
					isPickingOrder = false;
				}}
			>
				Reset Workbench Session
			</button>
		</div>
	</div>
</Modal>

<!-- WIP bucket picker modal -->
<Modal isOpen={isConfiguring} title="WIP Bucket" onClose={() => (isConfiguring = false)}>
	<div class="config-modal">
		<section class="config-section">
			<h4>WIP Bucket Location</h4>
			<p class="desc">Select where you are physically building these units.</p>

			{#if loadingLocations}
				<div class="loading">Loading locations...</div>
			{:else}
				<div class="location-grid">
					{#each locations as loc (loc.id)}
						<button
							class="loc-card"
							class:active={String(loc.id) === workbench.wipLocationId}
							onclick={() => handleLocationChange(loc)}
						>
							<span class="loc-name">{loc.name}</span>
							<span class="loc-path">{loc.path}</span>
						</button>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</Modal>

<style>
	.workbench-header {
		display: flex;
		align-items: stretch;
		background: var(--surface-container-high);
		border-bottom: 1px solid var(--outline-variant);
	}

	.bo-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: var(--space-sm) var(--space-lg);
		min-width: 0;
		text-align: left;
		transition: background 0.15s ease;
	}

	.bo-btn:active {
		background: var(--surface-container-highest);
	}

	.session-info {
		display: flex;
		align-items: center;
		padding: var(--space-sm) var(--space-lg);
	}

	.item {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.divider {
		width: 1px;
		align-self: stretch;
		margin: var(--space-sm) 0;
		background: var(--outline-variant);
	}

	.label {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--text-muted);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.value {
		font-size: 1rem;
		font-weight: 800;
		color: var(--on-surface);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.bo-built {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--success);
		margin-top: 2px;
	}

	.qty-row {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}

	.qty-of {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.qty-input {
		background: transparent;
		border: none;
		color: var(--primary-fixed-dim);
		font-size: 1.125rem;
		font-weight: 900;
		width: 48px;
		padding: 0;
		outline: none;
	}

	.config-btn {
		background: var(--surface-container-low);
		border-left: 1px solid var(--outline-variant);
		display: flex;
		align-items: center;
		padding: var(--space-sm) var(--space-lg);
		transition: background 0.15s ease;
	}

	.config-btn:active {
		background: var(--surface-container-high);
	}

	.bucket-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	/* Order picker modal */
	.picker-modal {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.picker-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-height: 320px;
		overflow-y: auto;
		padding-right: 4px;
	}

	.picker-card {
		text-align: left;
		padding: var(--space-md);
		background: var(--surface-container-highest);
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		transition: all 0.15s ease;
	}

	.picker-card.active {
		border-color: var(--primary);
		background: var(--surface-container-high);
	}

	.picker-card:active {
		transform: scale(0.98);
	}

	.picker-ref {
		display: block;
		font-weight: 800;
		color: var(--on-surface);
		font-size: 0.875rem;
	}

	.picker-sub {
		display: block;
		font-size: 0.6875rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.modal-footer {
		padding-top: var(--space-sm);
		border-top: 1px solid var(--outline-variant);
	}

	/* Bucket config modal */
	.config-modal {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	.config-section h4 {
		margin: 0 0 var(--space-xs);
		font-size: 0.875rem;
		font-weight: 800;
		color: var(--on-surface);
	}

	.config-section .desc {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-bottom: var(--space-lg);
	}

	.loading {
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 600;
		text-align: center;
		padding: var(--space-lg);
	}

	.location-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-height: 300px;
		overflow-y: auto;
		padding-right: 4px;
	}

	.loc-card {
		text-align: left;
		padding: var(--space-md);
		background: var(--surface-container-highest);
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		transition: all 0.15s ease;
	}

	.loc-card.active {
		border-color: var(--primary);
		background: var(--surface-container-high);
	}

	.loc-card:active {
		transform: scale(0.98);
	}

	.loc-name {
		display: block;
		font-weight: 800;
		color: var(--on-surface);
		font-size: 0.875rem;
	}

	.loc-path {
		display: block;
		font-size: 0.6875rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.clear-btn {
		width: 100%;
		padding: var(--space-md) var(--space-lg);
		min-height: var(--space-12);
		background: transparent;
		border: 1px solid var(--tertiary);
		color: var(--tertiary);
		font-weight: 800;
		font-size: 0.875rem;
		border-radius: var(--radius-md);
		transition: transform 0.1s ease;
	}

	.clear-btn:active {
		transform: scale(0.98);
	}
</style>
