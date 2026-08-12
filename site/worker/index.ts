/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import registry from "../public/cop/v2/source-registry.json";
import { buildLiveSnapshot, buildSourceContracts, createAlertCandidates } from "../lib/dataIntegration.mjs";
import { buildSituationClusters } from "../lib/situationWorkflow.mjs";
import { makeLiveAdapters } from "../lib/liveAdapters.mjs";
import { PROVIDER_FIXTURES } from "../lib/providerFixtures.mjs";
import { SOURCE_MANIFEST } from "../lib/sourceManifest.mjs";
import { resolveCorsPolicy } from "../lib/corsPolicy.mjs";
import {
  prepareWorkflowMock,
  simulateWccTicketEvent,
  wccTicketEventContract,
  workflowAdapterCatalog,
} from "../lib/workflowAdapters.mjs";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ALLOWED_POST_ORIGINS?: string;
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

function jsonResponse(payload: unknown, init: ResponseInit = {}, allowOrigin: string | null = "*") {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  if (allowOrigin) headers.set("access-control-allow-origin", allowOrigin);
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  return new Response(JSON.stringify(payload, null, 2), { ...init, headers });
}

async function handleIntegrationApi(request: Request, pathname: string, allowedPostOrigins = "") {
  const cors = resolveCorsPolicy(request, allowedPostOrigins);
  if (!cors.allowed) {
    return jsonResponse({ error: "cors_origin_not_allowed" }, { status: 403 }, null);
  }
  if (request.method === "OPTIONS") {
    const headers = new Headers({
      "access-control-allow-methods": cors.allowMethods,
      "access-control-allow-headers": "accept, content-type",
      "access-control-max-age": "600",
      vary: "Origin",
    });
    if (cors.allowOrigin) headers.set("access-control-allow-origin", cors.allowOrigin);
    return new Response(null, {
      status: 204,
      headers,
    });
  }
  const respond = (payload: unknown, init: ResponseInit = {}) => jsonResponse(payload, init, cors.allowOrigin);
  if (pathname === "/api/integration/v1/workflow-adapters") {
    if (request.method === "GET") return respond(workflowAdapterCatalog());
    if (request.method === "POST") {
      try {
        const body = await request.json() as { adapter_id?: string; case?: Record<string, unknown> };
        return respond(prepareWorkflowMock(body.adapter_id, body.case));
      } catch (error) {
        const code = error instanceof Error && "code" in error
          ? String(error.code)
          : "invalid_workflow_request";
        return respond({ error: code }, { status: 400 });
      }
    }
    return respond({ error: "method_not_allowed" }, { status: 405, headers: { allow: "GET, POST, OPTIONS" } });
  }
  if (pathname === "/api/integration/v1/wcc-ticket-events") {
    if (request.method === "GET") return respond(wccTicketEventContract());
    if (request.method === "POST") {
      try {
        const body = await request.json() as Record<string, unknown>;
        return respond(simulateWccTicketEvent(body));
      } catch (error) {
        const code = error instanceof Error && "code" in error
          ? String(error.code)
          : "invalid_wcc_ticket_event";
        return respond({ error: code }, { status: 400 });
      }
    }
    return respond({ error: "method_not_allowed" }, { status: 405, headers: { allow: "GET, POST, OPTIONS" } });
  }
  if (request.method !== "GET") {
    return respond({ error: "method_not_allowed" }, { status: 405, headers: { allow: "GET, OPTIONS" } });
  }
  if (pathname === "/api/integration/v1/contracts") {
    return respond(integrationContracts, {
      headers: { "cache-control": "public, max-age=300, stale-while-revalidate=3600" },
    });
  }

  const snapshot = await buildLiveSnapshot({
    contracts: integrationContracts,
    adapters: makeLiveAdapters(fetch),
    mockFixtures: PROVIDER_FIXTURES,
    now: new Date(),
  });
  if (pathname === "/api/integration/v1/snapshot") return respond(snapshot);
  if (pathname === "/api/alerts/v1/candidates") {
    return respond(createAlertCandidates(snapshot));
  }
  if (pathname === "/api/alerts/v1/situations") {
    return respond(buildSituationClusters(createAlertCandidates(snapshot)));
  }
  return respond({ error: "not_found" }, { status: 404 });
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
      return handleIntegrationApi(request, url.pathname, env.ALLOWED_POST_ORIGINS);
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
