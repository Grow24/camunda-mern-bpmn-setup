const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  auth = {
    getMe: () => this.request('/auth/me'),
    logout: () => this.request('/auth/logout', { method: 'POST' }),
    refresh: () => this.request('/auth/refresh', { method: 'POST' })
  };

  // Spreadsheet endpoints
  spreadsheets = {
    getAll: () => this.request('/spreadsheets'),
    getById: (id: string) => this.request(`/spreadsheets/${id}`),
    create: (data: { title: string; description?: string }) =>
      this.request('/spreadsheets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      this.request(`/spreadsheets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      this.request(`/spreadsheets/${id}`, { method: 'DELETE' }),
    share: (id: string, data: { email: string; permission: string }) =>
      this.request(`/spreadsheets/${id}/share`, { method: 'POST', body: JSON.stringify(data) })
  };

  // User endpoints
  users = {
    getAll: (search?: string) => this.request(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    updateProfile: (data: { name?: string; timezone?: string }) =>
      this.request('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
    getActivity: () => this.request('/users/activity')
  };
}

export const api = new ApiClient();
export const { auth: authApi, spreadsheets: spreadsheetsApi, users: usersApi } = api;