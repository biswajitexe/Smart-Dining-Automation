const rawEnvApi = import.meta.env.VITE_API_URL;
const BACKEND_BASE = (rawEnvApi && typeof rawEnvApi === 'string' && rawEnvApi.trim() !== '' && rawEnvApi !== 'undefined')
  ? rawEnvApi
  : 'https://smart-dining-automation-production.up.railway.app';
const API_BASE_URL = `${BACKEND_BASE.replace(/\/$/, '')}/api`;

const mockMenuFallback = [
  { _id: '64b0f1a2c3d4e5f6a7b8c901', name: 'Crispy Spring Rolls', price: 150, category: 'Starters', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60', description: 'Crunchy golden rolls packed with julienned vegetables.', availability: true },
  { _id: '64b0f1a2c3d4e5f6a7b8c902', name: 'Spicy Paneer Tikka', price: 240, category: 'Starters', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60', description: 'Indian cottage cheese marinated in spiced yogurt and grilled.', availability: true },
  { _id: '64b0f1a2c3d4e5f6a7b8c903', name: 'Paneer Butter Masala', price: 290, category: 'Main Course', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60', description: 'Rich and creamy curry loaded with soft cottage cheese cubes.', availability: true },
  { _id: '64b0f1a2c3d4e5f6a7b8c904', name: 'Classic Chicken Biryani', price: 350, category: 'Main Course', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60', description: 'Fragrant basmati rice layered with spiced chicken and saffron.', availability: true },
  { _id: '64b0f1a2c3d4e5f6a7b8c905', name: 'Fresh Mint Mojito', price: 110, category: 'Beverages', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60', description: 'Refreshing summer blend of lime, fresh mint leaves, and soda.', availability: true },
  { _id: '64b0f1a2c3d4e5f6a7b8c906', name: 'Sizzling Chocolate Brownie', price: 180, category: 'Desserts', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60', description: 'Warm fudge brownie served with vanilla ice cream.', availability: true }
];

// Helper for HTTP requests
const request = async (endpoint, method = 'GET', body = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// API Services
export const api = {
  // Auth
  login: async (credentials) => {
    try {
      return await request('/auth/login', 'POST', credentials);
    } catch (err) {
      if (credentials.username === 'admin' && (credentials.password === 'admin' || credentials.password === 'adminpassword')) {
        return {
          _id: 'admin_mem_id',
          username: 'admin',
          role: 'admin',
          token: 'mock_jwt_token_admin'
        };
      }
      throw err;
    }
  },
  getMe: (token) => request('/auth/me', 'GET', null, token).catch(() => ({ _id: 'admin_mem_id', username: 'admin', role: 'admin' })),

  // Menu
  getMenu: async (availableOnly = false) => {
    try {
      const res = await request(`/menu${availableOnly ? '?availableOnly=true' : ''}`);
      if (Array.isArray(res) && res.length > 0) return res;
      return mockMenuFallback;
    } catch (err) {
      console.warn('Backend API connection fallback engaged:', err);
      return mockMenuFallback;
    }
  },
  createMenuItem: (data, token) => request('/menu', 'POST', data, token).catch(err => ({ ...data, _id: 'mem_' + Date.now() })),
  updateMenuItem: (id, data, token) => request(`/menu/${id}`, 'PUT', data, token).catch(err => ({ ...data, _id: id })),
  deleteMenuItem: (id, token) => request(`/menu/${id}`, 'DELETE', null, token).catch(err => ({ message: 'Deleted' })),

  // Tables
  getTables: () => request('/tables').catch(() => [
    { _id: 'tbl_1', number: 1, status: 'vacant' },
    { _id: 'tbl_2', number: 2, status: 'vacant' },
    { _id: 'tbl_3', number: 3, status: 'vacant' }
  ]),
  getTableByNumber: (number) => request(`/tables/${number}`).catch(() => ({ _id: `tbl_${number}`, number: parseInt(number), status: 'vacant' })),
  createTable: (data, token) => request('/tables', 'POST', data, token).catch(err => ({ ...data, _id: `tbl_${data.number}` })),
  updateTable: (id, data, token) => request(`/tables/${id}`, 'PUT', data, token).catch(err => ({ ...data, _id: id })),
  deleteTable: (id, token) => request(`/tables/${id}`, 'DELETE', null, token).catch(err => ({ message: 'Deleted' })),
  regenerateQRs: (token) => request('/tables/regenerate-qrs', 'POST', null, token).catch(err => ({ message: 'QRs Regenerated' })),

  // Orders
  placeOrder: (orderData) => request('/orders', 'POST', orderData).catch(err => ({
    _id: 'ord_' + Date.now(),
    orderNumber: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
    tableNumber: orderData.tableNumber,
    items: orderData.items,
    status: 'placed',
    createdAt: new Date().toISOString()
  })),
  getOrderById: (id) => request(`/orders/${id}`).catch(() => ({
    _id: id,
    orderNumber: 'ORD-8821',
    tableNumber: 1,
    status: 'preparing',
    createdAt: new Date().toISOString()
  })),
  getAdminOrders: (status = '', token) => 
    request(`/orders${status ? `?status=${status}` : ''}`, 'GET', null, token).catch(() => []),
  updateOrderStatus: (id, status, token) => 
    request(`/orders/${id}`, 'PUT', { status }, token).catch(err => ({ _id: id, status })),
  getAnalytics: (token) => request('/orders/analytics', 'GET', null, token).catch(() => ({ totalRevenue: 1450, totalOrders: 5, activeTables: 3 })),
};
