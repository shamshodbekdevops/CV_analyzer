import { NextResponse } from "next/server";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "expect",
]);

function stripTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function getBackendBase() {
  const explicit =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.API_BASE_URL ||
    "";
  if (explicit) {
    return stripTrailingSlash(explicit);
  }
  if (process.env.RAILWAY_ENVIRONMENT) {
    return "http://backend-web.railway.internal:8080";
  }
  return "http://web:8000";
}

async function forward(request, context) {
  const params = await context.params;
  const backendBase = getBackendBase();
  const path = (params.path || []).join("/");
  const url = new URL(`${backendBase}/api/${path}`);
  const incomingUrl = new URL(request.url);
  incomingUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lower)) {
      headers.set(key, value);
    }
  });

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const requestInit = {
    method,
    headers,
    redirect: "manual",
  };
  if (hasBody) {
    const bodyBuffer = await request.arrayBuffer();
    if (bodyBuffer.byteLength > 0) {
      requestInit.body = Buffer.from(bodyBuffer);
    }
  }

  try {
    const upstream = await fetch(url.toString(), requestInit);

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!HOP_BY_HOP_HEADERS.has(lower)) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const errorMessage = String(error?.message || error);
    const errorCause = error?.cause ? String(error.cause?.message || error.cause) : "";
    return NextResponse.json(
      {
        detail: `Proxy request failed: ${url.toString()}`,
        error: errorMessage,
        cause: errorCause,
      },
      { status: 502 },
    );
  }
}

export async function GET(request, context) {
  return forward(request, context);
}

export async function POST(request, context) {
  return forward(request, context);
}

export async function PUT(request, context) {
  return forward(request, context);
}

export async function PATCH(request, context) {
  return forward(request, context);
}

export async function DELETE(request, context) {
  return forward(request, context);
}

export async function OPTIONS(request, context) {
  return forward(request, context);
}
