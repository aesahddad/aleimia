import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('aleinia_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('aleinia_refreshToken');
        if (!refresh) throw new Error('No refresh token');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken: refresh });
        localStorage.setItem('aleinia_token', data.token);
        localStorage.setItem('aleinia_refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.token}`;
        return client(original);
      } catch {
        localStorage.removeItem('aleinia_token');
        localStorage.removeItem('aleinia_refreshToken');
        localStorage.removeItem('aleinia_user');
      }
    }
    return Promise.reject(err);
  }
);

export const fetchSettings = () => client.get('/status').then(r => r.data);
export const fetchTabs = () => client.get('/tabs').then(r => r.data);
export const fetchStores = (params) => client.get('/stores', { params }).then(r => r.data);
export const fetchStore = (id) => client.get(`/stores/${id}`).then(r => r.data);
export const fetchProducts = (storeId) => client.get(`/stores/${storeId}/products`).then(r => r.data);

export default client;
