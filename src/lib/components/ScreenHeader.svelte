<script>
	import { goto } from '$app/navigation';
	import { authState } from '$lib/state/auth.svelte.js';
	import { workbench } from '$lib/state/workbench.svelte.js';
	import { themeState } from '$lib/state/theme.svelte.js';
	import Icon from '$lib/components/Icon.svelte';

	let { title = '', subtitle = '', backHref = '', showLogout = true } = $props();

	/** @param {MouseEvent} event */
	async function handleBack(event) {
		if (!backHref) return;
		event.preventDefault();
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(backHref);
	}

	async function handleLogout() {
		authState.clear();
		workbench.clear();
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto('/login');
	}
</script>

<header class="header">
	<div class="row">
		{#if backHref}
			<button class="icon-btn" type="button" onclick={handleBack} aria-label="Back">
				<Icon name="arrow-left" size={18} />
			</button>
		{/if}
		<div class="titles">
			<h1>{title}</h1>
			{#if subtitle}
				<p>{subtitle}</p>
			{/if}
		</div>
		<button
			class="icon-btn"
			type="button"
			onclick={() => themeState.toggle()}
			aria-label="Toggle theme"
		>
			<Icon name={themeState.value === 'dark' ? 'sun' : 'moon'} size={18} />
		</button>
		{#if showLogout && authState.isAuthenticated}
			<button class="icon-btn" type="button" onclick={handleLogout} aria-label="Sign out">
				<Icon name="logout" size={18} />
			</button>
		{/if}
	</div>
</header>

<style>
	.header {
		padding: var(--space-lg) var(--space-lg) var(--space-sm);
		background: var(--surface);
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.titles {
		flex: 1;
		min-width: 0;
	}

	.icon-btn {
		display: inline-flex;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-md);
		align-items: center;
		justify-content: center;
		color: var(--on-surface);
		background: var(--surface-container-high);
		flex-shrink: 0;
		transition: transform 0.1s ease;
	}

	.icon-btn:active {
		transform: scale(0.92);
	}

	h1 {
		margin: 0;
		font-size: 1.75rem;
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--on-surface);
		letter-spacing: -0.025em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	p {
		margin: 2px 0 0;
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
