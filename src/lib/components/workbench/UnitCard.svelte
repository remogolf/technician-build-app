<script>
	import { goto } from '$app/navigation';
	import Modal from '$lib/components/Modal.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import {
		deleteOutput,
		fetchAllocationsForOutput,
		fetchBuildLevelAllocations,
		deallocateStockItems,
		fetchLocations,
		scrapBuildOutputs
	} from '$lib/api/builds';

	let { output, boId, onRefresh = null } = $props();

	const isComplete = $derived(!output.is_building);
	const hasSerial = $derived(!!output.serial);

	// ─── Swipe ───────────────────────────────────────────────────────────────
	const REVEAL_WIDTH = 240;
	const SNAP_THRESHOLD = REVEAL_WIDTH * 0.35;

	let translateX = $state(0);
	let isAnimating = $state(false);
	let startX = 0;
	let startY = 0;
	let directionLocked = /** @type {'h'|'v'|null} */ (null);

	/** @param {TouchEvent} e */
	function onTouchStart(e) {
		startX = e.touches[0].clientX;
		startY = e.touches[0].clientY;
		directionLocked = null;
		isAnimating = false;
	}

	/** @param {TouchEvent} e */
	function onTouchMove(e) {
		const dx = e.touches[0].clientX - startX;
		const dy = e.touches[0].clientY - startY;

		if (directionLocked === null) {
			if (Math.abs(dx) > Math.abs(dy) + 3) {
				directionLocked = 'h';
			} else if (Math.abs(dy) > Math.abs(dx) + 3) {
				directionLocked = 'v';
			}
		}

		if (directionLocked === 'h') {
			const offset = translateX + dx;
			translateX = Math.max(-REVEAL_WIDTH, Math.min(0, offset));
			startX = e.touches[0].clientX;
		}
	}

	function onTouchEnd() {
		if (directionLocked !== 'h') return;
		isAnimating = true;
		if (translateX < -SNAP_THRESHOLD) {
			translateX = -REVEAL_WIDTH;
		} else {
			translateX = 0;
		}
	}

	function closeSwipe() {
		isAnimating = true;
		translateX = 0;
	}

	// ─── Actions ─────────────────────────────────────────────────────────────
	let showMenu = $state(false);
	let activeAction = $state(/** @type {string|null} */ (null));
	let saving = $state(false);
	let actionError = $state(/** @type {string|null} */ (null));

	let formLocationId = $state('');
	let formNotes = $state('');
	let locations = $state(/** @type {any[]} */ ([]));
	let loadingLocations = $state(false);

	async function ensureLocations() {
		if (locations.length > 0) return;
		loadingLocations = true;
		try {
			locations = await fetchLocations();
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e));
			console.error('Failed to load locations', err);
		} finally {
			loadingLocations = false;
		}
	}

	async function openScrap() {
		showMenu = false;
		closeSwipe();
		actionError = null;
		formLocationId = '';
		formNotes = '';
		activeAction = 'scrap';
		await ensureLocations();
	}

	async function handleDeallocate() {
		showMenu = false;
		closeSwipe();
		saving = true;
		actionError = null;
		try {
			const [trackedAllocs, bulkAllocs] = await Promise.all([
				fetchAllocationsForOutput(boId, output.pk),
				fetchBuildLevelAllocations(boId)
			]);
			const idsToDelete = [
				...trackedAllocs.map((/** @type {{id:number}} */ a) => a.id),
				...bulkAllocs.map((/** @type {{id:number}} */ a) => a.id)
			];
			if (idsToDelete.length > 0) {
				await deallocateStockItems(idsToDelete);
			}
			onRefresh?.();
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e));
			actionError = `Failed to deallocate: ${err.message}`;
		} finally {
			saving = false;
		}
	}

	async function handleCancel() {
		showMenu = false;
		closeSwipe();
		saving = true;
		actionError = null;
		try {
			await deleteOutput(boId, output.pk);
			onRefresh?.();
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e));
			actionError = `Failed to cancel output: ${err.message}`;
		} finally {
			saving = false;
		}
	}

	async function handleConfirmScrap() {
		if (!formLocationId) return;
		saving = true;
		actionError = null;
		try {
			await scrapBuildOutputs(boId, [output.pk], formLocationId, formNotes);
			activeAction = null;
			onRefresh?.();
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e));
			actionError = `Failed to scrap output: ${err.message}`;
		} finally {
			saving = false;
		}
	}

	const QUICK_ACTIONS = [
		{ name: 'allocate', label: 'Allocate', icon: 'wrench', color: 'var(--primary)' },
		{ name: 'complete', label: 'Complete', icon: 'check-circle', color: 'var(--success)' },
		{ name: 'deallocate', label: 'Dealloc', icon: 'minus', color: 'var(--surface-container-highest)', darkText: true },
		{ name: 'cancel', label: 'Cancel', icon: 'alert', color: 'var(--tertiary)' }
	];

	async function navigateToDetail() {
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(`/workbench/${output.pk}`);
	}

	async function navigateToComplete() {
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(`/workbench/${output.pk}?complete=1`);
	}

	/** @param {'allocate'|'complete'|'deallocate'|'cancel'} name */
	async function handleQuickAction(name) {
		closeSwipe();
		if (name === 'allocate') {
			await navigateToDetail();
		} else if (name === 'complete') {
			navigateToComplete();
		} else if (name === 'deallocate') {
			await handleDeallocate();
		} else if (name === 'cancel') {
			await handleCancel();
		}
	}
