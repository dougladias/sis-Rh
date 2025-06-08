"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  EyeIcon, PencilIcon, TrashIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import {
  getWorkers,
  getWorkerById,
  handleCreateWorker,
  handleUpdateWorker,
  handleDeleteWorker
} from '@/server/worker/worker.actions';
import { Worker, CreateWorkerData, UpdateWorkerData } from '@/types/worker.type';
import { ContractType, WorkerStatus } from '@/types/enums.type';

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

export default function WorkersPage() {
  // Estados
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeSection, setActiveSection] = useState<'list' | 'form' | 'details'>('list');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado do formulário e erros - usando tipagem específica em vez de "any"
  const [formData, setFormData] = useState<Partial<CreateWorkerData & { id?: string }>>({
    name: '',
    cpf: '',
    birthDate: '',
    admissionDate: '',
    salary: 0,
    allowance: 0,
    phone: '',
    email: '',
    address: '',
    contractType: ContractType.CLT,
    position: '',
    department: '',
    status: WorkerStatus.ACTIVE
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  // Buscar funcionários na montagem do componente
  useEffect(() => {
    fetchWorkers();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

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

  // Filtragem de funcionários baseada na busca
  const filteredWorkers = useMemo(() => {
    if (!searchTerm) return workers;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return workers.filter(worker =>
      worker.name.toLowerCase().includes(lowerSearchTerm) ||
      worker.cpf.includes(lowerSearchTerm) ||
      worker.position.toLowerCase().includes(lowerSearchTerm) ||
      worker.department.toLowerCase().includes(lowerSearchTerm)
    );
  }, [workers, searchTerm]);

  // Helper function to format date for input fields
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

  // Funções de manipulação
  const fetchWorkers = async () => {
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

      setError('Erro ao buscar funcionários');
      console.error('Erro ao buscar funcionários:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerById = async (id: string) => {
    setLoading(true);
    try {
      const worker = await getWorkerById(id);
      setCurrentWorker(worker);
      clearError();
    } catch (err) {
      setError('Erro ao buscar funcionário');
      console.error('Erro ao buscar funcionário:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewWorker = () => {
    setFormData({
      name: '',
      employeeCode: new Date().getTime().toString().slice(-8),
      cpf: '',
      birthDate: '',
      admissionDate: new Date().toISOString().split('T')[0],
      salary: 0,
      allowance: 0,
      phone: '',
      email: '',
      address: '',
      contractType: ContractType.CLT,
      position: '',
      department: '',
      status: WorkerStatus.ACTIVE
    });
    setFormErrors({});
    setFormMode('create');
    setActiveSection('form');
  };

  const handleEditWorker = async (id: string) => {
    setLoading(true);
    try {
      const worker = await getWorkerById(id);
      if (worker) {
        // Converter datas para o formato de string do formulário
        setFormData({
          id: worker.id,
          employeeCode: worker.employeeCode,
          name: worker.name,
          cpf: worker.cpf,
          rg: worker.rg,
          // Conversão explícita para string
          birthDate: typeof worker.birthDate === 'string'
            ? worker.birthDate
            : worker.birthDate instanceof Date
              ? worker.birthDate.toISOString().split('T')[0]
              : '',
          admissionDate: typeof worker.admissionDate === 'string'
            ? worker.admissionDate
            : worker.admissionDate instanceof Date
              ? worker.admissionDate.toISOString().split('T')[0]
              : '',
          terminationDate: typeof worker.terminationDate === 'string'
            ? worker.terminationDate
            : worker.terminationDate instanceof Date
              ? worker.terminationDate.toISOString().split('T')[0]
              : '',
          // Resto do código permanece igual
          salary: worker.salary,
          allowance: worker.allowance ?? 0,
          phone: worker.phone,
          email: worker.email,
          address: worker.address,
          city: worker.city,
          state: worker.state,
          zipCode: worker.zipCode,
          contractType: worker.contractType,
          position: worker.position,
          department: worker.department,
          status: worker.status
        });
        setFormMode('edit');
        setActiveSection('form');
      }
    } catch (err) {
      setError('Erro ao carregar dados do funcionário');
      console.error('Erro ao carregar dados do funcionário:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewWorker = async (id: string) => {
    setLoading(true);
    try {
      const worker = await getWorkerById(id);
      setCurrentWorker(worker);
      setActiveSection('details');
    } catch (err) {
      setError('Erro ao carregar detalhes do funcionário');
      console.error('Erro ao carregar detalhes do funcionário:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number | boolean = value;

    // Converter valores conforme o tipo do campo
    if (name === 'salary' || name === 'allowance') {
      processedValue = value ? parseFloat(value) : 0;
    }

    setFormData({
      ...formData,
      [name]: processedValue
    });

    // Limpar erro específico quando o campo é alterado
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (!formData.employeeCode?.trim()) {
      errors.employeeCode = 'Código do funcionário é obrigatório';
    }

    if (!formData.cpf?.trim()) {
      errors.cpf = 'CPF é obrigatório';
    } else if (!/^\d{11}$/.test(formData.cpf)) {
      errors.cpf = 'CPF inválido';
    }

    if (!formData.email?.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.phone?.trim()) {
      errors.phone = 'Telefone é obrigatório';
    }

    if (!formData.position?.trim()) {
      errors.position = 'Cargo é obrigatório';
    }

    if (!formData.department?.trim()) {
      errors.department = 'Departamento é obrigatório';
    }

    if (!formData.salary || formData.salary <= 0) {
      errors.salary = 'Salário deve ser maior que zero';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (formMode === 'create') {
        // Converter para o formato correto para criação
        const createData: CreateWorkerData = {
          employeeCode: formData.employeeCode || new Date().getTime().toString().slice(-8),
          name: formData.name || '',
          cpf: formData.cpf || '',
          rg: formData.rg || null,
          birthDate: formData.birthDate || new Date().toISOString(),
          admissionDate: formData.admissionDate || new Date().toISOString(),
          terminationDate: formData.terminationDate || null,
          salary: formData.salary || 0,
          allowance: formData.allowance || null,
          phone: formData.phone || '',
          email: formData.email || '',
          address: formData.address || '',
          city: formData.city || null,
          state: formData.state || null,
          zipCode: formData.zipCode || null,
          contractType: formData.contractType as ContractType || ContractType.CLT,
          position: formData.position || '',
          department: formData.department || '',
          status: formData.status as WorkerStatus || WorkerStatus.ACTIVE
        };

        const result = await handleCreateWorker(createData);

        if (result.error) {
          setError(result.error);
        } else {
          setSuccessMessage('Funcionário criado com sucesso!');
          setActiveSection('list');
          fetchWorkers();
        }
      } else {
        // Converter para o formato correto para atualização
        const updateData: UpdateWorkerData = {
          id: formData.id || '',
          employeeCode: formData.employeeCode,
          name: formData.name,
          cpf: formData.cpf,
          rg: formData.rg,
          birthDate: formData.birthDate,
          admissionDate: formData.admissionDate,
          terminationDate: formData.terminationDate,
          salary: formData.salary,
          allowance: formData.allowance,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          contractType: formData.contractType as ContractType,
          position: formData.position,
          department: formData.department,
          status: formData.status as WorkerStatus
        };

        const result = await handleUpdateWorker(updateData);

        if (result.error) {
          setError(result.error);
        } else {
          setSuccessMessage('Funcionário atualizado com sucesso!');
          setActiveSection('list');
          fetchWorkers();
        }
      }
    } catch (err) {
      setError('Erro ao salvar funcionário');
      console.error('Erro ao salvar funcionário:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentWorker?.id) return;

    setLoading(true);
    try {
      const result = await handleDeleteWorker(currentWorker.id);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMessage('Funcionário excluído com sucesso!');
        setIsDeleteModalOpen(false);
        setActiveSection('list');
        fetchWorkers();
      }
    } catch (err) {
      setError('Erro ao excluir funcionário');
      console.error('Erro ao excluir funcionário:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  // Funções de formatação
  const formatCPF = (cpf: string) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo';
      case 'INACTIVE':
        return 'Inativo';
      case 'TERMINATED':
        return 'Desligado';
      case 'ON_VACATION':
        return 'Em férias';
      default:
        return status;
    }
  };

  // Renderização condicional das seções
  const renderContent = () => {
    if (loading && workers.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
        </div>
      );
    }

    switch (activeSection) {
      case 'list':
        return renderWorkersList();
      case 'form':
        return renderWorkerForm();
      case 'details':
        return renderWorkerDetails();
      default:
        return renderWorkersList();
    }
  };

  // Seção: Lista de Funcionários
  const renderWorkersList = () => {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b dark:border-gray-700 gap-3">
          <h2 className="text-xl font-semibold text-stone-800 dark:text-gray-100">Lista de Funcionários</h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-grow sm:flex-grow-0">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-stone-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-stone-900 dark:text-gray-100 placeholder-stone-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors"
                placeholder="Buscar funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* New Worker Button */}
            <motion.button
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-4 flex items-center py-2 rounded-lg text-[14px] gap-2 text-white shadow-sm transition-colors whitespace-nowrap"
              onClick={handleNewWorker}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Novo Funcionário</span>
              <PlusIcon className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {workers.length === 0 ? (
          <div className="p-6 text-center text-stone-500 dark:text-gray-400">
            <p>Nenhum funcionário cadastrado.</p>
            <Button
              onClick={handleNewWorker}
              className="mt-4 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
            >
              Adicionar Funcionário
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
                    CPF
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                    Departamento
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
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-stone-500 dark:text-gray-400">
                      {searchTerm
                        ? "Nenhum funcionário encontrado com esse termo de busca."
                        : "Nenhum funcionário cadastrado."}
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker: Worker) => (
                    <tr key={worker.id} className="hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-stone-900 dark:text-gray-100">{worker.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{formatCPF(worker.cpf)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{worker.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{worker.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${worker.status === WorkerStatus.ACTIVE
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : worker.status === WorkerStatus.INACTIVE
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : worker.status === WorkerStatus.TERMINATED
                                ? 'bg-stone-100 text-stone-800 dark:bg-gray-700 dark:text-gray-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                          {formatStatus(worker.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-3">
                          <motion.button
                            onClick={() => handleViewWorker(worker.id)}
                            className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                            title="Ver detalhes"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleEditWorker(worker.id)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              fetchWorkerById(worker.id);
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Seção: Formulário de Funcionário
  const renderWorkerForm = () => {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-stone-800 dark:text-white">
            {formMode === 'create' ? 'Novo Funcionário' : 'Editar Funcionário'}
          </h2>
          <motion.button
            onClick={() => setActiveSection('list')}
            className="text-stone-400 hover:text-stone-500 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <XMarkIcon className="h-6 w-6" />
          </motion.button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Componente reutilizável para inputs de texto */}
            {FormField("employeeCode", "Código do Funcionário", formData.employeeCode || '', true, formErrors.employeeCode)}
            {FormField("name", "Nome Completo", formData.name || '', true, formErrors.name)}
            {FormField("cpf", "CPF", formData.cpf || '', true, formErrors.cpf, "Apenas números", 11)}
            {FormField("rg", "RG", formData.rg || '', false)}

            {/* Data de Nascimento */}
            <div className="space-y-2">
              <label htmlFor="birthDate" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                Data de Nascimento <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="date"
                name="birthDate"
                id="birthDate"
                value={formatDateForInput(formData.birthDate)}
                onChange={handleFormChange}
                className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                required
              />
            </div>
            
            {/* Data de Admissão */}
            <div className="space-y-2">
              <label htmlFor="admissionDate" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                Data de Admissão <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="date"
                name="admissionDate"
                id="admissionDate"
                value={formatDateForInput(formData.admissionDate)}
                onChange={handleFormChange}
                className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                required
              />
            </div>

            {/* Data de Desligamento (se aplicável) */}
            <div className="space-y-2">
              <label htmlFor="terminationDate" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                Data de Desligamento
              </label>
              <input
                type="date"
                name="terminationDate"
                id="terminationDate"
                value={formatDateForInput(formData.terminationDate)}
                onChange={handleFormChange}
                className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
              />
            </div>

            {/* Salário */}
            <div className="space-y-2">
              <label htmlFor="salary" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                Salário <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="number"
                name="salary"
                id="salary"
                value={formData.salary || ''}
                onChange={handleFormChange}
                className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                required
                step="0.01"
                min="0"
              />
              {formErrors.salary && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.salary}</p>
              )}
            </div>

            {/* Ajuda de Custo */}
            <div className="space-y-2">
              <label htmlFor="allowance" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                Ajuda de Custo
              </label>
              <input
                type="number"
                name="allowance"
                id="allowance"
                value={formData.allowance || ''}
                onChange={handleFormChange}
                className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                step="0.01"
                min="0"
              />
            </div>

            {FormField("phone", "Telefone", formData.phone || '', true, formErrors.phone)}
            {FormField("email", "Email", formData.email || '', true, formErrors.email)}

            {/* Endereço (col-span-2) */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="address" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                Endereço <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="address"
                id="address"
                value={formData.address || ''}
                onChange={handleFormChange}
                className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                required
              />
            </div>

            {FormField("city", "Cidade", formData.city || '')}
            {FormField("state", "Estado", formData.state || '')}
            {FormField("zipCode", "CEP", formData.zipCode || '')}

            {/* Tipo de Contrato */}
            <div className="space-y-2">
              <label htmlFor="contractType" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                Tipo de Contrato <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                name="contractType"
                id="contractType"
                value={formData.contractType || ContractType.CLT}
                onChange={handleFormChange}
                className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                required
              >
                <option value={ContractType.CLT}>CLT</option>
                <option value={ContractType.PJ}>PJ</option>
              </select>
            </div>

            {FormField("position", "Cargo", formData.position || '', true, formErrors.position)}
            {FormField("department", "Departamento", formData.department || '', true, formErrors.department)}

            {/* Status */}
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                Status
              </label>
              <select
                name="status"
                id="status"
                value={formData.status || WorkerStatus.ACTIVE}
                onChange={handleFormChange}
                className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
              >
                <option value={WorkerStatus.ACTIVE}>Ativo</option>
                <option value={WorkerStatus.INACTIVE}>Inativo</option>
                <option value={WorkerStatus.TERMINATED}>Desligado</option>
                <option value={WorkerStatus.ON_VACATION}>Em férias</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={() => setActiveSection('list')}
              className="bg-stone-200 hover:bg-stone-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  {formMode === 'create' ? 'Criando...' : 'Salvando...'}
                </div>
              ) : (
                formMode === 'create' ? 'Criar Funcionário' : 'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  };

  // Modifique a função FormField para usar as cores da sidebar
  const FormField = (
    name: string,
    label: string,
    value: string | number,
    required = false,
    error?: string,
    placeholder?: string,
    maxLength?: number
  ) => {
    return (
      <div className="space-y-2">
        <label htmlFor={name} className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
          {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
        </label>
        <input
          type="text"
          name={name}
          id={name}
          value={value}
          onChange={handleFormChange}
          className={`w-full px-3 py-2 rounded-md border ${error
            ? 'border-red-300 dark:border-red-500'
            : 'border-stone-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400`}
          required={required}
          placeholder={placeholder}
          maxLength={maxLength}
        />
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  };

  // Seção: Detalhes do Funcionário
  const renderWorkerDetails = () => {
    if (!currentWorker) return null;

    // Item de informação reutilizável
    const InfoItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
      <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-stone-200 dark:border-gray-700 last:border-b-0">
        <dt className="text-sm font-medium text-stone-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-stone-900 dark:text-gray-200 sm:col-span-2 sm:mt-0">{value}</dd>
      </div>
    );

    return (
      <div className="bg-white shadow overflow-hidden rounded-lg dark:bg-gray-800">
        <div className="flex justify-between items-center px-4 py-5 sm:px-6 border-b border-stone-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg leading-6 font-medium text-stone-900 dark:text-white">
              Informações do Funcionário
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-gray-400">
              Detalhes pessoais e informações de contato.
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

        <div className="border-t border-stone-200 dark:border-gray-700 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-stone-200 sm:dark:divide-gray-700">
            <InfoItem label="Código do Funcionário" value={currentWorker.employeeCode} />
            <InfoItem label="Nome completo" value={currentWorker.name} />
            <InfoItem label="CPF" value={formatCPF(currentWorker.cpf)} />
            {currentWorker.rg && <InfoItem label="RG" value={currentWorker.rg} />}
            <InfoItem label="Data de nascimento" value={formatDate(currentWorker.birthDate)} />
            <InfoItem label="Data de admissão" value={formatDate(currentWorker.admissionDate)} />
            {currentWorker.terminationDate && (
              <InfoItem label="Data de desligamento" value={formatDate(currentWorker.terminationDate)} />
            )}
            <InfoItem label="Salário" value={`R$ ${Number(currentWorker.salary).toFixed(2)}`} />
            {currentWorker.allowance && (
              <InfoItem label="Ajuda de custo" value={`R$ ${Number(currentWorker.allowance).toFixed(2)}`} />
            )}
            <InfoItem label="Telefone" value={currentWorker.phone} />
            <InfoItem label="Email" value={currentWorker.email} />
            <InfoItem label="Endereço" value={currentWorker.address} />
            {currentWorker.city && <InfoItem label="Cidade" value={currentWorker.city} />}
            {currentWorker.state && <InfoItem label="Estado" value={currentWorker.state} />}
            {currentWorker.zipCode && <InfoItem label="CEP" value={currentWorker.zipCode} />}
            <InfoItem label="Cargo" value={currentWorker.position} />
            <InfoItem label="Departamento" value={currentWorker.department} />
            <InfoItem label="Contrato" value={currentWorker.contractType} />
            <InfoItem
              label="Status"
              value={
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${currentWorker.status === WorkerStatus.ACTIVE
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : currentWorker.status === WorkerStatus.INACTIVE
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : currentWorker.status === WorkerStatus.TERMINATED
                        ? 'bg-stone-100 text-stone-800 dark:bg-gray-700 dark:text-gray-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                  {formatStatus(currentWorker.status)}
                </span>
              }
            />
          </dl>
        </div>

        <div className="px-4 py-5 sm:px-6 bg-stone-50 dark:bg-gray-900 border-t border-stone-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
              variant="destructive"
            >
              Excluir
            </Button>
            <Button
              onClick={() => handleEditWorker(currentWorker.id)}
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
            >
              Editar
            </Button>
          </div>
        </div>
      </div>
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
        <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Gerenciamento de Funcionários</h1>
        <p className="text-stone-500 dark:text-gray-400 mt-1">Cadastre, visualize e gerencie todos os funcionários da empresa</p>
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

      {/* Main content with shadow and rounded corners */}
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
            Tem certeza que deseja excluir o funcionário <br />
            <strong className="font-semibold">{currentWorker?.name}</strong>?
          </p>
          <p className="text-stone-600 dark:text-gray-400 text-sm mt-4">
            Esta ação não pode ser desfeita.
          </p>
        </motion.div>
      </Modal>
    </motion.div>
  );
}
