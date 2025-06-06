import { InvoiceStatus } from './enums.type';

export interface Invoice {
  id: string;
  number: string;
  issueDate: string | Date;
  dueDate?: string | Date | null;
  value: number;
  description: string;
  status: InvoiceStatus;
  issuerName: string;
  issuerDocument?: string | null;
  issuerEmail?: string | null;
  recipientName: string;
  recipientDocument?: string | null;
  recipientEmail?: string | null;
  paymentDate?: string | Date | null;
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  attachments?: InvoiceAttachment[];
}

export interface InvoiceAttachment {
  id: string;
  invoiceId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadDate: string | Date;
  // content não é incluído aqui pois é binário e geralmente
  // não é enviado nas listagens, apenas em endpoints específicos
}

// Interface para criação de uma nova fatura
export interface CreateInvoiceDTO {
  number: string;
  issueDate: string | Date;
  dueDate?: string | Date | null;
  value: number;
  description: string;
  status?: InvoiceStatus;
  issuerName: string;
  issuerDocument?: string | null;
  issuerEmail?: string | null;
  recipientName: string;
  recipientDocument?: string | null;
  recipientEmail?: string | null;
  paymentDate?: string | Date | null;
  paymentMethod?: string | null;
  notes?: string | null;
}

// Interface para atualização de uma fatura existente
export interface UpdateInvoiceDTO {
  number?: string;
  issueDate?: string | Date;
  dueDate?: string | Date | null;
  value?: number;
  description?: string;
  status?: InvoiceStatus;
  issuerName?: string;
  issuerDocument?: string | null;
  issuerEmail?: string | null;
  recipientName?: string;
  recipientDocument?: string | null;
  recipientEmail?: string | null;
  paymentDate?: string | Date | null;
  paymentMethod?: string | null;
  notes?: string | null;
}

// Interface para filtros na listagem de faturas
export interface InvoiceFilters {
  number?: string;
  status?: InvoiceStatus;
  startDate?: string | Date;
  endDate?: string | Date;
  minValue?: number;
  maxValue?: number;
  issuerName?: string;
  recipientName?: string;
  page?: number;
  limit?: number;
}

// Interface para resposta paginada de faturas
export interface PaginatedInvoiceResponse {
  invoices: Invoice[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Interface para upload de anexo
export interface UploadInvoiceAttachmentDTO {
  invoiceId: string;
  file: File;
}