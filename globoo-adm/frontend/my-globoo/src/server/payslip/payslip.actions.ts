"use server";

import { revalidatePath } from 'next/cache';
import { api } from '@/services/api.service';
import { getAuthToken, getAuthHeaders } from '@/lib/auth/auth';
import { handleApiError } from '@/lib/errorHandler/errorHandler';
import { ApiResponse } from '@/types/api.type';
import { 
  Payslip, 
  PayslipFilters,
  CreatePayslipRequest,
  UpdatePayslipRequest,
  PayslipApiResponse,
  PayslipListResponse,
  PayslipStats,
  PayslipStatus,
  DepartmentPayslipSummary
} from '@/types/payslip.type';

/**
 * Busca holerites com filtros opcionais
 */
export async function getPayslips(filters?: PayslipFilters): Promise<PayslipListResponse | null> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.payrollId) queryParams.append('payrollId', filters.payrollId);
      if (filters.workerId) queryParams.append('workerId', filters.workerId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.details) queryParams.append('details', String(filters.details));
      if (filters.page) queryParams.append('page', String(filters.page));
      if (filters.limit) queryParams.append('limit', String(filters.limit));
    }
    
    const queryString = queryParams.toString();
    const url = `/payslips${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return {
        success: true,
        payslips: response.data.payslips,
        pagination: response.data.pagination
      };
    }
    
    console.error('Resposta da API não contém dados válidos:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar holerites:', error);
    return null;
  }
}

/**
 * Busca um holerite pelo ID
 */
export async function getPayslipById(id: string): Promise<Payslip | null> {
  try {
    const token = await getAuthToken();
    
    if (!token || !id) {
      return null;
    }
    
    const response = await api.get(`/payslips/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return response.data.payslip;
    }
    
    console.error('Resposta da API não contém holerite válido:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar holerite por ID:', error);
    return null;
  }
}

/**
 * Cria um novo holerite
 */
export async function handleCreatePayslip(data: CreatePayslipRequest): Promise<PayslipApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, message: "Não autorizado" };
    }

    // Validações básicas
    if (!data.payrollId || !data.workerId) {
      return { success: false, message: "ID da folha de pagamento e ID do funcionário são obrigatórios" };
    }
    
    const response = await api.post('/payslips', data, {
      headers: getAuthHeaders(token)
    });
    
    // Atualizar cache
    revalidatePath('/pages/payslip');
    revalidatePath('/pages/payroll');
    
    return { 
      success: true, 
      payslip: response.data.payslip,
      message: "Holerite criado com sucesso!"
    };
  } catch (error) {
    console.error('Erro ao criar holerite:', error);
    return { 
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado ao criar holerite"
    };
  }
}

/**
 * Atualiza um holerite existente
 */
export async function handleUpdatePayslip(id: string, data: UpdatePayslipRequest): Promise<PayslipApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, message: "Não autorizado" };
    }
    
    if (!id) {
      return { success: false, message: "ID do holerite é obrigatório" };
    }
    
    const response = await api.put(`/payslips/${id}`, data, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/payslip');
    revalidatePath('/pages/payroll');
    return { 
      success: true, 
      payslip: response.data.payslip,
      message: "Holerite atualizado com sucesso!"
    };
  } catch (error) {
    return { 
      success: false,
      message: handleApiError(error)
    };
  }
}

/**
 * Exclui um holerite
 */
