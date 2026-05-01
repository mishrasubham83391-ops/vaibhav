import axios from "axios";

// CRA exposes only env vars prefixed with REACT_APP_ at build time.
// Set REACT_APP_BACKEND_URL on Vercel (and locally in frontend/.env)
// to your deployed backend, e.g. https://vaibhav-6.onrender.com.
//
// NOTE: do NOT include "/api" or a trailing slash here — this module
// appends "/api" itself.
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL?.replace(/\/+$/, "") || "";

if (!BACKEND_URL && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.error(
    "[api] REACT_APP_BACKEND_URL is not set. " +
      "Set it on your host (Vercel: Settings → Environment Variables) and redeploy."
  );
}

export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 20000 });

export const adminApi = axios.create({ baseURL: API, timeout: 20000 });
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("pal_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// One-shot health check so Render's connectivity is verified at app boot.
// The check runs once per page load and logs the result without blocking
// rendering or surfacing user-facing errors.
let _healthChecked = false;
export function pingBackendHealth() {
  if (_healthChecked || typeof window === "undefined") return;
  _healthChecked = true;
  api
    .get("/health")
    .then((res) => {
      // eslint-disable-next-line no-console
      console.info("[api] backend health:", res.data);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[api] backend unreachable", {
        backendUrl: BACKEND_URL || "(empty)",
        status: err?.response?.status,
        message: err?.message,
      });
    });
}
