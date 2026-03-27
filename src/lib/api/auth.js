/**
 * Authenticate with InvenTree server.
 *
 * @param {{ serverUrl: string; username: string; password: string }} params
 * @returns {Promise<{ serverUrl: string; username: string; token: string }>}
 */
export async function loginToInvenTree({ serverUrl, username, password }) {
	if (!serverUrl || !username || !password) {
		throw new Error('Server URL, username, and password are required');
	}

	const normalizedUrl = serverUrl.replace(/\/+$/, '');
	const url = `${normalizedUrl}/api/user/token/`;
	const basic = btoa(`${username.trim()}:${password}`);

	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: `Basic ${basic}`,
				Accept: 'application/json'
			}
		});

		let data = null;
		try {
			data = await response.json();
		} catch {
			// Data is not JSON
		}

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				throw new Error('Invalid username or password');
			}
			if (response.status >= 500) {
				throw new Error('Server error: The InvenTree server is currently unavailable');
			}
			throw new Error(data?.detail || data?.error || `Login failed (Status: ${response.status})`);
		}

		if (!data?.token) {
			throw new Error('Login response missing authentication token');
		}

		return {
			serverUrl: normalizedUrl,
			username: username.trim(),
			token: data.token
		};
	} catch (err) {
		if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
			throw new Error(`Network error: Could not reach ${normalizedUrl}`);
		}
		throw err;
	}
}
