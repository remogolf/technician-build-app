// @ts-nocheck
import { apiFetch } from './client';

export const STOCK_STATUS = [
	{ value: 10, label: 'OK' },
	{ value: 50, label: 'Attention needed' },
	{ value: 55, label: 'Damaged' },
	{ value: 60, label: 'Destroyed' },
	{ value: 65, label: 'Rejected' },
	{ value: 70, label: 'Lost' },
	{ value: 75, label: 'Quarantined' },
	{ value: 85, label: 'Returned' }
];

/** items: [{ pk, quantity }] */
export async function countStock(items, notes = '', options = {}) {
	return await apiFetch('/api/stock/count/', {
		...options,
		method: 'POST',
		body: JSON.stringify({ items, notes })
	});
}

/** items: [{ pk, quantity }] */
export async function addStock(items, notes = '', options = {}) {
	return await apiFetch('/api/stock/add/', {
		...options,
		method: 'POST',
		body: JSON.stringify({ items, notes })
	});
}

/** items: [{ pk, quantity }] */
export async function removeStock(items, notes = '', options = {}) {
	return await apiFetch('/api/stock/remove/', {
		...options,
		method: 'POST',
		body: JSON.stringify({ items, notes })
	});
}

/** items: [{ pk, quantity }], locationId: number */
export async function transferStockItems(items, locationId, notes = '', options = {}) {
	return await apiFetch('/api/stock/transfer/', {
		...options,
		method: 'POST',
		body: JSON.stringify({ items, location: Number(locationId), notes })
	});
}

/** itemIds: number[], status: number (use STOCK_STATUS values) */
export async function changeStockStatus(itemIds, status, note = '', options = {}) {
	return await apiFetch('/api/stock/change_status/', {
		...options,
		method: 'POST',
		body: JSON.stringify({ items: itemIds.map(Number), status: Number(status), note })
	});
}

/** Serialize a trackable stock item into individually-serialized units */
export async function serializeStock(itemId, quantity, serialNumbers, destination, notes = '', options = {}) {
	return await apiFetch(`/api/stock/${itemId}/serialize/`, {
		...options,
		method: 'POST',
		body: JSON.stringify({
			quantity: Number(quantity),
			serial_numbers: serialNumbers,
			destination: Number(destination),
			notes
		})
	});
}
