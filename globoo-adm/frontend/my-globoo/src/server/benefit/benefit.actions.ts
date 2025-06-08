"use server";

import { revalidatePath } from 'next/cache';
import { api } from '@/services/api.service';
import { getAuthToken, getAuthHeaders } from '@/lib/auth/auth';
import { handleApiError } from '@/lib/errorHandler/errorHandler';
import { ApiResponse } from '@/types/api.type';
import { 
  Benefit, 
  BenefitFilters,
  CreateBenefitRequest,
  UpdateBenefitRequest,
  BenefitApiResponse,
  BenefitListResponse,
  BenefitStats
} from '@/types/benefit.type';

/**
 * Busca benefícios por holerite
 */
export async function getBenefitsByPayslip(payslipId: string): Promise<Benefit[]> {
  try {
    const token = await getAuthToken();
    
    if (!token || !payslipId) {
      return [];
    }
    
    const response = await api.get(`/benefits/${payslipId}`, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return response.data.benefits || [];
    }
    
    console.error('Resposta da API não contém benefícios válidos:', response.data);
    return [];
  } catch (error) {
    console.error('Erro ao buscar benefícios:', error);
    return [];
  }
}

/**
 * Busca benefícios com filtros opcionais
 */
export async function getBenefits(filters?: BenefitFilters): Promise<BenefitListResponse | null> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.payslipId) queryParams.append('payslipId', filters.payslipId);
      if (filters.code) queryParams.append('code', filters.code);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.minValue !== undefined) queryParams.append('minValue', String(filters.minValue));
      if (filters.maxValue !== undefined) queryParams.append('maxValue', String(filters.maxValue));
      if (filters.page) queryParams.append('page', String(filters.page));
      if (filters.limit) queryParams.append('limit', String(filters.limit));
      if (filters.sort) queryParams.append('sort', filters.sort);
      if (filters.order) queryParams.append('order', filters.order);
    }
    
    const queryString = queryParams.toString();
    const url = `/benefits${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return {
        success: true,
        benefits: response.data.benefits || [],
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages
      };
    }
    
    console.error('Resposta da API não contém dados válidos:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar benefícios:', error);
    return null;
  }
}

/**
 * Busca um benefício pelo ID
 */
export async function getBenefitById(id: string): Promise<Benefit | null> {
  try {
    const token = await getAuthToken();
    
    if (!token || !id) {
      return null;
    }
    
    const response = await api.get(`/benefits/detail/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return response.data.benefit;
    }
    
    console.error('Resposta da API não contém benefício válido:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar benefício por ID:', error);
    return null;
  }
}

/**
 * Cria um novo benefício
 */
export async function handleCreateBenefit(data: CreateBenefitRequest): Promise<BenefitApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, message: "Não autorizado" };
    }

    // Validações básicas
    if (!data.payslipId || !data.code || !data.type || data.value === undefined) {
      return { success: false, message: "Campos obrigatórios não preenchidos" };
    }

    if (data.value <= 0) {
      return { success: false, message: "Valor deve ser maior que zero" };
    }
    
    const response = await api.post(`/benefits/${data.payslipId}`, {
      code: data.code,
      type: data.type,
      description: data.description,
      value: data.value
    }, {
      headers: getAuthHeaders(token)
    });
    
    // Atualizar cache
    revalidatePath('/pages/payslip');
    revalidatePath('/pages/benefit');
    
    return { 
      success: true, 
      benefit: response.data.benefit,
      message: "Benefício criado com sucesso!"
    };
  } catch (error) {
    console.error('Erro ao criar benefício:', error);
    return { 
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado ao criar benefício"
    };
  }
}

/**
 * Atualiza um benefício existente
 */
export async function handleUpdateBenefit(data: UpdateBenefitRequest): Promise<BenefitApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, message: "Não autorizado" };
    }
    
    if (!data.id) {
      return { success: false, message: "ID do benefício é obrigatório" };
    }

    // Validação de valor se fornecido
    if (data.value !== undefined && data.value <= 0) {
      return { success: false, message: "Valor deve ser maior que zero" };
    }
    
    const { id, ...updateData } = data;
    
    const response = await api.put(`/benefits/detail/${id}`, updateData, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/payslip');
    revalidatePath('/pages/benefit');
    return { 
      success: true, 
      benefit: response.data.benefit,
      message: "Benefício atualizado com sucesso!"
    };
  } catch (error) {
    return { 
      success: false,
      message: handleApiError(error)
    };
  }
}

/**
 * Exclui um benefício
 */
