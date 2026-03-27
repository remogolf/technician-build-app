import { fetchStockItemById, fetchAllocationsForOutput, fetchBuildOrderBOM } from '$lib/api/builds';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
	const { unitId } = params;

	try {
		const unit = await fetchStockItemById(unitId, { customFetch: fetch });
		const boId = unit.build;

		if (!boId) {
			throw new Error('This stock item is not an output of a build order.');
		}

		const [allocations, bom] = await Promise.all([
			fetchAllocationsForOutput(boId, unitId, { customFetch: fetch }),
			fetchBuildOrderBOM(boId, { customFetch: fetch })
		]);

		return {
			unit,
			allocations,
			bom,
			boId
		};
	} catch (err) {
		const error = /** @type {Error} */ (err);
		console.error('Failed to load unit details:', error);
		return {
			error: error.message || 'Failed to load unit details',
			unit: null,
			allocations: [],
			bom: [],
			boId: null
		};
	}
}
