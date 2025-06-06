"use server";

import { revalidatePath } from 'next/cache';
import { api } from '@/services/api.service';
import { getAuthToken, getAuthHeaders } from '@/lib/auth/auth';
import { handleApiError } from '@/lib/errorHandler/errorHandler';
import { ApiResponse } from '@/types/api.type';
import { 
  Visitor, 
  VisitorFilters,
  CreateVisitorRequest,
  UpdateVisitorRequest,
  VisitorApiResponse,
  VisitorListApiResponse,
  VisitorStatus,
  VisitorStats
} from '@/types/visitor.type';

/**
 * Busca visitantes com filtros opcionais
 */
export async function getVisitors(filters?: VisitorFilters): Promise<VisitorListApiResponse | null> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.dateRange && filters.dateRange[0]) 
        queryParams.append('startDate', filters.dateRange[0].toISOString());
      if (filters.dateRange && filters.dateRange[1]) 
        queryParams.append('endDate', filters.dateRange[1].toISOString());
      if (filters.page) queryParams.append('page', String(filters.page));
      if (filters.limit) queryParams.append('limit', String(filters.limit));
    }
    
    const queryString = queryParams.toString();
    const url = `/visitors${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return {
        success: true,
        visitors: response.data.visitors,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages
      };
    }
    
    console.error('Resposta da API não contém dados válidos:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar visitantes:', error);
    return null;
  }
}

/**
 * Busca um visitante pelo ID
 */
export async function getVisitorById(id: string): Promise<Visitor | null> {
  try {
    const token = await getAuthToken();
    
    if (!token || !id) {
      return null;
    }
    
    const response = await api.get(`/visitors/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return response.data.visitor;
    }
    
    console.error('Resposta da API não contém visitante válido:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar visitante por ID:', error);
    return null;
  }
}

/**
 * Cria um novo visitante
 */
export async function handleCreateVisitor(data: CreateVisitorRequest): Promise<VisitorApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, message: "Não autorizado" };
    }

    // Validações básicas
    if (!data.name || !data.documentNumber || !data.phone || !data.reason || !data.hostName) {
      return { success: false, message: "Campos obrigatórios não preenchidos" };
    }
    
    const response = await api.post('/visitors', data, {
      headers: getAuthHeaders(token)
    });
    
    // Atualizar cache
    revalidatePath('/pages/visitor');
    
    return { 
      success: true, 
      visitor: response.data.visitor,
      message: "Visitante cadastrado com sucesso!"
    };
  } catch (error) {
    console.error('Erro ao criar visitante:', error);
    return { 
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado ao cadastrar visitante"
    };
  }
}

/**
 * Atualiza um visitante existente
 */
export async function handleUpdateVisitor(id: string, data: UpdateVisitorRequest): Promise<VisitorApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, message: "Não autorizado" };
    }
    
    if (!id) {
      return { success: false, message: "ID do visitante é obrigatório" };
    }
    
    const response = await api.put(`/visitors/${id}`, data, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/visitor');
    return { 
      success: true, 
      visitor: response.data.visitor,
      message: "Visitante atualizado com sucesso!"
    };
  } catch (error) {
    return { 
      success: false,
      message: handleApiError(error)
    };
  }
}

/**
 * Registra a entrada ou saída de um visitante
 */
export async function handleCheckInOut(
  id: string, 
  action: 'checkin' | 'checkout', 
  data: { temperature?: number, notes?: string }
): Promise<VisitorApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, message: "Não autorizado" };
    }
    
    if (!id) {
      return { success: false, message: "ID do visitante é obrigatório" };
    }
    
    const updateData: UpdateVisitorRequest = {
      status: action === 'checkin' ? VisitorStatus.CHECKED_IN : VisitorStatus.CHECKED_OUT,
      ...data
    };
    
    // Para check-in, atualiza a entrada real
    if (action === 'checkin') {
      updateData.actualEntry = new Date();
    } 
    // Para check-out, atualiza a saída real
    else {
      updateData.actualExit = new Date();
    }
    
    const response = await api.put(`/visitors/${id}`, updateData, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/visitor');
    return { 
      success: true, 
      visitor: response.data.visitor,
      message: action === 'checkin' ? "Check-in realizado com sucesso!" : "Check-out realizado com sucesso!"
    };
  } catch (error) {
    return { 
      success: false,
      message: handleApiError(error)
    };
  }
}

/**
 * Exclui um visitante
 */
export async function handleDeleteVisitor(id: string): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!id) {
      return { error: "ID do visitante é obrigatório" };
    }
    
    await api.delete(`/visitors/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/visitor');
    return { 
      success: true,
      message: "Visitante excluído com sucesso!" 
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Adiciona/atualiza a foto de um visitante
 */
export async function handleUploadVisitorPhoto(id: string, formData: FormData): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }

    if (!id) {
      return { error: "ID do visitante é obrigatório" };
    }
    
    // Verificar se há um arquivo de foto
    const photoFile = formData.get('photo');
    if (!photoFile) {
      return { error: "Foto não fornecida" };
    }

    // URL completa para o backend
    const backendUrl = process.env.API_URL || 'http://localhost:4000';
    const url = `${backendUrl}/visitors/${id}/photo`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
        error: responseData.message || `Erro ao enviar foto: ${response.status}` 
      };
    }
    
    // Atualizar cache
    revalidatePath('/pages/visitor');
    
    return { 
      success: true, 
      data: responseData.photo,
      message: "Foto adicionada com sucesso!"
    };
  } catch (error) {
    console.error('Erro ao enviar foto do visitante:', error);
    return { 
      error: error instanceof Error ? error.message : "Erro inesperado ao enviar foto"
    };
  }
}

/**
 * Exclui a foto de um visitante
 */
export async function handleDeleteVisitorPhoto(id: string): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!id) {
      return { error: "ID do visitante é obrigatório" };
    }
    
    await api.delete(`/visitors/${id}/photo`, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/visitor');
    return { 
      success: true,
      message: "Foto excluída com sucesso!" 
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Gera URL para visualização da foto de um visitante
 */
export async function getVisitorPhotoUrl(id: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
  return `${baseUrl}/visitors/${id}/photo`;
}

/**
 * Busca estatísticas de visitantes
 */
export async function getVisitorStats(): Promise<VisitorStats | null> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    const response = await api.get('/visitors/stats', {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return response.data.stats;
    }
    
    console.error('Resposta da API não contém estatísticas válidas:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar estatísticas de visitantes:', error);
    return null;
  }
}