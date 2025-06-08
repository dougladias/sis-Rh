"use server";

import { revalidatePath } from 'next/cache';
import { api } from '@/services/api.service';
import { getAuthToken, getAuthHeaders } from '@/lib/auth/auth';
import { handleApiError } from '@/lib/errorHandler/errorHandler';
import { ApiResponse } from '@/types/api.type';
import { Worker, CreateWorkerData, UpdateWorkerData, WorkerStats } from '@/types/worker.type';

// Buscar todos os funcionários
export async function getWorkers(): Promise<Worker[]> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return [];
    }
    
    // Aqui está o problema - precisamos acessar workers dentro da resposta
    const response = await api.get('/workers', {
      headers: getAuthHeaders(token)
    });

    // Verificar se a resposta tem a estrutura esperada
    if (response.data && response.data.success && Array.isArray(response.data.workers)) {      
      return response.data.workers;
    }
    
    console.error('Resposta da API não é um array:', response.data);
    return [];
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    return [];
  }
}

// Buscar um funcionário específico
export async function getWorkerById(id: string): Promise<Worker | null> {
  try {
    if (!id) return null;
    
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    const response = await api.get(`/workers/${id}`, {
      headers: getAuthHeaders(token)
    });

    // Verificar se a resposta tem a estrutura esperada
    if (response.data && response.data.success && response.data.worker) {
      return response.data.worker;
    }
    
    console.error('Resposta da API não contém worker:', response.data);
    return null;
  } catch (error) {
    console.error(`Erro ao buscar funcionário ${id}:`, error);
    return null;
  }
}

// Buscar estatísticas dos funcionários
export async function getWorkerStats(): Promise<WorkerStats | null> {
  try {
    const token = await getAuthToken();
    
    const response = await api.get('/workers', {
      headers: getAuthHeaders(token)
    });

    if (response.data) {
      // Verifica se response.data é array ou se contém uma propriedade workers
      const workers = Array.isArray(response.data) ? response.data : 
                      (response.data.workers || response.data.data || []);
      
      // Agora garantimos que workers é um array
      const departments = workers.map((worker: Worker) => worker.department);
      const uniqueDepartments = [...new Set(departments)].filter((dept): dept is string => 
        typeof dept === 'string'
      );
      
      const departmentCounts = uniqueDepartments.map((dept: string) => ({
        name: dept,
        count: workers.filter((w: Worker) => w.department === dept).length
      }));
      
      return {
        totalWorkers: workers.length,
        activeWorkers: workers.filter((w: Worker) => w.status === 'ACTIVE').length,
        inactiveWorkers: workers.filter((w: Worker) => w.status === 'INACTIVE').length,
        terminatedWorkers: workers.filter((w: Worker) => w.status === 'TERMINATED').length,
        onVacationWorkers: workers.filter((w: Worker) => w.status === 'ON_VACATION').length,
        departmentsCount: uniqueDepartments.length,
        departments: departmentCounts
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    return null;
  }
}

// Criar funcionário
export async function handleCreateWorker(data: CreateWorkerData): Promise<ApiResponse> {
  // Validações básicas
  if (!data.name?.trim()) {
    return { error: "Nome é obrigatório" };
  }

  if (!data.employeeCode?.trim()) {
    return { error: "Código de funcionário é obrigatório" };
  }

  if (!data.cpf?.trim()) {
    return { error: "CPF é obrigatório" };
  }

  if (!data.email?.trim() || !data.email.includes('@')) {
    return { error: "Email inválido" };
  }

  if (!data.phone?.trim()) {
    return { error: "Telefone é obrigatório" };
  }

  if (!data.position?.trim()) {
    return { error: "Cargo é obrigatório" };
  }

  if (!data.salary || data.salary <= 0) {
    return { error: "Salário deve ser maior que zero" };
  }

  try {
    const token = await getAuthToken();
    
    await api.post('/workers', data, {
      headers: getAuthHeaders(token)
    });

    revalidatePath('/pages/worker');
    return { success: true };
  } catch(err) {
    return { error: handleApiError(err) };
  }
}

// Atualizar funcionário
export async function handleUpdateWorker(data: UpdateWorkerData): Promise<ApiResponse> {
  if (!data.id) {
    return { error: "ID é obrigatório" };
  }

  // Validações para os campos que serão atualizados
  if (data.email && !data.email.includes('@')) {
    return { error: "Email inválido" };
  }

  if (data.salary && data.salary <= 0) {
    return { error: "Salário deve ser maior que zero" };
  }

  try {
    const token = await getAuthToken();
    
    await api.put(`/workers/${data.id}`, data, {
      headers: getAuthHeaders(token)
    });

    revalidatePath('/pages/worker');
    return { success: true };
  } catch(err) {
    return { error: handleApiError(err) };
  }
}

// Deletar funcionário
export async function handleDeleteWorker(id: string): Promise<ApiResponse> {
  if (!id) {
    return { error: "ID é obrigatório" };
  }

  try {
    const token = await getAuthToken();
    
    await api.delete(`/workers/${id}`, {
      headers: getAuthHeaders(token)
    });

    revalidatePath('/pages/worker');
    return { success: true };
  } catch(err) {
    return { error: handleApiError(err) };
  }
}

// Buscar funcionários ativos (helper function)
export async function getActiveWorkers(): Promise<Worker[]> {
  try {
    const workers = await getWorkers();
    return workers.filter(worker => worker.status === 'ACTIVE');
  } catch (error) {
    console.error('Erro ao buscar funcionários ativos:', error);
    return [];
  }
}

// Buscar funcionários por departamento (helper function)
export async function getWorkersByDepartment(department: string): Promise<Worker[]> {
  try {
    const workers = await getWorkers();
    return workers.filter(worker => worker.department === department);
  } catch (error) {
    console.error(`Erro ao buscar funcionários do departamento ${department}:`, error);
    return [];
  }
}