<script>
	import { onMount } from 'svelte';
	import {
		fetchBuildOrderBOM,
		fetchStockInLocation,
		transferStock,
		fetchStockForPart
	} from '$lib/api/builds';
	import Modal from '$lib/components/Modal.svelte';
	import Card from '$lib/components/Card.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { workbench } from '$lib/state/workbench.svelte.js';

	let { boId, bucketId } = $props();

	let bomLines = $state([]);
	let bucketStock = $state([]);
	let loading = $state(true);

	// Pick Modal State
	let selectedLine = $state(null);
	let availableStock = $state([]);
	let loadingStock = $state(false);
	let transferQty = $state({});
	let transferring = $state(false);
	let transferError = $state(null);

	async function loadData() {
		if (!boId || !bucketId) return;
		loading = true;
		try {
			const [bom, stock] = await Promise.all([
				fetchBuildOrderBOM(boId),
				fetchStockInLocation(bucketId)
			]);
			bomLines = bom;
			bucketStock = stock;
		} catch (e) {
			console.error('Failed to load NeedsList data', e);
		} finally {
			loading = false;
		}
	}

	onMount(loadData);

	// Re-fetch data if props OR workQuantity changes
	$effect(() => {
		if (boId && bucketId && workbench.workQuantity) {
			loadData();
		}
	});

	function getInBucket(partId) {
		return bucketStock
			.filter((s) => String(s.part) === String(partId))
			.reduce((sum, s) => sum + Number(s.quantity), 0);
	}

	function getRequiredForSession(line) {
		// Calculate what we need for the session vs what's available in BO
		const sessionReq = workbench.workQuantity * line.quantityPerUnit;
		return Math.min(line.required, sessionReq);
	}

	function getMissing(line) {
		const inBucket = getInBucket(line.partId);
		const needed = getRequiredForSession(line);
		return Math.max(0, needed - inBucket);
	}

	async function openPickModal(line) {
		selectedLine = line;
		loadingStock = true;
		transferQty = {};
		availableStock = [];
		transferError = null;
		try {
			const stock = await fetchStockForPart(line.partId);
			// Filter out stock already in our bucket
			availableStock = stock.filter((s) => String(s.locationId) !== String(bucketId));

			// Set default quantities to missing amount, up to available stock
			const missing = getMissing(line);
			availableStock.forEach((s) => {
				transferQty[s.id] = Math.min(s.quantity, missing);
			});
		} catch (e) {
			console.error('Failed to load stock for picking', e);
		} finally {
			loadingStock = false;
		}
	}

	function closePickModal() {
		selectedLine = null;
		availableStock = [];
	}

	async function handleTransfer(stockItem) {
		const qty = Number(transferQty[stockItem.id]);
		if (!qty || qty <= 0 || qty > stockItem.quantity) {
			transferError = 'Invalid quantity.';
			return;
		}
		transferError = null;

		transferring = true;
		try {
			await transferStock([{ pk: stockItem.id, quantity: qty }], bucketId, 'Picked for WIP');
			// Reload bucket stock
			bucketStock = await fetchStockInLocation(bucketId);

			// Check if we still have missing parts
			if (getMissing(selectedLine) <= 0) {
				closePickModal();
			} else {
				// Refresh modal stock if still missing
				await openPickModal(selectedLine);
			}
		} catch (e) {
			console.error('Failed to transfer stock', e);
			transferError = `Failed to transfer stock: ${e.message}`;
		} finally {
			transferring = false;
		}
	}
</script>

