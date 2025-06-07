"use server";

import { revalidatePath } from 'next/cache';
import { api } from '@/services/api.service';
import { getAuthToken, getAuthHeaders } from '@/lib/auth/auth';
import { handleApiError } from '@/lib/errorHandler/errorHandler';
import { ApiResponse } from '@/types/api.type';
import { 
  Provider, 
  ProviderFilters,
  CreateProviderRequest,
  UpdateProviderRequest,
  ProviderApiResponse,
  ProviderListApiResponse,
  ProviderStatus,
  ProviderStats
} from '@/types/provider.type';

/**
 * Busca prestadores com filtros opcionais
 */
export async function getProviders(filters?: ProviderFilters): Promise<ProviderListApiResponse | null> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.serviceType) queryParams.append('serviceType', filters.serviceType);
      if (filters.company) queryParams.append('company', filters.company);
      if (filters.dateRange && filters.dateRange[0]) 
        queryParams.append('startDate', filters.dateRange[0].toISOString());
      if (filters.dateRange && filters.dateRange[1]) 
        queryParams.append('endDate', filters.dateRange[1].toISOString());
      if (filters.page) queryParams.append('page', String(filters.page));
      if (filters.limit) queryParams.append('limit', String(filters.limit));
    }
    
    const queryString = queryParams.toString();
    const url = `/providers${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return {
        success: true,
        providers: response.data.providers,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages
      };
    }
    
    console.error('Resposta da API não contém dados válidos:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar prestadores:', error);
    return null;
  }
}

/**
 * Busca um prestador pelo ID
 */
export async function getProviderById(id: string): Promise<Provider | null> {
  try {
    const token = await getAuthToken();
    
    if (!token || !id) {
      return null;
    }
    
    const response = await api.get(`/providers/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return response.data.provider;
    }
    
    console.error('Resposta da API não contém prestador válido:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar prestador por ID:', error);
    return null;
  }
}

/**
 * Cria um novo prestador
 */
export async function handleCreateProvider(data: CreateProviderRequest): Promise<ProviderApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, message: "Não autorizado" };
    }

    // Validações básicas
    if (!data.name || !data.documentNumber || !data.phone || !data.reason || !data.hostName) {
      return { success: false, message: "Campos obrigatórios não preenchidos" };
    }
    
    const response = await api.post('/providers', data, {
      headers: getAuthHeaders(token)
    });
    
    // Atualizar cache
    revalidatePath('/pages/provider');
    
    return { 
      success: true, 
      provider: response.data.provider,
      message: "Prestador cadastrado com sucesso!"
    };
  } catch (error) {
    console.error('Erro ao criar prestador:', error);
    return { 
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado ao cadastrar prestador"
    };
  }
}

/**
 * Atualiza um prestador existente
 */
export async function handleUpdateProvider(id: string, data: UpdateProviderRequest): Promise<ProviderApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, message: "Não autorizado" };
    }
    
    if (!id) {
      return { success: false, message: "ID do prestador é obrigatório" };
    }
    
    const response = await api.put(`/providers/${id}`, data, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/provider');
    return { 
      success: true, 
      provider: response.data.provider,
      message: "Prestador atualizado com sucesso!"
    };
  } catch (error) {
    return { 
      success: false,
      message: handleApiError(error)
    };
  }
}

/**
 * Registra a entrada ou saída de um prestador
 */
export async function handleCheckInOut(
  id: string, 
  action: 'checkin' | 'checkout', 
  data: { notes?: string }
): Promise<ProviderApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, message: "Não autorizado" };
    }
    
    if (!id) {
      return { success: false, message: "ID do prestador é obrigatório" };
    }
    
    const updateData: UpdateProviderRequest = {
      status: action === 'checkin' ? ProviderStatus.CHECKED_IN : ProviderStatus.CHECKED_OUT,
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
    
    const response = await api.put(`/providers/${id}`, updateData, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/provider');
    return { 
      success: true, 
      provider: response.data.provider,
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
 * Exclui um prestador
 */
export async function handleDeleteProvider(id: string): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!id) {
      return { error: "ID do prestador é obrigatório" };
    }
    
    await api.delete(`/providers/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/provider');
    return { 
      success: true,
      message: "Prestador excluído com sucesso!" 
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Adiciona/atualiza a foto de um prestador
 */
export async function handleUploadProviderPhoto(id: string, formData: FormData): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }

    if (!id) {
      return { error: "ID do prestador é obrigatório" };
    }
    
    // Verificar se há um arquivo de foto
    const photoFile = formData.get('photo');
    if (!photoFile) {
      return { error: "Foto não fornecida" };
    }

    // URL completa para o backend
    const backendUrl = process.env.API_URL || 'http://localhost:4000';
    const url = `${backendUrl}/providers/${id}/photo`;

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
    revalidatePath('/pages/provider');
    
    return { 
      success: true, 
      data: responseData.photo,
      message: "Foto adicionada com sucesso!"
    };
  } catch (error) {
    console.error('Erro ao enviar foto do prestador:', error);
    return { 
      error: error instanceof Error ? error.message : "Erro inesperado ao enviar foto"
    };
  }
}

/**
 * Exclui a foto de um prestador
 */
export async function handleDeleteProviderPhoto(id: string): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!id) {
      return { error: "ID do prestador é obrigatório" };
    }
    
    await api.delete(`/providers/${id}/photo`, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/provider');
    return { 
      success: true,
      message: "Foto excluída com sucesso!" 
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Gera URL para visualização da foto de um prestador
 */
export async function getProviderPhotoUrl(id: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
  return `${baseUrl}/providers/${id}/photo`;
}

/**
 * Busca estatísticas de prestadores
 */
export async function getProviderStats(): Promise<ProviderStats | null> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    const response = await api.get('/providers/stats', {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return response.data.stats;
    }
    
    console.error('Resposta da API não contém estatísticas válidas:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar estatísticas de prestadores:', error);
    return null;
  }
}

/**
 * Busca prestadores por tipo de serviço
 */
export async function getProvidersByServiceType(serviceType: string): Promise<Provider[]> {
  const result = await getProviders({ serviceType });
  return result?.providers || [];
}

/**
 * Busca prestadores por empresa
 */
export async function getProvidersByCompany(company: string): Promise<Provider[]> {
  const result = await getProviders({ company });
  return result?.providers || [];
}

/**
 * Busca prestadores por status
 */
export async function getProvidersByStatus(status: ProviderStatus): Promise<Provider[]> {
  const result = await getProviders({ status });
  return result?.providers || [];
}

/**
 * Busca prestadores ativos (check-in realizado)
 */
export async function getActiveProviders(): Promise<Provider[]> {
  return getProvidersByStatus(ProviderStatus.CHECKED_IN);
}