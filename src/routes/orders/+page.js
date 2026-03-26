import { fetchBuildOrders } from '$lib/api/builds';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, depends }) {
	depends('app:build-orders');
	try {
		const buildOrders = await fetchBuildOrders({ customFetch: fetch });
		return { buildOrders };
	} catch (err) {
		console.error('Home: Fetch error detail:', err);
		let errorMsg = 'Failed to load build orders';
		if (err instanceof TypeError && err.message === 'Failed to fetch') {
			errorMsg = 'Network error or CORS block. Ensure the InvenTree server allows this origin.';
		} else {
			errorMsg = err instanceof Error ? err.message : String(err);
		}
		return { error: errorMsg, buildOrders: [] };
	}
}
