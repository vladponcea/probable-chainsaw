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
  ghlConnected: boolean;
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

  connectGhl: async (
    token: string,
    data: ConnectIntegrationRequest,
  ): Promise<ConnectIntegrationResponse> => {
    const response = await api.post(
      `/onboarding/${token}/integrations/ghl`,
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

export interface DashboardMetrics {
  speedToLead: number | null;
  failedPaymentAmountYearly: number;
  bookingRate: number | null;
  cancellationRate: number | null;
  showUpRate: number | null;
  closeRate: number | null;
  crmHygiene: number;
  averageDealValue: number | null;
  pipelineVelocity: number | null;
  totalRevenue: number;
  totalLeads: number;
  bookedCalls: number;
  showUps: number;
  wonDeals: number;
}

export interface SyncStatus {
  lastSync: string | null;
  status: string;
}

export interface SyncProgress {
  status: 'idle' | 'syncing' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  logs: string[];
  startedAt?: string;
  completedAt?: string;
}

export type DateRangeOption =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'mtd'
  | 'qtd'
  | 'ytd'
  | 'custom';

export interface MetricsQueryOptions {
  period?: DateRangeOption;
  startDate?: string;
  endDate?: string;
}

export const dashboardApi = {
  getMetrics: async (
    token: string,
    options: MetricsQueryOptions = {},
  ): Promise<DashboardMetrics> => {
    const params: Record<string, string> = {
      period: options.period ?? 'mtd',
    };

    if (options.startDate) {
      params.startDate = options.startDate;
    }
    if (options.endDate) {
      params.endDate = options.endDate;
    }

    const response = await api.get(`/dashboard/${token}/metrics`, {
      params,
    });
    return response.data;
  },

  triggerSync: async (token: string): Promise<{ success: boolean; message: string; status?: string }> => {
    const response = await api.post(`/dashboard/${token}/sync`);
    return response.data;
  },

  getSyncStatus: async (token: string): Promise<SyncStatus> => {
    const response = await api.get(`/dashboard/${token}/sync-status`);
    return response.data;
  },

  getSyncProgress: async (token: string): Promise<SyncProgress | null> => {
    const response = await api.get(`/dashboard/${token}/sync-progress`);
    return response.data;
  },

  clearSyncProgress: async (token: string): Promise<{ success: boolean }> => {
    const response = await api.post(`/dashboard/${token}/sync-progress/clear`);
    return response.data;
  },

  updateCalendly: async (
    token: string,
    data: ConnectIntegrationRequest,
  ): Promise<ConnectIntegrationResponse> => {
    const response = await api.post(`/dashboard/${token}/integrations/calendly`, data);
    return response.data;
  },

  updateClose: async (
    token: string,
    data: ConnectIntegrationRequest,
  ): Promise<ConnectIntegrationResponse> => {
    const response = await api.post(`/dashboard/${token}/integrations/close`, data);
    return response.data;
  },

  updateStripe: async (
    token: string,
    data: ConnectIntegrationRequest,
  ): Promise<ConnectIntegrationResponse> => {
    const response = await api.post(`/dashboard/${token}/integrations/stripe`, data);
    return response.data;
  },
};

export const mockDataApi = {
  generate: async (token: string, count: number = 10) => {
    const response = await api.post(`/dashboard/${token}/mock-data/generate?count=${count}`, {});
    return response.data;
  },
};

export interface StatusMapping {
  id: string;
  clientId: string;
  statusId: string;
  statusLabel: string;
  statusType: string | null;
  showedUp: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStatusMappingRequest {
  showedUp: boolean;
}

export interface BulkUpdateStatusMappingsRequest {
  mappings: Array<{ statusId: string; showedUp: boolean }>;
}

export const statusMappingApi = {
  getMappings: async (token: string): Promise<StatusMapping[]> => {
    const response = await api.get(`/dashboard/${token}/status-mappings`);
    return response.data;
  },

  syncMappings: async (token: string): Promise<StatusMapping[]> => {
    const response = await api.post(`/dashboard/${token}/status-mappings/sync`);
    return response.data;
  },

  updateMapping: async (
    token: string,
    statusId: string,
    data: UpdateStatusMappingRequest,
  ): Promise<StatusMapping> => {
    const response = await api.put(
      `/dashboard/${token}/status-mappings/${statusId}`,
      data,
    );
    return response.data;
  },

  bulkUpdateMappings: async (
    token: string,
    data: BulkUpdateStatusMappingsRequest,
  ): Promise<StatusMapping[]> => {
    const response = await api.put(
      `/dashboard/${token}/status-mappings`,
      data,
    );
    return response.data;
  },
};