export async function handleDeletePayslip(id: string): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!id) {
      return { error: "ID do holerite é obrigatório" };
    }
    
    await api.delete(`/payslips/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/payslip');
    revalidatePath('/pages/payroll');
    return { 
      success: true,
      message: "Holerite excluído com sucesso!" 
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Busca estatísticas de holerites
 */
export async function getPayslipStats(): Promise<PayslipStats | null> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    // Buscar todos os holerites para calcular estatísticas
    const response = await api.get('/payslips?details=true', {
      headers: getAuthHeaders(token)
    });
    
    if (response.data) {
      // Extrai os holerites da resposta
      const payslips = Array.isArray(response.data) ? response.data : 
                      (response.data.payslips || response.data.data || []);
      
      // Calcula as estatísticas básicas
      const draftCount = payslips.filter((p: Payslip) => p.status === PayslipStatus.DRAFT).length;
      const processedCount = payslips.filter((p: Payslip) => p.status === PayslipStatus.PROCESSED).length;
      const paidCount = payslips.filter((p: Payslip) => p.status === PayslipStatus.PAID).length;
      const cancelledCount = payslips.filter((p: Payslip) => p.status === PayslipStatus.CANCELLED).length;
      
      // Calcula holerites por status
      const payslipsByStatus: Record<PayslipStatus, number> = {
        [PayslipStatus.DRAFT]: draftCount,
        [PayslipStatus.PROCESSED]: processedCount,
        [PayslipStatus.PAID]: paidCount,
        [PayslipStatus.CANCELLED]: cancelledCount
      };
      
      // Calcula valores totais e médios
      const totalPayslipsValue = payslips.reduce((sum: number, p: Payslip) => sum + Number(p.netSalary), 0);
      const averagePayslipValue = payslips.length > 0 ? totalPayslipsValue / payslips.length : 0;
      
      // Agrupa por departamento
      const departmentMap = new Map<string, { count: number; totalValue: number }>();
      payslips.forEach((payslip: Payslip) => {
        const dept = payslip.department || 'Sem departamento';
        const current = departmentMap.get(dept) || { count: 0, totalValue: 0 };
        departmentMap.set(dept, {
          count: current.count + 1,
          totalValue: current.totalValue + Number(payslip.netSalary)
        });
      });
      
      const payslipsByDepartment = Array.from(departmentMap.entries()).map(([department, data]) => ({
        department,
        count: data.count,
        totalValue: data.totalValue
      }));
      
      // Agrupa por mês/ano (se houver dados de payroll)
      const monthMap = new Map<string, { count: number; totalValue: number }>();
      payslips.forEach((payslip: Payslip) => {
        if (payslip.payroll) {
          const key = `${payslip.payroll.year}-${payslip.payroll.month}`;
          const current = monthMap.get(key) || { count: 0, totalValue: 0 };
          monthMap.set(key, {
            count: current.count + 1,
            totalValue: current.totalValue + Number(payslip.netSalary)
          });
        }
      });
      
      const payslipsByMonth = Array.from(monthMap.entries()).map(([key, data]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          month,
          year,
          count: data.count,
          totalValue: data.totalValue
        };
      });
      
      return {
        totalPayslips: payslips.length,
        draftPayslips: draftCount,
        processedPayslips: processedCount,
        paidPayslips: paidCount,
        cancelledPayslips: cancelledCount,
        payslipsByStatus,
        totalPayslipsValue,
        averagePayslipValue,
        payslipsByDepartment,
        payslipsByMonth,
        recentPayslips: payslips
          .sort((a: Payslip, b: Payslip) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      } as PayslipStats;
    }
    
    console.error('Resposta da API não contém dados válidos:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar estatísticas de holerites:', error);
    return null;
  }
}

/**
 * Busca holerites por status
 */
export async function getPayslipsByStatus(status: PayslipStatus): Promise<Payslip[]> {
  const result = await getPayslips({ status });
  return result?.payslips || [];
}

/**
 * Busca holerites por folha de pagamento
 */
export async function getPayslipsByPayroll(payrollId: string): Promise<Payslip[]> {
  const result = await getPayslips({ payrollId, details: true });
  return result?.payslips || [];
}

/**
 * Busca holerites por funcionário
 */
export async function getPayslipsByWorker(workerId: string): Promise<Payslip[]> {
  const result = await getPayslips({ workerId, details: true });
  return result?.payslips || [];
}

/**
 * Busca holerites por departamento
 */
export async function getPayslipsByDepartment(department: string): Promise<Payslip[]> {
  const result = await getPayslips({ department, details: true });
  return result?.payslips || [];
}

/**
 * Busca resumo de holerites por departamento
 */
export async function getDepartmentPayslipSummary(department?: string): Promise<DepartmentPayslipSummary[]> {
  try {
    const filters: PayslipFilters = { details: true };
    if (department) {
      filters.department = department;
    }
    
    const result = await getPayslips(filters);
    
    if (!result?.payslips) {
      return [];
    }
    
    // Agrupar por departamento
    const departmentMap = new Map<string, Payslip[]>();
    result.payslips.forEach(payslip => {
      const dept = payslip.department || 'Sem departamento';
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, []);
      }
      departmentMap.get(dept)!.push(payslip);
    });
    
    // Criar resumo para cada departamento
    return Array.from(departmentMap.entries()).map(([deptName, payslips]) => {
      const totalGrossSalary = payslips.reduce((sum, p) => sum + Number(p.baseSalary), 0);
      const totalDeductions = payslips.reduce((sum, p) => sum + Number(p.totalDeductions), 0);
      const totalBenefits = payslips.reduce((sum, p) => sum + Number(p.totalBenefits), 0);
      const totalNetSalary = payslips.reduce((sum, p) => sum + Number(p.netSalary), 0);
      
      return {
        department: deptName,
        totalEmployees: payslips.length,
        totalGrossSalary,
        totalDeductions,
        totalBenefits,
        totalNetSalary,
        averageSalary: payslips.length > 0 ? totalNetSalary / payslips.length : 0,
        payslips
      };
    });
  } catch (error) {
    console.error('Erro ao buscar resumo por departamento:', error);
    return [];
  }
}

/**
 * Marca holerite como pago
 */
export async function handleMarkPayslipAsPaid(id: string): Promise<PayslipApiResponse> {
  return handleUpdatePayslip(id, {
    status: PayslipStatus.PAID,
    paymentDate: new Date()
  });
}

/**
 * Cancela um holerite
 */
export async function handleCancelPayslip(id: string): Promise<PayslipApiResponse> {
  return handleUpdatePayslip(id, {
    status: PayslipStatus.CANCELLED
  });
}

/**
 * Processa um holerite (de DRAFT para PROCESSED)
 */
export async function handleProcessPayslip(id: string): Promise<PayslipApiResponse> {
  return handleUpdatePayslip(id, {
    status: PayslipStatus.PROCESSED
  });
}

/**
 * Busca holerites pagos
 */
export async function getPaidPayslips(): Promise<Payslip[]> {
  return getPayslipsByStatus(PayslipStatus.PAID);
}

/**
 * Busca holerites pendentes (DRAFT + PROCESSED)
 */
export async function getPendingPayslips(): Promise<Payslip[]> {
  const draft = await getPayslipsByStatus(PayslipStatus.DRAFT);
  const processed = await getPayslipsByStatus(PayslipStatus.PROCESSED);
  return [...draft, ...processed];
}

/**
 * Gera URL para visualização do PDF do holerite
 */
export async function getPayslipPDFViewUrl(id: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
  return `${baseUrl}/payslips/${id}/pdf`;
}

/**
 * Gera URL para download do PDF do holerite
 */
export async function getPayslipPDFDownloadUrl(id: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
  return `${baseUrl}/payslips/${id}/download`;
}

/**
 * Visualiza o PDF do holerite em nova aba
 */
export async function handleViewPayslipPDF(payslipId: string) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    if (!payslipId) {
      return { success: false, error: 'ID do holerite é obrigatório' };
    }

    // Gerar URL para visualização
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
    const pdfUrl = `${baseUrl}/payslips/${payslipId}/pdf`;

    return {
      success: true,
      message: 'URL do PDF gerada com sucesso',
      pdfUrl
    };

  } catch (error) {
    console.error('Erro ao gerar URL do PDF:', error);
    return { 
      success: false, 
      error: 'Erro interno do servidor' 
    };
  }
}

/**
 * Faz download do PDF do holerite
 */
export async function handleDownloadPayslipPDF(id: string, employeeName?: string): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!id) {
      return { error: "ID do holerite é obrigatório" };
    }

    // URL completa para o backend
    const backendUrl = process.env.API_URL || 'http://localhost:4000';
    const url = `${backendUrl}/payslips/${id}/download`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro ao baixar PDF: ${response.status} - ${errorData}`);
    }

    // Verificar se a resposta é um PDF
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/pdf')) {
      throw new Error('Resposta não é um PDF válido');
    }

    // Obter o blob do PDF
    const pdfBlob = await response.blob();
    
    // Gerar URL de download
    const downloadUrl = URL.createObjectURL(pdfBlob);
    
    // Nome do arquivo
    const fileName = employeeName 
      ? `holerite-${employeeName.replace(/\s+/g, '-').toLowerCase()}-${id.slice(-8)}.pdf`
      : `holerite-${id}.pdf`;
    
    return { 
      success: true,
      message: "PDF pronto para download!",
      data: {
        downloadUrl,
        fileName,
        blob: pdfBlob
      }
    };
  } catch (error) {
    console.error('Erro ao fazer download do PDF:', error);
    return { 
      error: error instanceof Error ? error.message : "Erro inesperado ao baixar PDF"
    };
  }
}

/**
 * Gera e visualiza o PDF do holerite
 */
export async function handleGenerateAndViewPayslipPDF(id: string): Promise<ApiResponse> {
  try {
    // Primeiro tenta visualizar
    const result = await handleViewPayslipPDF(id);
    
    if (result.success) {
      return {
        success: true,
        message: "PDF gerado e aberto para visualização!"
      };
    }
    
    return result;
  } catch (error) {
    return { error: handleApiError(error) };
  }
}