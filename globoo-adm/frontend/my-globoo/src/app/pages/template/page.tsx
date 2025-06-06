"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { 
  getTemplates, 
  getTemplateById, 
  handleUpdateTemplate, 
  handleDeleteTemplate, 
  handleCreateTemplate,
  getTemplateViewUrl,
} from '@/server/tamplate/template.actions';
import { Template, TemplateFilters, UpdateTemplateDTO } from '@/types/template.type';
import { DocumentType } from '@/types/enums.type';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Componente de Alerta personalizado para evitar conflitos com o componente do shadcn
type AlertProps = {
  variant: "success" | "error" | "warning" | "info";
  message: string;
  onClose: () => void;
};

const Alert = ({ variant, message, onClose }: AlertProps) => {
  const bgColor = {
    success: "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600",
    error: "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600",
    warning: "bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600",
    info: "bg-cyan-100 border-cyan-500 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-600"
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${bgColor[variant]} flex justify-between items-center`}>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-stone-500 hover:text-stone-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

// Implementando funções de utilidade
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Função para obter descrições amigáveis para os tipos de documento
const getDocumentTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'WORKER_CONTRACT': 'Contrato de Funcionário',
    'SERVICE_CONTRACT': 'Contrato de Serviço',
    'NDA': 'Acordo de Confidencialidade',
    'INVOICE': 'Fatura',
    'RECEIPT': 'Recibo',
    'REPORT': 'Relatório',
    'CERTIFICATE': 'Certificado',
    'PROPOSAL': 'Proposta',
    'MEMO': 'Memorando',
    'LETTER': 'Carta',
    'FORM': 'Formulário',
    'POLICY': 'Política',
    'PRESENTATION': 'Apresentação',
    'OTHER': 'Outro'
  };
  
  return labels[type] || type;
};

// Adicione esta função junto com a getDocumentTypeLabel
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'GENERAL': 'Geral',
    'CONTRACT': 'Contratual',
    'PERSONAL': 'Pessoal',
    'FINANCIAL': 'Financeiro',
    'TRAINING': 'Treinamento',
    'HEALTH': 'Saúde'
  };
  
  return labels[category] || category;
};

const TemplatesPage: React.FC = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 20 }
    }
  };

  // Estados
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'list' | 'form' | 'details'>('list');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filters, setFilters] = useState<TemplateFilters>({
    page: 1,
    limit: 10,
  });
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  
  // Estado do formulário - Corrigindo o tipo DocumentType
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: string;
    type: string; // Mudando para string para evitar conflito de tipos
  }>({
    name: '',
    description: '',
    category: 'GENERAL',
    type: DocumentType.OTHER.toString(), // Converter para string
  });
  const [file, setFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Funções auxiliares com useCallback - movidas para o início do componente
  const handleError = useCallback((message: string, err: unknown) => {
    console.error(`${message}:`, err);
    setError(message);
    toast.error("Erro", { description: message });
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Efeito para verificar o tema
  useEffect(() => {
    // Verificar o tema inicial
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listener para mudanças de tema
    const handleThemeChange = (e: CustomEvent) => {
      console.log("Templates page: Tema alterado para", e.detail?.theme);
      const newTheme = e.detail?.theme || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    window.addEventListener('themeToggled', handleThemeChange as EventListener);
    return () => window.removeEventListener('themeToggled', handleThemeChange as EventListener);
  }, []);

  // Função para buscar templates
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTemplates(filters);
      
      if (result) {
        setTemplates(result.templates);
        setPaginationMeta(result.meta);
        clearError();
      }
    } catch (err) {
      handleError('Erro ao buscar templates', err);
    } finally {
      setLoading(false);
    }
  }, [filters, clearError, handleError]);

  // Efeito para carregar templates quando a página carrega ou filtros mudam
  useEffect(() => {
    fetchTemplates();
  }, [filters, fetchTemplates]);

  // Função para buscar um template específico pelo ID
  const fetchTemplateById = async (id: string) => {
    setLoading(true);
    try {
      const template = await getTemplateById(id);
      if (template) {
        setCurrentTemplate(template);
      }
      clearError();
    } catch (err) {
      handleError('Erro ao buscar template', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem de templates baseada na busca
  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return templates;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return templates.filter(template => 
      template.name.toLowerCase().includes(lowerSearchTerm) || 
      (template.description && template.description.toLowerCase().includes(lowerSearchTerm)) ||
      (template.category && template.category.toLowerCase().includes(lowerSearchTerm))
    );
  }, [templates, searchTerm]);

  // Manipulador para alterações nos campos do formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });

    // Limpar erro específico quando o campo é alterado
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Manipulador para seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Limpar erro de arquivo se existir
      if (formErrors.file) {
        setFormErrors({
          ...formErrors,
          file: ''
        });
      }
    }
  };

  // Validação do formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome do template é obrigatório';
    }
    
    if (!formData.type) {
      errors.type = 'Tipo de documento é obrigatório';
    }
    
    if (formMode === 'create' && !file) {
      errors.file = 'Selecione um arquivo';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler para criar um novo template
  const handleNewTemplate = () => {
    setFormData({
      name: '',
      description: '',
      category: 'GENERAL',
      type: DocumentType.OTHER.toString(), // Converter para string
    });
    setFile(null);
    setFormErrors({});
    setFormMode('create');
    setActiveSection('form');
  };

  // Handler para editar um template
  const handleEdit = (id: string) => {
    fetchTemplateById(id).then(() => {
      if (currentTemplate) {
        setFormData({
          name: currentTemplate.name || '',
          description: currentTemplate.description || '',
          category: currentTemplate.category || 'GENERAL',
          // Converter DocumentType para string
          type: String(currentTemplate.type),
        });
        setFormErrors({});
        setFormMode('edit');
        setActiveSection('form');
      }
    });
  };

  // Handler para ver detalhes de um template
  const handleView = (id: string) => {
    fetchTemplateById(id);
    setActiveSection('details');
  };

  // Visualizar template em nova aba
  const handleViewInNewTab = async (id: string) => {
    try {
      // Obter o token do cookie
      const cookies = document.cookie.split(';');
      let token = null;
      
      // Procurar pelo cookie 'session' que contém o token
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('session=')) {
          token = cookie.substring('session='.length);
          break;
        }
      }
      
      if (!token) {
        toast.error("Você precisa estar autenticado");
        return;
      }
      
      // Obter a URL base do template
      const viewUrl = await getTemplateViewUrl(id);
      
      // Adicionar o token como parâmetro de query
      const urlWithToken = `${viewUrl}?token=${token}`;
      
      // Abrir em nova aba
      window.open(urlWithToken, '_blank');
    } catch (error) {
      handleError('Erro ao visualizar template', error);
    }
  };

  // Função para resetar o formulário
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'GENERAL',
      type: DocumentType.OTHER.toString(), // Converter para string
    });
    setFile(null);
    setFormErrors({});
    setCurrentTemplate(null);
    setActiveSection('list');
  };

  // Função para enviar o formulário (criar/editar template)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (formMode === 'create') {
        // Criar FormData para upload
        const formDataObj = new FormData();
        formDataObj.append('name', formData.name);
        formDataObj.append('description', formData.description);
        formDataObj.append('category', formData.category);
        formDataObj.append('type', formData.type); // Enviar o tipo diretamente como está (já é string)
        
        if (file) {
          formDataObj.append('file', file);
        }
        
        const result = await handleCreateTemplate(formDataObj);
        
        if (result.error) {
          setError(result.error);
          toast.error("Erro", { description: result.error });
        } else {
          setSuccessMessage(result.message || 'Template criado com sucesso!');
          toast.success("Sucesso", { description: result.message || 'Template criado com sucesso!' });
          resetForm();
          fetchTemplates();
        }
      } else {
        // Modo de edição
        if (!currentTemplate) return;
        
        // Verificação mais segura (opcional)
        const isValidDocType = (type: string): type is DocumentType => {
          return Object.values(DocumentType).includes(type as DocumentType);
        };

        const typeValue = isValidDocType(formData.type) 
          ? formData.type 
          : DocumentType.OTHER;

        const updateData: UpdateTemplateDTO = {
          id: currentTemplate.id,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          type: typeValue as unknown as UpdateTemplateDTO['type'], 
        };
        
        const result = await handleUpdateTemplate(updateData, file || undefined);
        
        if (result.error) {
          setError(result.error);
          toast.error("Erro", { description: result.error });
        } else {
          setSuccessMessage('Template atualizado com sucesso!');
          toast.success("Sucesso", { description: 'Template atualizado com sucesso!' });
          resetForm();
          fetchTemplates();
        }
      }
    } catch (err) {
      handleError(formMode === 'create' ? 'Erro ao criar template' : 'Erro ao atualizar template', err);
    } finally {
      setLoading(false);
    }
  };

  // Handler para confirmar exclusão
  const handleDelete = (id: string) => {
    fetchTemplateById(id).then(() => {
      setIsDeleteModalOpen(true);
    });
  };

  // Handler para confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!currentTemplate) return;
    
    setLoading(true);
    try {
      const result = await handleDeleteTemplate(currentTemplate.id);
      
      if (result.error) {
        setError(result.error);
        toast.error("Erro", { description: result.error });
      } else {
        setSuccessMessage('Template excluído com sucesso!');
        toast.success("Sucesso", { description: 'Template excluído com sucesso!' });
        setIsDeleteModalOpen(false);
        setActiveSection('list');
        fetchTemplates();
      }
    } catch (err) {
      handleError('Erro ao excluir template', err);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Renderização condicional das seções
  const renderContent = () => {
    if (loading && templates.length === 0 && activeSection === 'list') {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
        </div>
      );
    }

    switch (activeSection) {
      case 'list':
        return renderTemplatesList();
      case 'form':
        return renderTemplateForm();
      case 'details':
        return renderTemplateDetails();
      default:
        return renderTemplatesList();
    }
  };

  // Renderizar lista de templates
  const renderTemplatesList = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h2 className="text-xl font-semibold text-stone-800 dark:text-gray-100">Lista de Templates</h2>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-grow sm:flex-grow-0">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-stone-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-stone-900 dark:text-gray-100 placeholder-stone-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors"
                  placeholder="Buscar template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* New Template Button */}
              <motion.button
                className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-4 flex items-center py-2 rounded-lg text-[14px] gap-2 text-white shadow-sm transition-colors whitespace-nowrap"
                onClick={handleNewTemplate}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Novo Template</span>
                <PlusIcon className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredTemplates.length === 0 ? (
            <div className="p-6 text-center text-stone-500 dark:text-gray-400">
              <p>{searchTerm ? "Nenhum template encontrado com esse termo de busca." : "Nenhum template disponível."}</p>
              <Button
                onClick={handleNewTemplate}
                className="mt-4 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
              >
                Adicionar Template
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 dark:divide-gray-700">
                <thead className="bg-stone-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Formato
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Tamanho
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-stone-200 dark:divide-gray-700">
                  {filteredTemplates.map((template, index) => (
                    <motion.tr 
                      key={template.id} 
                      className="hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-stone-900 dark:text-gray-100">{template.name}</div>
                        <div className="text-xs text-stone-500 dark:text-gray-400">{template.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">
                          {getDocumentTypeLabel(String(template.type))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{getCategoryLabel(template.category || "GENERAL")}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{template.format?.toUpperCase() || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{formatBytes(template.fileSize || 0)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-3">
                          <motion.button
                            onClick={() => handleView(template.id)}
                            className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                            title="Ver detalhes"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleViewInNewTab(template.id)}
                            className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                            title="Visualizar arquivo"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <DocumentArrowDownIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleEdit(template.id)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(template.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Excluir"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Paginação - código mantido */}
        {filteredTemplates.length > 0 && paginationMeta.pages > 1 && (
          <CardFooter className="border-t border-stone-200 dark:border-gray-700">
            <div className="w-full flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setFilters({...filters, page: filters.page && filters.page > 1 ? filters.page - 1 : 1})}
                  disabled={!filters.page || filters.page <= 1}
                  variant="outline"
                  className="dark:border-gray-600 dark:text-gray-300"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => setFilters({...filters, page: (filters.page || 1) + 1})}
                  disabled={!filters.page || filters.page >= paginationMeta.pages}
                  variant="outline"
                  className="dark:border-gray-600 dark:text-gray-300"
                >
                  Próxima
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-stone-700 dark:text-gray-300">
                    Mostrando <span className="font-medium">{((filters.page || 1) - 1) * (filters.limit || 10) + 1}</span> a{" "}
                    <span className="font-medium">
                      {Math.min((filters.page || 1) * (filters.limit || 10), paginationMeta.total)}
                    </span>{" "}
                    de <span className="font-medium">{paginationMeta.total}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginação">
                    <Button
                      onClick={() => setFilters({...filters, page: (filters.page || 1) > 1 ? (filters.page || 1) - 1 : 1})}
                      disabled={!filters.page || filters.page <= 1}
                      variant="outline"
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md dark:border-gray-600 dark:text-gray-300"
                    >
                      &laquo;
                    </Button>
                    
                    {/* Páginas */}
                    {Array.from({ length: Math.min(5, paginationMeta.pages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={i}
                          onClick={() => setFilters({...filters, page: pageNum})}
                          variant={pageNum === (filters.page || 1) ? "default" : "outline"}
                          className={`relative inline-flex items-center px-4 py-2 ${
                            pageNum === (filters.page || 1) 
                              ? "bg-cyan-500 dark:bg-cyan-600 text-white" 
                              : "dark:border-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button
                      onClick={() => setFilters({...filters, page: (filters.page || 1) + 1})}
                      disabled={!filters.page || filters.page >= paginationMeta.pages}
                      variant="outline"
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md dark:border-gray-600 dark:text-gray-300"
                    >
                      &raquo;
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    );
  };

  // Renderizar formulário de template
  const renderTemplateForm = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-stone-800 dark:text-white">
              {formMode === 'create' ? 'Novo Template' : 'Editar Template'}
            </CardTitle>
            <motion.button
              onClick={() => setActiveSection('list')}
              className="text-stone-400 hover:text-stone-500 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <XMarkIcon className="h-6 w-6" />
            </motion.button>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome do Template */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Nome do Template <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                )}
              </div>
              
              {/* Tipo de Template */}
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Tipo de Documento <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  name="type"
                  id="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                  required
                >
                  {Object.entries(DocumentType).map(([, value]) => (
                    <option key={value} value={value}>
                      {getDocumentTypeLabel(value)}
                    </option>
                  ))}
                </select>
                {formErrors.type && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.type}</p>
                )}
              </div>
              
              {/* Categoria */}
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Categoria
                </label>
                <select
                  name="category"
                  id="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                >
                  <option value="GENERAL">Geral</option>
                  <option value="CONTRACT">Contratual</option>
                  <option value="PERSONAL">Pessoal</option>
                  <option value="FINANCIAL">Financeiro</option>
                  <option value="TRAINING">Treinamento</option>
                  <option value="HEALTH">Saúde</option>
                </select>
              </div>

              {/* Arquivo - apenas no modo de criação ou edição com arquivo */}
              {(formMode === 'create' || (formMode === 'edit' && file)) && (
                <div className="space-y-2">
                  <label htmlFor="file" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                    Arquivo {formMode === 'edit' && '(deixe em branco para manter o atual)'}
                  </label>
                  <Input
                    type="file"
                    id="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required={formMode === 'create'}
                  />
                  {formErrors.file && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.file}</p>
                  )}
                  {file && (
                    <p className="mt-1 text-sm text-stone-600 dark:text-gray-400">
                      {file.name} ({formatBytes(file.size)})
                    </p>
                  )}
                </div>
              )}
              
              {/* Descrição - span full */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="description" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Descrição
                </label>
                <textarea
                  name="description"
                  id="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                  rows={3}
                />
              </div>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="border-t border-stone-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3 w-full">
            <Button
              type="button"
              onClick={() => setActiveSection('list')}
              variant="secondary"
              className="bg-stone-200 hover:bg-stone-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  {formMode === 'create' ? 'Criando...' : 'Salvando...'}
                </div>
              ) : (
                formMode === 'create' ? 'Criar Template' : 'Salvar Alterações'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Renderizar detalhes de um template
  const renderTemplateDetails = () => {
    if (!currentTemplate) return null;

    // Item de informação reutilizável
    const InfoItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
      <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-stone-200 dark:border-gray-700 last:border-b-0">
        <dt className="text-sm font-medium text-stone-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-stone-900 dark:text-gray-200 sm:col-span-2 sm:mt-0">{value}</dd>
      </div>
    );

    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg leading-6 font-medium text-stone-900 dark:text-white">
                Informações do Template
              </CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-gray-400">
                Detalhes completos sobre o template.
              </p>
            </div>
            <motion.button
              onClick={() => setActiveSection('list')}
              className="text-stone-400 hover:text-stone-500 dark:text-gray-500 dark:hover:text-gray-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <XMarkIcon className="h-6 w-6" />
            </motion.button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <dl className="sm:divide-y sm:divide-stone-200 sm:dark:divide-gray-700">
            <InfoItem label="Nome" value={currentTemplate.name} />
            <InfoItem label="Descrição" value={currentTemplate.description || "-"} />
            <InfoItem label="Categoria" value={currentTemplate.category || "-"} />
            {/* Converter DocumentType para string */}
            <InfoItem label="Tipo" value={getDocumentTypeLabel(String(currentTemplate.type))} />
            <InfoItem label="Formato" value={currentTemplate.format?.toUpperCase() || "-"} />
            <InfoItem label="Tamanho" value={formatBytes(currentTemplate.fileSize || 0)} />
            <InfoItem label="Versão" value={currentTemplate.version || "1.0"} />
            <InfoItem label="Data de Criação" value={formatDate(currentTemplate.createdAt)} />
            <InfoItem label="Última Atualização" value={formatDate(currentTemplate.updatedAt)} />
            <InfoItem label="Status" value={currentTemplate.isActive ? "Ativo" : "Inativo"} />
          </dl>
        </CardContent>

        <CardFooter className="bg-stone-50 dark:bg-gray-900 border-t border-stone-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3 w-full">
            <Button
              onClick={() => handleDelete(currentTemplate.id)}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
            >
              Excluir
            </Button>
            <Button
              onClick={() => handleViewInNewTab(currentTemplate.id)}
              variant="secondary"
              className="bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700"
            >
              Visualizar
            </Button>
            <Button
              onClick={() => handleEdit(currentTemplate.id)}
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
            >
              Editar
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <motion.div
      className="p-6 min-h-screen bg-stone-50 dark:bg-gray-950"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Gerenciamento de Templates</h1>
        <p className="text-stone-500 dark:text-gray-400 mt-1">Crie, visualize e gerencie templates de documentos</p>
      </motion.div>

      {/* Mensagens de sucesso/erro */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Alert
              variant="success"
              message={successMessage}
              onClose={() => setSuccessMessage('')}
            />
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Alert
              variant="error"
              message={error}
              onClose={clearError}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-stone-100 dark:border-gray-800 dark:bg-gray-900"
      >
        {renderContent()}
      </motion.div>

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
        size="sm"
        closeOnOutsideClick={true}
        footer={
          <div className="flex justify-end space-x-3 w-full">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={loading}
              className="hover:scale-105 active:scale-95 transition-transform bg-stone-200 hover:bg-stone-300 text-stone-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
            >
              Cancelar
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={loading}
              className="hover:scale-105 active:scale-95 transition-transform bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Excluindo...
                </div>
              ) : (
                'Excluir'
              )}
            </Button>
          </div>
        }
      >
        {/* Conteúdo do modal */}
        <Card className="border-0 shadow-none">
          <CardContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <div className="flex flex-col items-center mb-6">
                <motion.div
                  className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 text-red-500 dark:text-red-400 mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                >
                  <TrashIcon className="h-8 w-8" />
                </motion.div>
              </div>

              <p className="text-stone-700 dark:text-gray-300 text-lg mb-2">
                Tem certeza que deseja excluir o template <br />
                <strong className="font-semibold">{currentTemplate?.name}</strong>?
              </p>
              <p className="text-stone-600 dark:text-gray-400 text-sm mt-4">
                Esta ação não pode ser desfeita.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </Modal>
    </motion.div>
  );
};

export default TemplatesPage;