interface AssetBinding {
    fetch(request: Request): Promise<Response>;
}

interface Env {
    ASSETS: AssetBinding;
    JOBSCOUT_URL?: string;
}

interface WorkerHandler {
    fetch(request: Request, env: Env): Promise<Response>;
}

const JOBSCOUT_PREFIX = '/jobscout';
const DEFAULT_JOBSCOUT_URL = 'https://jobscout.sookyungahn.com';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const SECURITY_HEADERS: Record<string, string> = {
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self'",
        "object-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ].join('; '),
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
};

function isJobScoutPath(pathname: string): boolean {
    return pathname === JOBSCOUT_PREFIX || pathname.startsWith(`${JOBSCOUT_PREFIX}/`);
}

function isLocalHost(hostname: string): boolean {
    return LOCAL_HOSTS.has(hostname);
}

function withSecurityHeaders(response: Response): Response {
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
        headers.set(name, value);
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

function safeJobScoutUrl(rawUrl: string | undefined, publicUrl: URL): URL | null {
    if (!rawUrl) {
        return null;
    }

    try {
        const origin = new URL(rawUrl);
        const isLocalHttp =
            origin.protocol === 'http:' &&
            isLocalHost(origin.hostname) &&
            isLocalHost(publicUrl.hostname);
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

function redirectToJobScout(env: Env, publicUrl: URL): Response {
    const target = safeJobScoutUrl(env.JOBSCOUT_URL ?? DEFAULT_JOBSCOUT_URL, publicUrl);
    if (!target) {
        return withSecurityHeaders(new Response('JobScout URL is not configured.', {
            status: 503,
            headers: {
                'Cache-Control': 'no-store',
                'Content-Type': 'text/plain; charset=utf-8',
            },
        }));
    }

    const suffix = publicUrl.pathname === JOBSCOUT_PREFIX
        ? '/'
        : publicUrl.pathname.slice(JOBSCOUT_PREFIX.length);
    target.pathname = suffix.startsWith('/') ? suffix : `/${suffix}`;
    target.search = publicUrl.search;
    target.hash = '';

    return withSecurityHeaders(new Response(null, {
        status: 307,
        headers: {
            'Cache-Control': 'no-store',
            Location: target.toString(),
        },
    }));
}

export default {
    async fetch(request, env): Promise<Response> {
        const url = new URL(request.url);
        if (isJobScoutPath(url.pathname)) {
            return redirectToJobScout(env, url);
        }

        const response = await env.ASSETS.fetch(request);
        return withSecurityHeaders(response);
    },
} satisfies WorkerHandler;
