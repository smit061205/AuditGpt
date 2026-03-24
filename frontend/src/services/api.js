import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS, TIMEOUT_MS } from "../constants/config";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      "An unknown error occurred";
    return Promise.reject(new Error(message));
  },
);

export async function analyzeCompany(companyName) {
  const response = await apiClient.post(API_ENDPOINTS.ANALYZE, {
    company_name_or_cin: companyName,
  });
  return response.data;
}

export async function searchCompanies(query) {
  const response = await apiClient.get(`/api/search?q=${encodeURIComponent(query)}`, {
    timeout: 5000,
  });
  return response.data.results || [];
}

export async function checkHealth() {
  const response = await apiClient.get(API_ENDPOINTS.HEALTH);
  return response.data;
}

export default apiClient;
