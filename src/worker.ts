interface AssetBinding {
    fetch(request: Request): Promise<Response>;
}

interface Env {
    ASSETS: AssetBinding;
    JOBSCOUT_ORIGIN?: string;
}

interface WorkerHandler {
    fetch(request: Request, env: Env): Promise<Response>;
}

const JOBSCOUT_PREFIX = '/jobscout';
const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
]);

function isJobScoutPath(pathname: string): boolean {
    return pathname === JOBSCOUT_PREFIX || pathname.startsWith(`${JOBSCOUT_PREFIX}/`);
}

function safeOrigin(rawOrigin: string | undefined, publicUrl: URL): URL | null {
    if (!rawOrigin) {
        return null;
    }

    try {
        const origin = new URL(rawOrigin);
        const isLocalHttp =
            origin.protocol === 'http:' &&
            ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
        if (origin.protocol !== 'https:' && !isLocalHttp) {
            return null;
        }
        if (origin.username || origin.password) {
            return null;
        }
        if (origin.host === publicUrl.host) {
            return null;
        }
        return origin;
    } catch {
        return null;
    }
}

function proxiedRequest(request: Request, origin: URL, publicUrl: URL): Request {
    const upstreamUrl = new URL(origin);
    upstreamUrl.pathname = publicUrl.pathname;
    upstreamUrl.search = publicUrl.search;

    const headers = new Headers(request.headers);
    headers.set('X-Forwarded-Host', publicUrl.host);
    headers.set('X-Forwarded-Proto', publicUrl.protocol.replace(':', ''));
    headers.set('X-Forwarded-Prefix', JOBSCOUT_PREFIX);
    for (const headerName of HOP_BY_HOP_HEADERS) {
        headers.delete(headerName);
    }

    return new Request(upstreamUrl, {
        body: request.body,
        duplex: 'half',
        headers,
        method: request.method,
        redirect: 'manual',
    } as RequestInit & { duplex: 'half' });
}

function rewriteLocation(location: string | null, origin: URL, publicUrl: URL): string | null {
    if (!location) {
        return null;
    }

    try {
        const redirected = new URL(location, origin);
        if (redirected.origin !== origin.origin) {
            return location;
        }
        redirected.protocol = publicUrl.protocol;
        redirected.host = publicUrl.host;
        return redirected.toString();
    } catch {
        return location;
    }
}

async function fetchJobScout(request: Request, env: Env, publicUrl: URL): Promise<Response> {
    const origin = safeOrigin(env.JOBSCOUT_ORIGIN, publicUrl);
    if (!origin) {
        return new Response('JobScout origin is not configured.', {
            status: 503,
            headers: {
                'Cache-Control': 'no-store',
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });
    }

    const upstream = await fetch(proxiedRequest(request, origin, publicUrl));
    const headers = new Headers(upstream.headers);
    const rewrittenLocation = rewriteLocation(headers.get('Location'), origin, publicUrl);
    if (rewrittenLocation) {
        headers.set('Location', rewrittenLocation);
    }
    headers.set('Cache-Control', headers.get('Cache-Control') ?? 'no-store');

    return new Response(upstream.body, {
        headers,
        status: upstream.status,
        statusText: upstream.statusText,
    });
}

export default {
    async fetch(request, env): Promise<Response> {
        const url = new URL(request.url);
        if (isJobScoutPath(url.pathname)) {
            return fetchJobScout(request, env, url);
        }

        return env.ASSETS.fetch(request);
    },
} satisfies WorkerHandler;
