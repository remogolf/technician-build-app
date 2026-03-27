// @ts-nocheck
import { apiFetch } from './client';

/** Normalizes paginated or plain-array API responses. */
function normalizeResults(data) {
	return Array.isArray(data) ? data : (data?.results || []);
}

const BUILD_STATUS_MAP = {
	10: 'pending',
	20: 'in_progress',
	30: 'on_hold',
	40: 'cancelled',
	50: 'complete'
};

function mapStatus(status) {
	return BUILD_STATUS_MAP[Number(status)] ?? 'pending';
}

function mapBuildOrder(bo) {
	const target = Number(bo?.quantity ?? 0);
	const built = Number(bo?.completed ?? 0);

	return {
		id: String(bo?.pk),
		reference: bo?.reference || `BO-${bo?.pk}`,
		partId: bo?.part ?? null,
		partName:
			bo?.part_detail?.full_name ||
			bo?.part_name ||
			bo?.part_detail?.name ||
			`Part ${bo?.part ?? ''}`,
		status: mapStatus(bo?.status),
		statusText: bo?.status_text || '',
		built,
		target,
		remaining: Math.max(target - built, 0),
		progress: target > 0 ? (built / target) * 100 : 0,
		raw: bo
	};
}

export async function fetchBuildOrders(options = {}) {
	const data = await apiFetch('/api/build/?part_detail=true', options);
	return normalizeResults(data).map(mapBuildOrder);
}

export async function fetchBuildOrderById(id, options = {}) {
	const bo = await apiFetch(`/api/build/${id}/`, options);
	return mapBuildOrder(bo);
}

export async function createSingleOutput(id, locationId, serial = '', options = {}) {
	const payload = {
		quantity: 1,
		location: Number(locationId)
	};
	if (serial) payload.serial_numbers = serial;

	const response = await apiFetch(`/api/build/${id}/create-output/`, {
		...options,
		method: 'POST',
		body: JSON.stringify(payload)
	});

	// create-output returns an array of StockItem
	return Array.isArray(response) ? response[0] : response;
}

export async function completeBuildOutputs(buildId, outputIds, locationId, options = {}) {
	return await apiFetch(`/api/build/${buildId}/complete/`, {
		...options,
		method: 'POST',
		body: JSON.stringify({
			location: Number(locationId),
			accept_incomplete_allocation: true,
			outputs: outputIds.map((id) => ({
				output: id,
				quantity: 1
			}))
		})
	});
}

export async function fetchAllBuildOutputs(buildId, options = {}) {
	const data = await apiFetch(`/api/stock/?build=${buildId}`, options);
	return normalizeResults(data);
}

export async function fetchLocations(options = {}) {
	const data = await apiFetch('/api/stock/location/?structural=false', options);
	return normalizeResults(data).map((loc) => ({
		id: loc.pk,
		name: loc.name,
		path: loc.pathstring
	}));
}

export async function fetchStockForPart(partId, options = {}) {
	const data = await apiFetch(
		`/api/stock/?part=${partId}&in_stock=true&allocated=false&location_detail=true`,
		options
	);
	return normalizeResults(data).map((item) => ({
		id: item.pk,
		partId: item.part,
		locationId: item.location,
		locationName: item.location_detail?.name || 'No Location',
		locationPath: item.location_detail?.pathstring || item.location_detail?.name || 'No Location',
		quantity: Number(item.quantity),
		serial: item.serial,
		batch: item.batch,
		status: item.status_text
	}));
}

