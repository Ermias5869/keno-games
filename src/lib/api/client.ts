const API_BASE = "/api";

/** Fetch wrapper that automatically injects JWT access token */
async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  // If 401, try to refresh token
  if (response.status === 401 && token) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        // Retry original request with new token
        headers["Authorization"] = `Bearer ${data.accessToken}`;
        return fetch(`${API_BASE}${url}`, {
          ...options,
          headers,
        });
      } else {
        // Refresh failed — clear tokens
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }
  }

  return response;
}

/** API client methods */
export const apiClient = {
  // Auth
  register: (phone: string, password: string) =>
    fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    }),

  login: (phone: string, password: string) =>
    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    }),

  getProfile: () => fetchWithAuth("/auth/me"),

  // Game
  placeBet: (selectedNumbers: number[], betAmount: number, roundId: string) =>
    fetchWithAuth("/game/bet", {
      method: "POST",
      body: JSON.stringify({ selectedNumbers, betAmount, roundId }),
    }),

  getCurrentRound: () => fetchWithAuth("/game/round"),

  getBetHistory: () => fetchWithAuth("/game/history"),

  getPayoutTable: () => fetch(`${API_BASE}/game/payout-table`),

  getLeaderboard: () => fetch(`${API_BASE}/game/leaderboard`),

  getDailyStats: () => fetch(`${API_BASE}/game/stats`),

  // Admin
  getUsers: () => fetchWithAuth("/admin/users"),

  getAdminStats: () => fetchWithAuth("/admin/stats"),

  getMultipliers: () => fetchWithAuth("/admin/multipliers"),

  updateMultiplier: (id: string, multiplier: number) =>
    fetchWithAuth("/admin/multipliers", {
      method: "PUT",
      body: JSON.stringify({ id, multiplier }),
    }),

  // Payments
  initializeDeposit: (amount: number) =>
    fetchWithAuth("/payments/chapa/initialize", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  verifyTransaction: (txRef: string) =>
    fetchWithAuth(`/payments/chapa/verify?tx_ref=${encodeURIComponent(txRef)}`),

  getTransactions: () => fetchWithAuth("/payments/transactions"),

  getBanks: () => fetchWithAuth("/payments/banks"),

  requestWithdraw: (data: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
  }) =>
    fetchWithAuth("/payments/withdraw", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Game tabs
  getMyHistory: (page = 1, limit = 20) =>
    fetchWithAuth(`/game/my-history?page=${page}&limit=${limit}`),
};
