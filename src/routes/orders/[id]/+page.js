import { fetchBuildOrderById } from '$lib/api/builds';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
	const { id } = params;
	try {
		const bo = await fetchBuildOrderById(id, { customFetch: fetch });
		return { bo };
	} catch (err) {
		return {
			error: err instanceof Error ? err.message : String(err),
			bo: null
		};
	}
}
