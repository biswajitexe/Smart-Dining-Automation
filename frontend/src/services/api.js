const BACKEND_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${BACKEND_BASE.replace(/\/$/, '')}/api`;


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
  login: (credentials) => request('/auth/login', 'POST', credentials),
  getMe: (token) => request('/auth/me', 'GET', null, token),

  // Menu
  getMenu: (availableOnly = false) => 
    request(`/menu${availableOnly ? '?availableOnly=true' : ''}`),
  createMenuItem: (data, token) => request('/menu', 'POST', data, token),
  updateMenuItem: (id, data, token) => request(`/menu/${id}`, 'PUT', data, token),
  deleteMenuItem: (id, token) => request(`/menu/${id}`, 'DELETE', null, token),

  // Tables
  getTables: () => request('/tables'),
  getTableByNumber: (number) => request(`/tables/${number}`),
  createTable: (data, token) => request('/tables', 'POST', data, token),
  updateTable: (id, data, token) => request(`/tables/${id}`, 'PUT', data, token),
  deleteTable: (id, token) => request(`/tables/${id}`, 'DELETE', null, token),
  regenerateQRs: (token) => request('/tables/regenerate-qrs', 'POST', null, token),

  // Orders
  placeOrder: (orderData) => request('/orders', 'POST', orderData),
  getOrderById: (id) => request(`/orders/${id}`),
  getAdminOrders: (status = '', token) => 
    request(`/orders${status ? `?status=${status}` : ''}`, 'GET', null, token),
  updateOrderStatus: (id, status, token) => 
    request(`/orders/${id}`, 'PUT', { status }, token),
  getAnalytics: (token) => request('/orders/analytics', 'GET', null, token),
};
