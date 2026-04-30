const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} failed: ${response.status}`);
  }
  return response.json();
}

export const api = {
  listSources: () => request("/sources"),
  getSource: (id) => request(`/sources/${id}`),
  summary: () => request("/metrics/summary"),
  scoreBreakdown: () => request("/metrics/score-breakdown"),
  risk: () => request("/metrics/risk"),
  validate: (mode, input) =>
    request("/validate", {
      method: "POST",
      body: JSON.stringify({ mode, input }),
    }),
};
