<script>
	import Modal from './Modal.svelte';
	import Icon from './Icon.svelte';
	import { fetchLocations } from '$lib/api/builds';
	import {
		countStock,
		addStock,
		removeStock,
		transferStockItems,
		changeStockStatus,
		serializeStock,
		STOCK_STATUS
	} from '$lib/api/stock';

	/** @type {{ item: any, onRefresh?: (() => void) | null }} */
	let { item, onRefresh = null } = $props();

	// ─── Swipe ───────────────────────────────────────────────────────────────
	const REVEAL_WIDTH = 240;
	const SNAP_THRESHOLD = REVEAL_WIDTH * 0.35;

	let translateX = $state(0);
	let isAnimating = $state(false);
	let startX = 0;
	let startY = 0;
	let directionLocked = /** @type {'h'|'v'|null} */ (null);

	function onTouchStart(e) {
		startX = e.touches[0].clientX;
		startY = e.touches[0].clientY;
		directionLocked = null;
		isAnimating = false;
	}

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
			const next = translateX + dx - (translateX + dx > 0 ? dx : 0);
			// allow dragging from current position
			const raw = translateX + (e.touches[0].clientX - (startX + (translateX)));
			// simpler: track from initial swipe offset
			const offset = translateX + dx;
			translateX = Math.max(-REVEAL_WIDTH, Math.min(0, offset));
			// re-anchor start so next move is relative
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

	// Form fields
	let formQty = $state(1);
	let formNotes = $state('');
	let formLocationId = $state('');
	let formStatus = $state(10);
	let formSerials = $state('');
	let locations = $state(/** @type {any[]} */ ([]));
	let loadingLocations = $state(false);

	const isTrackable = $derived(item?.part_detail?.trackable);
	const canSerialize = $derived(isTrackable && !item?.serial);

	const ACTION_LABELS = {
		transfer: 'Transfer',
		count: 'Count',
		add: 'Add Stock',
		remove: 'Remove Stock',
		status: 'Change Status',
		serialize: 'Serialize'
	};

	async function ensureLocations() {
		if (locations.length > 0) return;
		loadingLocations = true;
		try {
			locations = await fetchLocations();
		} catch (e) {
			console.error('Failed to load locations', e);
		} finally {
			loadingLocations = false;
		}
	}

	async function openAction(name) {
		actionError = null;
		formQty = name === 'count' ? item.quantity : 1;
		if (name === 'remove') formQty = 1;
		if (name === 'transfer') formQty = item.serial ? 1 : item.quantity;
		formNotes = '';
		formLocationId = '';
		formStatus = item.status ?? 10;
		formSerials = '';
		activeAction = name;
		if (name === 'transfer' || name === 'serialize') {
			await ensureLocations();
		}
	}

	function closeAction() {
		activeAction = null;
		actionError = null;
	}

	async function handleConfirm() {
		saving = true;
		actionError = null;
		try {
			if (activeAction === 'count') {
				await countStock([{ pk: item.pk, quantity: formQty }], formNotes);
			} else if (activeAction === 'add') {
				await addStock([{ pk: item.pk, quantity: formQty }], formNotes);
			} else if (activeAction === 'remove') {
				await removeStock([{ pk: item.pk, quantity: formQty }], formNotes);
			} else if (activeAction === 'transfer') {
				if (!formLocationId) { actionError = 'Select a destination location.'; saving = false; return; }
				await transferStockItems([{ pk: item.pk, quantity: formQty }], formLocationId, formNotes);
			} else if (activeAction === 'status') {
				await changeStockStatus([item.pk], formStatus, formNotes);
			} else if (activeAction === 'serialize') {
				if (!formLocationId) { actionError = 'Select a destination location.'; saving = false; return; }
				if (!formSerials.trim()) { actionError = 'Enter serial number(s).'; saving = false; return; }
				await serializeStock(item.pk, formQty, formSerials.trim(), formLocationId, formNotes);
			}
			closeAction();
			onRefresh?.();
		} catch (e) {
			console.error('Stock action failed', e);
			actionError = e.message || 'Action failed. Please try again.';
		} finally {
			saving = false;
		}
	}

	const QUICK_ACTIONS = [
		{ name: 'transfer', icon: 'arrow-right-left', label: 'Transfer', color: 'var(--primary)' },
		{ name: 'count', icon: 'clipboard', label: 'Count', color: 'var(--primary-fixed-dim)' },
		{ name: 'add', icon: 'plus', label: 'Add', color: 'var(--success)' },
		{ name: 'remove', icon: 'minus', label: 'Remove', color: 'var(--tertiary)' }
	];

	const MENU_ACTIONS = $derived([
		{ name: 'transfer', icon: 'arrow-right-left', label: 'Transfer to Location' },
		{ name: 'count', icon: 'clipboard', label: 'Count / Stocktake' },
		{ name: 'add', icon: 'plus', label: 'Add Stock' },
		{ name: 'remove', icon: 'minus', label: 'Remove Stock' },
		{ name: 'status', icon: 'alert', label: 'Change Status' },
		...(canSerialize ? [{ name: 'serialize', icon: 'tag', label: 'Serialize' }] : [])
	]);
