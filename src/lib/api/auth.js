// src/lib/api/auth.js

/** @param {{ serverUrl: string; username: string; password: string }} params */
export async function loginToInvenTree({ serverUrl, username, password }) {
  const cleanServerUrl = serverUrl.trim().replace(/\/+$/, '');
  const url = `${cleanServerUrl}/api/user/token/`;

  const basic = btoa(`${username}:${password}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${basic}`
    }
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    // leave as null
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.error ||
      `Login failed (${response.status})`
    );
  }

  if (!data?.token) {
    throw new Error('Login succeeded but no token was returned');
  }

  return {
    serverUrl: cleanServerUrl,
    username,
    token: data.token
  };
}