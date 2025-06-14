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
  PlayIcon,
  UserIcon,
  CalendarIcon,  
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { 
  getPayrolls, 
  getPayrollById,   
  handleUpdatePayroll, 
  handleDeletePayroll,  
  handleCreatePayroll,  
  handleProcessPayroll,
} from '@/server/payroll/payroll.actions';
import { Payroll, PayrollFilters, CreatePayrollRequest, UpdatePayrollRequest, ProcessPayrollRequest, PayrollStatus } from '@/types/payroll.type';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Componente de Alerta personalizado
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
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
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

const formatMonthYear = (month: number, year: number): string => {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[month - 1]} ${year}`;
};

const getStatusBadge = (status: PayrollStatus) => {
  const statusConfig = {
    [PayrollStatus.DRAFT]: {
      bg: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      text: "Rascunho"
    },
    [PayrollStatus.PROCESSING]: {
      bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      text: "Processando"
    },
    [PayrollStatus.COMPLETED]: {
      bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      text: "Concluída"
    },
    [PayrollStatus.CANCELLED]: {
      bg: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      text: "Cancelada"
    }
  };

  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg}`}>
      {config.text}
    </span>
  );
};

const PayrollPage: React.FC = () => {
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
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [currentPayroll, setCurrentPayroll] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'list' | 'form' | 'details'>('list');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [filters, setFilters] = useState<PayrollFilters>({
    page: 1,
    limit: 10,
  });
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  
  // Estado do formulário
  const [formData, setFormData] = useState<CreatePayrollRequest>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    description: '',
    status: PayrollStatus.DRAFT
  });
  const [processData, setProcessData] = useState<ProcessPayrollRequest>({
    processedBy: ''
  });
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
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

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

  // Função para buscar folhas de pagamento
  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPayrolls(filters);
      
      if (result) {
        setPayrolls(result.payrolls);
        setPaginationMeta(result.pagination);
        clearError();
      }
    } catch (err) {
      handleError('Erro ao buscar folhas de pagamento', err);
    } finally {
      setLoading(false);
    }
  }, [filters, clearError, handleError]);

  // Efeitos
  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  // Função para buscar uma folha específica pelo ID
  const fetchPayrollById = async (id: string) => {
    setLoading(true);
    try {
      const payroll = await getPayrollById(id);
      if (payroll) {
        setCurrentPayroll(payroll);
      }
      clearError();
    } catch (err) {
      handleError('Erro ao buscar folha de pagamento', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem de folhas baseada na busca
  const filteredPayrolls = useMemo(() => {
    if (!searchTerm) return payrolls;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return payrolls.filter(payroll => 
      formatMonthYear(payroll.month, payroll.year).toLowerCase().includes(lowerSearchTerm) ||
      (payroll.description && payroll.description.toLowerCase().includes(lowerSearchTerm))
    );
  }, [payrolls, searchTerm]);

  // Manipulador para alterações nos campos do formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: name === 'month' || name === 'year' ? parseInt(value) || 0 : value,
    });

    // Limpar erro específico
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Validação do formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.month || formData.month < 1 || formData.month > 12) {
      errors.month = 'Selecione um mês válido';
    }
    
    if (!formData.year || formData.year < 2000 || formData.year > 2100) {
      errors.year = 'Digite um ano válido';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler para criar nova folha
  const handleNewPayroll = () => {
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      description: '',
      status: PayrollStatus.DRAFT
    });
    setFormErrors({});
    setFormMode('create');
    setActiveSection('form');
  };

  // Handler para editar folha
  const handleEditPayroll = (payroll: Payroll) => {
    setCurrentPayroll(payroll);
    setFormData({
      month: payroll.month,
      year: payroll.year,
      description: payroll.description || '',
      status: payroll.status
    });
    setFormErrors({});
    setFormMode('edit');
    setActiveSection('form');
  };

  // Handler para ver detalhes
  const handleViewPayroll = (id: string) => {
    fetchPayrollById(id);
    setActiveSection('details');
  };

  // Handler para processar folha
  const handleProcessClick = (payroll: Payroll) => {
    setCurrentPayroll(payroll);
    setProcessData({ processedBy: '' });
    setIsProcessModalOpen(true);
  };

  // Função para enviar o formulário
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formMode === 'create') {
      if (!validateForm()) return;
      
      setLoading(true);
      try {
        const result = await handleCreatePayroll(formData);
        
        if (!result.success) {
          setError(result.message || 'Erro ao criar folha de pagamento');
          toast.error("Erro", { description: result.message });
        } else {
          setSuccessMessage(result.message || 'Folha de pagamento criada com sucesso!');
          toast.success("Sucesso", { description: result.message });
          setActiveSection('list');
          fetchPayrolls();
          
          // Limpar formulário
          setFormData({
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            description: '',
            status: PayrollStatus.DRAFT
          });
        }
      } catch (err) {
        handleError('Erro ao criar folha de pagamento', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Modo de edição
      if (!currentPayroll) return;
      
      setLoading(true);
      try {
        const updateData: UpdatePayrollRequest = {
          description: formData.description,
          status: formData.status,
        };
        
        const result = await handleUpdatePayroll(currentPayroll.id, updateData);
        
        if (!result.success) {
          setError(result.message || 'Erro ao atualizar folha');
          toast.error("Erro", { description: result.message });
        } else {
          setSuccessMessage('Folha de pagamento atualizada com sucesso!');
          toast.success("Sucesso", { description: 'Folha atualizada com sucesso!' });
          setActiveSection('list');
          fetchPayrolls();
        }
      } catch (err) {
        handleError('Erro ao atualizar folha de pagamento', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handler para confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!currentPayroll) return;
    
    setLoading(true);
    try {
      const result = await handleDeletePayroll(currentPayroll.id);
      
      if (result.error) {
        setError(result.error);
        toast.error("Erro", { description: result.error });
      } else {
        setSuccessMessage('Folha de pagamento excluída com sucesso!');
        toast.success("Sucesso", { description: 'Folha excluída com sucesso!' });
        setIsDeleteModalOpen(false);
        setActiveSection('list');
        fetchPayrolls();
      }
    } catch (err) {
      handleError('Erro ao excluir folha de pagamento', err);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Handler para confirmar processamento
  const handleProcessConfirm = async () => {
    if (!currentPayroll || !processData.processedBy.trim()) {
      toast.error("Erro", { description: "Informe quem está processando a folha" });
      return;
    }
    
    setLoading(true);
    try {
      const result = await handleProcessPayroll(currentPayroll.id, processData);
      
      if (!result.success) {
        setError(result.message || 'Erro ao processar folha');
        toast.error("Erro", { description: result.message });
      } else {
        setSuccessMessage(`Folha processada com sucesso! ${result.payslipsCreated || 0} holerites criados.`);
        toast.success("Sucesso", { description: result.message });
        setIsProcessModalOpen(false);
        setActiveSection('list');
        fetchPayrolls();
      }
    } catch (err) {
      handleError('Erro ao processar folha de pagamento', err);
    } finally {
      setLoading(false);
      setIsProcessModalOpen(false);
    }
  };

  // Renderização condicional das seções
  const renderContent = () => {
    if (loading && payrolls.length === 0 && activeSection === 'list') {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
        </div>
      );
    }

    switch (activeSection) {
      case 'list':
        return renderPayrollsList();
      case 'form':
        return renderPayrollForm();
      case 'details':
        return renderPayrollDetails();
      default:
        return renderPayrollsList();
    }
  };

  // Renderizar lista de folhas
  const renderPayrollsList = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h2 className="text-xl font-semibold text-stone-800 dark:text-gray-100">Folhas de Pagamento</h2>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Filtros de ano */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={filters.year || ''}
                  onChange={(e) => setFilters({...filters, year: parseInt(e.target.value) || undefined, page: 1})}
                  placeholder="Ano"
                  min="2020"
                  max="2030"
                  className="block w-20 px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-stone-900 dark:text-gray-100"
                />
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({...filters, status: e.target.value as PayrollStatus || undefined, page: 1})}
                  className="block px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-stone-900 dark:text-gray-100"
                >
                  <option value="">Todos os status</option>
                  <option value={PayrollStatus.DRAFT}>Rascunho</option>
                  <option value={PayrollStatus.PROCESSING}>Processando</option>
                  <option value={PayrollStatus.COMPLETED}>Concluída</option>
                  <option value={PayrollStatus.CANCELLED}>Cancelada</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-stone-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-stone-900 dark:text-gray-100 placeholder-stone-500 dark:placeholder-gray-400"
                  placeholder="Buscar folha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* New Payroll Button */}
              <motion.button
                className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-4 flex items-center py-2 rounded-lg text-sm gap-2 text-white shadow-sm transition-colors whitespace-nowrap"
                onClick={handleNewPayroll}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Nova Folha</span>
                <PlusIcon className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredPayrolls.length === 0 ? (
            <div className="p-6 text-center text-stone-500 dark:text-gray-400">
              <p>{searchTerm ? "Nenhuma folha encontrada com esse termo de busca." : "Nenhuma folha de pagamento cadastrada."}</p>
              <Button
                onClick={handleNewPayroll}
                className="mt-4 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
              >
                Criar Primeira Folha
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 dark:divide-gray-700">
                <thead className="bg-stone-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Funcionários
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Processado em
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-stone-200 dark:divide-gray-700">
                  {filteredPayrolls.map((payroll, index) => (
                    <motion.tr 
                      key={payroll.id} 
                      className="hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-stone-900 dark:text-gray-100">
                          {formatMonthYear(payroll.month, payroll.year)}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-gray-400">{payroll.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">
                          {payroll.employeeCount} funcionários
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-900 dark:text-gray-100">
                          {formatCurrency(payroll.totalNetSalary)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payroll.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">
                          {payroll.processedAt ? formatDate(payroll.processedAt) : '-'}
                        </div>
                        <div className="text-xs text-stone-400 dark:text-gray-500">
                          {payroll.processedBy || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-2">
                          <motion.button
                            onClick={() => handleViewPayroll(payroll.id)}
                            className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                            title="Ver detalhes"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </motion.button>

                          {payroll.status === PayrollStatus.DRAFT && (
                            <motion.button
                              onClick={() => handleProcessClick(payroll)}
                              className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                              title="Processar"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <PlayIcon className="h-5 w-5" />
                            </motion.button>
                          )}

                          <motion.button
                            onClick={() => handleEditPayroll(payroll)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>

                          {payroll.status !== PayrollStatus.COMPLETED && (
                            <motion.button
                              onClick={() => {
                                setCurrentPayroll(payroll);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Excluir"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </motion.button>
                          )}
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
        {filteredPayrolls.length > 0 && paginationMeta.totalPages > 1 && (
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
                  disabled={!filters.page || filters.page >= paginationMeta.totalPages}
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
                    {Array.from({ length: Math.min(5, paginationMeta.totalPages) }, (_, i) => {
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
                      disabled={!filters.page || filters.page >= paginationMeta.totalPages}
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

  // Renderizar formulário de folha
  const renderPayrollForm = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-stone-800 dark:text-white">
              {formMode === 'create' ? 'Nova Folha de Pagamento' : 'Editar Folha de Pagamento'}
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
              {/* Mês */}
              <div className="space-y-2">
                <label htmlFor="month" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Mês <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  name="month"
                  id="month"
                  value={formData.month}
                  onChange={handleFormChange}
                  disabled={formMode === 'edit'}
                  className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleDateString('pt-BR', { month: 'long' })}
                    </option>
                  ))}
                </select>
                {formErrors.month && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.month}</p>
                )}
              </div>
              
              {/* Ano */}
              <div className="space-y-2">
                <label htmlFor="year" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Ano <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  type="number"
                  name="year"
                  id="year"
                  value={formData.year}
                  onChange={handleFormChange}
                  disabled={formMode === 'edit'}
                  min="2020"
                  max="2030"
                  required
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
                {formErrors.year && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.year}</p>
                )}
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
                  placeholder="Descrição opcional da folha de pagamento..."
                />
              </div>

              {/* Status - apenas no modo edição */}
              {formMode === 'edit' && (
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                  >
                    <option value={PayrollStatus.DRAFT}>Rascunho</option>
                    <option value={PayrollStatus.PROCESSING}>Processando</option>
                    <option value={PayrollStatus.COMPLETED}>Concluída</option>
                    <option value={PayrollStatus.CANCELLED}>Cancelada</option>
                  </select>
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
                  {formMode === 'create' ? 'Criando...' : 'Salvando...'}
                </div>
              ) : (
                formMode === 'create' ? 'Criar Folha' : 'Salvar Alterações'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Renderizar detalhes de uma folha
  const renderPayrollDetails = () => {
    if (!currentPayroll) return null;

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
                Detalhes da Folha de Pagamento
              </CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-gray-400">
                Informações completas sobre a folha de pagamento.
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Informações gerais */}
            <div className="lg:col-span-2">
              <div className="bg-stone-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-stone-800 dark:text-white mb-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Informações Gerais
                </h3>
                <dl className="space-y-2">
                  <InfoItem label="Período" value={formatMonthYear(currentPayroll.month, currentPayroll.year)} />
                  <InfoItem label="Descrição" value={currentPayroll.description || "-"} />
                  <InfoItem label="Status" value={getStatusBadge(currentPayroll.status)} />
                  <InfoItem label="Data de Criação" value={formatDate(currentPayroll.createdAt)} />
                  <InfoItem label="Última Atualização" value={formatDate(currentPayroll.updatedAt)} />
                  {currentPayroll.processedAt && (
                    <InfoItem label="Processado em" value={formatDate(currentPayroll.processedAt)} />
                  )}
                  {currentPayroll.processedBy && (
                    <InfoItem label="Processado por" value={currentPayroll.processedBy} />
                  )}
                </dl>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="space-y-4">
              <div className="bg-stone-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-stone-800 dark:text-white mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Funcionários
                </h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                    {currentPayroll.employeeCount}
                  </div>
                  <div className="text-sm text-stone-500 dark:text-gray-400">
                    Total de funcionários
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-stone-800 dark:text-white mb-4 flex items-center">
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  Valores
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-500 dark:text-gray-400">Salário Bruto:</span>
                    <span className="text-sm font-medium text-stone-900 dark:text-gray-100">
                      {formatCurrency(currentPayroll.totalGrossSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-500 dark:text-gray-400">Benefícios:</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(currentPayroll.totalBenefits)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-500 dark:text-gray-400">Deduções:</span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      -{formatCurrency(currentPayroll.totalDeductions)}
                    </span>
                  </div>
                  <div className="border-t border-stone-200 dark:border-gray-600 pt-2">
                    <div className="flex justify-between">
                      <span className="text-base font-medium text-stone-900 dark:text-gray-100">Salário Líquido:</span>
                      <span className="text-base font-bold text-cyan-600 dark:text-cyan-400">
                        {formatCurrency(currentPayroll.totalNetSalary)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de holerites (se disponível) */}
          {currentPayroll.payslips && currentPayroll.payslips.length > 0 && (
            <div className="border-t border-stone-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-stone-800 dark:text-white mb-4">
                Holerites ({currentPayroll.payslips.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-200 dark:divide-gray-700">
                  <thead className="bg-stone-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                        Funcionário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                        Departamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                        Salário Base
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                        Salário Líquido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-stone-200 dark:divide-gray-700">
                    {currentPayroll.payslips.map((payslip) => (
                      <tr key={payslip.id} className="hover:bg-stone-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-stone-900 dark:text-gray-100">
                            {payslip.employeeName}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-gray-400">
                            {payslip.employeeCode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-gray-400">
                          {payslip.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 dark:text-gray-100">
                          {formatCurrency(payslip.baseSalary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900 dark:text-gray-100">
                          {formatCurrency(payslip.netSalary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payslip.status as unknown as PayrollStatus)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-stone-50 dark:bg-gray-900 border-t border-stone-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3 w-full">
            {currentPayroll.status === PayrollStatus.DRAFT && (
              <Button
                onClick={() => handleProcessClick(currentPayroll)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Processar
              </Button>
            )}
            
            {currentPayroll.status !== PayrollStatus.COMPLETED && (
              <Button
                onClick={() => setIsDeleteModalOpen(true)}
                variant="destructive"
                className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
              >
                Excluir
              </Button>
            )}
            
            <Button
              onClick={() => handleEditPayroll(currentPayroll)}
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
        <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Folha de Pagamento</h1>
        <p className="text-stone-500 dark:text-gray-400 mt-1">Gerencie a folha de pagamento dos funcionários</p>
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
                Tem certeza que deseja excluir a folha de pagamento <br />
                <strong className="font-semibold">
                  {currentPayroll && formatMonthYear(currentPayroll.month, currentPayroll.year)}
                </strong>?
              </p>
              <p className="text-stone-600 dark:text-gray-400 text-sm mt-4">
                Esta ação não pode ser desfeita.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </Modal>

      {/* Modal de processamento */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="Processar Folha de Pagamento"
        size="md"
        closeOnOutsideClick={true}
        footer={
          <div className="flex justify-end space-x-3 w-full">
            <Button
              variant="secondary"
              onClick={() => setIsProcessModalOpen(false)}
              disabled={loading}
              className="bg-stone-200 hover:bg-stone-300 text-stone-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
            >
              Cancelar
            </Button>

            <Button
              onClick={handleProcessConfirm}
              disabled={loading || !processData.processedBy.trim()}
              className="bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Processando...
                </div>
              ) : (
                'Processar Folha'
              )}
            </Button>
          </div>
        }
      >
        <Card className="border-0 shadow-none">
          <CardContent className="p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col items-center mb-6">
                <motion.div
                  className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-4 text-yellow-500 dark:text-yellow-400 mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                >
                  <PlayIcon className="h-8 w-8" />
                </motion.div>
              </div>

              <div className="text-center mb-6">
                <p className="text-stone-700 dark:text-gray-300 text-lg mb-2">
                  Processar folha de pagamento para <br />
                  <strong className="font-semibold">
                    {currentPayroll && formatMonthYear(currentPayroll.month, currentPayroll.year)}
                  </strong>?
                </p>
                <p className="text-stone-600 dark:text-gray-400 text-sm">
                  Isso irá gerar os holerites para todos os funcionários ativos.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="processedBy" className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2">
                    Processado por <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    id="processedBy"
                    value={processData.processedBy}
                    onChange={(e) => setProcessData({ processedBy: e.target.value })}
                    placeholder="Nome do responsável pelo processamento"
                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </Modal>
    </motion.div>
  );
};

export default PayrollPage;