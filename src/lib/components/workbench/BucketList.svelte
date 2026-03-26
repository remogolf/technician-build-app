<script>
	import { onMount } from 'svelte';
	import { fetchStockInLocation, transferStock, fetchLocations } from '$lib/api/builds';
	import Modal from '$lib/components/Modal.svelte';
	import Card from '$lib/components/Card.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { locationId } = $props();

	let stockItems = $state([]);
	let loading = $state(true);

	// Return Modal State
	let selectedItem = $state(null);
	let locations = $state([]);
	let destinationId = $state('');
	let returnQty = $state(0);
	let returning = $state(false);
	let returnError = $state(null);

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

	onMount(() => {
		loadData();
		fetchLocations()
			.then((locs) => {
				locations = locs;
			})
			.catch((e) => {
				console.error('Failed to prefetch locations', e);
			});
	});

	$effect(() => {
		if (locationId) {
			loadData();
		}
	});

	async function openReturnModal(item) {
		selectedItem = item;
		returnQty = item.quantity;
		returning = false;
		returnError = null;
		if (locations.length === 0) {
			try {
				locations = await fetchLocations();
			} catch (e) {
				console.error('Failed to load locations', e);
			}
		}
	}

	function closeReturnModal() {
		selectedItem = null;
	}

	async function handleReturn() {
		if (!destinationId || returnQty <= 0 || returnQty > selectedItem.quantity) {
			returnError = 'Please select a location and a valid quantity.';
			return;
		}
		returnError = null;

		returning = true;
		try {
			await transferStock(
				[{ pk: selectedItem.pk, quantity: returnQty }],
				destinationId,
				'Returned from WIP'
			);
			await loadData();
			closeReturnModal();
		} catch (e) {
			console.error('Failed to return stock', e);
			returnError = 'Failed to return stock. Please try again.';
		} finally {
			returning = false;
		}
	}
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
			<Card class="bucket-item-card">
				<div class="info">
					<div class="part-name">{item.part_detail.full_name}</div>
					<div class="sku">SKU: {item.part_detail.SKU || 'N/A'}</div>
					{#if item.serial}
						<div class="serial">SN: {item.serial}</div>
					{/if}
				</div>
				<div class="actions">
					<div class="qty">
						{item.quantity}
						<span class="unit">{item.part_detail.unit || ''}</span>
					</div>
					<button class="return-btn" onclick={() => openReturnModal(item)}> Return </button>
				</div>
			</Card>
		{/each}
	{/if}
</div>

<Modal
	isOpen={!!selectedItem}
	title="Return to Stock"
	subtitle={`Returning ${selectedItem?.part_detail?.full_name}`}
	onClose={closeReturnModal}
>
	<div class="modal-form">
		<div class="field">
			<label for="return-qty">Quantity to Return</label>
			<div class="input-group">
				<input
					id="return-qty"
					type="number"
					class="qty-input"
					min="1"
					max={selectedItem?.quantity}
					bind:value={returnQty}
					disabled={!!selectedItem?.serial || returning}
				/>
				<span class="unit-label">{selectedItem?.part_detail?.unit}</span>
			</div>
		</div>

		<div class="field">
			<label for="dest-loc">Destination Location</label>
			<select id="dest-loc" class="loc-select" bind:value={destinationId} disabled={returning}>
				<option value="">Select a location...</option>
				{#each locations as loc (loc.id)}
					<option value={loc.id}>{loc.path}</option>
				{/each}
			</select>
		</div>

		{#if returnError}
			<p class="return-error">{returnError}</p>
		{/if}
		<button
			class="confirm-btn"
			onclick={handleReturn}
			disabled={returning || !destinationId || returnQty <= 0}
		>
			{returning ? 'Transferring...' : 'Confirm Return'}
		</button>
	</div>
</Modal>

<style>
	.bucket-list {
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

	:global(.bucket-item-card) {
		display: flex !important;
		justify-content: space-between;
		align-items: center;
	}

	.part-name {
		font-weight: 800;
		color: var(--on-surface);
		font-size: 0.9375rem;
		line-height: 1.2;
	}

	.sku {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 600;
		margin-top: 2px;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.serial {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		background: var(--surface-container-low);
		color: var(--primary);
		padding: 2px 6px;
		border-radius: 4px;
		display: inline-block;
		margin-top: var(--space-sm);
		font-weight: bold;
	}

	.actions {
		text-align: right;
		flex-shrink: 0;
	}

	.qty {
		font-size: 1.25rem;
		font-weight: 900;
		color: var(--on-surface);
		line-height: 1;
	}

	.qty .unit {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.return-btn {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--tertiary); /* Safety Orange */
		background: none;
		margin-top: var(--space-xs);
		text-decoration: underline;
	}

	.return-btn:active {
		opacity: 0.6;
	}

	.modal-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.field label {
		display: block;
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--text-muted);
		text-transform: uppercase;
		margin-bottom: var(--space-xs);
	}

	.input-group {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.qty-input,
	.loc-select {
		width: 100%;
		padding: var(--space-md);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		background: var(--surface-container-highest);
		color: var(--on-surface);
		font-weight: 700;
		outline: none;
	}

	.qty-input:focus,
	.loc-select:focus {
		border-bottom-color: var(--primary);
		background: var(--surface-container-high);
	}

	.qty-input {
		flex: 1;
	}

	.unit-label {
		font-weight: 800;
		color: var(--text-muted);
	}

	.confirm-btn {
		width: 100%;
		min-height: var(--space-12);
		background: var(--tertiary);
		color: var(--on-tertiary-container);
		border-radius: var(--radius-md);
		font-weight: 700;
		font-family: var(--font-display);
		font-size: 1rem;
		box-shadow: var(--shadow-ambient);
	}

	.confirm-btn:active {
		transform: scale(0.98);
	}

	.return-error {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--tertiary);
		margin: 0;
	}
</style>
