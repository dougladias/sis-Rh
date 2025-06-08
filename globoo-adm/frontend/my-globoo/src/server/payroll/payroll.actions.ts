"use server";

import { revalidatePath } from 'next/cache';
import { api } from '@/services/api.service';
import { getAuthToken, getAuthHeaders } from '@/lib/auth/auth';
import { handleApiError } from '@/lib/errorHandler/errorHandler';
import { ApiResponse } from '@/types/api.type';
import { 
  Payroll, 
  PayrollFilters,
  CreatePayrollRequest,
  UpdatePayrollRequest,
  ProcessPayrollRequest,
  PayrollApiResponse,
  PayrollListResponse,
  PayrollStats,
  PayrollStatus,
  MonthlyPayrollSummary
} from '@/types/payroll.type';

/**
 * Busca folhas de pagamento com filtros opcionais
 */
export async function getPayrolls(filters?: PayrollFilters): Promise<PayrollListResponse | null> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.year) queryParams.append('year', String(filters.year));
      if (filters.month) queryParams.append('month', String(filters.month));
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.page) queryParams.append('page', String(filters.page));
      if (filters.limit) queryParams.append('limit', String(filters.limit));
    }
    
    const queryString = queryParams.toString();
    const url = `/payrolls${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return {
        success: true,
        payrolls: response.data.payrolls,
        pagination: response.data.pagination
      };
    }
    
    console.error('Resposta da API não contém dados válidos:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar folhas de pagamento:', error);
    return null;
  }
}

/**
 * Busca uma folha de pagamento pelo ID
 */
export async function getPayrollById(id: string): Promise<Payroll | null> {
  try {
    const token = await getAuthToken();
    
    if (!token || !id) {
      return null;
    }
    
    const response = await api.get(`/payrolls/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return response.data.payroll;
    }
    
    console.error('Resposta da API não contém folha de pagamento válida:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar folha de pagamento por ID:', error);
    return null;
  }
}

/**
 * Cria uma nova folha de pagamento
 */
export async function handleCreatePayroll(data: CreatePayrollRequest): Promise<PayrollApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, message: "Não autorizado" };
    }

    // Validações básicas
    if (!data.month || !data.year) {
      return { success: false, message: "Mês e ano são obrigatórios" };
    }

    if (data.month < 1 || data.month > 12) {
      return { success: false, message: "Mês deve estar entre 1 e 12" };
    }

    if (data.year < 2000 || data.year > 2100) {
      return { success: false, message: "Ano inválido" };
    }
    
    const response = await api.post('/payrolls', data, {
      headers: getAuthHeaders(token)
    });
    
    // Atualizar cache
    revalidatePath('/pages/payroll');
    
    return { 
      success: true, 
      payroll: response.data.payroll,
      message: "Folha de pagamento criada com sucesso!"
    };
  } catch (error) {
    console.error('Erro ao criar folha de pagamento:', error);
    return { 
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado ao criar folha de pagamento"
    };
  }
}

/**
 * Atualiza uma folha de pagamento existente
 */
export async function handleUpdatePayroll(id: string, data: UpdatePayrollRequest): Promise<PayrollApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, message: "Não autorizado" };
    }
    
    if (!id) {
      return { success: false, message: "ID da folha de pagamento é obrigatório" };
    }
    
    const response = await api.put(`/payrolls/${id}`, data, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/payroll');
    return { 
      success: true, 
      payroll: response.data.payroll,
      message: "Folha de pagamento atualizada com sucesso!"
    };
  } catch (error) {
    return { 
      success: false,
      message: handleApiError(error)
    };
  }
}

/**
 * Processa uma folha de pagamento (gera holerites)
 */
export async function handleProcessPayroll(id: string, data: ProcessPayrollRequest): Promise<PayrollApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, message: "Não autorizado" };
    }
    
    if (!id) {
      return { success: false, message: "ID da folha de pagamento é obrigatório" };
    }

    if (!data.processedBy) {
      return { success: false, message: "É necessário informar quem está processando a folha" };
    }
    
    const response = await api.post(`/payrolls/${id}/process`, data, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/payroll');
    return { 
      success: true, 
      payroll: response.data.payroll,
      payslipsCreated: response.data.payslipsCreated,
      message: "Folha de pagamento processada com sucesso!"
    };
  } catch (error) {
    return { 
      success: false,
      message: handleApiError(error)
    };
  }
}

/**
 * Exclui uma folha de pagamento
 */
