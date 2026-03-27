<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/state/auth.svelte.js';
	import { loginToInvenTree } from '$lib/api/auth';
	import ScreenHeader from '$lib/components/ScreenHeader.svelte';
	import Card from '$lib/components/Card.svelte';

	let serverUrl = $state('');
	let username = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	// Startup guard: Redirect if already authenticated
	onMount(() => {
		if (authState.isAuthenticated) {
			goto('/', { replaceState: true });
		}
		serverUrl = authState.serverUrl || '';
	});

	/** @param {SubmitEvent} e */
	async function handleLogin(e) {
		e.preventDefault();

		if (loading) return;
		if (!serverUrl.trim() || !username.trim() || !password) {
			error = 'Server URL, username, and password are required';
			return;
		}

		loading = true;
		error = '';

		try {
			const session = await loginToInvenTree({
				serverUrl: serverUrl.trim(),
				username: username.trim(),
				password
			});

			authState.setAuth(session);
			await goto('/orders');
		} catch (/** @type {any} */ err) {
			console.error('Login failed:', err);
			error = err?.message || 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<div class="login-page">
	<ScreenHeader title="Sign in" subtitle="Technician Build App" showLogout={false} />

	<main class="content p-6">
		<div class="intro">
			<p>Access your InvenTree workshop to begin assembly orders.</p>
		</div>

		<Card>
			<form onsubmit={handleLogin} class="login-form">
				<div class="field">
					<label for="server">Server URL</label>
					<input
						id="server"
						type="url"
						bind:value={serverUrl}
						placeholder="https://your-inventree.com"
						required
						disabled={loading}
					/>
				</div>

				<div class="field">
					<label for="username">Username</label>
					<input
						id="username"
						type="text"
						bind:value={username}
						placeholder="Enter username"
						required
						autocomplete="username"
						disabled={loading}
					/>
				</div>

				<div class="field">
					<label for="password">Password</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder="Enter password"
						required
						autocomplete="current-password"
						disabled={loading}
					/>
				</div>

				{#if error}
					<div class="error-box">
						{error}
					</div>
				{/if}

				<button type="submit" class="login-btn" disabled={loading}>
					{loading ? 'Signing in...' : 'Sign In'}
				</button>
			</form>
		</Card>

		<p class="footer-note">Industrial Build Client v0.1.0</p>
	</main>
</div>

<style>
	.login-page {
		min-height: 100vh;
		background: var(--surface);
	}

	.content {
		max-width: 480px;
		margin: 0 auto;
	}

	.intro {
		text-align: center;
		color: var(--text-muted);
		margin-bottom: var(--space-xl);
		font-weight: 600;
		font-size: 0.9375rem;
	}

	.login-form {
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
		letter-spacing: 0.05em;
	}

	.field input {
		width: 100%;
		padding: var(--space-md);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		background: var(--surface-container-highest);
		color: var(--on-surface);
		font-weight: 600;
		outline: none;
		transition: all 0.2s;
	}

	.field input:focus {
		border-bottom-color: var(--primary);
		background: var(--surface-container-high);
	}

	.error-box {
		padding: var(--space-md);
		background: var(--surface-container-low);
		border-left: 4px solid var(--tertiary);
		border-radius: var(--radius-md);
		color: var(--tertiary);
		font-size: 0.8125rem;
		font-weight: 700;
		text-align: left;
	}

	.login-btn {
		width: 100%;
		min-height: var(--space-12);
		background: linear-gradient(180deg, var(--primary), var(--primary-container));
		color: var(--on-primary);
		border-radius: var(--radius-md);
		font-weight: 700;
		font-family: var(--font-display);
		font-size: 1.125rem;
		margin-top: var(--space-sm);
		box-shadow: var(--shadow-ambient);
	}

	.login-btn:disabled {
		opacity: 0.5;
		box-shadow: none;
	}

	.footer-note {
		text-align: center;
		margin-top: var(--space-xl);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		opacity: 0.5;
	}
</style>