<div class="needs-list">
	{#if loading}
		<p class="empty-text">Loading needs...</p>
	{:else if bomLines.length === 0}
		<p class="empty-text">No BOM items found.</p>
	{:else}
		{#each bomLines as line (line.id)}
			{@const sessionRequired = getRequiredForSession(line)}
			{@const inBucket = getInBucket(line.partId)}
			{@const missing = getMissing(line)}
			<Card class="bom-card {missing <= 0 ? 'complete' : ''}">
				<div class="card-body">
					<div class="info">
						<div class="part-name">{line.partName}</div>
						<div class="req-qty">Required for Goal: {sessionRequired} {line.unit}</div>
					</div>
					<div class="status">
						<div class="bucket-qty" class:ready={inBucket >= sessionRequired}>
							In Bucket: {inBucket}
						</div>
						{#if missing > 0}
							<div class="missing-qty">Pick: {missing}</div>
						{/if}
					</div>
				</div>
				{#if missing > 0}
					<button class="pick-btn" onclick={() => openPickModal(line)}> Pick Missing </button>
				{/if}
			</Card>
		{/each}
	{/if}
</div>

<Modal
	isOpen={!!selectedLine}
	title={`Pick ${selectedLine?.partName}`}
	subtitle={`Session Goal Missing: ${selectedLine ? getMissing(selectedLine) : 0} ${selectedLine?.unit || ''}`}
	onClose={closePickModal}
>
	{#if loadingStock}
		<div class="modal-loading">Searching inventory...</div>
	{:else if availableStock.length === 0}
		<div class="modal-loading">No available stock found outside the WIP bucket.</div>
	{:else}
		{#if transferError}
			<p class="transfer-error">{transferError}</p>
		{/if}
		<div class="stock-options">
			{#each availableStock as item (item.id)}
				<div class="stock-item">
					<div class="stock-header">
						<span class="location"><Icon name="map-pin" size={12} /> {item.locationPath}</span>
						<span class="avail">Avail: {item.quantity}</span>
					</div>
					{#if item.serial}
						<div class="serial">SN: {item.serial}</div>
					{/if}
					<div class="transfer-row">
						<input
							type="number"
							class="qty-input"
							min="1"
							max={item.quantity}
							bind:value={transferQty[item.id]}
							disabled={transferring || !!item.serial}
						/>
						<button class="move-btn" onclick={() => handleTransfer(item)} disabled={transferring}>
							{transferring ? '...' : 'Move to WIP'}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Modal>

<style>
	.needs-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.empty-text {
		text-align: center;
		color: var(--text-muted);
		padding: var(--space-xl);
		font-weight: 500;
	}

	:global(.bom-card) {
		padding: 0 !important;
		overflow: hidden;
		border-top: var(--space-1) solid var(--tertiary) !important;
	}

	:global(.bom-card.complete) {
		border-top-color: var(--success) !important;
	}

	.card-body {
		padding: var(--space-md) var(--space-lg);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-md);
	}

	.part-name {
		font-weight: 800;
		color: var(--on-surface);
		line-height: 1.2;
	}

	.req-qty {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 2px;
		font-weight: 600;
	}

	.status {
		text-align: right;
		flex-shrink: 0;
	}

	.bucket-qty {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.bucket-qty.ready {
		color: var(--success);
	}

	.missing-qty {
		font-size: 0.8125rem;
		font-weight: 800;
		color: var(--tertiary);
	}

	.pick-btn {
		width: 100%;
		min-height: var(--space-12);
		background: var(--primary);
		color: var(--on-primary);
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.875rem;
		transition: background-color 0.1s;
		border-radius: 0 0 var(--radius-md) var(--radius-md);
	}

	.pick-btn:active {
		background: var(--primary-container);
	}

	.modal-loading {
		text-align: center;
		padding: var(--space-xl);
		color: var(--text-muted);
		font-weight: 500;
	}

	.stock-options {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.stock-item {
		background: var(--surface-container-low);
		padding: var(--space-md);
		border-radius: var(--radius-md);
	}

	.stock-header {
		display: flex;
		justify-content: space-between;
		font-size: 0.8125rem;
		font-weight: 700;
		margin-bottom: var(--space-sm);
	}

	.location {
		display: flex;
		align-items: center;
		gap: 4px;
		color: var(--on-surface);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.avail {
		color: var(--primary);
	}

	.serial {
		font-family: monospace;
		font-size: 0.75rem;
		background: var(--surface-container-highest);
		padding: 2px 6px;
		border-radius: 4px;
		display: inline-block;
		margin-bottom: var(--space-sm);
		font-weight: bold;
		color: var(--on-surface);
	}

	.transfer-row {
		display: flex;
		gap: var(--space-sm);
	}

	.qty-input {
		width: 70px;
		padding: 8px;
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		text-align: center;
		font-weight: 700;
		background: var(--surface-container-highest);
		color: var(--on-surface);
	}

	.qty-input:focus {
		border-bottom-color: var(--primary);
	}

	.move-btn {
		flex: 1;
		min-height: var(--space-12);
		background: var(--primary);
		color: var(--on-primary);
		border-radius: var(--radius-sm);
		font-weight: 800;
		font-size: 0.8125rem;
	}

	.move-btn:active {
		transform: scale(0.98);
	}

	.transfer-error {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--tertiary);
		margin: 0 0 var(--space-sm);
	}
</style>
