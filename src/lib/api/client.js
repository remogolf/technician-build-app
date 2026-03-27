// src/lib/api/client.js
import { authState } from '$lib/state/auth.svelte.js';
import { API_TIMEOUT_MS } from '$lib/config/app';

/**
 * Enhanced fetch wrapper for InvenTree API.
 */
export async function apiFetch(path, options = {}) {
	const { token, serverUrl } = authState;

	if (!token) {
		throw new Error('Not authenticated');
	}

	const url = `${serverUrl}${path}`;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

	const fetchFn = options.customFetch || fetch;

	try {
		const response = await fetchFn(url, {
			...options,
			signal: controller.signal,
			headers: {
				Accept: 'application/json',
				Authorization: `Token ${token}`,
				...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
				...(options.headers || {})
			}
		});

		clearTimeout(timeoutId);

		let data = null;
		try {
			data = await response.json();
		} catch {
			// empty
		}

		if (!response.ok) {
			console.error(`apiFetch error [${response.status}] for ${url}:`, data);

			// Handle Django REST Framework error shapes
			if (response.status === 400 && data && typeof data === 'object') {
				const messages = Object.entries(data)
					.map(([key, val]) => {
						const detail = Array.isArray(val)
							? val.map((v) => (typeof v === 'object' ? JSON.stringify(v) : v)).join(', ')
							: typeof val === 'object'
								? JSON.stringify(val)
								: val;
						return `${key}: ${detail}`;
					})
					.join(' | ');
				throw new Error(messages || 'Bad Request');
			}

			throw new Error(data?.detail || data?.error || `Request failed (${response.status})`);
		}

		return data;
	} catch (err) {
		clearTimeout(timeoutId);
		if (err.name === 'AbortError') throw new Error('Request timed out');
		if (err instanceof TypeError && err.message === 'Failed to fetch') {
			throw new Error('Network error — check that the InvenTree server allows this origin.');
		}
		throw err;
	}
}
