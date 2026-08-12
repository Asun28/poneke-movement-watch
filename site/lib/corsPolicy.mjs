function configuredOrigins(value) {
  return new Set(String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      try {
        return new URL(entry).origin;
      } catch {
        return null;
      }
    })
    .filter(Boolean));
}

export function resolveCorsPolicy(request, allowedPostOrigins = "") {
  const requestedMethod = request.method === "OPTIONS"
    ? request.headers.get("access-control-request-method")?.toUpperCase() ?? "GET"
    : request.method.toUpperCase();
  const isPost = requestedMethod === "POST";
  if (!isPost) {
    return { allowed: true, allowOrigin: "*", allowMethods: "GET, OPTIONS" };
  }

  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin) {
    return { allowed: true, allowOrigin: null, allowMethods: "GET, POST, OPTIONS" };
  }

  let normalizedOrigin;
  try {
    normalizedOrigin = new URL(requestOrigin).origin;
  } catch {
    return { allowed: false, allowOrigin: null, allowMethods: "GET, POST, OPTIONS" };
  }
  const sameOrigin = normalizedOrigin === new URL(request.url).origin;
  const explicitlyAllowed = configuredOrigins(allowedPostOrigins).has(normalizedOrigin);
  return {
    allowed: sameOrigin || explicitlyAllowed,
    allowOrigin: sameOrigin || explicitlyAllowed ? normalizedOrigin : null,
    allowMethods: "GET, POST, OPTIONS",
  };
}
