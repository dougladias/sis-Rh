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
  DocumentTextIcon,
  CheckIcon,
  BanknotesIcon,
  UserIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  PrinterIcon,  
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { 
  getPayslips, 
  getPayslipById,   
  handleUpdatePayslip, 
  handleDeletePayslip,  
  handleCreatePayslip,  
  handleMarkPayslipAsPaid,
  handleCancelPayslip,
  handleProcessPayslip,  
  handleDownloadPayslipPDF,  
} from '@/server/payslip/payslip.actions';
import { getWorkers } from '@/server/worker/worker.actions';
import { getPayrolls } from '@/server/payroll/payroll.actions';
import { Payslip, PayslipFilters, CreatePayslipRequest, UpdatePayslipRequest, PayslipStatus } from '@/types/payslip.type';
import { Worker } from '@/types/worker.type';
import { Payroll, PayrollStatus } from '@/types/payroll.type';
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

const getStatusBadge = (status: PayslipStatus) => {
  const statusConfig = {
    [PayslipStatus.DRAFT]: {
      bg: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      text: "Rascunho"
    },
    [PayslipStatus.PROCESSED]: {
      bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      text: "Processado"
    },
    [PayslipStatus.PAID]: {
      bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      text: "Pago"
    },
    [PayslipStatus.CANCELLED]: {
      bg: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      text: "Cancelado"
    }
  };

  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg}`}>
      {config.text}
    </span>
  );
};

const PayslipPage: React.FC = () => {
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
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [currentPayslip, setCurrentPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'list' | 'form' | 'details'>('list');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filters, setFilters] = useState<PayslipFilters>({
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
  const [formData, setFormData] = useState<CreatePayslipRequest>({
    payrollId: '',
    workerId: '',
    baseSalary: 0,
    totalBenefits: 0,
    totalDeductions: 0,
    status: PayslipStatus.DRAFT
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

  // Função para buscar funcionários
  const fetchWorkers = useCallback(async () => {
    try {
      const workersData = await getWorkers();

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
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        window.location.href = '/auth/login';
        return;
      }
      
      handleError('Erro ao buscar funcionários', err);
    }
  }, [clearError, handleError]);

  // Função para buscar folhas de pagamento
  const fetchPayrolls = useCallback(async () => {
    try {
      const result = await getPayrolls({ limit: 100 }); // Buscar mais folhas
      
      if (result) {
        setPayrolls(result.payrolls);
        clearError();
      }
    } catch (err) {
      handleError('Erro ao buscar folhas de pagamento', err);
    }
  }, [clearError, handleError]);

  // Função para buscar holerites
  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPayslips({ ...filters, details: true });
      
      if (result) {
        setPayslips(result.payslips);
        setPaginationMeta(result.pagination);
        clearError();
      }
    } catch (err) {
      handleError('Erro ao buscar holerites', err);
    } finally {
      setLoading(false);
    }
  }, [filters, clearError, handleError]);

  // Efeitos
  useEffect(() => {
    fetchWorkers();
    fetchPayrolls();
  }, [fetchWorkers, fetchPayrolls]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  // Função para buscar um holerite específico pelo ID
  const fetchPayslipById = async (id: string) => {
    setLoading(true);
    try {
      const payslip = await getPayslipById(id);
      if (payslip) {
        setCurrentPayslip(payslip);
      }
      clearError();
    } catch (err) {
      handleError('Erro ao buscar holerite', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem de holerites baseada na busca
  const filteredPayslips = useMemo(() => {
    if (!searchTerm) return payslips;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return payslips.filter(payslip => 
      payslip.employeeName.toLowerCase().includes(lowerSearchTerm) ||
      payslip.employeeCode.toLowerCase().includes(lowerSearchTerm) ||
      payslip.department.toLowerCase().includes(lowerSearchTerm)
    );
  }, [payslips, searchTerm]);

  // Manipulador para alterações nos campos do formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: name === 'baseSalary' || name === 'totalBenefits' || name === 'totalDeductions' 
        ? parseFloat(value) || 0 
        : value,
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
    
    if (!formData.payrollId) {
      errors.payrollId = 'Selecione uma folha de pagamento';
    }
    
    if (!formData.workerId) {
      errors.workerId = 'Selecione um funcionário';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler para criar novo holerite
  const handleNewPayslip = () => {
    setFormData({
      payrollId: '',
      workerId: '',
      baseSalary: 0,
      totalBenefits: 0,
      totalDeductions: 0,
      status: PayslipStatus.DRAFT
    });
    setFormErrors({});
    setFormMode('create');
    setActiveSection('form');
  };

  // Handler para editar holerite
  const handleEditPayslip = (payslip: Payslip) => {
    setCurrentPayslip(payslip);
    setFormData({
      payrollId: payslip.payrollId,
      workerId: payslip.workerId,
      baseSalary: payslip.baseSalary,
      totalBenefits: payslip.totalBenefits,
      totalDeductions: payslip.totalDeductions,
      status: payslip.status
    });
    setFormErrors({});
    setFormMode('edit');
    setActiveSection('form');
  };

  // Handler para ver detalhes
  const handleViewPayslip = (id: string) => {
    fetchPayslipById(id);
    setActiveSection('details');
  };

  // Função para enviar o formulário
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formMode === 'create') {
      if (!validateForm()) return;
      
      setLoading(true);
      try {
        const result = await handleCreatePayslip(formData);
        
        if (!result.success) {
          setError(result.message || 'Erro ao criar holerite');
          toast.error("Erro", { description: result.message });
        } else {
          setSuccessMessage(result.message || 'Holerite criado com sucesso!');
          toast.success("Sucesso", { description: result.message });
          setActiveSection('list');
          fetchPayslips();
          
          // Limpar formulário
          setFormData({
            payrollId: '',
            workerId: '',
            baseSalary: 0,
            totalBenefits: 0,
            totalDeductions: 0,
            status: PayslipStatus.DRAFT
          });
        }
      } catch (err) {
        handleError('Erro ao criar holerite', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Modo de edição
      if (!currentPayslip) return;
      
      setLoading(true);
      try {
        const updateData: UpdatePayslipRequest = {
          baseSalary: formData.baseSalary,
          totalBenefits: formData.totalBenefits,
          totalDeductions: formData.totalDeductions,
          status: formData.status,
        };
        
        const result = await handleUpdatePayslip(currentPayslip.id, updateData);
        
        if (!result.success) {
          setError(result.message || 'Erro ao atualizar holerite');
          toast.error("Erro", { description: result.message });
        } else {
          setSuccessMessage('Holerite atualizado com sucesso!');
          toast.success("Sucesso", { description: 'Holerite atualizado com sucesso!' });
          setActiveSection('list');
          fetchPayslips();
        }
      } catch (err) {
        handleError('Erro ao atualizar holerite', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handler para confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!currentPayslip) return;
    
    setLoading(true);
    try {
      const result = await handleDeletePayslip(currentPayslip.id);
      
      if (result.error) {
        setError(result.error);
        toast.error("Erro", { description: result.error });
      } else {
        setSuccessMessage('Holerite excluído com sucesso!');
        toast.success("Sucesso", { description: 'Holerite excluído com sucesso!' });
        setIsDeleteModalOpen(false);
        setActiveSection('list');
        fetchPayslips();
      }
    } catch (err) {
      handleError('Erro ao excluir holerite', err);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Handlers para ações de status
  const handleMarkAsPaid = async (id: string) => {
    setLoading(true);
    try {
      const result = await handleMarkPayslipAsPaid(id);
      if (result.success) {
        setSuccessMessage('Holerite marcado como pago!');
        toast.success("Sucesso", { description: 'Holerite marcado como pago!' });
        fetchPayslips();
      } else {
        setError(result.message || 'Erro ao marcar como pago');
        toast.error("Erro", { description: result.message });
      }
    } catch (err) {
      handleError('Erro ao marcar como pago', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: string) => {
    setLoading(true);
    try {
      const result = await handleProcessPayslip(id);
      if (result.success) {
        setSuccessMessage('Holerite processado com sucesso!');
        toast.success("Sucesso", { description: 'Holerite processado!' });
        fetchPayslips();
      } else {
        setError(result.message || 'Erro ao processar');
        toast.error("Erro", { description: result.message });
      }
    } catch (err) {
      handleError('Erro ao processar holerite', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setLoading(true);
    try {
      const result = await handleCancelPayslip(id);
      if (result.success) {
        setSuccessMessage('Holerite cancelado!');
        toast.success("Sucesso", { description: 'Holerite cancelado!' });
        fetchPayslips();
      } else {
        setError(result.message || 'Erro ao cancelar');
        toast.error("Erro", { description: result.message });
      }
    } catch (err) {
      handleError('Erro ao cancelar holerite', err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers para PDF - REMOVENDO handleViewPDF não utilizada
  const handleDownloadPDF = async (payslip: Payslip) => {
    setLoading(true);
    try {
      const result = await handleDownloadPayslipPDF(payslip.id, payslip.employeeName);
      if (result.success && result.data) {
        // Verificar se data tem as propriedades necessárias
        const data = result.data as { downloadUrl: string; fileName: string; blob: Blob };
        
        // Fazer o download no cliente
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpar URL temporária
        URL.revokeObjectURL(data.downloadUrl);
        
        toast.success("Sucesso", { description: result.message });
      } else {
        setError(result.error || 'Erro ao baixar PDF');
        toast.error("Erro", { description: result.error });
      }
    } catch (err) {
      handleError('Erro ao baixar PDF', err);
    } finally {
      setLoading(false);
    }
  };

  // Nova função para visualizar PDF com token (similar à página de documentos)
  const handleViewPDFWithToken = (payslipId: string) => {
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
    const viewUrl = `${baseUrl}/payslips/${payslipId}/pdf?token=${token}`;
    
    // Abrir em nova aba
    window.open(viewUrl, '_blank');
    toast.success("PDF aberto em nova aba");
  };

  // Renderização condicional das seções
  const renderContent = () => {
    if (loading && payslips.length === 0 && activeSection === 'list') {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
        </div>
      );
    }

    switch (activeSection) {
      case 'list':
        return renderPayslipsList();
      case 'form':
        return renderPayslipForm();
      case 'details':
        return renderPayslipDetails();
      default:
        return renderPayslipsList();
    }
  };

  // Renderizar lista de holerites
  const renderPayslipsList = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h2 className="text-xl font-semibold text-stone-800 dark:text-gray-100">Holerites</h2>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Filtros */}
              <div className="flex items-center gap-2">
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({...filters, status: e.target.value as PayslipStatus || undefined, page: 1})}
                  className="block px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-stone-900 dark:text-gray-100"
                >
                  <option value="">Todos os status</option>
                  <option value={PayslipStatus.DRAFT}>Rascunho</option>
                  <option value={PayslipStatus.PROCESSED}>Processado</option>
                  <option value={PayslipStatus.PAID}>Pago</option>
                  <option value={PayslipStatus.CANCELLED}>Cancelado</option>
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
                  placeholder="Buscar funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* New Payslip Button */}
              <motion.button
                className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-4 flex items-center py-2 rounded-lg text-sm gap-2 text-white shadow-sm transition-colors whitespace-nowrap"
                onClick={handleNewPayslip}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Novo Holerite</span>
                <PlusIcon className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredPayslips.length === 0 ? (
            <div className="p-6 text-center text-stone-500 dark:text-gray-400">
              <p>{searchTerm ? "Nenhum holerite encontrado com esse termo de busca." : "Nenhum holerite cadastrado."}</p>
              <Button
                onClick={handleNewPayslip}
                className="mt-4 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
              >
                Criar Primeiro Holerite
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 dark:divide-gray-700">
                <thead className="bg-stone-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Funcionário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Período
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
                    <th className="px-6 py-3 text-center text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-stone-200 dark:divide-gray-700">
                  {filteredPayslips.map((payslip, index) => (
                    <motion.tr 
                      key={payslip.id} 
                      className="hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-stone-900 dark:text-gray-100">
                          {payslip.employeeName}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-gray-400">
                          {payslip.employeeCode} - {payslip.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">
                          {payslip.payroll ? formatMonthYear(payslip.payroll.month, payslip.payroll.year) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-900 dark:text-gray-100">
                          {formatCurrency(payslip.baseSalary)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-stone-900 dark:text-gray-100">
                          {formatCurrency(payslip.netSalary)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payslip.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-2">
                          <motion.button
                            onClick={() => handleViewPayslip(payslip.id)}
                            className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                            title="Ver detalhes"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </motion.button>

                          <motion.button
                            onClick={() => handleViewPDFWithToken(payslip.id)}
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            title="Visualizar PDF"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <DocumentArrowDownIcon className="h-5 w-5" />
                          </motion.button>
                                                    
                          {payslip.status === PayslipStatus.DRAFT && (
                            <motion.button
                              onClick={() => handleProcess(payslip.id)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Processar"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <DocumentTextIcon className="h-5 w-5" />
                            </motion.button>
                          )}

                          {payslip.status === PayslipStatus.PROCESSED && (
                            <motion.button
                              onClick={() => handleMarkAsPaid(payslip.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Marcar como Pago"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <CheckIcon className="h-5 w-5" />
                            </motion.button>
                          )}

                          {(payslip.status === PayslipStatus.PROCESSED || payslip.status === PayslipStatus.PAID) && (
                            <motion.button
                              onClick={() => handleCancel(payslip.id)}
                              className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                              title="Cancelar"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </motion.button>
                          )}

                          <motion.button
                            onClick={() => handleEditPayslip(payslip)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>

                          {payslip.status !== PayslipStatus.PAID && (
                            <motion.button
                              onClick={() => {
                                setCurrentPayslip(payslip);
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
        {filteredPayslips.length > 0 && paginationMeta.totalPages > 1 && (
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

  // Renderizar formulário de holerite
  const renderPayslipForm = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-stone-800 dark:text-white">
              {formMode === 'create' ? 'Novo Holerite' : 'Editar Holerite'}
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
              {/* Folha de Pagamento */}
              <div className="space-y-2">
                <label htmlFor="payrollId" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Folha de Pagamento <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  name="payrollId"
                  id="payrollId"
                  value={formData.payrollId}
                  onChange={handleFormChange}
                  disabled={formMode === 'edit'}
                  className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  required
                >
                  <option value="">Selecione uma folha de pagamento</option>
                  {payrolls
                    .filter(payroll => payroll.status === PayrollStatus.DRAFT || payroll.status === PayrollStatus.PROCESSING)
                    .map((payroll) => (
                    <option key={payroll.id} value={payroll.id}>
                      {formatMonthYear(payroll.month, payroll.year)} - {payroll.description}
                    </option>
                  ))}
                </select>
                {formErrors.payrollId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.payrollId}</p>
                )}
              </div>
              
              {/* Funcionário */}
              <div className="space-y-2">
                <label htmlFor="workerId" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Funcionário <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  name="workerId"
                  id="workerId"
                  value={formData.workerId}
                  onChange={handleFormChange}
                  disabled={formMode === 'edit'}
                  className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  required
                >
                  <option value="">Selecione um funcionário</option>
                  {workers
                    .filter(worker => worker.status === 'ACTIVE')
                    .map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} ({worker.employeeCode}) - {worker.department}
                    </option>
                  ))}
                </select>
                {formErrors.workerId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.workerId}</p>
                )}
              </div>

              {/* Salário Base */}
              <div className="space-y-2">
                <label htmlFor="baseSalary" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Salário Base
                </label>
                <Input
                  type="number"
                  name="baseSalary"
                  id="baseSalary"
                  value={formData.baseSalary}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Benefícios */}
              <div className="space-y-2">
                <label htmlFor="totalBenefits" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Total de Benefícios
                </label>
                <Input
                  type="number"
                  name="totalBenefits"
                  id="totalBenefits"
                  value={formData.totalBenefits}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Deduções */}
              <div className="space-y-2">
                <label htmlFor="totalDeductions" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Total de Deduções
                </label>
                <Input
                  type="number"
                  name="totalDeductions"
                  id="totalDeductions"
                  value={formData.totalDeductions}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                    <option value={PayslipStatus.DRAFT}>Rascunho</option>
                    <option value={PayslipStatus.PROCESSED}>Processado</option>
                    <option value={PayslipStatus.PAID}>Pago</option>
                    <option value={PayslipStatus.CANCELLED}>Cancelado</option>
                  </select>
                </div>
              )}

              {/* Salário Líquido Calculado */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Salário Líquido (Calculado)
                </label>
                <div className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-lg font-semibold text-cyan-600 dark:text-cyan-400">
                  {formatCurrency((formData.baseSalary || 0) + (formData.totalBenefits || 0) - (formData.totalDeductions || 0))}
                </div>
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
                formMode === 'create' ? 'Criar Holerite' : 'Salvar Alterações'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Renderizar detalhes de um holerite
  const renderPayslipDetails = () => {
    if (!currentPayslip) return null;

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
                Detalhes do Holerite
              </CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-gray-400">
                Informações completas sobre o holerite.
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
            {/* Informações do funcionário */}
            <div className="lg:col-span-2">
              <div className="bg-stone-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-stone-800 dark:text-white mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Funcionário
                </h3>
                <dl className="space-y-2">
                  <InfoItem label="Nome" value={currentPayslip.employeeName} />
                  <InfoItem label="Código" value={currentPayslip.employeeCode} />
                  <InfoItem label="Cargo" value={currentPayslip.position} />
                  <InfoItem label="Departamento" value={currentPayslip.department} />
                  {currentPayslip.worker?.cpf && (
                    <InfoItem label="CPF" value={currentPayslip.worker.cpf} />
                  )}
                  {currentPayslip.worker?.email && (
                    <InfoItem label="Email" value={currentPayslip.worker.email} />
                  )}
                </dl>
              </div>

              {/* Período */}
              <div className="bg-stone-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-stone-800 dark:text-white mb-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Período
                </h3>
                <dl className="space-y-2">
                  <InfoItem 
                    label="Período" 
                    value={currentPayslip.payroll ? formatMonthYear(currentPayslip.payroll.month, currentPayslip.payroll.year) : '-'} 
                  />
                  <InfoItem label="Status" value={getStatusBadge(currentPayslip.status)} />
                  <InfoItem label="Data de Criação" value={formatDate(currentPayslip.createdAt)} />
                  <InfoItem label="Última Atualização" value={formatDate(currentPayslip.updatedAt)} />
                  {currentPayslip.paymentDate && (
                    <InfoItem label="Data de Pagamento" value={formatDate(currentPayslip.paymentDate)} />
                  )}
                </dl>
              </div>
            </div>

            {/* Valores */}
            <div className="space-y-4">
              <div className="bg-stone-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-stone-800 dark:text-white mb-4 flex items-center">
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  Valores
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-500 dark:text-gray-400">Salário Base:</span>
                    <span className="text-sm font-medium text-stone-900 dark:text-gray-100">
                      {formatCurrency(currentPayslip.baseSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-500 dark:text-gray-400">Benefícios:</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(currentPayslip.totalBenefits)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-500 dark:text-gray-400">Deduções:</span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      -{formatCurrency(currentPayslip.totalDeductions)}
                    </span>
                  </div>
                  <div className="border-t border-stone-200 dark:border-gray-600 pt-2">
                    <div className="flex justify-between">
                      <span className="text-base font-medium text-stone-900 dark:text-gray-100">Salário Líquido:</span>
                      <span className="text-base font-bold text-cyan-600 dark:text-cyan-400">
                        {formatCurrency(currentPayslip.netSalary)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deduções detalhadas */}
          {currentPayslip.deductions && currentPayslip.deductions.length > 0 && (
            <div className="border-t border-stone-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-stone-800 dark:text-white mb-4">
                Deduções ({currentPayslip.deductions.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-200 dark:divide-gray-700">
                  <thead className="bg-stone-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-stone-200 dark:divide-gray-700">
                    {currentPayslip.deductions.map((deduction) => (
                      <tr key={deduction.id} className="hover:bg-stone-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 dark:text-gray-100">
                          {deduction.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-gray-400">
                          {deduction.type}
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-500 dark:text-gray-400">
                          {deduction.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">
                          -{formatCurrency(deduction.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Benefícios detalhados */}
          {currentPayslip.benefits && currentPayslip.benefits.length > 0 && (
            <div className="border-t border-stone-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-stone-800 dark:text-white mb-4">
                Benefícios ({currentPayslip.benefits.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-200 dark:divide-gray-700">
                  <thead className="bg-stone-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-stone-200 dark:divide-gray-700">
                    {currentPayslip.benefits.map((benefit) => (
                      <tr key={benefit.id} className="hover:bg-stone-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 dark:text-gray-100">
                          {benefit.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-gray-400">
                          {benefit.type}
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-500 dark:text-gray-400">
                          {benefit.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                          +{formatCurrency(benefit.value)}
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
            <Button
              onClick={() => handleViewPDFWithToken(currentPayslip.id)}
              className="bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Visualizar PDF
            </Button>

            <Button
              onClick={() => handleDownloadPDF(currentPayslip)}
              className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>

            {currentPayslip.status === PayslipStatus.DRAFT && (
              <Button
                onClick={() => handleProcess(currentPayslip.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Processar
              </Button>
            )}
            
            {currentPayslip.status === PayslipStatus.PROCESSED && (
              <Button
                onClick={() => handleMarkAsPaid(currentPayslip.id)}
                className="bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Marcar como Pago
              </Button>
            )}

            {currentPayslip.status !== PayslipStatus.PAID && (
              <Button
                onClick={() => setIsDeleteModalOpen(true)}
                variant="destructive"
                className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
              >
                Excluir
              </Button>
            )}
            
            <Button
              onClick={() => handleEditPayslip(currentPayslip)}
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
        <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Gerenciamento de Holerites</h1>
        <p className="text-stone-500 dark:text-gray-400 mt-1">Gerencie os holerites dos funcionários</p>
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
                Tem certeza que deseja excluir o holerite de <br />
                <strong className="font-semibold">
                  {currentPayslip?.employeeName}
                </strong>?
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

export default PayslipPage;