</script>

<div class="swipe-wrapper" class:complete={isComplete}>
	<!-- Revealed action buttons (WIP only) -->
	{#if !isComplete}
		<div class="swipe-actions" style="width: {REVEAL_WIDTH}px">
			{#each QUICK_ACTIONS as action (action.name)}
				<button
					class="quick-btn"
					class:dark-text={action.darkText}
					style="background: {action.color}"
					onclick={() => handleQuickAction(/** @type {'allocate'|'complete'|'deallocate'|'cancel'} */ (action.name))}
					aria-label={action.label}
					disabled={saving}
				>
					<Icon name={action.icon} size={18} />
					<span>{action.label}</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Card (slides left to reveal actions) -->
	<div
		class="swipe-card"
		class:animating={isAnimating}
		class:complete={isComplete}
		style="transform: translateX({translateX}px)"
		ontouchstart={!isComplete ? onTouchStart : null}
		ontouchmove={!isComplete ? onTouchMove : null}
		ontouchend={!isComplete ? onTouchEnd : null}
		onclick={navigateToDetail}
		role="button"
		tabindex="0"
		onkeydown={(e) => { if (e.key === 'Enter') navigateToDetail(); }}
	>
		<div class="card-top">
			<div class="card-main">
				<div class="unit-label">Unit #{output.pk}</div>
				<div class="serial-value">
					{#if hasSerial}
						<span class="serial-tag">SN: {output.serial}</span>
					{:else}
						<span class="serial-empty">No serial assigned</span>
					{/if}
				</div>
			</div>

			<div class="card-right">
				<div class="status-badge" class:complete={isComplete}>
					{isComplete ? 'READY' : 'WIP'}
				</div>
				<button
					class="more-btn"
					onclick={(e) => { e.stopPropagation(); showMenu = true; }}
					aria-label="More actions"
					disabled={saving}
				>
					<Icon name="more-horizontal" size={16} />
				</button>
			</div>
		</div>

		<div class="card-bottom">
			<div class="action-label" class:active={!isComplete}>
				{isComplete ? 'View details →' : 'Continue build →'}
			</div>
			{#if !isComplete}
				<div class="pulse-dot"></div>
			{/if}
		</div>

		{#if actionError}
			<div class="inline-error">{actionError}</div>
		{/if}
	</div>
</div>

<!-- ⋯ Action menu -->
<Modal isOpen={showMenu} title="Unit #{output.pk}" onClose={() => (showMenu = false)}>
	<div class="menu-list">
		{#if !isComplete}
			<button class="menu-item" onclick={() => { showMenu = false; navigateToDetail(); }}>
				<Icon name="wrench" size={18} />
				Allocate Components
			</button>
			<button class="menu-item" onclick={() => { showMenu = false; navigateToComplete(); }}>
				<Icon name="check-circle" size={18} />
				Complete Unit
			</button>
			<button class="menu-item" onclick={handleDeallocate} disabled={saving}>
				<Icon name="minus" size={18} />
				Deallocate All
			</button>
		{:else}
			<button class="menu-item" onclick={() => { showMenu = false; navigateToDetail(); }}>
				<Icon name="arrow-left" size={18} />
				View Details
			</button>
		{/if}
		<button class="menu-item destructive" onclick={openScrap} disabled={saving}>
			<Icon name="package" size={18} />
			Scrap Output
		</button>
		{#if !isComplete}
			<button class="menu-item destructive" onclick={handleCancel} disabled={saving}>
				<Icon name="alert" size={18} />
				Cancel Output
			</button>
		{/if}
	</div>
</Modal>

<!-- Scrap form modal -->
<Modal
	isOpen={activeAction === 'scrap'}
	title="Scrap Output"
	subtitle="Unit #{output.pk}"
	onClose={() => (activeAction = null)}
>
	{#if loadingLocations}
		<p class="modal-hint">Loading locations...</p>
	{:else}
		<div class="form-field">
			<label class="form-label" for="scrap-location">Destination Location</label>
			<select id="scrap-location" class="form-select" bind:value={formLocationId} disabled={saving}>
				<option value="">Select location...</option>
				{#each locations as loc (loc.pk)}
					<option value={loc.pk}>{loc.pathstring || loc.name}</option>
				{/each}
			</select>
		</div>
		<div class="form-field">
			<label class="form-label" for="scrap-notes">Notes</label>
			<input
				id="scrap-notes"
				type="text"
				class="form-input"
				placeholder="Optional notes"
				bind:value={formNotes}
				disabled={saving}
			/>
		</div>
		{#if actionError}
			<p class="form-error">{actionError}</p>
		{/if}
		<button
			class="confirm-btn"
			onclick={handleConfirmScrap}
			disabled={saving || !formLocationId}
		>
			{saving ? 'Scrapping...' : 'Confirm Scrap'}
		</button>
	{/if}
</Modal>

<style>
	/* ── Swipe wrapper ─────────────────────────────────────────────── */
	.swipe-wrapper {
		position: relative;
		overflow: hidden;
		border-radius: var(--radius-md);
		border: 1px solid var(--outline-variant);
		border-top: 3px solid var(--primary);
	}

	.swipe-wrapper.complete {
		border-top-color: var(--success);
	}

	.swipe-actions {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		display: flex;
	}

	.quick-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		color: white;
		font-size: 0.5625rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		min-width: 60px;
		border: none;
		border-left: 1px solid rgba(255, 255, 255, 0.1);
	}

	.quick-btn.dark-text {
		color: var(--on-surface);
		border-left-color: var(--outline-variant);
	}

	/* ── Swipe card ────────────────────────────────────────────────── */
	.swipe-card {
		position: relative;
		z-index: 1;
		touch-action: pan-y;
		background: var(--surface-container-high);
		padding: var(--space-lg);
		cursor: pointer;
		text-align: left;
		width: 100%;
		outline: none;
	}

	.swipe-card.animating {
		transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	.swipe-card:active {
		background: var(--surface-container-highest);
	}

	/* ── Card content ──────────────────────────────────────────────── */
	.card-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.card-main {
		flex: 1;
		min-width: 0;
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

	.card-right {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-shrink: 0;
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
	}

	.status-badge.complete {
		background: transparent;
		color: var(--success);
		border: 1px solid var(--success);
	}

	.more-btn {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		background: var(--surface-container-highest);
		color: var(--text-muted);
		border: 1px solid var(--outline-variant);
		flex-shrink: 0;
	}

	.card-bottom {
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

	.inline-error {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--tertiary);
		margin-top: var(--space-sm);
	}

	/* ── Action menu ───────────────────────────────────────────────── */
	.menu-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		background: var(--surface-container-high);
		border-radius: var(--radius-md);
		font-weight: 700;
		color: var(--on-surface);
		font-size: 0.9375rem;
		text-align: left;
		border: 1px solid var(--outline-variant);
		transition: background 0.1s;
	}

	.menu-item:active {
		background: var(--surface-container-highest);
	}

	.menu-item.destructive {
		color: var(--tertiary);
	}

	.menu-item:disabled {
		opacity: 0.5;
	}

	/* ── Scrap form ────────────────────────────────────────────────── */
	.modal-hint {
		text-align: center;
		color: var(--text-muted);
		padding: var(--space-lg);
		font-weight: 500;
	}

	.form-field {
		margin-bottom: var(--space-md);
	}

	.form-label {
		display: block;
		font-size: 0.625rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: var(--space-xs);
	}

	.form-select,
	.form-input {
		width: 100%;
		padding: var(--space-md);
		border: 1px solid var(--outline-variant);
		border-radius: var(--radius-md);
		background: var(--surface-container-highest);
		color: var(--on-surface);
		font-weight: 600;
		font-size: 0.875rem;
	}

	.form-select:focus,
	.form-input:focus {
		border-color: var(--primary);
		outline: none;
	}

	.form-error {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--tertiary);
		margin: 0 0 var(--space-sm);
	}

	.confirm-btn {
		width: 100%;
		min-height: var(--space-12);
		background: var(--primary);
		color: var(--on-primary);
		border-radius: var(--radius-md);
		font-weight: 800;
		font-size: 0.9375rem;
		margin-top: var(--space-md);
		transition: transform 0.1s ease;
	}

	.confirm-btn:active {
		transform: scale(0.98);
	}

	.confirm-btn:disabled {
		opacity: 0.5;
	}
</style>
