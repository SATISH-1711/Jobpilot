import axios from "axios";

export const TOKEN_KEY = "jobpilot_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
});

// Runs before every request: attach the token if we have one.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Runs after every response: if the server says our token is invalid, log out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Turn a failed request into one readable message for the UI.
export function getErrorMessage(error) {
  if (!error.response) {
    return "Cannot reach the server. Is the backend running? (A free server may take a minute to wake up.)";
  }
  const data = error.response.data;
  if (typeof data === "string") return "Something went wrong on the server.";
  if (data?.detail) return data.detail;

  const messages = Object.entries(data || {}).map(([field, value]) => {
    const text = Array.isArray(value) ? value.join(" ") : String(value);
    return field === "non_field_errors" ? text : `${field}: ${text}`;
  });
  return messages.join("  ") || "Something went wrong.";
}

export default api;