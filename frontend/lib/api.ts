import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Client {
  clientId: string;
  email: string | null;
  companyName: string | null;
  calendlyConnected: boolean;
  closeConnected: boolean;
  stripeConnected: boolean;
}

export interface AdminClient {
  id: string;
  email: string | null;
  companyName: string | null;
  onboardingToken: string;
  calendlyConnected: boolean;
  closeConnected: boolean;
  stripeConnected: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    integrations: number;
    bookedCalls: number;
    leads: number;
    payments: number;
  };
}

export interface CreateClientRequest {
  email?: string;
  companyName?: string;
}

export const clientsApi = {
  create: async (data: CreateClientRequest) => {
    const response = await api.post('/clients', data);
    return response.data;
  },

  getByToken: async (token: string): Promise<Client> => {
    const response = await api.get(`/clients/onboarding/${token}`);
    return response.data;
  },

  getAll: async (): Promise<AdminClient[]> => {
    const response = await api.get('/clients');
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },
};

export interface ConnectIntegrationRequest {
  apiKey: string;
}

export interface ConnectIntegrationResponse {
  success: boolean;
  message: string;
}

export const integrationsApi = {
  connectCalendly: async (
    token: string,
    data: ConnectIntegrationRequest,
  ): Promise<ConnectIntegrationResponse> => {
    const response = await api.post(
      `/onboarding/${token}/integrations/calendly`,
      data,
    );
    return response.data;
  },

  connectClose: async (
    token: string,
    data: ConnectIntegrationRequest,
  ): Promise<ConnectIntegrationResponse> => {
    const response = await api.post(
      `/onboarding/${token}/integrations/close`,
      data,
    );
    return response.data;
  },

  connectStripe: async (
    token: string,
    data: ConnectIntegrationRequest,
  ): Promise<ConnectIntegrationResponse> => {
    const response = await api.post(
      `/onboarding/${token}/integrations/stripe`,
      data,
    );
    return response.data;
  },
};

