const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function setAccessToken(token) {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token);
  }
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem("access_token") || "";
}

export function clearAccessToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
  }
}

export async function apiFetch(path, options = {}, token = "") {
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = "Request failed";
    try {
      const data = await response.json();
      detail = data.detail || JSON.stringify(data);
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export async function apiDownload(path, token = "") {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    let detail = "Request failed";
    try {
      const data = await response.json();
      detail = data.detail || JSON.stringify(data);
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || "Request failed");
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") || "";
  const match = contentDisposition.match(/filename="([^"]+)"/i);
  return {
    blob,
    filename: match?.[1] || "resume.pdf",
  };
}
