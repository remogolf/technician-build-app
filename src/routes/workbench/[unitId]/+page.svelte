<script>
	import { onMount } from 'svelte';
	import { goto, invalidate } from '$app/navigation';
	import ScreenHeader from '$lib/components/ScreenHeader.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Card from '$lib/components/Card.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { workbench } from '$lib/state/workbench.svelte.js';
	import {
		fetchStockInLocation,
		updateStockItem,
		allocateStock,
		completeBuildOutputs,
		fetchAllocationsForOutput
	} from '$lib/api/builds';

	let { data } = $props();

	// Derived values from data to ensure reactivity during navigation
	const bom = $derived(data.bom || []);
	const boId = $derived(data.boId);
	const error = $derived(data.error);

	// Local UI state
	let unit = $state(data.unit);
	let allocations = $state(data.allocations || []);
	let inputSerial = $state(data.unit?.serial || '');
	let wipStock = $state([]);
	let loadingWip = $state(true);
	let saving = $state(false);
	let isReviewMode = $state(false);
	let serialError = $state(null);
	let allocateError = $state(null);
	let completeError = $state(null);

	// Synchronize local state when data prop changes (e.g. navigation)
	$effect(() => {
		if (saving) return;
		unit = data.unit;
		allocations = data.allocations || [];
		inputSerial = data.unit?.serial || '';
		isReviewMode = false;
	});

	async function loadWipStock() {
		const bucketId = workbench.wipLocationId;
		if (!bucketId) {
			loadingWip = false;
			return;
		}
		try {
			wipStock = await fetchStockInLocation(bucketId);
		} catch (e) {
			console.error('Failed to load WIP stock', e);
		} finally {
			loadingWip = false;
		}
	}

	onMount(() => {
		if (!error && unit) {
			loadWipStock();
		}
	});

	const isComplete = $derived(!unit?.is_building);

	// Group BOM requirements and match with allocations
	const requirements = $derived(
		bom.map((line) => {
			const isTrackable = line.raw?.part_detail?.trackable;
			const allocatedToThis = allocations.filter((a) => a.bomLineId === line.id);
			const totalAllocatedQty = allocatedToThis.reduce((sum, a) => sum + a.quantity, 0);

			const availableWip = wipStock.filter((s) => String(s.part) === String(line.partId));
			const totalWipQty = availableWip.reduce((sum, s) => sum + Number(s.quantity), 0);

			const met = isTrackable
				? totalAllocatedQty >= line.quantityPerUnit
				: totalWipQty >= line.quantityPerUnit;

			return {
				...line,
				isTrackable,
				allocated: allocatedToThis,
				totalAllocatedQty,
				totalWipQty,
				met,
				availableWip
			};
		})
	);

	const canComplete = $derived(!isComplete && requirements.every((r) => r.met));

	async function handleSaveSerial() {
		if (inputSerial === (unit?.serial || '')) return;
		serialError = null;
		saving = true;
		try {
			const updated = await updateStockItem(unit.pk, { serial: inputSerial });
			unit = updated;
		} catch (e) {
			console.error('Failed to save serial', e);
			serialError = `Failed to save serial number: ${e.message}`;
		} finally {
			saving = false;
		}
	}

	async function handleAllocate(bomLine, stockItemPk, quantity) {
		allocateError = null;
		saving = true;
		try {
			const items = [
				{
					build_line: Number(bomLine.id),
					stock_item: Number(stockItemPk),
					quantity: Number(quantity),
					output: unit.pk
				}
			];
			await allocateStock(boId, items);

			const [newAllocs, newWip] = await Promise.all([
				fetchAllocationsForOutput(boId, unit.pk),
				fetchStockInLocation(workbench.wipLocationId)
			]);
			allocations = newAllocs;
			wipStock = newWip;
		} catch (e) {
			console.error('Failed to allocate', e);
			allocateError = `Failed to allocate part: ${e.message}`;
		} finally {
			saving = false;
		}
	}

	async function autoAllocateBulkItems() {
		const itemsToAllocate = [];

		for (const req of requirements) {
			if (!req.isTrackable) {
				const missingQty = req.quantityPerUnit - req.totalAllocatedQty;
				if (missingQty <= 0) continue;

				let qtyToFind = missingQty;
				for (const wipItem of req.availableWip) {
					if (qtyToFind <= 0) break;
					const takeQty = Math.min(Number(wipItem.quantity), qtyToFind);
					itemsToAllocate.push({
						build_line: Number(req.id),
						stock_item: Number(wipItem.pk),
						quantity: takeQty
					});
					qtyToFind -= takeQty;
				}

				if (qtyToFind > 0) {
					throw new Error(`Not enough stock in WIP bucket for bulk item: ${req.partName}`);
				}
			}
		}

		if (itemsToAllocate.length > 0) {
			await allocateStock(boId, itemsToAllocate);
		}
	}

	async function handleComplete() {
		completeError = null;
		saving = true;
		try {
			await autoAllocateBulkItems();
			await completeBuildOutputs(boId, [unit.pk], workbench.wipLocationId);

			unit.is_building = false;
			await invalidate('app:build-orders');
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto('/workbench');
		} catch (e) {
			console.error('Failed to complete unit', e);
			completeError = `Failed to complete unit: ${e.message}`;
		} finally {
			saving = false;
		}
	}
