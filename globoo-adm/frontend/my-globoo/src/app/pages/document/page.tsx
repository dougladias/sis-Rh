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
  getDocuments, 
  getDocumentById,   
  handleUpdateDocument, 
  handleDeleteDocument,  
  handleCreateDocument,  
} from '@/server/document/document.actions';
import { getWorkers } from '@/server/worker/worker.actions';
import { Document, DocumentFilters, UpdateDocumentDTO } from '@/types/document.type';
import { Worker } from '@/types/worker.type';
import { DocumentType as DocType } from '@/types/enums.type';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

// Implementando funções de utilidade faltantes
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

const DocumentsPage: React.FC = () => {
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
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'list' | 'form' | 'details'>('list');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filters, setFilters] = useState<DocumentFilters>({
    page: 1,
    limit: 10,
  });
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  
  // Estado do formulário para upload
  const [formData, setFormData] = useState({
    description: '',
    category: 'GERAL',
    documentType: DocType.OTHER, // Use DocType ao invés de DocumentType
    expiresAt: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  // Função para buscar funcionários com useCallback
  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const workersData = await getWorkers();

      // Se a resposta for array vazio, pode verificar se foi por falta de autenticação
      if (workersData.length === 0) {
        const hasAuthCookie = document.cookie.includes('session=');
        if (!hasAuthCookie) {
          window.location.href = '/auth/login';
          return;
        }
      }

      setWorkers(workersData);
      clearError();
    } catch (err: unknown) {
      // Verifica se o erro indica falta de autenticação
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        window.location.href = '/auth/login';
        return;
      }
      
      handleError('Erro ao buscar funcionários', err);
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  // Função para buscar documentos do funcionário selecionado
  const fetchDocuments = useCallback(async () => {
    if (!selectedWorkerId) return;
    
    setLoading(true);
    try {
      const result = await getDocuments({
        ...filters,
        workerId: selectedWorkerId
      });
      
      if (result) {
        setDocuments(result.documents);
        setPaginationMeta(result.meta);
        clearError();
      }
    } catch (err) {
      handleError('Erro ao buscar documentos', err);
    } finally {
      setLoading(false);
    }
  }, [selectedWorkerId, filters, clearError, handleError]);

  // Efeito para carregar os funcionários quando a página carrega
  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Efeito para carregar documentos quando um trabalhador é selecionado ou filtros mudam
  useEffect(() => {
    if (selectedWorkerId) {
      fetchDocuments();
    }
  }, [selectedWorkerId, filters, fetchDocuments]);

  // Função para buscar um documento específico pelo ID
  const fetchDocumentById = async (id: string) => {
    setLoading(true);
    try {
      const document = await getDocumentById(id);
      if (document) {
        setCurrentDocument(document);
      }
      clearError();
    } catch (err) {
      handleError('Erro ao buscar documento', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem de documentos baseada na busca
  const filteredDocuments = useMemo(() => {
    if (!searchTerm) return documents;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return documents.filter(doc => 
      doc.originalName.toLowerCase().includes(lowerSearchTerm) || 
      (doc.description && doc.description.toLowerCase().includes(lowerSearchTerm)) ||
      (doc.category && doc.category.toLowerCase().includes(lowerSearchTerm))
    );
  }, [documents, searchTerm]);

  // Manipulador para seleção de funcionário
  const handleWorkerSelect = (value: string) => {
    setSelectedWorkerId(value);
    setSearchTerm('');
    setFilters({
      ...filters,
      page: 1
    });
    setActiveSection('list');
  };

  // Manipulador para alterações nos campos do formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'documentType') {
      // Converte a string para o enum DocumentType correto
      setFormData({
        ...formData,
        [name]: value as unknown as DocType, // Forçando a conversão de tipo
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

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
    
    if (!selectedWorkerId) {
      errors.workerId = 'Selecione um funcionário';
    }
    
    if (!file) {
      errors.file = 'Selecione um arquivo';
    }
    
    if (!formData.documentType) {
      errors.documentType = 'Selecione o tipo de documento';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler para criar um novo documento
  const handleNewDocument = () => {
    setFormData({
      description: '',
      category: 'GERAL',
      documentType: DocType.OTHER,
      expiresAt: '',
    });
    setFile(null);
    setFormErrors({});
    setFormMode('create');
    setActiveSection('form');
  };

  // Handler para editar um documento
  const handleEditDocument = (document: Document) => {
    setCurrentDocument(document);
    setFormData({
      description: document.description || '',
      category: document.category || 'GERAL',
      documentType: document.documentType as unknown as DocType,
      expiresAt: document.expiresAt ? formatDateForInput(document.expiresAt) : '',
    });
    setFormErrors({});
    setFormMode('edit');
    setActiveSection('form');
  };

  // Handler para ver detalhes de um documento
  const handleViewDocument = (id: string) => {
    fetchDocumentById(id);
    setActiveSection('details');
  };

  // Visualizar documento em nova aba com token
  const handleViewDocumentInNewTab = (id: string) => {
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
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Adicionar o token como parâmetro de query
    const viewUrl = `${baseUrl}/documents/${id}/view?token=${token}`;
    
    // Abrir em nova aba
    window.open(viewUrl, '_blank');
  };

  // Função para enviar o formulário (criar/editar documento)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formMode === 'create') {
      if (!validateForm()) return;
      
      setLoading(true);
      try {
        // Criar FormData para upload
        const formDataObj = new FormData();
        formDataObj.append('workerId', selectedWorkerId);
        formDataObj.append('documentType', formData.documentType.toString());
        formDataObj.append('description', formData.description);
        formDataObj.append('category', formData.category);
        
        if (formData.expiresAt) {
          formDataObj.append('expiresAt', formData.expiresAt);
        }
        
        if (file) {
          // Garantir que o campo do arquivo seja nomeado como 'file'
          formDataObj.append('file', file);
        }
        
        const result = await handleCreateDocument(formDataObj);
        
        if (result.error) {
          setError(result.error);
          toast.error("Erro", { description: result.error });
        } else {
          setSuccessMessage(result.message || 'Documento enviado com sucesso!');
          toast.success("Sucesso", { description: result.message || 'Documento enviado com sucesso!' });
          setActiveSection('list');
          fetchDocuments();
          
          // Limpar o formulário
          setFormData({
            description: '',
            category: 'GERAL',
            documentType: DocType.OTHER,
            expiresAt: '',
          });
          setFile(null);
        }
      } catch (err) {
        handleError('Erro ao enviar documento', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Modo de edição
      if (!currentDocument) return;
      
      setLoading(true);
      try {
        const updateData: UpdateDocumentDTO = {
          id: currentDocument.id,
          documentType: formData.documentType as unknown as DocumentType,
          description: formData.description,
          category: formData.category,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
        };
        
        const result = await handleUpdateDocument(updateData);
        
        if (result.error) {
          setError(result.error);
          toast.error("Erro", { description: result.error });
        } else {
          setSuccessMessage('Documento atualizado com sucesso!');
          toast.success("Sucesso", { description: 'Documento atualizado com sucesso!' });
          setActiveSection('list');
          fetchDocuments();
        }
      } catch (err) {
        handleError('Erro ao atualizar documento', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handler para confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!currentDocument) return;
    
    setLoading(true);
    try {
      const result = await handleDeleteDocument(currentDocument.id);
      
      if (result.error) {
        setError(result.error);
        toast.error("Erro", { description: result.error });
      } else {
        setSuccessMessage('Documento excluído com sucesso!');
        toast.success("Sucesso", { description: 'Documento excluído com sucesso!' });
        setIsDeleteModalOpen(false);
        setActiveSection('list');
        fetchDocuments();
      }
    } catch (err) {
      handleError('Erro ao excluir documento', err);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const formatDateForInput = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    if (typeof date === 'string') {
      // Se já for string no formato YYYY-MM-DD, retornar como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Caso contrário, tentar converter
      try {
        return new Date(date).toISOString().split('T')[0];
      } catch {
        return '';
      }
    }
    return '';
  };

  // Modifica o tipo da função formatDocumentType para aceitar o tipo correto
  const formatDocumentType = (type: DocType): string => {
    switch (type as unknown as DocType) {  // Forçando o tipo para garantir compatibilidade
      case DocType.CPF:
        return 'CPF';
      case DocType.RG:
        return 'RG';
      case DocType.CNH:
        return 'CNH';
      case DocType.PASSPORT:
        return 'Passaporte';
      case DocType.WORK_CONTRACT:
        return 'Contrato de Trabalho';
      case DocType.MEDICAL_CERTIFICATE:
        return 'Atestado Médico';
      case DocType.ADMISSION_DOCUMENT:
        return 'Documento de Admissão';
      case DocType.DISMISSAL_DOCUMENT:
        return 'Documento de Demissão';
      case DocType.CERTIFICATE:
        return 'Certificado';
      case DocType.OTHER:
      default:
        return 'Outro';
    }
  };

  // Renderização condicional das seções
  const renderContent = () => {
    if (loading && documents.length === 0 && activeSection === 'list') {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
        </div>
      );
    }

    switch (activeSection) {
      case 'list':
        return renderDocumentsList();
      case 'form':
        return renderDocumentForm();
      case 'details':
        return renderDocumentDetails();
      default:
        return renderDocumentsList();
    }
  };

  // Renderizar lista de documentos
  const renderDocumentsList = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h2 className="text-xl font-semibold text-stone-800 dark:text-gray-100">Lista de Documentos</h2>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search Bar - Estilo igual à página Workers */}
              {selectedWorkerId && (
                <div className="relative flex-grow sm:flex-grow-0">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-stone-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-stone-900 dark:text-gray-100 placeholder-stone-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors"
                    placeholder="Buscar documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}

              {/* New Document Button */}
              {selectedWorkerId && (
                <motion.button
                  className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-4 flex items-center py-2 rounded-lg text-[14px] gap-2 text-white shadow-sm transition-colors whitespace-nowrap"
                  onClick={handleNewDocument}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Novo Documento</span>
                  <PlusIcon className="h-5 w-5" />
                </motion.button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {!selectedWorkerId ? (
            <div className="p-6 text-center text-stone-500 dark:text-gray-400">
              <p>Selecione um funcionário para visualizar seus documentos.</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-6 text-center text-stone-500 dark:text-gray-400">
              <p>{searchTerm ? "Nenhum documento encontrado com esse termo de busca." : "Nenhum documento cadastrado para este funcionário."}</p>
              <Button
                onClick={handleNewDocument}
                className="mt-4 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
              >
                Adicionar Documento
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
                      Tamanho
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Data de Upload
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-stone-200 dark:divide-gray-700">
                  {filteredDocuments.map((doc, index) => (
                    <motion.tr 
                      key={doc.id} 
                      className="hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-stone-900 dark:text-gray-100">{doc.originalName}</div>
                        <div className="text-xs text-stone-500 dark:text-gray-400">{doc.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">
                          {formatDocumentType(doc.documentType as unknown as DocType)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{doc.category || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{formatBytes(doc.size)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{formatDate(doc.uploadDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-3">
                          <motion.button
                            onClick={() => handleViewDocument(doc.id)}
                            className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                            title="Ver detalhes"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleViewDocumentInNewTab(doc.id)}
                            className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                            title="Visualizar arquivo"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <DocumentArrowDownIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleEditDocument(doc)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              setCurrentDocument(doc);
                              setIsDeleteModalOpen(true);
                            }}
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

        {/* Paginação */}
        {filteredDocuments.length > 0 && paginationMeta.pages > 1 && (
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

  // Renderizar formulário de documento
  const renderDocumentForm = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-stone-800 dark:text-white">
              {formMode === 'create' ? 'Novo Documento' : 'Editar Documento'}
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
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Documento */}
              <div className="space-y-2">
                <label htmlFor="documentType" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Tipo de Documento <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  name="documentType"
                  id="documentType"
                  value={formData.documentType as string} // Conversão para string para compatibilidade
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                  required
                >
                  <option value={DocType.OTHER as string}>Outro</option>
                  <option value={DocType.CPF as string}>CPF</option>
                  <option value={DocType.RG as string}>RG</option>
                  <option value={DocType.CNH as string}>CNH</option>
                  <option value={DocType.PASSPORT as string}>Passaporte</option>
                  <option value={DocType.WORK_CONTRACT as string}>Contrato de Trabalho</option>
                  <option value={DocType.MEDICAL_CERTIFICATE as string}>Atestado Médico</option>
                  <option value={DocType.ADMISSION_DOCUMENT as string}>Documento de Admissão</option>
                  <option value={DocType.DISMISSAL_DOCUMENT as string}>Documento de Demissão</option>
                  <option value={DocType.CERTIFICATE as string}>Certificado</option>
                </select>
                {formErrors.documentType && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.documentType}</p>
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
                  <option value="GERAL">Geral</option>
                  <option value="PESSOAL">Pessoal</option>
                  <option value="FINANCEIRO">Financeiro</option>
                  <option value="CONTRATUAL">Contratual</option>
                  <option value="TREINAMENTO">Treinamento</option>
                  <option value="SAUDE">Saúde</option>
                </select>
              </div>

              {/* Descrição */}
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

              {/* Data de Expiração */}
              <div className="space-y-2">
                <label htmlFor="expiresAt" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Data de Expiração
                </label>
                <Input
                  type="date"
                  name="expiresAt"
                  id="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Arquivo - apenas no modo de criação */}
              {formMode === 'create' && (
                <div className="space-y-2">
                  <label htmlFor="file" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                    Arquivo <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <Input
                    type="file"
                    id="file"
                    onChange={handleFileChange}
                    required
                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
              onClick={handleFormSubmit}
              disabled={loading}
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  {formMode === 'create' ? 'Enviando...' : 'Salvando...'}
                </div>
              ) : (
                formMode === 'create' ? 'Enviar Documento' : 'Salvar Alterações'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Renderizar detalhes de um documento
  const renderDocumentDetails = () => {
    if (!currentDocument) return null;

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
                Informações do Documento
              </CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-gray-400">
                Detalhes completos sobre o documento.
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
            <InfoItem label="Nome do arquivo" value={currentDocument.originalName} />
            <InfoItem label="Descrição" value={currentDocument.description || "-"} />
            <InfoItem label="Categoria" value={currentDocument.category || "-"} />
            <InfoItem label="Tipo de Documento" value={formatDocumentType(currentDocument.documentType as unknown as DocType)} />
            <InfoItem label="Tamanho" value={formatBytes(currentDocument.size)} />
            <InfoItem label="Data de Upload" value={formatDate(currentDocument.uploadDate)} />
            <InfoItem label="Data de Expiração" value={currentDocument.expiresAt ? formatDate(currentDocument.expiresAt) : "-"} />
          </dl>
        </CardContent>

        <CardFooter className="bg-stone-50 dark:bg-gray-900 border-t border-stone-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3 w-full">
            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
            >
              Excluir
            </Button>
            <Button
              onClick={() => handleEditDocument(currentDocument)}
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
        <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Gerenciamento de Documentos</h1>
        <p className="text-stone-500 dark:text-gray-400 mt-1">Gerencie documentos associados aos funcionários</p>
      </motion.div>

      {/* Seleção de funcionário */}
      <motion.div className="mb-6" variants={itemVariants}>
        <Card className="bg-white rounded-xl shadow-lg overflow-hidden border border-stone-100 dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-stone-800 dark:text-white">
              Selecionar Funcionário
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">            
            <Select 
              value={selectedWorkerId || undefined} 
              onValueChange={handleWorkerSelect}
            >
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent className="bg-white  dark:bg-gray-800 border dark:border-gray-700 rounded-md">
                {workers.map((worker) => (
                  <SelectItem 
                    key={worker.id} 
                    value={worker.id}
                    className="text-stone-900 dark:text-gray-100 hover:bg-stone-100 dark:hover:bg-gray-700/70 cursor-pointer"
                  >
                    {worker.name} ({worker.employeeCode || 'Sem código'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
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
                Tem certeza que deseja excluir o documento <br />
                <strong className="font-semibold">{currentDocument?.originalName}</strong>?
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

export default DocumentsPage;