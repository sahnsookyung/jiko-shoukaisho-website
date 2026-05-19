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

function isJobScoutPath(pathname: string): boolean {
    return pathname === JOBSCOUT_PREFIX || pathname.startsWith(`${JOBSCOUT_PREFIX}/`);
}

function safeJobScoutUrl(rawUrl: string | undefined, publicUrl: URL): URL | null {
    if (!rawUrl) {
        return null;
    }

    try {
        const origin = new URL(rawUrl);
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

function redirectToJobScout(env: Env, publicUrl: URL): Response {
    const target = safeJobScoutUrl(env.JOBSCOUT_URL ?? DEFAULT_JOBSCOUT_URL, publicUrl);
    if (!target) {
        return new Response('JobScout URL is not configured.', {
            status: 503,
            headers: {
                'Cache-Control': 'no-store',
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });
    }

    const suffix = publicUrl.pathname === JOBSCOUT_PREFIX
        ? '/'
        : publicUrl.pathname.slice(JOBSCOUT_PREFIX.length);
    target.pathname = suffix.startsWith('/') ? suffix : `/${suffix}`;
    target.search = publicUrl.search;

    return Response.redirect(target.toString(), 308);
}

export default {
    async fetch(request, env): Promise<Response> {
        const url = new URL(request.url);
        if (isJobScoutPath(url.pathname)) {
            return redirectToJobScout(env, url);
        }

        return env.ASSETS.fetch(request);
    },
} satisfies WorkerHandler;
