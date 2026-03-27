<script>
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	// Hide Nav on login and deep-dive pages
	const showNav = $derived(
		$page.url.pathname !== '/login' &&
			!$page.url.pathname.match(/\/workbench\/\d+$/) &&
			!$page.url.pathname.match(/\/orders\/\d+$/)
	);
</script>

<div class="app-shell">
	<main class="content" class:with-nav={showNav}>
		{@render children()}
	</main>

	{#if showNav}
		<BottomNav />
	{/if}
</div>

<style>
	.app-shell {
		min-height: 100vh;
		background: var(--surface);
		max-width: 480px;
		margin: 0 auto;
		position: relative;
	}

	.content {
		min-height: 100vh;
	}

	.content.with-nav {
		padding-bottom: 88px;
	}

	@supports (padding: max(0px)) {
		.content.with-nav {
			padding-bottom: max(88px, calc(88px + env(safe-area-inset-bottom)));
		}
	}
</style>
