import { fetchBuildOrders } from '$lib/api/builds';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, depends }) {
	depends('app:build-orders');
	try {
		const buildOrders = await fetchBuildOrders({ customFetch: fetch });
		return { buildOrders };
	} catch (err) {
		console.error('Failed to load build orders:', err);
		return { error: err instanceof Error ? err.message : String(err), buildOrders: [] };
	}
}