</script>

<!-- Swipe wrapper -->
<div class="swipe-wrapper">
	<!-- Revealed action buttons (behind the card) -->
	<div class="swipe-actions" style="width: {REVEAL_WIDTH}px">
		{#each QUICK_ACTIONS as action (action.name)}
			<button
				class="quick-btn"
				style="background: {action.color}"
				onclick={() => { closeSwipe(); openAction(action.name); }}
				aria-label={action.label}
			>
				<Icon name={action.icon} size={18} />
				<span>{action.label}</span>
			</button>
		{/each}
	</div>

	<!-- Card (slides left to reveal actions) -->
	<div
		class="swipe-card"
		class:animating={isAnimating}
		style="transform: translateX({translateX}px)"
		ontouchstart={onTouchStart}
		ontouchmove={onTouchMove}
		ontouchend={onTouchEnd}
		role="presentation"
	>
		<div class="card-body">
			<div class="card-main">
				<div class="part-name">{item.part_detail?.full_name || item.part_detail?.name || 'Unknown Part'}</div>
				<div class="sku">{item.part_detail?.SKU ? `SKU: ${item.part_detail.SKU}` : ''}</div>
				{#if item.serial}
					<div class="serial-pill">SN: {item.serial}</div>
				{/if}
				{#if item.status && item.status !== 10}
					<div class="status-badge">{item.status_text || 'Unknown status'}</div>
				{/if}
			</div>

			<div class="card-right">
				<div class="qty-block">
					<span class="qty-value">{item.quantity}</span>
					<span class="qty-unit">{item.part_detail?.units || item.part_detail?.unit || ''}</span>
				</div>
				<button
					class="more-btn"
					onclick={(e) => { e.stopPropagation(); showMenu = true; }}
					aria-label="More actions"
				>
					<Icon name="more-horizontal" size={16} />
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Action menu modal -->
<Modal isOpen={showMenu} title="Stock Actions" subtitle={item.part_detail?.full_name} onClose={() => (showMenu = false)}>
	<div class="menu-list">
		{#each MENU_ACTIONS as action (action.name)}
			<button
				class="menu-item"
				onclick={() => { showMenu = false; openAction(action.name); }}
			>
				<Icon name={action.icon} size={18} />
				<span>{action.label}</span>
			</button>
		{/each}
	</div>
</Modal>

<!-- Action form modal -->
<Modal
	isOpen={activeAction !== null}
	title={ACTION_LABELS[activeAction] || ''}
	subtitle={item.part_detail?.full_name}
	onClose={closeAction}
>
	{#if activeAction !== null}
		<div class="action-form">
			<!-- Count / Add / Remove / Transfer: quantity field -->
			{#if activeAction !== 'status' && activeAction !== 'serialize'}
				<div class="field">
					<label for="form-qty">
						{activeAction === 'count' ? 'New Count' : activeAction === 'add' ? 'Quantity to Add' : activeAction === 'remove' ? 'Quantity to Remove' : 'Quantity'}
					</label>
					<input
						id="form-qty"
						type="number"
						class="form-input"
						min="0"
						max={activeAction === 'remove' ? item.quantity : undefined}
						bind:value={formQty}
						disabled={saving || (activeAction === 'transfer' && !!item.serial)}
					/>
				</div>
			{/if}

			<!-- Transfer: destination location -->
			{#if activeAction === 'transfer'}
				<div class="field">
					<label for="form-location">Destination</label>
					{#if loadingLocations}
						<div class="loading-hint">Loading locations...</div>
					{:else}
						<select id="form-location" class="form-select" bind:value={formLocationId} disabled={saving}>
							<option value="">Select location...</option>
							{#each locations as loc (loc.id)}
								<option value={loc.id}>{loc.path}</option>
							{/each}
						</select>
					{/if}
				</div>
			{/if}

			<!-- Change Status: status picker -->
			{#if activeAction === 'status'}
				<div class="field">
					<label>Status</label>
					<div class="status-grid">
						{#each STOCK_STATUS as s (s.value)}
							<button
								class="status-chip"
								class:active={formStatus === s.value}
								onclick={() => (formStatus = s.value)}
								disabled={saving}
							>
								{s.label}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Serialize: qty + serials + destination -->
			{#if activeAction === 'serialize'}
				<div class="field">
					<label for="form-ser-qty">Quantity to Serialize</label>
					<input id="form-ser-qty" type="number" class="form-input" min="1" max={item.quantity} bind:value={formQty} disabled={saving} />
				</div>
				<div class="field">
					<label for="form-serials">Serial Numbers</label>
					<input id="form-serials" type="text" class="form-input" placeholder="e.g. 1, 2, 3 or 1-3" bind:value={formSerials} disabled={saving} />
					<div class="field-hint">Comma-separated or range notation</div>
				</div>
				<div class="field">
					<label for="form-ser-loc">Destination</label>
					{#if loadingLocations}
						<div class="loading-hint">Loading locations...</div>
					{:else}
						<select id="form-ser-loc" class="form-select" bind:value={formLocationId} disabled={saving}>
							<option value="">Select location...</option>
							{#each locations as loc (loc.id)}
								<option value={loc.id}>{loc.path}</option>
							{/each}
						</select>
					{/if}
				</div>
			{/if}

			<!-- Notes (all actions) -->
			<div class="field">
				<label for="form-notes">Notes (optional)</label>
				<input id="form-notes" type="text" class="form-input" bind:value={formNotes} disabled={saving} />
			</div>

			{#if actionError}
				<p class="form-error">{actionError}</p>
			{/if}

			<button class="confirm-btn" onclick={handleConfirm} disabled={saving}>
				{saving ? 'Saving...' : `Confirm ${ACTION_LABELS[activeAction] || ''}`}
			</button>
		</div>
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
	}

	.swipe-card {
		position: relative;
		z-index: 1;
		will-change: transform;
		touch-action: pan-y;
	}

	.swipe-card.animating {
		transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	/* ── Card body ─────────────────────────────────────────────────── */
	.card-body {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		background: var(--surface-container-high);
		padding: var(--space-md) var(--space-lg);
		gap: var(--space-md);
	}

	.card-main {
		flex: 1;
		min-width: 0;
	}

	.part-name {
		font-weight: 800;
		color: var(--on-surface);
		font-size: 1rem;
		line-height: 1.3;
	}

	.sku {
		font-size: 0.75rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-top: 4px;
	}

	.serial-pill {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		font-weight: 700;
		background: var(--surface-container-low);
		color: var(--primary-fixed-dim);
		padding: 4px var(--space-md);
		border-radius: var(--radius-sm);
		display: inline-block;
		margin-top: var(--space-sm);
	}

	.status-badge {
		display: inline-block;
		margin-top: var(--space-sm);
		background: color-mix(in srgb, var(--tertiary) 12%, transparent);
		color: var(--tertiary);
		border: 1.5px solid color-mix(in srgb, var(--tertiary) 30%, transparent);
		padding: 4px var(--space-md);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	/* ── Card right column ──────────────────────────────────────────── */
	.card-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--space-md);
		flex-shrink: 0;
	}

	.qty-block {
		text-align: right;
		line-height: 1.1;
	}

	.qty-value {
		font-size: 1.5rem;
		font-weight: 900;
		color: var(--on-surface);
	}

	.qty-unit {
		display: block;
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.more-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--surface-container-highest);
		border: 1px solid var(--outline-variant);
		border-radius: var(--radius-md);
		color: var(--text-muted);
		transition: background 0.1s;
	}

	.more-btn:active {
		background: var(--surface-container-low);
	}

	/* ── Action menu ────────────────────────────────────────────────── */
	.menu-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
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
		transition: background 0.1s;
	}

	.menu-item:active {
		background: var(--surface-container-highest);
	}

	/* ── Action form ────────────────────────────────────────────────── */
	.action-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.field label {
		display: block;
		font-size: 0.625rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: var(--space-xs);
	}

	.form-input,
	.form-select {
		width: 100%;
		padding: var(--space-md);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		background: var(--surface-container-highest);
		color: var(--on-surface);
		font-weight: 700;
		font-size: 1rem;
		outline: none;
		box-sizing: border-box;
	}

	.form-input:focus,
	.form-select:focus {
		border-bottom-color: var(--primary);
	}

	.field-hint {
		font-size: 0.6875rem;
		color: var(--text-muted);
		margin-top: 4px;
	}

	.loading-hint {
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 600;
		padding: var(--space-md) 0;
	}

	.status-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.status-chip {
		padding: var(--space-sm) var(--space-md);
		background: var(--surface-container-highest);
		border: 1px solid var(--outline-variant);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--on-surface);
		transition: all 0.1s;
	}

	.status-chip.active {
		background: var(--primary);
		color: var(--on-primary);
		border-color: var(--primary);
	}

	.status-chip:active {
		transform: scale(0.96);
	}

	.form-error {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--tertiary);
		margin: 0;
	}

	.confirm-btn {
		width: 100%;
		min-height: var(--space-12);
		background: var(--primary);
		color: var(--on-primary);
		border-radius: var(--radius-md);
		font-weight: 800;
		font-family: var(--font-display);
		font-size: 1rem;
		box-shadow: var(--shadow-ambient);
		transition: transform 0.1s ease;
	}

	.confirm-btn:active {
		transform: scale(0.98);
	}

	.confirm-btn:disabled {
		background: var(--text-muted);
		opacity: 0.5;
		box-shadow: none;
	}
</style>
