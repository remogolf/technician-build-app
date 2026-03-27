// src/lib/config/app.js

/**
 * Hardcoded InvenTree base URL.
 * Normalize it to ensure no trailing slash.
 */
export const INVENTREE_BASE_URL = 'https://inventree.fueg.ch'.replace(/\/+$/, '');

export const API_TIMEOUT_MS = 15_000;
