/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import registry from "../public/cop/v2/source-registry.json";
import { buildLiveSnapshot, buildSourceContracts, createAlertCandidates } from "../lib/dataIntegration.mjs";
import { makeLiveAdapters } from "../lib/liveAdapters.mjs";
import { PROVIDER_FIXTURES } from "../lib/providerFixtures.mjs";
import { SOURCE_MANIFEST } from "../lib/sourceManifest.mjs";
import { prepareWorkflowMock, workflowAdapterCatalog } from "../lib/workflowAdapters.mjs";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const integrationContracts = buildSourceContracts(registry, SOURCE_MANIFEST);

function jsonResponse(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("access-control-allow-origin", "*");
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  return new Response(JSON.stringify(payload, null, 2), { ...init, headers });
}

async function handleIntegrationApi(request: Request, pathname: string) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "accept, content-type",
      },
    });
  }
  if (pathname === "/api/integration/v1/workflow-adapters") {
    if (request.method === "GET") return jsonResponse(workflowAdapterCatalog());
    if (request.method === "POST") {
      try {
        const body = await request.json() as { adapter_id?: string; case?: Record<string, unknown> };
        return jsonResponse(prepareWorkflowMock(body.adapter_id, body.case));
      } catch (error) {
        const code = error instanceof Error && "code" in error
          ? String(error.code)
          : "invalid_workflow_request";
        return jsonResponse({ error: code }, { status: 400 });
      }
    }
    return jsonResponse({ error: "method_not_allowed" }, { status: 405, headers: { allow: "GET, POST, OPTIONS" } });
  }
  if (request.method !== "GET") {
    return jsonResponse({ error: "method_not_allowed" }, { status: 405, headers: { allow: "GET, OPTIONS" } });
  }
  if (pathname === "/api/integration/v1/contracts") {
    return jsonResponse(integrationContracts, {
      headers: { "cache-control": "public, max-age=300, stale-while-revalidate=3600" },
    });
  }

  const snapshot = await buildLiveSnapshot({
    contracts: integrationContracts,
    adapters: makeLiveAdapters(fetch),
    mockFixtures: PROVIDER_FIXTURES,
    now: new Date(),
  });
  if (pathname === "/api/integration/v1/snapshot") return jsonResponse(snapshot);
  if (pathname === "/api/alerts/v1/candidates") {
    return jsonResponse(createAlertCandidates(snapshot));
  }
  return jsonResponse({ error: "not_found" }, { status: 404 });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/integration/") || url.pathname.startsWith("/api/alerts/")) {
      return handleIntegrationApi(request, url.pathname);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
