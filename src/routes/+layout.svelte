<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authState } from '$lib/state/auth.svelte.js';
	import AppShell from '$lib/components/AppShell.svelte';

	let { children } = $props();

	// Reactive guard using $effect
	$effect(() => {
		if (!authState.isAuthenticated && $page.url.pathname !== '/login') {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto('/login');
		}
	});
</script>

<AppShell>
	{@render children()}
</AppShell>

<style>
	:global(:root) {
		/* Colors - Digital Foreman */
		--surface: #061423;
		--surface-container-low: #0f1c2c;
		--surface-container: #152233;
		--surface-container-high: #1e2b3b;
		--surface-container-highest: #283647;
		--surface-variant: rgba(30, 43, 59, 0.6);

		--on-surface: #d6e4f9;
		--text-muted: #8e9db3; /* alias for on-surface-muted */

		--primary: #2563eb;
		--primary-container: #1e40af;
		--on-primary: #ffffff;

		--secondary: #64748b;
		--secondary-container: #334155;
		--secondary-fixed-dim: #475569;

		--tertiary: #ffb693;
		--on-tertiary-container: #4a2105;

		--primary-fixed-dim: #60a5fa;

		--outline-variant: rgba(69, 71, 77, 0.15); /* Ghost Border */

		/* Status Colors (Traffic) */
		--success: #10b981;
		--warning: #f59e0b;
		--error: #ef4444;
		--info: var(--primary-fixed-dim);

		/* Typography */
		--font-display: 'Space Grotesk', sans-serif;
		--font-body: 'Inter', sans-serif;
		--font-mono: 'Courier New', monospace;

		/* Spacing & Radii */
		--radius-sm: 0.375rem;
		--radius-md: 0.5rem; 
		--radius-lg: 0.75rem; 
		--radius-xl: 1.25rem;

		--space-1: 0.35rem; 
		--space-2: 0.75rem; 
		--space-xs: 0.375rem;
		--space-sm: 0.625rem;
		--space-md: 1rem;
		--space-lg: 1.25rem;
		--space-xl: 1.75rem;
		--space-8: 3rem;
		--space-10: 4rem;
		--space-12: 4.5rem; 
		--space-16: 6rem;

		/* Interaction */
		--touch-target: 4.5rem;
		--shadow-ambient: 0 4px 24px 0 rgba(214, 228, 249, 0.08);
	}

	:global(:root[data-theme='light']) {
		--surface: #f8fafc;
		--surface-container-low: #f1f5f9;
		--surface-container: #e2e8f0;
		--surface-container-high: #ffffff;
		--surface-container-highest: #f8fafc;
		--surface-variant: rgba(255, 255, 255, 0.6);

		--on-surface: #0f172a;
		--text-muted: #64748b;

		--primary: #2563eb;
		--primary-container: #dbeafe;
		--on-primary: #ffffff;

		--secondary: #64748b;
		--secondary-container: #f1f5f9;
		--secondary-fixed-dim: #94a3b8;

		--tertiary: #ea580c; 
		--on-tertiary-container: #fffedd;

		--primary-fixed-dim: #3b82f6;

		--outline-variant: rgba(15, 23, 42, 0.08);

		--shadow-ambient: 0 4px 24px 0 rgba(15, 23, 42, 0.05);
	}

	:global(body) {
		margin: 0;
		background: var(--surface);
		color: var(--on-surface);
		font-family: var(--font-body);
		font-size: 1rem;
		line-height: 1.6;
		-webkit-tap-highlight-color: transparent;
		overscroll-behavior-y: none;
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(button) {
		font-family: inherit;
		cursor: pointer;
		border: none;
		outline: none;
	}

	:global(input, select) {
		font-family: inherit;
		font-size: 1rem; /* Prevents auto-zoom on iOS */
		background: var(--surface-container-highest);
		color: var(--on-surface);
		border: none;
		border-bottom: 2.5px solid transparent;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
	}

	:global(input:focus, select:focus) {
		border-bottom-color: var(--primary);
	}
</style>
