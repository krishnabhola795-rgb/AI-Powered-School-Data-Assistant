const KEY = "educhat_user";

export function setUser(u) {
  localStorage.setItem(KEY, JSON.stringify(u));
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
export function clearUser() {
  localStorage.removeItem(KEY);
}
