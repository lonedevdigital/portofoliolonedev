import { env } from '$env/dynamic/public';

export function getApiBaseUrl() {
  return (env.PUBLIC_API_BASE_URL || '').trim();
}

export async function apiFetch(path, options = {}) {
  const base = getApiBaseUrl();
  const normalizedPath = String(path || '').startsWith('/') ? path : `/${path}`;

  const response = await fetch(`${base}${normalizedPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const message = data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export function getJson(path) {
  return apiFetch(path, { method: 'GET' });
}

export function postJson(path, payload) {
  return apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(payload || {})
  });
}

export function putJson(path, payload) {
  return apiFetch(path, {
    method: 'PUT',
    body: JSON.stringify(payload || {})
  });
}

export function deleteJson(path) {
  return apiFetch(path, { method: 'DELETE' });
}