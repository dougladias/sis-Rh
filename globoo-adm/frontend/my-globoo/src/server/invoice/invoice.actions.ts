"use server";

import { revalidatePath } from 'next/cache';
import { api } from '@/services/api.service';
import { getAuthToken, getAuthHeaders } from '@/lib/auth/auth';
import { handleApiError } from '@/lib/errorHandler/errorHandler';
import { ApiResponse } from '@/types/api.type';
import { 
  Invoice, 
  InvoiceFilters,
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  PaginatedInvoiceResponse,  
} from '@/types/invoice.type';

/**
 * Busca faturas com filtros opcionais
 */
export async function getInvoices(filters?: InvoiceFilters): Promise<PaginatedInvoiceResponse | null> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.number) queryParams.append('number', filters.number);
      if (filters.status) queryParams.append('status', String(filters.status));
      if (filters.startDate) queryParams.append('startDate', new Date(filters.startDate).toISOString());
      if (filters.endDate) queryParams.append('endDate', new Date(filters.endDate).toISOString());
      if (filters.minValue !== undefined) queryParams.append('minValue', String(filters.minValue));
      if (filters.maxValue !== undefined) queryParams.append('maxValue', String(filters.maxValue));
      if (filters.issuerName) queryParams.append('issuerName', filters.issuerName);
      if (filters.recipientName) queryParams.append('recipientName', filters.recipientName);
      if (filters.page) queryParams.append('page', String(filters.page));
      if (filters.limit) queryParams.append('limit', String(filters.limit));
    }
    
    const queryString = queryParams.toString();
    const url = `/invoices${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return {
        invoices: response.data.invoices,
        meta: response.data.meta
      };
    }
    
    console.error('Resposta da API não contém dados válidos:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    return null;
  }
}

/**
 * Busca uma fatura pelo ID
 */
export async function getInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const token = await getAuthToken();
    
    if (!token || !id) {
      return null;
    }
    
    const response = await api.get(`/invoices/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return response.data.invoice;
    }
    
    console.error('Resposta da API não contém fatura válida:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar fatura por ID:', error);
    return null;
  }
}

/**
 * Cria uma nova fatura
 */
export async function handleCreateInvoice(data: CreateInvoiceDTO): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }

    // Validações básicas
    if (!data.number || !data.issueDate || !data.value || !data.description || 
        !data.issuerName || !data.recipientName) {
      return { error: "Campos obrigatórios não preenchidos" };
    }
    
    const response = await api.post('/invoices', data, {
      headers: getAuthHeaders(token)
    });
    
    // Atualizar cache
    revalidatePath('/pages/invoice');
    
    return { 
      success: true, 
      data: response.data.invoice,
      message: "Fatura criada com sucesso!"
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Atualiza uma fatura existente
 */
export async function handleUpdateInvoice(data: UpdateInvoiceDTO & { id: string }): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!data.id) {
      return { error: "ID da fatura é obrigatório" };
    }
    
    const { id, ...updateData } = data;
    
    const response = await api.put(`/invoices/${id}`, updateData, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/invoice');
    return { 
      success: true, 
      data: response.data.invoice,
      message: "Fatura atualizada com sucesso!"
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Exclui uma fatura
 */
export async function handleDeleteInvoice(id: string): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!id) {
      return { error: "ID da fatura é obrigatório" };
    }
    
    await api.delete(`/invoices/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/invoice');
    return { 
      success: true,
      message: "Fatura excluída com sucesso!" 
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Upload de anexo para uma fatura - usa fetch nativo para melhor suporte a FormData
 */
export async function handleUploadInvoiceAttachment(formData: FormData): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }

    // Validações básicas
    const invoiceId = formData.get('invoiceId');
    const file = formData.get('file');
    
    if (!invoiceId) {
      return { error: "ID da fatura é obrigatório" };
    }
    
    if (!file) {
      return { error: "Arquivo é obrigatório" };
    }
    
    // URL completa para o backend
    const backendUrl = process.env.API_URL || 'http://localhost:4000';
    const url = `${backendUrl}/invoices/${invoiceId}/attachments`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Não incluir Content-Type para FormData
      },
      body: formData
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Erro na resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      return { 
        error: responseData.message || `Erro ao enviar anexo: ${response.status}` 
      };
    }
    
    // Atualizar cache
    revalidatePath('/pages/invoice/[id]', 'page');
    
    return { 
      success: true, 
      data: responseData.attachment,
      message: "Anexo enviado com sucesso!"
    };
  } catch (error) {
    console.error('Erro ao enviar anexo:', error);
    return { 
      error: error instanceof Error ? error.message : "Erro inesperado ao enviar anexo"
    };
  }
}

/**
 * Exclui um anexo de fatura
 */
export async function handleDeleteInvoiceAttachment(invoiceId: string, attachmentId: string): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!invoiceId || !attachmentId) {
      return { error: "IDs da fatura e do anexo são obrigatórios" };
    }
    
    await api.delete(`/invoices/${invoiceId}/attachments/${attachmentId}`, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/invoice/[id]', 'page');
    return { 
      success: true,
      message: "Anexo excluído com sucesso!" 
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Gera URL para visualização de um anexo de fatura
 */
export async function getInvoiceAttachmentViewUrl(invoiceId: string, attachmentId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return `${baseUrl}/invoices/${invoiceId}/attachments/${attachmentId}/view`;
}