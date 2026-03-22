import { error } from '@sveltejs/kit';
import { getBuildOrder } from '$lib/state/app-state.svelte.js';

export function load({ params }) {
  const bo = getBuildOrder(params.id);
  if (!bo) {
    throw error(404, `Build order ${params.id} not found`);
  }

  return { bo };
}
