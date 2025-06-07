import { DocumentType } from './enums.type';

// Enum para o status do prestador
export enum ProviderStatus {
  EXPECTED = 'EXPECTED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED'
}

// Interface para a foto do prestador (para exibição)
export interface ProviderPhotoDisplay {
  id: string;
  providerId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadDate: Date | string;
  url?: string; // URL para acessar a foto
}

// Interface principal do prestador
export interface Provider {
  id: string;
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  serviceType?: string | null;
  reason: string;
  hostName: string;
  hostDepartment?: string | null;
  scheduledEntry?: Date | string | null;
  scheduledExit?: Date | string | null;
  actualEntry?: Date | string | null;
  actualExit?: Date | string | null;
  status: ProviderStatus;
  contractNumber?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  photo?: ProviderPhotoDisplay | null;
}

// Interface para criação de prestador
export interface CreateProviderRequest {
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  serviceType?: string | null;
  reason: string;
  hostName: string;
  hostDepartment?: string | null;
  scheduledEntry?: Date | string | null;
  scheduledExit?: Date | string | null;
  status?: ProviderStatus;
  contractNumber?: string | null;
  notes?: string | null;
}

// Interface para atualização de prestador
export interface UpdateProviderRequest {
  name?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  phone?: string;
  email?: string | null;
  company?: string | null;
  serviceType?: string | null;
  reason?: string;
  hostName?: string;
  hostDepartment?: string | null;
  scheduledEntry?: Date | string | null;
  scheduledExit?: Date | string | null;
  actualEntry?: Date | string | null;
  actualExit?: Date | string | null;
  status?: ProviderStatus;
  contractNumber?: string | null;
  notes?: string | null;
}

// Interface para filtros da tabela de prestadores
export interface ProviderFilters {
  search?: string;
  status?: ProviderStatus | '';
  serviceType?: string;
  company?: string;
  dateRange?: [Date | null, Date | null];
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Interface para solicitação de listagem de prestadores
export interface ListProviderRequest {
  search?: string;
  status?: ProviderStatus;
  serviceType?: string;
  company?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Interface para resposta de listagem de prestadores
export interface ListProviderResponse {
  success: boolean;
  providers: Provider[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface para resposta de um único prestador
export interface ProviderResponse {
  success: boolean;
  provider: Provider;
}

// Interface para upload de foto
export interface UploadProviderPhotoRequest {
  providerId: string;
  photo: File;
}

// Tipos para as respostas da API
export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ProviderApiResponse extends ApiResponse {
  provider?: Provider;
}

export interface ProviderListApiResponse extends ApiResponse {
  providers?: Provider[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// Interface para estatísticas de prestadores
export interface ProviderStats {
  totalProviders: number;
  activeProviders: number;
  checkedInCount: number;
  checkedOutCount: number;
  expectedCount: number;
  cancelledCount: number;
  providersByStatus: Record<ProviderStatus, number>;
  providersByServiceType?: Array<{
    serviceType: string;
    count: number;
  }>;
  providersByCompany?: Array<{
    company: string;
    count: number;
  }>;
  providersByDay?: Array<{
    date: string;
    count: number;
  }>;
  providersByMonth?: Array<{
    month: string;
    count: number;
  }>;
  recentProviders?: Provider[];
}