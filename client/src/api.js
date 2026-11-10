const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const FEE = 500;
export const COURSES = [
  { code: "CSE", name: "Computer Science & Engineering", seats: 60, cutoff: 85 },
  { code: "IT", name: "Information Technology", seats: 60, cutoff: 80 },
  { code: "ECE", name: "Electronics & Communication", seats: 60, cutoff: 78 },
  { code: "ME", name: "Mechanical Engineering", seats: 60, cutoff: 70 },
];

export function getToken() {
  try { return localStorage.getItem("iem_token") || ""; } catch { return ""; }
}
export function setToken(t) {
  try { t ? localStorage.setItem("iem_token", t) : localStorage.removeItem("iem_token"); } catch {}
}

async function req(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  const isForm = opts.body instanceof FormData;
  if (!isForm && opts.body) headers["Content-Type"] = "application/json";
  const tk = getToken();
  if (tk) headers["Authorization"] = "Bearer " + tk;
  let res;
  try {
    res = await fetch(BASE + path, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? (isForm ? opts.body : JSON.stringify(opts.body)) : undefined,
    });
  } catch (e) {
    throw new Error("Cannot reach the server. Is the API running on " + BASE + "?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed (" + res.status + ")");
  return data;
}

export const api = {
  register: (b) => req("/auth/register", { method: "POST", body: b }),
  login: (b) => req("/auth/login", { method: "POST", body: b }),
  me: () => req("/auth/me"),
  myApp: () => req("/applications/me"),
  saveApp: (b) => req("/applications", { method: "POST", body: b }),
  uploadDoc: (form) => req("/applications/documents", { method: "POST", body: form }),
  deleteDoc: (id) => req("/applications/documents/" + id, { method: "DELETE" }),
  pay: (b) => req("/applications/pay", { method: "POST", body: b }),
  submit: () => req("/applications/submit", { method: "POST" }),
  adminApps: () => req("/admin/applications"),
  adminStats: () => req("/admin/stats"),
  verifyDoc: (id, docId) => req(`/admin/applications/${id}/documents/${docId}/verify`, { method: "PATCH" }),
  setStatus: (id, b) => req(`/admin/applications/${id}/status`, { method: "PATCH", body: b }),
  merit: () => req("/merit"),
  genMerit: () => req("/merit/generate", { method: "POST" }),
  unpubMerit: () => req("/merit/unpublish", { method: "POST" }),
};

export function courseName(c) {
  const x = COURSES.find((k) => k.code === c);
  return x ? x.code + " — " + x.name : c || "";
}
export function fmt(ts) {
  try { return new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return "" + ts; }
}
export function fmtd(ts) {
  try { return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }); } catch { return "" + ts; }
}