export async function handleDeleteBenefit(id: string): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!id) {
      return { error: "ID do benefício é obrigatório" };
    }
    
    await api.delete(`/benefits/detail/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/payslip');
    revalidatePath('/pages/benefit');
    return { 
      success: true,
      message: "Benefício excluído com sucesso!" 
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Busca estatísticas de benefícios
 */
export async function getBenefitStats(): Promise<BenefitStats | null> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    // Como não temos endpoint específico de stats, vamos buscar todos os benefícios
    const response = await api.get('/benefits', {
      headers: getAuthHeaders(token)
    });
    
    if (response.data) {
      // Extrai os benefícios da resposta (trata diferentes formatos de resposta)
      const benefits = Array.isArray(response.data) ? response.data : 
                      (response.data.benefits || response.data.data || []);
      
      // Calcula as estatísticas básicas
      const totalBenefits = benefits.length;
      const totalValue = benefits.reduce((sum: number, benefit: Benefit) => 
        sum + Number(benefit.value), 0);
      const averageValue = totalBenefits > 0 ? totalValue / totalBenefits : 0;
      
      // Calcula benefícios por tipo
      const typeCounts: Record<string, { count: number; totalValue: number }> = {};
      benefits.forEach((benefit: Benefit) => {
        if (!typeCounts[benefit.type]) {
          typeCounts[benefit.type] = { count: 0, totalValue: 0 };
        }
        typeCounts[benefit.type].count++;
        typeCounts[benefit.type].totalValue += Number(benefit.value);
      });
      
      const benefitsByType = Object.entries(typeCounts).map(([type, data]) => ({
        type,
        count: data.count,
        totalValue: data.totalValue
      }));
      
      // Calcula benefícios por código
      const codeCounts: Record<string, { count: number; totalValue: number }> = {};
      benefits.forEach((benefit: Benefit) => {
        if (!codeCounts[benefit.code]) {
          codeCounts[benefit.code] = { count: 0, totalValue: 0 };
        }
        codeCounts[benefit.code].count++;
        codeCounts[benefit.code].totalValue += Number(benefit.value);
      });
      
      const benefitsByCode = Object.entries(codeCounts).map(([code, data]) => ({
        code,
        count: data.count,
        totalValue: data.totalValue
      }));
      
      // Benefícios mais usados (por quantidade)
      const mostUsedBenefits = Object.entries(codeCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([code, data]) => {
          const benefit = benefits.find((b: Benefit) => b.code === code);
          return {
            code,
            type: benefit?.type || 'N/A',
            count: data.count
          };
        });
      
      return {
        totalBenefits,
        totalValue,
        averageValue,
        benefitsByType,
        benefitsByCode,
        mostUsedBenefits
      };
    }
    
    console.error('Resposta da API não contém dados válidos:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar estatísticas de benefícios:', error);
    return null;
  }
}

/**
 * Busca benefícios por tipo
 */
export async function getBenefitsByType(type: string): Promise<Benefit[]> {
  const result = await getBenefits({ type });
  return result?.benefits || [];
}

/**
 * Busca benefícios por código
 */
export async function getBenefitsByCode(code: string): Promise<Benefit[]> {
  const result = await getBenefits({ code });
  return result?.benefits || [];
}

/**
 * Duplica um benefício para outro holerite
 */
export async function handleDuplicateBenefit(benefitId: string, targetPayslipId: string): Promise<BenefitApiResponse> {
  try {
    // Primeiro, busca o benefício original
    const originalBenefit = await getBenefitById(benefitId);
    
    if (!originalBenefit) {
      return { success: false, message: "Benefício original não encontrado" };
    }
    
    // Cria um novo benefício baseado no original
    const newBenefitData: CreateBenefitRequest = {
      payslipId: targetPayslipId,
      code: originalBenefit.code,
      type: originalBenefit.type,
      description: originalBenefit.description,
      value: originalBenefit.value
    };
    
    return await handleCreateBenefit(newBenefitData);
  } catch (error) {
    return { 
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado ao duplicar benefício"
    };
  }
}

/**
 * Aplica um benefício padrão a múltiplos holerites
 */
export async function handleApplyBenefitToMultiplePayslips(
  benefitData: Omit<CreateBenefitRequest, 'payslipId'>,
  payslipIds: string[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  for (const payslipId of payslipIds) {
    try {
      const result = await handleCreateBenefit({
        ...benefitData,
        payslipId
      });
      
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`Holerite ${payslipId}: ${result.message}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Holerite ${payslipId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
  
  return results;
}