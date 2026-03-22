import { get } from 'svelte/store';
import { auth } from '$lib/stores/auth';

/**
 * @param {string} path
 * @param {RequestInit} [options]
 */
export async function apiFetch(path, options = {}) {
  const session = get(auth);

  if (!session?.serverUrl || !session?.token) {
    throw new Error('Not authenticated');
  }

  const base = session.serverUrl.replace(/\/+$/, '');
  const url = `${base}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Token ${session.token}`,
      ...(options.headers || {})
    }
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    // some responses may be empty / non-json
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.error ||
      `Request failed (${response.status})`
    );
  }

  return data;
}
