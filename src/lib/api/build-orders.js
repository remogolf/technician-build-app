import { apiFetch } from './client';

/**
 * @param {string | number | null | undefined} status
 * @param {string | null | undefined} statusText
 */
function mapStatus(status, statusText) {
  const numeric = String(status ?? '');
  const text = String(statusText ?? '').toLowerCase();

  if (numeric === '10' || text === 'pending') return 'pending';
  if (numeric === '20' || text === 'production') return 'in_progress';
  if (numeric === '25' || text === 'on hold' || text === 'on_hold') return 'on_hold';
  if (numeric === '40' || text === 'cancelled') return 'cancelled';
  if (numeric === '50' || text === 'completed') return 'completed';

  return 'pending';
}

/**
 * @param {any} bo
 */
function mapBuildOrder(bo) {
  const target = Number(bo?.quantity ?? 0);
  const built = Number(bo?.completed ?? 0);

  return {
    id: String(bo?.pk),
    reference: bo?.reference || `BO-${bo?.pk}`,
    partId: bo?.part ?? null,
    partName: bo?.part_name || bo?.part_detail?.name || `Part ${bo?.part ?? ''}`,
    status: mapStatus(bo?.status, bo?.status_text),
    built,
    target,
    remaining: Math.max(target - built, 0),
    statusText: bo?.status_text || '',
    raw: bo
  };
}

export async function fetchBuildOrders() {
  const data = await apiFetch('/api/build/');

  console.log('fetchBuildOrders raw', data);

  if (!Array.isArray(data)) {
    throw new Error('Expected build order list');
  }

  const mapped = data.map(mapBuildOrder);

  console.log('fetchBuildOrders mapped', mapped);

  return mapped;
}

