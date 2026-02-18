const API_PROXY_BASE = "/api/proxy";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const AUTH_USERNAME_KEY = "auth_username";

function normalizeApiPath(path) {
  const rawPath = String(path || "");
  if (!rawPath) {
    return "/";
  }
  if (rawPath.startsWith("/api/")) {
    return rawPath.slice(4);
  }
  if (rawPath.startsWith("/")) {
    return rawPath;
  }
  return `/${rawPath}`;
}

function toProxyUrl(path) {
  return `${API_PROXY_BASE}${normalizeApiPath(path)}`;
}

async function safeFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch {
    throw new Error(`Network error while connecting to API: ${url}`);
  }
}

export function setAuthTokens(accessToken, refreshToken = "") {
  if (typeof window === "undefined") {
    return;
  }
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function setAccessToken(accessToken) {
  setAuthTokens(accessToken, getRefreshToken());
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function getRefreshToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
}

export function setAuthUsername(username) {
  if (typeof window === "undefined") {
    return;
  }
  const value = String(username || "").trim();
  if (!value) {
    localStorage.removeItem(AUTH_USERNAME_KEY);
    return;
  }
  localStorage.setItem(AUTH_USERNAME_KEY, value);
}

export function getAuthUsername() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem(AUTH_USERNAME_KEY) || "";
}

export function clearAuthTokens() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USERNAME_KEY);
}

export function clearAccessToken() {
  clearAuthTokens();
}

async function toApiError(response) {
  let detail = "Request failed";
  try {
    const data = await response.json();
    detail = data.detail || JSON.stringify(data);
  } catch {
    detail = await response.text();
  }
  throw new Error(detail || "Request failed");
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearAuthTokens();
    throw new Error("Authentication expired. Please login again.");
  }

  const response = await safeFetch(toProxyUrl("/api/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearAuthTokens();
    return toApiError(response);
  }

  const payload = await response.json();
  setAuthTokens(payload.access, refresh);
  return payload.access;
}

export async function apiFetch(path, options = {}, token = "", retried = false) {
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await safeFetch(toProxyUrl(path), {
    ...options,
    headers,
  });

  if (response.status === 401 && token && !retried) {
    const newAccess = await refreshAccessToken();
    return apiFetch(path, options, newAccess, true);
  }

  if (!response.ok) {
    return toApiError(response);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export async function apiDownload(path, token = "", retried = false) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await safeFetch(toProxyUrl(path), {
    method: "GET",
    headers,
  });

  if (response.status === 401 && token && !retried) {
    const newAccess = await refreshAccessToken();
    return apiDownload(path, newAccess, true);
  }

  if (!response.ok) {
    return toApiError(response);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") || "";
  const match = contentDisposition.match(/filename=\"([^\"]+)\"/i);
  return {
    blob,
    filename: match?.[1] || "resume.pdf",
  };
}