</script>

{#if error}
	<ScreenHeader title="Error" backHref="/workbench" />
	<div class="content">
		<Card>{error}</Card>
	</div>
{:else if unit}
	<ScreenHeader
		title={`Unit #${unit.pk}`}
		subtitle={isComplete ? 'Complete' : isReviewMode ? 'Review & Commit' : 'Assembly in Progress'}
		backHref="/workbench"
	/>

	<div class="content">
		{#if saving}
			<div class="saving-overlay">
				<div class="spinner"></div>
				<div class="saving-text">Updating...</div>
			</div>
		{/if}

		{#if !isReviewMode}
			<!-- STATE A: IN PROGRESS -->
			<Card class="serial-card">
				<label for="out-serial" class="field-label">Output Serial</label>
				<div class="serial-row">
					<input
						id="out-serial"
						type="text"
						class="serial-input"
						placeholder="Assign Serial Number"
						bind:value={inputSerial}
						disabled={isComplete || saving}
					/>
					{#if !isComplete && inputSerial !== (unit.serial || '')}
						<button class="save-btn" onclick={handleSaveSerial} disabled={saving}>Save</button>
					{/if}
				</div>
			</Card>
		{#if serialError}
			<p class="action-error">{serialError}</p>
		{/if}

			<div class="section-label">Required Components</div>

			{#if loadingWip}
				<div class="loading-text">Loading WIP stock...</div>
			{:else}
				<div class="req-list">
					{#each requirements as req (req.id)}
						<div class="req-card" class:met={req.met}>
							<div class="req-header">
								<div class="req-info">
									<div class="req-name">{req.partName}</div>
									<div class="req-meta">
										{#if req.isTrackable}
											<Badge variant="warning">Tracked</Badge>
										{:else}
											<Badge variant="gray">Bulk</Badge>
										{/if}
										<span class="per-unit">Needs: {req.quantityPerUnit} {req.unit}</span>
									</div>
								</div>
								<div class="req-status">
									{#if req.met}
										<Badge variant="success">Ready</Badge>
									{:else}
										<Badge variant="error">Missing</Badge>
									{/if}
								</div>
							</div>

							{#if req.isTrackable}
								{#if req.allocated.length > 0}
									<div class="allocations">
										{#each req.allocated as alloc (alloc.id)}
											<div class="alloc-pill">
												<span class="alloc-label">PAIRED SN:</span>
												<span class="alloc-value">{alloc.serial || 'N/A'}</span>
											</div>
										{/each}
									</div>
								{/if}

								{#if !isComplete && !req.met}
									<div class="pair-action">
										{#if req.availableWip.length === 0}
											<div class="empty-wip-hint">No items in WIP Bucket. Pick items first.</div>
										{:else}
											<select
												class="pair-select"
												onchange={(e) => {
													if (e.currentTarget.value) {
														handleAllocate(req, e.currentTarget.value, req.quantityPerUnit);
														e.currentTarget.value = '';
													}
												}}
												disabled={saving}
											>
												<option value="">Pair serial from WIP...</option>
												{#each req.availableWip as wip (wip.pk)}
													<option value={wip.pk}>
														{wip.serial ? `SN: ${wip.serial}` : `Stock ID: ${wip.pk}`}
													</option>
												{/each}
											</select>
										{/if}
									</div>
								{/if}
							{:else}
								<div class="bulk-status" class:ready={req.met}>
									{req.met
										? 'Available in Bucket'
										: `Missing from Bucket (${req.totalWipQty} found)`}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
			{#if allocateError}
				<p class="action-error">{allocateError}</p>
			{/if}
		{:else}
			<!-- STATE B: REVIEW & COMMIT -->
			<div class="review-state">
				<div class="review-icon">
					<Icon name="check-circle" size={48} />
				</div>
				<h2 class="review-title">Ready to Complete</h2>
				<p class="review-subtitle">
					Review the final assembly details before committing to InvenTree.
				</p>

				<Card class="review-card">
					<div class="review-row">
						<span class="review-row-label">Output Serial</span>
						<span class="serial-tag">{unit.serial || 'N/A'}</span>
					</div>
				</Card>

				<Card class="review-card">
					<div class="section-label" style="margin-bottom: var(--space-md);">Tracked Components</div>
					{#if requirements.filter((r) => r.isTrackable).length === 0}
						<p class="muted-text">No tracked components required.</p>
					{:else}
						<div class="tracked-list">
							{#each requirements.filter((r) => r.isTrackable) as req (req.id)}
								<div class="tracked-row">
									<span class="tracked-name">{req.partName}</span>
									<span class="serial-tag">{req.allocated[0]?.serial || 'Bulk/None'}</span>
								</div>
							{/each}
						</div>
					{/if}
				</Card>

				<div class="bulk-warning">
					<Icon name="inbox" size={18} />
					<div>
						<strong>Bulk items auto-consume</strong><br />
						Required bulk components will be automatically deducted from your WIP Bucket:
						<strong>{workbench.wipLocationName}</strong>.
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div class="actions-footer">
		{#if !isComplete}
			{#if !isReviewMode}
				<div class="btn-row">
					<button
						class="back-btn"
						onclick={async () => {
							// eslint-disable-next-line svelte/no-navigation-without-resolve
							await goto('/workbench');
						}}
					>
						Back
					</button>
					<button
						class="build-btn"
						disabled={!canComplete || saving}
						onclick={() => (isReviewMode = true)}
					>
						Review Unit
					</button>
				</div>
			{:else}
				{#if completeError}
				<p class="action-error">{completeError}</p>
			{/if}
			<div class="commit-hint">This action consumes materials and finalizes the unit.</div>
				<div class="btn-row">
					<button class="back-btn" onclick={() => (isReviewMode = false)} disabled={saving}>
						Back to Edit
					</button>
					<button class="build-btn confirm" disabled={saving} onclick={handleComplete}>
						Confirm & Complete
					</button>
				</div>
			{/if}
		{:else}
			<button
				class="back-btn full"
				onclick={async () => {
					// eslint-disable-next-line svelte/no-navigation-without-resolve
					await goto('/workbench');
				}}
			>
				Back to Workbench
			</button>
		{/if}
	</div>
{/if}

<style>
	.content {
		padding: var(--space-lg);
		padding-bottom: calc(var(--space-16) * 2 + env(safe-area-inset-bottom));
		position: relative;
	}

	/* Saving overlay */
	.saving-overlay {
		position: absolute;
		inset: 0;
		background: var(--surface-variant);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		z-index: 100;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		border-radius: var(--radius-lg);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--outline-variant);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.saving-text {
		font-weight: 800;
		color: var(--primary-fixed-dim);
		text-transform: uppercase;
		font-size: 0.625rem;
		letter-spacing: 0.1em;
	}

	/* Serial card */
	:global(.serial-card) {
		margin-bottom: var(--space-lg) !important;
	}

	.field-label {
		display: block;
		font-size: 0.625rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: var(--space-sm);
	}

	.serial-row {
		display: flex;
		gap: var(--space-sm);
	}

	.serial-input {
		flex: 1;
		padding: var(--space-md);
		border: 1px solid var(--outline-variant);
		border-radius: var(--radius-md);
		background: var(--surface-container-highest);
		color: var(--on-surface);
		font-weight: 700;
		font-family: var(--font-mono);
		outline: none;
		transition: border-color 0.15s, background 0.15s;
	}

	.serial-input:focus {
		border-color: var(--primary);
		background: var(--surface-container-high);
	}

	.save-btn {
		padding: 0 var(--space-lg);
		background: var(--primary);
		color: var(--on-primary);
		border-radius: var(--radius-md);
		font-weight: 800;
		font-size: 0.875rem;
		transition: transform 0.1s ease;
	}

	.save-btn:active {
		transform: scale(0.98);
	}

	/* Section label — shared pattern */
	.section-label {
		font-size: 0.625rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: var(--space-md);
	}

	.loading-text {
		text-align: center;
		color: var(--text-muted);
		font-weight: 600;
		padding: var(--space-xl);
	}

	/* Requirements list */
	.req-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.req-card {
		background: var(--surface-container-high);
		border: 1px solid var(--outline-variant);
		border-left: 3px solid var(--tertiary);
		border-radius: var(--radius-lg);
		padding: var(--space-md);
	}

	.req-card.met {
		border-left-color: var(--success);
	}

	.req-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.req-name {
		font-weight: 800;
		color: var(--on-surface);
		font-size: 0.9375rem;
		line-height: 1.2;
	}

	.req-meta {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-top: var(--space-xs);
	}

	.per-unit {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.allocations {
		margin-top: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.alloc-pill {
		background: var(--surface-container-highest);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		display: flex;
		gap: var(--space-sm);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		border: 1px solid var(--outline-variant);
	}

	.alloc-label {
		color: var(--text-muted);
		font-weight: 800;
	}

	.alloc-value {
		color: var(--on-surface);
		font-weight: 900;
	}

	.pair-action {
		margin-top: var(--space-md);
	}

	.pair-select {
		width: 100%;
		padding: var(--space-md);
		border: 1px solid var(--outline-variant);
		border-radius: var(--radius-md);
		background: var(--surface-container-highest);
		color: var(--on-surface);
		font-weight: 700;
		font-size: 0.875rem;
		outline: none;
	}

	.pair-select:focus {
		border-color: var(--primary);
	}

	.empty-wip-hint {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--tertiary);
		background: transparent;
		border: 1px solid var(--tertiary);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		text-align: center;
	}

	.bulk-status {
		margin-top: var(--space-md);
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--tertiary);
	}

	.bulk-status.ready {
		color: var(--success);
	}

	/* Review state */
	.review-state {
		animation: fade-in 0.25s ease;
	}

	@keyframes fade-in {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.review-icon {
		text-align: center;
		margin-bottom: var(--space-md);
		color: var(--success);
	}

	.review-title {
		margin: 0 0 var(--space-sm);
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--on-surface);
		text-align: center;
		letter-spacing: -0.02em;
	}

	.review-subtitle {
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 500;
		text-align: center;
		margin: 0 0 var(--space-lg);
	}

	:global(.review-card) {
		margin-bottom: var(--space-md) !important;
	}

	.review-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.review-row-label {
		font-weight: 800;
		color: var(--text-muted);
		font-size: 0.875rem;
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

	.muted-text {
		font-size: 0.875rem;
		color: var(--text-muted);
		font-style: italic;
	}

	.tracked-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.tracked-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--outline-variant);
	}

	.tracked-row:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.tracked-name {
		font-weight: 700;
		color: var(--on-surface);
		font-size: 0.875rem;
	}

	.bulk-warning {
		display: flex;
		align-items: flex-start;
		gap: var(--space-md);
		background: var(--surface-container-low);
		border: 1px solid var(--outline-variant);
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		font-size: 0.8125rem;
		color: var(--on-surface);
		line-height: 1.5;
	}

	.bulk-warning :global(svg) {
		flex-shrink: 0;
		color: var(--primary-fixed-dim);
		margin-top: 2px;
	}

	/* Actions footer */
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
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		border-top: 1px solid var(--outline-variant);
		z-index: 1000;
		max-width: 480px;
		margin: 0 auto;
	}

	.commit-hint {
		font-size: 0.625rem;
		font-weight: 700;
		color: var(--text-muted);
		text-align: center;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.btn-row {
		display: flex;
		gap: var(--space-md);
		width: 100%;
	}

	.back-btn {
		flex: 1;
		padding: var(--space-lg);
		background: var(--surface-container-highest);
		color: var(--on-surface);
		border: 1px solid var(--outline-variant);
		border-radius: var(--radius-lg);
		font-weight: 800;
		transition: transform 0.1s ease;
	}

	.back-btn.full {
		width: 100%;
		flex: none;
	}

	.back-btn:active {
		transform: scale(0.98);
	}

	.build-btn {
		flex: 2;
		padding: var(--space-lg);
		background: var(--primary);
		color: var(--on-primary);
		border-radius: var(--radius-lg);
		font-weight: 900;
		font-size: 1rem;
		box-shadow: var(--shadow-ambient);
		transition: transform 0.1s ease;
	}

	.build-btn.confirm {
		background: var(--primary-container);
	}

	.build-btn:active {
		transform: scale(0.98);
	}

	.build-btn:disabled {
		background: var(--text-muted);
		opacity: 0.5;
		box-shadow: none;
	}

	.action-error {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--tertiary);
		margin-top: var(--space-sm);
		margin-bottom: 0;
	}
</style>
