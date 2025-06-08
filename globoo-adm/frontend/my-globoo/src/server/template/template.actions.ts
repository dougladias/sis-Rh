"use server";

import { revalidatePath } from 'next/cache';
import { api } from '@/services/api.service';
import { getAuthToken, getAuthHeaders } from '@/lib/auth/auth';
import { handleApiError } from '@/lib/errorHandler/errorHandler';
import { ApiResponse } from '@/types/api.type';
import { 
  Template, 
  TemplateFilters, 
  UpdateTemplateDTO,
  TemplatesResponse 
} from '@/types/template.type';

/**
 * Busca templates com filtros opcionais
 */
export async function getTemplates(filters?: TemplateFilters): Promise<TemplatesResponse | null> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.type) queryParams.append('type', String(filters.type));
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.name) queryParams.append('name', filters.name);
      if (filters.isActive !== undefined) queryParams.append('isActive', String(filters.isActive));
      if (filters.page) queryParams.append('page', String(filters.page));
      if (filters.limit) queryParams.append('limit', String(filters.limit));
    }
    
    const queryString = queryParams.toString();
    const url = `/templates${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return {
        templates: response.data.templates,
        meta: response.data.meta
      };
    }
    
    console.error('Resposta da API não contém dados válidos:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    return null;
  }
}

/**
 * Busca um template pelo ID
 */
export async function getTemplateById(id: string, includeFileData: boolean = false): Promise<Template | null> {
  try {
    const token = await getAuthToken();
    
    if (!token || !id) {
      return null;
    }
    
    const url = `/templates/${id}${includeFileData ? '?includeFileData=true' : ''}`;
    
    const response = await api.get(url, {
      headers: getAuthHeaders(token)
    });
    
    if (response.data && response.data.success) {
      return response.data.template;
    }
    
    console.error('Resposta da API não contém template válido:', response.data);
    return null;
  } catch (error) {
    console.error('Erro ao buscar template por ID:', error);
    return null;
  }
}

/**
 * Cria um novo template - Versão que usa fetch nativo em vez de axios
 */
export async function handleCreateTemplate(formData: FormData): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }

    // Validações básicas
    const name = formData.get('name');
    const description = formData.get('description');
    const file = formData.get('file');
    
    if (!name) {
      return { error: "Nome do template é obrigatório" };
    }
    
    if (!description) {
      return { error: "Descrição do template é obrigatória" };
    }
    
    if (!file) {
      return { error: "Arquivo é obrigatório" };
    }

    // URL completa para o backend
    const backendUrl = process.env.API_URL || 'http://localhost:4000';
    const url = `${backendUrl}/templates`;

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
        error: responseData.message || `Erro ao enviar template: ${response.status}` 
      };
    }
    
    // Atualizar cache
    revalidatePath('/pages/template');
    
    return { 
      success: true, 
      data: responseData.template,
      message: "Template enviado com sucesso!"
    };
  } catch (error: unknown) {
    console.error('Erro ao criar template:', error);
    return { 
      error: error instanceof Error ? error.message : "Erro inesperado ao enviar template"
    };
  }
}

/**
 * Atualiza um template existente
 */
export async function handleUpdateTemplate(data: UpdateTemplateDTO, file?: File): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!data.id) {
      return { error: "ID do template é obrigatório" };
    }
    
    // Se houver arquivo, usar FormData e fetch nativo
    if (file) {
      const formData = new FormData();
      
      // Adicionar todos os campos ao FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      // Adicionar o arquivo
      formData.append('file', file);
      
      // URL completa para o backend
      const backendUrl = process.env.API_URL || 'http://localhost:4000';
      const url = `${backendUrl}/templates/${data.id}`;

      const response = await fetch(url, {
        method: 'PUT',
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
          error: responseData.message || `Erro ao atualizar template: ${response.status}` 
        };
      }
      
      revalidatePath('/pages/template');
      return { 
        success: true, 
        data: responseData.template,
        message: "Template atualizado com sucesso!"
      };
    } else {
      // Se não houver arquivo, enviar como JSON normal com axios
      const response = await api.put(`/templates/${data.id}`, data, {
        headers: getAuthHeaders(token)
      });
      
      revalidatePath('/pages/template');
      return { 
        success: true, 
        data: response.data.template,
        message: "Template atualizado com sucesso!"
      };
    }
  } catch (error) {
    return { error: handleApiError(error) };
  }
}


// Exclui um template
export async function handleDeleteTemplate(id: string): Promise<ApiResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { error: "Não autorizado" };
    }
    
    if (!id) {
      return { error: "ID do template é obrigatório" };
    }
    
    await api.delete(`/templates/${id}`, {
      headers: getAuthHeaders(token)
    });
    
    revalidatePath('/pages/template');
    return { 
      success: true,
      message: "Template excluído com sucesso!" 
    };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}


// Gera URL para visualização de um template
export async function getTemplateViewUrl(id: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
  return `${baseUrl}/templates/${id}/view`;
}

