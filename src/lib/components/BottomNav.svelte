<script>
	// @ts-nocheck
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { workbench } from '$lib/state/workbench.svelte.js';

	let items = $derived([
		{
			key: 'orders',
			label: 'Orders',
			href: '/orders',
			svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11M5 6v.01M5 12v.01M5 18v.01" /></svg>`
		},
		{
			key: 'workbench',
			label: 'Workbench',
			href: '/workbench',
			svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>`
		},
		{
			key: 'inventory',
			label: 'Inventory',
			href: '/inventory',
			svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>`
		}
	]);

	let activeIndex = $derived(
		items.findIndex((item) => {
			if (!item.href) return false;
			return $page.url.pathname.startsWith(item.href);
		})
	);

	let containerWidth = $state(0);
	let slotWidth = $derived(containerWidth / items.length);

	// Animation state — decoupled from URL so position doesn't jump mid-animation
	let renderIndex = $state(0);
	let notchFactor = $state(1); // 0 = fully collapsed, 1 = full depth
	let busy = $state(false);

	// Sync renderIndex on direct URL changes (back/forward, initial load)
	$effect(() => {
		if (activeIndex >= 0 && !busy) {
			renderIndex = activeIndex;
		}
	});

	// Geometry
	const chipDiameter = 40;
	const chipRadius = chipDiameter / 2;
	const gap = 10;
	const centerRadius = chipRadius + gap;
	const maxNotchDepth = 18;
	const maxShoulderDropY = 5;
	const shoulderWidth = 15;
	const shoulderInset = 10;

	// All scale with notchFactor so notch fully collapses to flat when factor=0
	let notchDepth = $derived(maxNotchDepth * notchFactor);
	let shoulderDropY = $derived(maxShoulderDropY * notchFactor);
	let arcRadius = $derived(centerRadius * notchFactor);

	// Position driven by renderIndex (not URL-derived activeIndex)
	let notchCenterX = $derived((renderIndex + 0.5) * slotWidth);
	let notchBoxWidth = $derived(centerRadius * 2 + shoulderWidth * 2);
	let notchLeft = $derived(notchCenterX - notchBoxWidth / 2);

	const maskId = 'nav-cutout-mask';

	let notchPath = $derived.by(() => {
		const r = arcRadius;
		const localCx = notchBoxWidth / 2;
		const leftArcX = localCx - centerRadius;
		const rightArcX = localCx + centerRadius;
		const leftTopX = leftArcX - shoulderWidth;
		const rightTopX = rightArcX + shoulderWidth;

		return `M ${leftTopX} 0 C ${leftTopX + shoulderInset} 0 ${leftArcX} ${shoulderDropY} ${leftArcX} ${notchDepth} A ${r} ${r} 0 0 0 ${rightArcX} ${notchDepth} C ${rightArcX} ${shoulderDropY} ${rightTopX - shoulderInset} 0 ${rightTopX} 0 L ${rightTopX} -120 L ${leftTopX} -120 Z`;
	});

	function easeInOut(t) {
		return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
	}

	function animateNotch(from, to, duration) {
		const start = performance.now();
		return new Promise((resolve) => {
			function frame(now) {
				const t = Math.min((now - start) / duration, 1);
				notchFactor = from + (to - from) * easeInOut(t);
				if (t < 1) requestAnimationFrame(frame);
				else {
					notchFactor = to;
					resolve();
				}
			}
			requestAnimationFrame(frame);
		});
	}

	async function handleNav(item, index) {
		if (!item.href || index === activeIndex || busy) return;
		busy = true;

		// Collapse notch at current position
		await animateNotch(1, 0, 150);

		// Snap position to destination (invisible — notch is flat)
		renderIndex = index;

		// Navigate and expand concurrently
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await Promise.all([goto(item.href), animateNotch(0, 1, 200)]);

		busy = false;
	}
</script>

<nav class="bottom-nav-wrapper">
	<div class="nav-container" bind:clientWidth={containerWidth}>
		<svg
			class="nav-bar-svg"
			viewBox={`0 0 ${Math.max(containerWidth, 1)} 100`}
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<defs>
				<mask id={maskId} maskUnits="userSpaceOnUse">
					<rect x="0" y="0" width={Math.max(containerWidth, 1)} height="100" fill="white" />
					<g transform={`translate(${notchLeft}, 0)`}>
						<path d={notchPath} fill="black" />
					</g>
				</mask>
			</defs>

			<rect
				x="0"
				y="0"
				width={Math.max(containerWidth, 1)}
				height="100"
				mask={`url(#${maskId})`}
				class="nav-bar-rect"
			/>
		</svg>

		<div class="nav-items">
			{#each items as item, i (item.key)}
				<button
					type="button"
					class="nav-item"
					class:active={i === renderIndex}
					class:disabled={!item.href}
					aria-current={i === activeIndex ? 'page' : undefined}
					onclick={() => handleNav(item, i)}
					disabled={!item.href}
				>
					<div class="chip-slot">
						<div class="chip">
							<div class="icon-wrapper">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html item.svg}
							</div>
						</div>
					</div>
					<span class="label">{item.label}</span>
				</button>
			{/each}
		</div>
	</div>
</nav>

<style>
	.bottom-nav-wrapper {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		pointer-events: none;
		display: flex;
		justify-content: center;
	}

	.nav-container {
		pointer-events: auto;
		position: relative;
		width: 100%;
		height: calc(72px + env(safe-area-inset-bottom));
		background: transparent;
		overflow: visible;
	}

	.nav-bar-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100px;
		display: block;
		overflow: visible;
		filter: drop-shadow(0 -4px 12px rgba(0, 0, 0, 0.12));
		z-index: 0;
	}

	.nav-bar-rect {
		fill: var(--surface-container-high);
	}

	.nav-items {
		position: absolute;
		inset: 0;
		display: flex;
		z-index: 2;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.nav-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		position: relative;
		-webkit-tap-highlight-color: transparent;
		transition: color 0.2s ease;
	}

	.chip-slot {
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.chip {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
			color 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
			transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
		background: transparent;
	}

	.nav-item.active .chip {
		background: var(--on-surface);
		color: var(--surface);
	}

	.icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		color: inherit;
	}

	.icon-wrapper :global(svg) {
		width: 22px;
		height: 22px;
	}

	.label {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--on-surface);
		opacity: 0;
		transform: translateY(4px);
		transition:
			opacity 160ms ease,
			transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
		pointer-events: none;
		margin-top: 6px;
	}

	.nav-item.active .label {
		opacity: 1;
		transform: translateY(0);
	}

	.nav-item.disabled {
		opacity: 0.2;
		cursor: not-allowed;
	}
</style>
