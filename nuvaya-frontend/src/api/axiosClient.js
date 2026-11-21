import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8083';

const axiosClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('nuvaya_admin_jwt');
  if (token && config.url?.startsWith('/admin')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if ((err.response?.status === 401 || err.response?.status === 403) && window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
      sessionStorage.removeItem('nuvaya_admin_jwt');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
      <rect width="600" height="800" fill="#F3EAD9"/>
      <rect x="24" y="24" width="552" height="752" fill="none" stroke="#C5A065" stroke-width="3"/>
      <circle cx="300" cy="340" r="85" fill="#2C141F" stroke="#C5A065" stroke-width="4"/>
      <text x="300" y="352" text-anchor="middle" fill="#C5A065" font-family="Georgia, serif" font-size="34" letter-spacing="4">NuVaya</text>
      <text x="300" y="475" text-anchor="middle" fill="#6D5B62" font-family="sans-serif" font-size="18" letter-spacing="3">MODEST LUXURY</text>
    </svg>`
  );

export const resolveAssetUrl = (url) => {
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http://localhost:8083/uploads/')) {
    return url.replace('http://localhost:8083', '');
  }
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/') || url.startsWith('/campaigns/')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default axiosClient;
