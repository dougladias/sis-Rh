// Interface para representar um template de documento
export interface Template {
  id: string;
  name: string;
  type: DocumentType;
  category: string;
  description: string;
  version: string;
  createdBy: string;
  format: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  creator?: {
    name: string;
    email: string;
  };
}

// Filtros para listagem de templates
export interface TemplateFilters {
  type?: DocumentType;
  category?: string;
  name?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// DTO para criação de templates
export interface CreateTemplateDTO {
  name: string;
  type: DocumentType;
  category: string;
  description: string;
  version?: string;
  format: string;
  // O arquivo será enviado como FormData
}

// DTO para atualização de templates
export interface UpdateTemplateDTO {
  id: string;
  name?: string;
  type?: DocumentType;
  category?: string;
  description?: string;
  version?: string;
  format?: string;
  isActive?: boolean;
}

// Resposta paginada da API
export interface TemplatesResponse {
  templates: Template[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

