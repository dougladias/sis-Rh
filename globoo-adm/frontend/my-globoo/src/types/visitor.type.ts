
// Enum para o status do visitante
export enum VisitorStatus {
  EXPECTED = 'EXPECTED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED'
}

// Interface para a foto do visitante (para exibição)
export interface VisitorPhotoDisplay {
  id: string;
  visitorId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadDate: Date | string;
  url?: string; // URL para acessar a foto
}

// Interface principal do visitante
export interface Visitor {
  id: string;
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  reason: string;
  hostName: string;
  hostDepartment?: string | null;
  scheduledEntry?: Date | string | null;
  scheduledExit?: Date | string | null;
  actualEntry?: Date | string | null;
  actualExit?: Date | string | null;
  status: VisitorStatus;
  temperature?: number | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  photo?: VisitorPhotoDisplay | null;
}

// Interface para criação de visitante
export interface CreateVisitorRequest {
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  reason: string;
  hostName: string;
  hostDepartment?: string | null;
  scheduledEntry?: Date | string | null;
  scheduledExit?: Date | string | null;
  status?: VisitorStatus;
  notes?: string | null;
}

// Interface para atualização de visitante
export interface UpdateVisitorRequest {
  name?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  phone?: string;
  email?: string | null;
  company?: string | null;
  reason?: string;
  hostName?: string;
  hostDepartment?: string | null;
  scheduledEntry?: Date | string | null;
  scheduledExit?: Date | string | null;
  actualEntry?: Date | string | null;
  actualExit?: Date | string | null;
  status?: VisitorStatus;
  temperature?: number | null;
  notes?: string | null;
}

// Interface para filtros da tabela de visitantes
export interface VisitorFilters {
  search?: string;
  status?: VisitorStatus | '';
  dateRange?: [Date | null, Date | null];
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Interface para solicitação de listagem de visitantes
export interface ListVisitorRequest {
  search?: string;
  status?: VisitorStatus;
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Interface para resposta de listagem de visitantes
export interface ListVisitorResponse {
  success: boolean;
  visitors: Visitor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface para resposta de um único visitante
export interface VisitorResponse {
  success: boolean;
  visitor: Visitor;
}

// Interface para upload de foto
export interface UploadVisitorPhotoRequest {
  visitorId: string;
  photo: File;
}

// Tipos para as respostas da API
export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface VisitorApiResponse extends ApiResponse {
  visitor?: Visitor;
}

export interface VisitorListApiResponse extends ApiResponse {
  visitors?: Visitor[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// Interface para estatísticas de visitantes
export interface VisitorStats {
  totalVisitors: number;
  activeVisitors: number;
  checkedInCount: number;
  checkedOutCount: number;
  expectedCount: number;
  cancelledCount: number;
  visitorsByStatus: Record<VisitorStatus, number>;
  visitorsByDay?: Array<{
    date: string;
    count: number;
  }>;
  visitorsByMonth?: Array<{
    month: string;
    count: number;
  }>;
  recentVisitors?: Visitor[];
}