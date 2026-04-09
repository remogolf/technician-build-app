<script>
	import StatusChip from './StatusChip.svelte';
	import ProgressBar from './ProgressBar.svelte';
	import Icon from './Icon.svelte';
	import { finishBuildOrder, cancelBuildOrder, holdBuildOrder, issueBuildOrder } from '$lib/api/builds';

	/**
	 * @typedef {Object} BuildOrderCardProps
	 * @property {any} bo - Build Order data object
	 * @property {(event: MouseEvent) => any} onclick
	 * @property {() => void} [onAction] - called after a successful action so parent can refresh
	 */
	/** @type {BuildOrderCardProps} */
	let { bo, onclick, onAction } = $props();

	const isTerminal = $derived(bo.status === 'complete' || bo.status === 'cancelled');

	// ─── Swipe ───────────────────────────────────────────────────────────────
	const REVEAL_WIDTH = 160;
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
			if (Math.abs(dx) > Math.abs(dy) + 3) directionLocked = 'h';
			else if (Math.abs(dy) > Math.abs(dx) + 3) directionLocked = 'v';
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
		translateX = translateX < -SNAP_THRESHOLD ? -REVEAL_WIDTH : 0;
	}

	function closeSwipe() {
		isAnimating = true;
		translateX = 0;
	}

	// ─── Actions ─────────────────────────────────────────────────────────────
	let saving = $state(false);
	let actionError = $state(/** @type {string|null} */ (null));

	/** @param {'finish'|'cancel'|'hold'|'issue'} action */
	async function handleAction(action) {
		closeSwipe();
		saving = true;
		actionError = null;
		try {
			if (action === 'finish') await finishBuildOrder(bo.id);
			else if (action === 'cancel') await cancelBuildOrder(bo.id);
			else if (action === 'hold') await holdBuildOrder(bo.id);
			else if (action === 'issue') await issueBuildOrder(bo.id);
			onAction?.();
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e));
			actionError = err.message;
		} finally {
			saving = false;
		}
	}
</script>

<div class="swipe-wrapper" class:terminal={isTerminal}>
	{#if !isTerminal}
		<div class="swipe-actions" style="width: {REVEAL_WIDTH}px">
			{#if bo.status === 'on_hold' || bo.status === 'pending'}
				<button
					class="quick-btn issue"
					onclick={() => handleAction('issue')}
					disabled={saving}
					aria-label="Issue build order"
				>
					<Icon name="play" size={18} />
					<span>Issue</span>
				</button>
			{:else if bo.status === 'in_progress'}
				<button
					class="quick-btn hold"
					onclick={() => handleAction('hold')}
					disabled={saving}
					aria-label="Put on hold"
				>
					<Icon name="pause" size={18} />
					<span>Hold</span>
				</button>
			{/if}
			<button
				class="quick-btn finish"
				onclick={() => handleAction('finish')}
				disabled={saving}
				aria-label="Finish build order"
			>
				<Icon name="check-circle" size={18} />
				<span>Finish</span>
			</button>
		</div>
	{/if}

	<div
		class="swipe-card"
		class:animating={isAnimating}
		style="transform: translateX({translateX}px)"
		ontouchstart={!isTerminal ? onTouchStart : null}
		ontouchmove={!isTerminal ? onTouchMove : null}
		ontouchend={!isTerminal ? onTouchEnd : null}
		onclick={onclick}
		role="button"
		tabindex="0"
		onkeydown={(e) => { if (e.key === 'Enter') onclick?.(e); }}
	>
		<div class="top-row">
			<div class="info">
				<div class="ref">{bo.reference}</div>
				<div class="name">{bo.partName}</div>
			</div>
			<StatusChip status={bo.status} />
		</div>

		<div class="qty-row">
			<span class="built">{bo.built} / {bo.target} built</span>
			<strong class="remaining" class:warning={bo.remaining > 0}>{bo.remaining} missing</strong>
		</div>

		<div class="progress-wrap">
			<ProgressBar value={bo.built} max={bo.target} />
		</div>

		{#if actionError}
			<div class="inline-error">{actionError}</div>
		{/if}

		{#if saving}
			<div class="saving-indicator">Working...</div>
		{/if}
	</div>
</div>

<style>
	.swipe-wrapper {
		position: relative;
		overflow: hidden;
		border-radius: var(--radius-md);
		border: 1px solid var(--outline-variant);
		border-top: 3px solid var(--primary);
	}

	.swipe-wrapper.terminal {
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
		min-width: 80px;
		border: none;
		border-left: 1px solid rgba(255, 255, 255, 0.15);
	}

	.quick-btn.finish {
		background: var(--success);
	}

	.quick-btn.hold {
		background: var(--warning);
	}

	.quick-btn.issue {
		background: var(--primary);
	}

	.quick-btn:disabled {
		opacity: 0.6;
	}

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

	.top-row {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		align-items: flex-start;
	}

	.ref {
		font-weight: 700;
		font-family: var(--font-display);
		font-size: 1.125rem;
		color: var(--on-surface);
		letter-spacing: -0.01em;
	}

	.name {
		color: var(--text-muted);
		margin-top: 2px;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.qty-row {
		margin: var(--space-lg) 0 var(--space-sm);
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.built {
		color: var(--text-muted);
		font-weight: 600;
	}

	.remaining {
		color: var(--success);
		font-weight: 800;
	}

	.remaining.warning {
		color: var(--warning);
	}

	.progress-wrap {
		margin-top: var(--space-sm);
	}

	.inline-error {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--tertiary);
		margin-top: var(--space-sm);
	}

	.saving-indicator {
		font-size: 0.6875rem;
		font-weight: 700;
		color: var(--text-muted);
		margin-top: var(--space-sm);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
</style>
