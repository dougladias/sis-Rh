// Interface para representar um arquivo de documento
export interface Document {
  id: string;
  workerId: string;
  documentType: DocumentType;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  description?: string;
  category?: string;
  expiresAt?: Date | string | null;
  isActive: boolean;
  uploadDate: Date | string;
  worker?: {
    name: string;
    employeeCode: string;
    department: string;
  };
}

// Filtros para listagem de documentos
export interface DocumentFilters {
  workerId?: string;
  documentType?: DocumentType;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// DTO para criação de documentos
export interface CreateDocumentDTO {
  workerId: string;
  documentType: DocumentType;
  description?: string;
  category?: string;
  expiresAt?: Date | string | null;
  // O arquivo será enviado como FormData
}

// DTO para atualização de documentos
export interface UpdateDocumentDTO {
  id: string;
  documentType?: DocumentType;
  description?: string;
  category?: string;
  expiresAt?: Date | string | null;
  isActive?: boolean;
}

// Resposta paginada da API
export interface DocumentsResponse {
  documents: Document[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}