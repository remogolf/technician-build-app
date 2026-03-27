import { browser } from '$app/environment';
import { INVENTREE_BASE_URL } from '$lib/config/app';

/**
 * Global authentication state using Svelte 5 Runes.
 */
function createAuthState() {
	let session = $state({
		serverUrl: INVENTREE_BASE_URL,
		token: '',
		username: ''
	});

	// Initialize from localStorage immediately if in browser
	if (browser) {
		const saved = localStorage.getItem('inventree-auth');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				session.serverUrl = parsed.serverUrl || INVENTREE_BASE_URL;
				session.token = parsed.token || '';
				session.username = parsed.username || '';
			} catch {
				localStorage.removeItem('inventree-auth');
			}
		}
	}

	return {
		get session() {
			return session;
		},
		get isAuthenticated() {
			return Boolean(session.token);
		},
		get token() {
			return session.token;
		},
		get username() {
			return session.username;
		},
		get serverUrl() {
			return session.serverUrl;
		},

		/** @param {{token:string, username:string, serverUrl: string}} data */
		setAuth(data) {
			session.token = data.token;
			session.username = data.username;
			session.serverUrl = data.serverUrl || INVENTREE_BASE_URL;
			if (browser) {
				localStorage.setItem(
					'inventree-auth',
					JSON.stringify({
						token: session.token,
						username: session.username,
						serverUrl: session.serverUrl
					})
				);
			}
		},

		clear() {
			session.token = '';
			session.username = '';
			// We keep the serverUrl even after clear for UX
			if (browser) {
				localStorage.setItem(
					'inventree-auth',
					JSON.stringify({
						token: '',
						username: '',
						serverUrl: session.serverUrl
					})
				);
			}
		}
	};
}

export const authState = createAuthState();
