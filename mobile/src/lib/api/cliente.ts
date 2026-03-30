import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

function obtenerBaseUrl(): string {
  if (!__DEV__) return 'https://theastra.xyz/api/v1';

  // En Expo Go, extraer la IP del dev server (ej: 172.26.0.31)
  const debuggerHost =
    Constants.expoConfig?.hostUri ?? Constants.experienceUrl ?? '';
  const ip = debuggerHost.split(':')[0];

  if (ip) return `http://${ip}:8000/api/v1`;
  return 'http://localhost:8000/api/v1';
}

export const API_BASE_URL = obtenerBaseUrl();

export const clienteApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: agregar token JWT a cada request
clienteApi.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: manejar 401 y renovar token
clienteApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE_URL}/auth/renovar`, {
          refresh_token: refreshToken,
        });

        await SecureStore.setItemAsync('access_token', data.access_token);
        if (data.refresh_token) {
          await SecureStore.setItemAsync('refresh_token', data.refresh_token);
        }

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return clienteApi(originalRequest);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        // TODO: redirigir a login
      }
    }

    return Promise.reject(error);
  }
);
