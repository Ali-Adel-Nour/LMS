const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status === false) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export function login(email, password) {
  return request("/user/login", {
    method: "POST",
    body: { email, password },
  });
}

export function fetchConversations(token) {
  return request("/chat/conversations", { token });
}

export function fetchOrCreateConversation(token, recipientId) {
  return request(`/chat/conversations/user/${recipientId}`, { token });
}

export function fetchMessages(token, conversationId) {
  return request(`/chat/conversations/${conversationId}/messages`, { token });
}

export function postMessage(token, conversationId, content) {
  return request(`/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    token,
    body: { content },
  });
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
