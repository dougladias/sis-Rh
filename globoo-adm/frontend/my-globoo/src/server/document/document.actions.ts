"use server";

import { revalidatePath } from 'next/cache';
import { api } from '@/services/api.service';
import { getAuthToken, getAuthHeaders } from '@/lib/auth/auth';
import { handleApiError } from '@/lib/errorHandler/errorHandler';
import { ApiResponse } from '@/types/api.type';
import { 
  Document, 
  DocumentFilters,   
  UpdateDocumentDTO,
  DocumentsResponse 
} from '@/types/document.type';

/**
 * Busca documentos com filtros opcionais
 */
export async function getDocuments(filters?: DocumentFilters): Promise<DocumentsResponse | null> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.workerId) queryParams.append('workerId', filters.workerId);
      if (filters.documentType) queryParams.append('documentType', String(filters.documentType));
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.isActive !== undefined) queryParams.append('isActive', String(filters.isActive));
      if (filters.page) queryParams.append('page', String(filters.page));
      if (filters.limit) queryParams.append('limit', String(filters.limit));
    }
    
    const queryString = queryParams.toString();
    const url = `/documents${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return {
        documents: response.data.documents,
        meta: response.data.meta
      };
    }
    
    console.error('Resposta da API não contém dados válidos:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    return null;
  }
}

/**
 * Busca um documento pelo ID
 */
export async function getDocumentById(id: string, includeContent: boolean = false): Promise<Document | null> {
  try {
    const token = await getAuthToken();
    
    if (!token || !id) {
      return null;
    }
    
    const url = `/documents/${id}${includeContent ? '?includeContent=true' : ''}`;
    
    const response = await api.get(url, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return response.data.document;
    }
    
    console.error('Resposta da API não contém documento válido:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar documento por ID:', error);
    return null;
  }
}

/**
 * Cria um novo documento - Versão que usa fetch nativo em vez de axios
 */
export async function handleCreateDocument(formData: FormData): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }

    // Validações básicas
    const workerId = formData.get('workerId');
    const file = formData.get('file');    
    
    if (!workerId) {
      return { error: "ID do funcionário é obrigatório" };
    }
    
    if (!file) {
      return { error: "Arquivo é obrigatório" };
    }    

    // URL completa para o backend
    const backendUrl = process.env.API_URL || 'http://localhost:4000';
    const url = `${backendUrl}/documents`;

    // Usar o FormData original diretamente
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // NÃO adicione Content-Type para FormData
      },
      body: formData // Use o FormData original
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Erro na resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      return { 
        error: responseData.message || `Erro ao enviar documento: ${response.status}` 
      };
    }
    
    // Atualizar cache
    revalidatePath('/pages/document');
    
    return { 
      success: true, 
      data: responseData.document,
      message: "Documento enviado com sucesso!"
    };
  } catch (error: unknown) {
    console.error('Erro ao criar documento:', error);
    return { 
      error: error instanceof Error ? error.message : "Erro inesperado ao enviar documento"
    };
  }
}

/**
 * Atualiza um documento existente
 */
export async function handleUpdateDocument(data: UpdateDocumentDTO): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!data.id) {
      return { error: "ID do documento é obrigatório" };
    }
    
    const response = await api.put(`/documents/${data.id}`, data, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/document');
    return { 
      success: true, 
      data: response.data.document,
      message: "Documento atualizado com sucesso!"
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Exclui um documento
 */
export async function handleDeleteDocument(id: string): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!id) {
      return { error: "ID do documento é obrigatório" };
    }
    
    await api.delete(`/documents/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/document');
    return { 
      success: true,
      message: "Documento excluído com sucesso!" 
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Busca documentos por funcionário
 */
export async function getDocumentsByWorker(workerId: string): Promise<Document[]> {
  const result = await getDocuments({ workerId });
  return result?.documents || [];
}

/**
 * Gera URL para visualização de um documento
 */
export async function getDocumentViewUrl(id: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
  return `${baseUrl}/documents/${id}/view`;
}


