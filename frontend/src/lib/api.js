import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export async function login(email, password, role) {
  const { data } = await api.post("/auth/login", { email, password, role });
  return data;
}
export async function getDemoAccounts() {
  const { data } = await api.get("/auth/demo-accounts");
  return data;
}
export async function getDashboard() {
  const { data } = await api.get("/dashboard");
  return data;
}
export async function getStudents(params = {}) {
  const { data } = await api.get("/students", { params });
  return data;
}
export async function getStudent(id) {
  const { data } = await api.get(`/students/${id}`);
  return data;
}
export async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
  return data;
}
export async function listUploads() {
  const { data } = await api.get("/uploads");
  return data;
}
export async function seed(count = 300) {
  const { data } = await api.post("/seed", { count });
  return data;
}
export async function getChatSessions() {
  const { data } = await api.get("/chat/sessions");
  return data;
}
export async function getChatHistory(sessionId) {
  const { data } = await api.get(`/chat/history/${sessionId}`);
  return data;
}
export async function deleteChatSession(sessionId) {
  const { data } = await api.delete(`/chat/${sessionId}`);
  return data;
}

/** Streams tokens from the /chat/stream SSE endpoint via fetch. */
export async function streamChat({ sessionId, message, onDelta, onDone, onError }) {
  try {
    const res = await fetch(`${API}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, message }),
    });
    if (!res.ok || !res.body) {
      onError?.(`HTTP ${res.status}`);
      onDone?.();
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const p of parts) {
        const line = p.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const obj = JSON.parse(payload);
          if (obj.delta) onDelta?.(obj.delta);
          if (obj.done) { onDone?.(); return; }
        } catch { /* ignore */ }
      }
    }
    onDone?.();
  } catch (e) {
    onError?.(e.message || String(e));
    onDone?.();
  }
}
