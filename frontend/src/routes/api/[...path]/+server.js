import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const hopByHopHeaders = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host'
]);

function stripTrailingSlash(value) {
  return value.replace(/\/$/, '');
}

function getBackendBaseUrl() {
  if (privateEnv.BACKEND_INTERNAL_URL?.trim()) {
    return stripTrailingSlash(privateEnv.BACKEND_INTERNAL_URL.trim());
  }

  if (publicEnv.PUBLIC_API_BASE_URL?.trim()) {
    return stripTrailingSlash(publicEnv.PUBLIC_API_BASE_URL.trim());
  }

  return 'http://localhost:3001';
}

async function proxyRequest(request, params) {
  const backendBaseUrl = getBackendBaseUrl();
  const dynamicPath = Array.isArray(params.path)
    ? params.path.join('/')
    : String(params.path || '');
  const inboundUrl = new URL(request.url);
  const targetUrl = new URL(`${backendBaseUrl}/api/${dynamicPath}`);
  targetUrl.search = inboundUrl.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const init = {
    method: request.method,
    headers
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(targetUrl, init);
    const responseHeaders = new Headers(upstream.headers);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Unable to reach backend service', detail: String(error) }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export const GET = ({ request, params }) => proxyRequest(request, params);
export const POST = ({ request, params }) => proxyRequest(request, params);
export const PUT = ({ request, params }) => proxyRequest(request, params);
export const PATCH = ({ request, params }) => proxyRequest(request, params);
export const DELETE = ({ request, params }) => proxyRequest(request, params);