export async function handleDeletePayroll(id: string): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!id) {
      return { error: "ID da folha de pagamento é obrigatório" };
    }
    
    await api.delete(`/payrolls/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/payroll');
    return { 
      success: true,
      message: "Folha de pagamento excluída com sucesso!" 
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Busca estatísticas de folhas de pagamento
 */
export async function getPayrollStats(): Promise<PayrollStats | null> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    // Buscar todas as folhas de pagamento para calcular estatísticas
    const response = await api.get('/payrolls', {
      headers: getAuthHeaders(token)
    });
    
    if (response.data) {
      // Extrai as folhas da resposta
      const payrolls = Array.isArray(response.data) ? response.data : 
                      (response.data.payrolls || response.data.data || []);
      
      // Calcula as estatísticas básicas
      const draftCount = payrolls.filter((p: Payroll) => p.status === PayrollStatus.DRAFT).length;
      const processingCount = payrolls.filter((p: Payroll) => p.status === PayrollStatus.PROCESSING).length;
      const completedCount = payrolls.filter((p: Payroll) => p.status === PayrollStatus.COMPLETED).length;
      const cancelledCount = payrolls.filter((p: Payroll) => p.status === PayrollStatus.CANCELLED).length;
      
      // Calcula folhas por status
      const payrollsByStatus: Record<PayrollStatus, number> = {
        [PayrollStatus.DRAFT]: draftCount,
        [PayrollStatus.PROCESSING]: processingCount,
        [PayrollStatus.COMPLETED]: completedCount,
        [PayrollStatus.CANCELLED]: cancelledCount
      };
      
      // Pega a última folha processada
      const lastPayroll = payrolls
        .filter((p: Payroll) => p.status === PayrollStatus.COMPLETED)
        .sort((a: Payroll, b: Payroll) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      // Calcula média de valor das folhas
      const completedPayrolls = payrolls.filter((p: Payroll) => p.status === PayrollStatus.COMPLETED);
      const averagePayrollValue = completedPayrolls.length > 0 
        ? completedPayrolls.reduce((sum: number, p: Payroll) => sum + Number(p.totalNetSalary), 0) / completedPayrolls.length
        : 0;
      
      // Agrupa por mês/ano
      const payrollsByMonth = payrolls.reduce((acc: { month: number; year: number; count: number; totalValue: number }[], payroll: Payroll) => {
        const existing = acc.find(item => item.month === payroll.month && item.year === payroll.year);
        if (existing) {
          existing.count++;
          existing.totalValue += Number(payroll.totalNetSalary);
        } else {
          acc.push({
            month: payroll.month,
            year: payroll.year,
            count: 1,
            totalValue: Number(payroll.totalNetSalary)
          });
        }
        return acc;
      }, []);
      
      return {
        totalPayrolls: payrolls.length,
        draftPayrolls: draftCount,
        processingPayrolls: processingCount,
        completedPayrolls: completedCount,
        cancelledPayrolls: cancelledCount,
        payrollsByStatus,
        totalEmployeesInLastPayroll: lastPayroll ? lastPayroll.employeeCount : 0,
        totalValueInLastPayroll: lastPayroll ? Number(lastPayroll.totalNetSalary) : 0,
        averagePayrollValue,
        payrollsByMonth,
        recentPayrolls: payrolls
          .sort((a: Payroll, b: Payroll) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      } as PayrollStats;
    }
    
    console.error('Resposta da API não contém dados válidos:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar estatísticas de folhas de pagamento:', error);
    return null;
  }
}

/**
 * Busca folhas de pagamento por status
 */
export async function getPayrollsByStatus(status: PayrollStatus): Promise<Payroll[]> {
  const result = await getPayrolls({ status });
  return result?.payrolls || [];
}

/**
 * Busca folhas de pagamento por ano
 */
export async function getPayrollsByYear(year: number): Promise<Payroll[]> {
  const result = await getPayrolls({ year });
  return result?.payrolls || [];
}

/**
 * Busca folhas de pagamento por mês/ano
 */
export async function getPayrollByMonthYear(month: number, year: number): Promise<Payroll | null> {
  const result = await getPayrolls({ month, year, limit: 1 });
  return result?.payrolls[0] || null;
}

/**
 * Busca resumo mensal das folhas de pagamento
 */
export async function getMonthlyPayrollSummary(year: number): Promise<MonthlyPayrollSummary[]> {
  const result = await getPayrolls({ year, limit: 12 });
  
  if (!result?.payrolls) {
    return [];
  }
  
  return result.payrolls.map(payroll => ({
    month: payroll.month,
    year: payroll.year,
    totalEmployees: payroll.employeeCount,
    totalGrossSalary: Number(payroll.totalGrossSalary),
    totalDeductions: Number(payroll.totalDeductions),
    totalBenefits: Number(payroll.totalBenefits),
    totalNetSalary: Number(payroll.totalNetSalary),
    status: payroll.status,
    processedAt: payroll.processedAt,
    processedBy: payroll.processedBy
  }));
}

/**
 * Verifica se existe folha para determinado mês/ano
 */
export async function checkPayrollExists(month: number, year: number): Promise<boolean> {
  const payroll = await getPayrollByMonthYear(month, year);
  return payroll !== null;
}

/**
 * Busca folhas em rascunho
 */
export async function getDraftPayrolls(): Promise<Payroll[]> {
  return getPayrollsByStatus(PayrollStatus.DRAFT);
}

/**
 * Busca folhas processadas
 */
export async function getCompletedPayrolls(): Promise<Payroll[]> {
  return getPayrollsByStatus(PayrollStatus.COMPLETED);
}