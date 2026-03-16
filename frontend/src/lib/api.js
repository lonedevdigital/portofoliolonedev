import { env } from '$env/dynamic/public';

function isAbsoluteHttpUrl(value) {
  return value.startsWith('http://') || value.startsWith('https://');
}

export function getApiBaseUrl() {
  const configured = (env.PUBLIC_API_BASE_URL || '').trim();
  if (!configured) {
    return '';
  }

  // Prefer same-origin proxy in browser when configured API domain is different.
  if (typeof window !== 'undefined' && isAbsoluteHttpUrl(configured)) {
    try {
      const target = new URL(configured);
      if (target.origin !== window.location.origin) {
        return '';
      }
    } catch {
      return '';
    }
  }

  return configured;
}

export async function apiFetch(path, options = {}) {
  const base = getApiBaseUrl();
  const normalizedPath = String(path || '').startsWith('/') ? path : `/${path}`;

  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormDataBody =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (hasBody && !isFormDataBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${base}${normalizedPath}`, {
    ...options,
    credentials: options.credentials || 'include',
    headers
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImageFile(file) {
  if (!(typeof File !== 'undefined' && file instanceof File)) {
    throw new Error('File gambar tidak valid');
  }

  const dataUrl = await readFileAsDataUrl(file);
  const payload = {
    fileName: file.name || 'image',
    mimeType: file.type || '',
    base64Data: dataUrl
  };

  return postJson('/api/admin/uploads/image', payload);
}