export async function updateStockItem(id, data, options = {}) {
	return await apiFetch(`/api/stock/${id}/`, {
		...options,
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}

export async function allocateStock(buildId, items, options = {}) {
	return await apiFetch(`/api/build/${buildId}/allocate/`, {
		...options,
		method: 'POST',
		body: JSON.stringify({ items })
	});
}

export async function consumeBuildItems(buildId, items, options = {}) {
	return await apiFetch(`/api/build/${buildId}/consume/`, {
		...options,
		method: 'POST',
		body: JSON.stringify({ items })
	});
}

export async function transferStock(items, toLocationId, notes = '', options = {}) {
	return await apiFetch('/api/stock/transfer/', {
		...options,
		method: 'POST',
		body: JSON.stringify({
			items: items.map((i) => ({ pk: i.pk, quantity: i.quantity })),
			location: Number(toLocationId),
			notes
		})
	});
}

export async function fetchStockInLocation(locationId, options = {}) {
	const data = await apiFetch(
		`/api/stock/?location=${locationId}&in_stock=true&allocated=false&part_detail=true&location_detail=true`,
		options
	);
	return normalizeResults(data);
}

export async function fetchAllocationsForOutput(buildId, outputId, options = {}) {
	const data = await apiFetch(
		`/api/build/item/?build=${buildId}&output=${outputId}&part_detail=true&stock_detail=true`,
		options
	);
	return normalizeResults(data).map((item) => ({
		id: item.pk,
		bomLineId: String(item.build_line),
		stockItemId: item.stock_item,
		quantity: Number(item.quantity),
		serial: item.stock_item_detail?.serial || '',
		partName: item.stock_item_detail?.part_detail?.full_name || item.part_detail?.full_name || ''
	}));
}

export async function fetchBuildLevelAllocations(buildId, options = {}) {
	const data = await apiFetch(
		`/api/build/item/?build=${buildId}&part_detail=true&stock_detail=true`,
		options
	);
	return normalizeResults(data)
		.filter((item) => !item.output)
		.map((item) => ({
			id: item.pk,
			bomLineId: String(item.build_line),
			stockItemId: item.stock_item,
			quantity: Number(item.quantity),
			partName: item.stock_item_detail?.part_detail?.full_name || item.part_detail?.full_name || ''
		}));
}

export async function fetchBuildOrderBOM(buildId, options = {}) {
	const data = await apiFetch(
		`/api/build/line/?build=${buildId}&part_detail=true&bom_item_detail=true`,
		options
	);

	return normalizeResults(data).map((line) => ({
		id: String(line.pk),
		partId: line.part,
		partName: line.part_detail?.full_name || line.part_detail?.name || `Part ${line.part}`,
		required: Number(line.quantity || 0),
		allocated: Number(line.allocated || 0),
		consumed: Number(line.consumed || 0),
		remaining: Math.max(0, Number(line.quantity || 0) - Number(line.allocated || 0)),
		unit: line.part_detail?.unit || '',
		bomId: line.bom_item,
		quantityPerUnit: Number(line.bom_item_detail?.quantity || 1),
		raw: line
	}));
}

export async function searchStock(query, options = {}) {
	const data = await apiFetch(
		`/api/stock/?search=${encodeURIComponent(query)}&in_stock=true&part_detail=true&location_detail=true`,
		options
	);
	return normalizeResults(data);
}

export async function fetchNextSerialNumber(partId, options = {}) {
	const data = await apiFetch(`/api/part/${partId}/serial-numbers/`, options);
	return data?.next || '';
}

export async function fetchStockItemById(id, options = {}) {
	return await apiFetch(`/api/stock/${id}/?part_detail=true`, options);
}

export async function deallocateStockItems(allocationIds, options = {}) {
	return await apiFetch('/api/build/item/', {
		...options,
		method: 'DELETE',
		body: JSON.stringify({ items: allocationIds.map(Number) })
	});
}

export async function deleteOutput(buildId, outputId, options = {}) {
	return await apiFetch(`/api/build/${buildId}/delete-outputs/`, {
		...options,
		method: 'POST',
		body: JSON.stringify({ outputs: [{ output: Number(outputId) }] })
	});
}

export async function scrapBuildOutputs(buildId, outputs, locationId, notes = '', discardAllocations = true, options = {}) {
	return await apiFetch(`/api/build/${buildId}/scrap-outputs/`, {
		...options,
		method: 'POST',
		body: JSON.stringify({
			outputs: outputs.map(Number),
			location: Number(locationId),
			discard_allocations: discardAllocations,
			notes
		})
	});
}
