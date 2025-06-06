"use server";

import { revalidatePath } from 'next/cache';
import { api } from '@/services/api.service';
import { getAuthToken, getAuthHeaders } from '@/lib/auth/auth';
import { handleApiError } from '@/lib/errorHandler/errorHandler';
import { ApiResponse } from '@/types/api.type';
import { 
  TimeSheet, 
  CreateTimeSheetDTO, 
  UpdateTimeSheetDTO, 
  TimeSheetFilters 
} from '@/types/timeSheet.type';

// Busca todos os registros de ponto com filtragem opcional
export async function getTimeSheets(filters?: TimeSheetFilters): Promise<TimeSheet[]> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return [];
    }
    
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.workerId) queryParams.append('workerId', filters.workerId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.isAbsent !== undefined) queryParams.append('isAbsent', String(filters.isAbsent));
      if (filters.limit) queryParams.append('limit', String(filters.limit));
      if (filters.page) queryParams.append('page', String(filters.page));
    }
    
    const queryString = queryParams.toString();
    // Usando a rota correta no plural conforme definida no backend
    const url = `/timeSheets${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, {
      headers: getAuthHeaders(token)
    });

    if (response.data && response.data.success) {
      // Verifica o formato retornado pelo backend
      if (Array.isArray(response.data.TimeSheet)) {
        return response.data.TimeSheet;
      } else if (Array.isArray(response.data.timeSheets)) {
        return response.data.timeSheets;
      } else if (Array.isArray(response.data.logs)) {
        return response.data.logs;
      }
    }
    
    console.error('Resposta da API não contém registros válidos:', response.data);
    return [];
  } catch (error) {
    console.error('Erro na API ao buscar registros de ponto:', error);
    return [];
  }
}

// Busca um registro de ponto pelo ID
export async function getTimeSheetById(id: string): Promise<TimeSheet | null> {
  try {
    if (!id) return null;
    
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    // Usando a rota correta no plural conforme definida no backend
    const response = await api.get(`/timeSheets/${id}`, {
      headers: getAuthHeaders(token)
    });

    if (response.data && response.data.success) {
      // Verifica se os dados estão em log ou timeSheet conforme backend
      if (response.data.log) {
        return response.data.log;
      } else if (response.data.timeSheet) {
        return response.data.timeSheet;
      }
    }
    
    console.error('Resposta da API não contém registro de ponto:', response.data);
    return null;
  } catch (error) {
    console.error('Erro na API ao buscar registro de ponto por ID:', error);
    return null;
  }
}

// Cria um novo registro de ponto
export async function handleCreateTimeSheet(timeSheetData: CreateTimeSheetDTO): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    // Usando a rota correta no plural conforme definida no backend
    await api.post('/timeSheets', timeSheetData, {
      headers: getAuthHeaders(token)
    });

    revalidatePath('/pages/timeSheet');
    return { success: true };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

// Atualiza um registro de ponto existente
export async function handleUpdateTimeSheet(id: string, timeSheetData: UpdateTimeSheetDTO): Promise<ApiResponse> {
  if (!id) {
    return { error: "ID é obrigatório" };
  }

  try {
    const token = await getAuthToken();
    
    // Usando a rota correta no plural conforme definida no backend
    await api.put(`/timeSheets/${id}`, timeSheetData, {
      headers: getAuthHeaders(token)
    });

    revalidatePath('/pages/timeSheet');
    return { success: true };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

// Remove um registro de ponto
export async function handleDeleteTimeSheet(id: string): Promise<ApiResponse> {
  if (!id) {
    return { error: "ID é obrigatório" };
  }

  try {
    const token = await getAuthToken();
    
    // Usando a rota correta no plural conforme definida no backend
    await api.delete(`/timeSheets/${id}`, {
      headers: getAuthHeaders(token)
    });

    revalidatePath('/pages/timeSheet');
    return { success: true };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

// Busca registros de ponto por funcionário
export async function getTimeSheetsByWorker(workerId: string): Promise<TimeSheet[]> {
  return getTimeSheets({ workerId });
}

// Busca registros de ponto por período
export async function getTimeSheetsByDateRange(startDate: string, endDate: string): Promise<TimeSheet[]> {
  return getTimeSheets({ startDate, endDate });
}