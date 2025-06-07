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
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  getInvoices,
  getInvoiceById,
  handleCreateInvoice,
  handleUpdateInvoice,
  handleDeleteInvoice,
  handleUploadInvoiceAttachment,
} from '@/server/invoice/invoice.actions';

import { Invoice, InvoiceFilters, CreateInvoiceDTO, UpdateInvoiceDTO } from '@/types/invoice.type';
import { InvoiceStatus } from '@/types/enums.type';

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

// Funções de utilidade
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatValue = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatStatus = (status: InvoiceStatus): string => {
  switch (status) {
    case InvoiceStatus.PAID:
      return 'Pago';
    case InvoiceStatus.CANCELLED:
      return 'Cancelado';
    case InvoiceStatus.OVERDUE:
      return 'Vencido';
    case InvoiceStatus.PENDING:
    default:
      return 'Pendente';
  }
};

export default function InvoicePage() {
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'list' | 'form' | 'details'>('list');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filters, setFilters] = useState<InvoiceFilters>({
    page: 1,
    limit: 10,
  });
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });

  // Estado do formulário
  const [formData, setFormData] = useState<CreateInvoiceDTO>({
    number: '',
    issueDate: new Date(),
    value: 0,
    description: '',
    status: InvoiceStatus.PENDING,
    issuerName: '',
    recipientName: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Funções auxiliares com useCallback
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
      console.log("Invoice page: Tema alterado para", e.detail?.theme);
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

  // Função para buscar faturas
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInvoices(filters);

      if (result) {
        setInvoices(result.invoices);
        setPaginationMeta(result.meta);
        clearError();
      }
    } catch (err) {
      handleError('Erro ao buscar faturas', err);
    } finally {
      setLoading(false);
    }
  }, [filters, clearError, handleError]);

  // Efeito para carregar faturas quando a página carrega ou filtros mudam
  useEffect(() => {
    fetchInvoices();
  }, [filters, fetchInvoices]);

  // Função para buscar uma fatura específica pelo ID
  const fetchInvoiceById = async (id: string) => {
    setLoading(true);
    try {
      const invoice = await getInvoiceById(id);
      if (invoice) {
        setCurrentInvoice(invoice);
      }
      clearError();
    } catch (err) {
      handleError('Erro ao buscar fatura', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem de faturas baseada na busca
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return invoices.filter(invoice =>
      invoice.number.toLowerCase().includes(lowerSearchTerm) ||
      invoice.description.toLowerCase().includes(lowerSearchTerm) ||
      invoice.issuerName.toLowerCase().includes(lowerSearchTerm) ||
      invoice.recipientName.toLowerCase().includes(lowerSearchTerm)
    );
  }, [invoices, searchTerm]);

  // Manipulador para alterações nos campos do formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'status') {
      setFormData({
        ...formData,
        [name]: value as InvoiceStatus,
      });
    } else if (name === 'value') {
      // Garantir que o valor seja sempre um número válido
      const numValue = value === '' ? 0 : parseFloat(value);

      setFormData({
        ...formData,
        [name]: isNaN(numValue) ? 0 : numValue,
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
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

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

    if (!formData.number) {
      errors.number = 'Número da nota é obrigatório';
    }

    if (!formData.issueDate) {
      errors.issueDate = 'Data de emissão é obrigatória';
    }

    if (!formData.value || formData.value <= 0) {
      errors.value = 'Valor deve ser maior que zero';
    }

    if (!formData.description) {
      errors.description = 'Descrição é obrigatória';
    }

    if (!formData.issuerName) {
      errors.issuerName = 'Nome do emissor é obrigatório';
    }

    if (!formData.recipientName) {
      errors.recipientName = 'Nome do destinatário é obrigatório';
    }

    if (formMode === 'create' && !selectedFile) {
      errors.file = 'Arquivo é obrigatório';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler para criar uma nova fatura
  const handleNewInvoice = () => {
    setFormData({
      number: '',
      issueDate: new Date(),
      value: 0,
      description: '',
      status: InvoiceStatus.PENDING,
      issuerName: '',
      recipientName: '',
    });
    setSelectedFile(null);
    setFormErrors({});
    setFormMode('create');
    setActiveSection('form');
  };

  // Handler para editar uma fatura
  const handleEditInvoice = async (id: string) => {
    await fetchInvoiceById(id);

    if (currentInvoice) {
      setFormData({
        number: currentInvoice.number,
        issueDate: currentInvoice.issueDate,
        dueDate: currentInvoice.dueDate || undefined,
        value: currentInvoice.value,
        description: currentInvoice.description,
        status: currentInvoice.status,
        issuerName: currentInvoice.issuerName,
        issuerDocument: currentInvoice.issuerDocument || undefined,
        issuerEmail: currentInvoice.issuerEmail || undefined,
        recipientName: currentInvoice.recipientName,
        recipientDocument: currentInvoice.recipientDocument || undefined,
        recipientEmail: currentInvoice.recipientEmail || undefined,
        paymentDate: currentInvoice.paymentDate || undefined,
        paymentMethod: currentInvoice.paymentMethod || undefined,
        notes: currentInvoice.notes || undefined,
      });
      setFormErrors({});
      setFormMode('edit');
      setActiveSection('form');
    }
  };

  // Handler para ver detalhes de uma fatura
  const handleViewInvoice = async (id: string) => {
    await fetchInvoiceById(id);
    setActiveSection('details');
  };

  // Visualizar anexo da fatura em nova aba - VERSÃO SIMPLIFICADA SEGUINDO O PADRÃO DO DOCUMENT
  const handleViewInvoiceAttachmentInNewTab = (invoiceId: string, attachmentId: string) => {
    if (!invoiceId || !attachmentId) {
      toast.error("Dados do anexo inválidos");
      return;
    }

    // Obter o token do cookie (mesmo método que funciona no Document)
    const cookies = document.cookie.split(';');
    let token = null;
    
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
    
    // Construir URL diretamente como no Document
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const viewUrl = `${baseUrl}/invoices/${invoiceId}/attachments/${attachmentId}/view?token=${token}`;
    
    // Abrir em nova aba
    window.open(viewUrl, '_blank');
  };

  // Função para enviar o formulário (criar/editar fatura)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (formMode === 'create') {
        // Criar nova fatura
        const result = await handleCreateInvoice(formData);

        if (result.error) {
          setError(result.error);
          toast.error("Erro", { description: result.error });
        } else {
          // Se a criação for bem-sucedida e tivermos um arquivo, fazer upload do anexo
          if (selectedFile && result.data && typeof result.data === 'object' && result.data !== null && 'id' in result.data) {
            const formDataObj = new FormData();
            formDataObj.append('invoiceId', String(result.data.id));
            formDataObj.append('file', selectedFile);

            const attachmentResult = await handleUploadInvoiceAttachment(formDataObj);

            if (attachmentResult.error) {
              toast.warning("Atenção", {
                description: "Fatura criada, mas ocorreu um erro ao anexar o arquivo: " + attachmentResult.error
              });
            }
          }

          setSuccessMessage(result.message || 'Fatura criada com sucesso!');
          toast.success("Sucesso", { description: result.message || 'Fatura criada com sucesso!' });
          setActiveSection('list');
          fetchInvoices();

          // Limpar o formulário
          setFormData({
            number: '',
            issueDate: new Date(),
            value: 0,
            description: '',
            status: InvoiceStatus.PENDING,
            issuerName: '',
            recipientName: '',
          });
          setSelectedFile(null);
        }
      } else {
        // Atualizar fatura existente
        if (!currentInvoice) return;

        const updateData: UpdateInvoiceDTO & { id: string } = {
          id: currentInvoice.id,
          ...formData
        };

        const result = await handleUpdateInvoice(updateData);

        if (result.error) {
          setError(result.error);
          toast.error("Erro", { description: result.error });
        } else {
          setSuccessMessage(result.message || 'Fatura atualizada com sucesso!');
          toast.success("Sucesso", { description: result.message || 'Fatura atualizada com sucesso!' });
          setActiveSection('list');
          fetchInvoices();
        }
      }
    } catch (err) {
      handleError(formMode === 'create' ? 'Erro ao criar fatura' : 'Erro ao atualizar fatura', err);
    } finally {
      setLoading(false);
    }
  };

  // Handler para confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!currentInvoice) return;

    setLoading(true);
    try {
      const result = await handleDeleteInvoice(currentInvoice.id);

      if (result.error) {
        setError(result.error);
        toast.error("Erro", { description: result.error });
      } else {
        setSuccessMessage(result.message || 'Fatura excluída com sucesso!');
        toast.success("Sucesso", { description: result.message || 'Fatura excluída com sucesso!' });
        setIsDeleteModalOpen(false);
        setActiveSection('list');
        fetchInvoices();
      }
    } catch (err) {
      handleError('Erro ao excluir fatura', err);
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

  // Renderização condicional das seções
  const renderContent = () => {
    if (loading && invoices.length === 0 && activeSection === 'list') {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
        </div>
      );
    }

    switch (activeSection) {
      case 'list':
        return renderInvoicesList();
      case 'form':
        return renderInvoiceForm();
      case 'details':
        return renderInvoiceDetails();
      default:
        return renderInvoicesList();
    }
  };

  // Renderizar lista de faturas
  const renderInvoicesList = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h2 className="text-xl font-semibold text-stone-800 dark:text-gray-100">Lista de Faturas</h2>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search Bar - Estilo igual à página Workers */}
              <div className="relative flex-grow sm:flex-grow-0">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-stone-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-stone-900 dark:text-gray-100 placeholder-stone-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors"
                  placeholder="Buscar fatura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* New Invoice Button */}
              <motion.button
                className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-4 flex items-center py-2 rounded-lg text-[14px] gap-2 text-white shadow-sm transition-colors whitespace-nowrap"
                onClick={handleNewInvoice}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Nova Fatura</span>
                <PlusIcon className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredInvoices.length === 0 ? (
            <div className="p-6 text-center text-stone-500 dark:text-gray-400">
              <p>
                {searchTerm
                  ? "Nenhuma fatura encontrada com esse termo de busca."
                  : "Nenhuma fatura cadastrada."}
              </p>
              <Button
                onClick={handleNewInvoice}
                className="mt-4 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
              >
                Adicionar Fatura
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 dark:divide-gray-700">
                <thead className="bg-stone-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Número
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Data
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Emissor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Destinatário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-stone-200 dark:divide-gray-700">
                  {filteredInvoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice.id}
                      className="hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-stone-900 dark:text-gray-100">{invoice.number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{formatDate(invoice.issueDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{formatValue(invoice.value)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{invoice.issuerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{invoice.recipientName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${invoice.status === InvoiceStatus.PAID
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : invoice.status === InvoiceStatus.CANCELLED
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : invoice.status === InvoiceStatus.OVERDUE
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                          {formatStatus(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-3">
                          <motion.button
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                            title="Ver detalhes"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </motion.button>
                          {/* Botão para visualizar anexo - VERSÃO SIMPLIFICADA */}
                          <motion.button
                            onClick={() => {
                              if (invoice.attachments && invoice.attachments.length > 0) {
                                handleViewInvoiceAttachmentInNewTab(invoice.id, invoice.attachments[0].id);
                              } else {
                                toast.error("Esta fatura não possui anexos");
                              }
                            }}
                            className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                            title="Visualizar nota fiscal"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <DocumentArrowDownIcon className="h-5 w-5" />
                          </motion.button>

                          <motion.button
                            onClick={() => handleEditInvoice(invoice.id)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>

                          <motion.button
                            onClick={() => {
                              setCurrentInvoice(invoice);
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
        {filteredInvoices.length > 0 && paginationMeta.pages > 1 && (
          <CardFooter className="border-t border-stone-200 dark:border-gray-700">
            <div className="w-full flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setFilters({ ...filters, page: filters.page && filters.page > 1 ? filters.page - 1 : 1 })}
                  disabled={!filters.page || filters.page <= 1}
                  variant="outline"
                  className="dark:border-gray-600 dark:text-gray-300"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
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
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) > 1 ? (filters.page || 1) - 1 : 1 })}
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
                          onClick={() => setFilters({ ...filters, page: pageNum })}
                          variant={pageNum === (filters.page || 1) ? "default" : "outline"}
                          className={`relative inline-flex items-center px-4 py-2 ${pageNum === (filters.page || 1)
                              ? "bg-cyan-500 dark:bg-cyan-600 text-white"
                              : "dark:border-gray-600 dark:text-gray-300"
                            }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
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

  // Renderizar formulário de fatura
  const renderInvoiceForm = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-stone-800 dark:text-white">
              {formMode === 'create' ? 'Nova Fatura' : 'Editar Fatura'}
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
              {/* Número da Fatura */}
              <div className="space-y-2">
                <label htmlFor="number" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Número da Fatura <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  id="number"
                  name="number"
                  value={formData.number}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
                {formErrors.number && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.number}</p>
                )}
              </div>

              {/* Data de Emissão */}
              <div className="space-y-2">
                <label htmlFor="issueDate" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Data de Emissão <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  type="date"
                  id="issueDate"
                  name="issueDate"
                  value={formatDateForInput(formData.issueDate)}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
                {formErrors.issueDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.issueDate}</p>
                )}
              </div>

              {/* Data de Vencimento */}
              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Data de Vencimento
                </label>
                <Input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formatDateForInput(formData.dueDate)}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <label htmlFor="value" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Valor <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  type="number"
                  id="value"
                  name="value"
                  value={formData.value}
                  onChange={handleFormChange}
                  min="0.01"
                  step="0.01"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
                {formErrors.value && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.value}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Status <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                  required
                >
                  <option value={InvoiceStatus.PENDING}>Pendente</option>
                  <option value={InvoiceStatus.PAID}>Pago</option>
                  <option value={InvoiceStatus.CANCELLED}>Cancelado</option>
                  <option value={InvoiceStatus.OVERDUE}>Vencido</option>
                </select>
              </div>

              {/* Nome do Emissor */}
              <div className="space-y-2">
                <label htmlFor="issuerName" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Nome do Emissor <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  id="issuerName"
                  name="issuerName"
                  value={formData.issuerName}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
                {formErrors.issuerName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.issuerName}</p>
                )}
              </div>

              {/* Documento do Emissor */}
              <div className="space-y-2">
                <label htmlFor="issuerDocument" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Documento do Emissor
                </label>
                <Input
                  type="text"
                  id="issuerDocument"
                  name="issuerDocument"
                  value={formData.issuerDocument || ''}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Email do Emissor */}
              <div className="space-y-2">
                <label htmlFor="issuerEmail" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Email do Emissor
                </label>
                <Input
                  type="email"
                  id="issuerEmail"
                  name="issuerEmail"
                  value={formData.issuerEmail || ''}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Nome do Destinatário */}
              <div className="space-y-2">
                <label htmlFor="recipientName" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Nome do Destinatário <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  id="recipientName"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
                {formErrors.recipientName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.recipientName}</p>
                )}
              </div>

              {/* Documento do Destinatário */}
              <div className="space-y-2">
                <label htmlFor="recipientDocument" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Documento do Destinatário
                </label>
                <Input
                  type="text"
                  id="recipientDocument"
                  name="recipientDocument"
                  value={formData.recipientDocument || ''}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Email do Destinatário */}
              <div className="space-y-2">
                <label htmlFor="recipientEmail" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Email do Destinatário
                </label>
                <Input
                  type="email"
                  id="recipientEmail"
                  name="recipientEmail"
                  value={formData.recipientEmail || ''}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-2">
                <label htmlFor="paymentMethod" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Forma de Pagamento
                </label>
                <Input
                  type="text"
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod || ''}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Data de Pagamento */}
              <div className="space-y-2">
                <label htmlFor="paymentDate" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Data de Pagamento
                </label>
                <Input
                  type="date"
                  id="paymentDate"
                  name="paymentDate"
                  value={formatDateForInput(formData.paymentDate)}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="description" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Descrição <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                  required
                ></textarea>
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.description}</p>
                )}
              </div>

              {/* Observações */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="notes" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Observações
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleFormChange}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                ></textarea>
              </div>

              {/* Arquivo - apenas no modo de criação */}
              {formMode === 'create' && (
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="file" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                    Arquivo da Fatura <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <Input
                    type="file"
                    id="file"
                    onChange={handleFileChange}
                    accept=".pdf,.xml,.jpg,.jpeg,.png"
                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                  />
                  {formErrors.file && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.file}</p>
                  )}
                  {selectedFile && (
                    <p className="mt-1 text-sm text-stone-600 dark:text-gray-400">
                      {selectedFile.name} ({formatBytes(selectedFile.size)})
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
                  {formMode === 'create' ? 'Salvando...' : 'Atualizando...'}
                </div>
              ) : (
                formMode === 'create' ? 'Criar Fatura' : 'Atualizar Fatura'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Renderizar detalhes de uma fatura
  const renderInvoiceDetails = () => {
    if (!currentInvoice) return null;

    // Item de informação reutilizável
    const InfoItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
      <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-stone-200 dark:border-gray-700 last:border-b-0">
        <dt className="text-sm font-medium text-stone-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-stone-900 dark:text-gray-200 sm:col-span-2 sm:mt-0">{value || "-"}</dd>
      </div>
    );

    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg leading-6 font-medium text-stone-900 dark:text-white">
                Detalhes da Fatura
              </CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-gray-400">
                Informações completas sobre a fatura.
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
            <InfoItem label="Número da Fatura" value={currentInvoice.number} />
            <InfoItem label="Data de Emissão" value={formatDate(currentInvoice.issueDate)} />
            <InfoItem label="Data de Vencimento" value={currentInvoice.dueDate ? formatDate(currentInvoice.dueDate) : "-"} />
            <InfoItem label="Valor" value={formatValue(currentInvoice.value)} />
            <InfoItem
              label="Status"
              value={
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${currentInvoice.status === InvoiceStatus.PAID
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : currentInvoice.status === InvoiceStatus.CANCELLED
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : currentInvoice.status === InvoiceStatus.OVERDUE
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                  {formatStatus(currentInvoice.status)}
                </span>
              }
            />
            <InfoItem label="Nome do Emissor" value={currentInvoice.issuerName} />
            <InfoItem label="Documento do Emissor" value={currentInvoice.issuerDocument} />
            <InfoItem label="Email do Emissor" value={currentInvoice.issuerEmail} />
            <InfoItem label="Nome do Destinatário" value={currentInvoice.recipientName} />
            <InfoItem label="Documento do Destinatário" value={currentInvoice.recipientDocument} />
            <InfoItem label="Email do Destinatário" value={currentInvoice.recipientEmail} />
            <InfoItem label="Data de Pagamento" value={currentInvoice.paymentDate ? formatDate(currentInvoice.paymentDate) : "-"} />
            <InfoItem label="Forma de Pagamento" value={currentInvoice.paymentMethod} />

            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-5 border-b border-stone-200 dark:border-gray-700">
              <dt className="text-sm font-medium text-stone-500 dark:text-gray-400">Descrição</dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-gray-200 sm:col-span-2 sm:mt-0">
                <p className="bg-stone-50 dark:bg-gray-700 p-3 rounded">{currentInvoice.description}</p>
              </dd>
            </div>

            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-5 border-b border-stone-200 dark:border-gray-700">
              <dt className="text-sm font-medium text-stone-500 dark:text-gray-400">Observações</dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-gray-200 sm:col-span-2 sm:mt-0">
                <p className="bg-stone-50 dark:bg-gray-700 p-3 rounded">{currentInvoice.notes || "-"}</p>
              </dd>
            </div>

            {/* Anexos */}
            {currentInvoice.attachments && currentInvoice.attachments.length > 0 && (
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-5">
                <dt className="text-sm font-medium text-stone-500 dark:text-gray-400">Anexos</dt>
                <dd className="mt-1 text-sm text-stone-900 dark:text-gray-200 sm:col-span-2 sm:mt-0">
                  <div className="space-y-2">
                    {currentInvoice.attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="bg-stone-50 dark:bg-gray-700 p-3 rounded flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{attachment.originalName}</p>
                          <p className="text-sm text-stone-500 dark:text-gray-400">
                            {formatBytes(attachment.size)} | {attachment.mimetype} | {formatDate(attachment.uploadDate)}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleViewInvoiceAttachmentInNewTab(currentInvoice.id, attachment.id)}
                          variant="outline"
                          size="sm"
                          className="dark:border-gray-600 dark:text-gray-300"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
                      </div>
                    ))}
                  </div>
                </dd>
              </div>
            )}
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
              onClick={() => handleEditInvoice(currentInvoice.id)}
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
        <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Gerenciamento de Faturas</h1>
        <p className="text-stone-500 dark:text-gray-400 mt-1">Cadastre, visualize e gerencie faturas e notas fiscais da empresa</p>
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col items-center mb-4">
            <motion.div
              className="bg-red-100 dark:bg-red-900/30 rounded-full p-3 text-red-500 dark:text-red-400 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
            >
              <TrashIcon className="h-6 w-6" />
            </motion.div>
          </div>

          <p className="text-gray-700 dark:text-gray-300 text-center">
            Tem certeza que deseja excluir a fatura <strong>{currentInvoice?.number}</strong>?
          </p>
          <p className="text-gray-700 dark:text-gray-400 text-center mt-2 text-sm">
            Esta ação não pode ser desfeita.
          </p>
        </motion.div>
      </Modal>
    </motion.div>
  );
}