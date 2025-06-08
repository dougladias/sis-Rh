"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import Image from 'next/image';
import {
  EyeIcon,  
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  CameraIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { 
  getVisitors,   
  handleCheckInOut, 
  handleDeleteVisitor,
  handleCreateVisitorWithPhoto
} from '@/server/visitor/visitor.actions';
import { DocumentType } from '@/types/enums.type';
import { Visitor, VisitorStatus, VisitorFilters } from '@/types/visitor.type';
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

// Funções utilitárias
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusText = (status: VisitorStatus) => {
  switch (status) {
    case VisitorStatus.EXPECTED:
      return 'Aguardando';
    case VisitorStatus.CHECKED_IN:
      return 'Em visita';
    case VisitorStatus.CHECKED_OUT:
      return 'Finalizado';
    case VisitorStatus.CANCELLED:
      return 'Cancelado';
    default:
      return status;
  }
};

const getStatusColor = (status: VisitorStatus) => {
  switch (status) {
    case VisitorStatus.EXPECTED:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case VisitorStatus.CHECKED_IN:
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case VisitorStatus.CHECKED_OUT:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case VisitorStatus.CANCELLED:
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const base64toBlob = (base64Data: string, contentType: string = 'image/jpeg') => {
  const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  
  try {
    const byteCharacters = atob(base64String);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    
    return new Blob(byteArrays, { type: contentType });
  } catch (error) {
    console.error('Erro ao converter base64 para blob:', error);
    throw new Error('Erro ao processar imagem');
  }
};

const VisitorsPage: React.FC = () => {
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
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [currentVisitor, setCurrentVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'list' | 'form' | 'details'>('list');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filters, setFilters] = useState<VisitorFilters>({
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
  const [formData, setFormData] = useState({
    name: '',
    documentType: DocumentType.RG,
    documentNumber: '',
    phone: '',
    email: '',
    company: '',
    reason: '',
    hostName: '',
    hostDepartment: '',
    notes: ''
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Refs
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Funções auxiliares com useCallback
  const handleError = useCallback((message: string, err: unknown) => {
    console.error(`${message}:`, err);
    setError(message);
    toast.error("Erro", { description: message });
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Função para buscar visitantes
  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getVisitors(filters);
      if (result) {
        if (result.visitors) {
          setVisitors(result.visitors);
        } else {
          setVisitors([]);
        }
        
        if (result) {
          setPaginationMeta({
            total: result.total || 0,
            page: result.page || 1,
            limit: result.limit || 10,
            pages: result.totalPages || 1
          });
        }
        clearError();
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        window.location.href = '/auth/login';
        return;
      }
      
      handleError('Erro ao buscar visitantes', err);
    } finally {
      setLoading(false);
    }
  }, [filters, clearError, handleError]);

  // Carregar visitantes quando o componente montar ou filtros mudarem
  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // Filtragem de visitantes baseada na busca
  const filteredVisitors = useMemo(() => {
    if (!searchTerm) return visitors;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return visitors.filter(visitor => 
      visitor.name.toLowerCase().includes(lowerSearchTerm) || 
      visitor.documentNumber.includes(searchTerm) || 
      (visitor.company && visitor.company.toLowerCase().includes(lowerSearchTerm)) ||
      visitor.hostName.toLowerCase().includes(lowerSearchTerm)
    );
  }, [visitors, searchTerm]);

  // Manipulador para alterações nos campos do formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'documentType') {
      setFormData({
        ...formData,
        [name]: value as DocumentType,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Manipulador para seleção de arquivo
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileUrl = URL.createObjectURL(file);
      setPhotoPreview(fileUrl);
      setUseWebcam(false);
      
      if (formErrors.photo) {
        setFormErrors({
          ...formErrors,
          photo: ''
        });
      }
    }
  };

  // Validação do formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (!formData.documentNumber.trim()) {
      errors.documentNumber = 'Número do documento é obrigatório';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Telefone é obrigatório';
    }
    
    if (!formData.reason.trim()) {
      errors.reason = 'Motivo da visita é obrigatório';
    }
    
    if (!formData.hostName.trim()) {
      errors.hostName = 'Anfitrião é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler para criar um novo visitante
  const handleNewVisitor = () => {
    setFormData({
      name: '',
      documentType: DocumentType.RG,
      documentNumber: '',
      phone: '',
      email: '',
      company: '',
      reason: '',
      hostName: '',
      hostDepartment: '',
      notes: ''
    });
    setPhotoPreview(null);
    setUseWebcam(false);
    setFormErrors({});
    setFormMode('create');
    setActiveSection('form');
  };

  // Handler para ver detalhes de um visitante
  const handleViewVisitor = (visitor: Visitor) => {
    setCurrentVisitor(visitor);
    setActiveSection('details');
  };

  // Captura foto da webcam
  const handleCapturePhoto = () => {
    setUseWebcam(!useWebcam);
  };

  // Tira uma foto da webcam
  const captureWebcamPhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setPhotoPreview(imageSrc);
        setUseWebcam(false);
      }
    }
  };

  // Função para enviar o formulário
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const formDataObj = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          formDataObj.append(key, value.toString());
        }
      });
      
      formDataObj.append('status', VisitorStatus.EXPECTED);
      
      if (photoPreview) {
        let photoFile: File;
        
        if (photoPreview.startsWith('data:')) {
          const blob = base64toBlob(photoPreview, 'image/jpeg');
          const originalName = `foto_${formData.name.replace(/\s+/g, '_').toLowerCase()}.jpg`;
          photoFile = new File([blob], originalName, { type: 'image/jpeg' });
        } else {
          const fileInput = fileInputRef.current;
          if (fileInput?.files?.[0]) {
            photoFile = fileInput.files[0];
          } else {
            const response = await fetch(photoPreview);
            const blob = await response.blob();
            const originalName = `foto_${formData.name.replace(/\s+/g, '_').toLowerCase()}.jpg`;
            photoFile = new File([blob], originalName, { type: blob.type || 'image/jpeg' });
          }
        }
        
        formDataObj.append('photo', photoFile);
      }
      
      const result = await handleCreateVisitorWithPhoto(formDataObj);
      
      if (!result.success) {
        setError(result.message || 'Erro ao cadastrar visitante');
        toast.error("Erro", { description: result.message || 'Erro ao cadastrar visitante' });
      } else {
        setSuccessMessage('Visitante cadastrado com sucesso!');
        toast.success("Sucesso", { description: 'Visitante cadastrado com sucesso!' });
        setActiveSection('list');
        fetchVisitors();
        
        setFormData({
          name: '',
          documentType: DocumentType.RG,
          documentNumber: '',
          phone: '',
          email: '',
          company: '',
          reason: '',
          hostName: '',
          hostDepartment: '',
          notes: ''
        });
        setPhotoPreview(null);
        setUseWebcam(false);
      }
    } catch (err) {
      handleError('Erro ao enviar visitante', err);
    } finally {
      setLoading(false);
    }
  };

  // Registra entrada de visitante
  const handleCheckIn = async (id: string) => {
    setLoading(true);
    try {
      const result = await handleCheckInOut(id, 'checkin', {});
      
      if (!result.success) {
        setError(result.message || 'Erro ao registrar entrada');
        toast.error("Erro", { description: result.message || 'Erro ao registrar entrada' });
      } else {
        setSuccessMessage('Entrada registrada com sucesso!');
        toast.success("Sucesso", { description: 'Entrada registrada com sucesso!' });
        fetchVisitors();
      }
    } catch (err) {
      handleError('Erro ao registrar entrada', err);
    } finally {
      setLoading(false);
    }
  };

  // Registra saída de visitante
  const handleCheckOut = async (id: string) => {
    setLoading(true);
    try {
      const result = await handleCheckInOut(id, 'checkout', {});
      
      if (!result.success) {
        setError(result.message || 'Erro ao registrar saída');
        toast.error("Erro", { description: result.message || 'Erro ao registrar saída' });
      } else {
        setSuccessMessage('Saída registrada com sucesso!');
        toast.success("Sucesso", { description: 'Saída registrada com sucesso!' });
        fetchVisitors();
      }
    } catch (err) {
      handleError('Erro ao registrar saída', err);
    } finally {
      setLoading(false);
    }
  };

  // Handler para confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!currentVisitor) return;
    
    setLoading(true);
    try {
      const result = await handleDeleteVisitor(currentVisitor.id);
      
      if (result.error) {
        setError(result.error);
        toast.error("Erro", { description: result.error });
      } else {
        setSuccessMessage('Visitante excluído com sucesso!');
        toast.success("Sucesso", { description: 'Visitante excluído com sucesso!' });
        setIsDeleteModalOpen(false);
        setActiveSection('list');
        fetchVisitors();
      }
    } catch (err) {
      handleError('Erro ao excluir visitante', err);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Renderizar lista de visitantes
  const renderVisitorsList = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h2 className="text-xl font-semibold text-stone-800 dark:text-gray-100">Lista de Visitantes</h2>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-stone-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-stone-900 dark:text-gray-100 placeholder-stone-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors"
                  placeholder="Buscar visitante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <motion.button
                className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-4 flex items-center py-2 rounded-lg text-[14px] gap-2 text-white shadow-sm transition-colors whitespace-nowrap"
                onClick={handleNewVisitor}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Novo Visitante</span>
                <PlusIcon className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredVisitors.length === 0 ? (
            <div className="p-6 text-center text-stone-500 dark:text-gray-400">
              <p>{searchTerm ? "Nenhum visitante encontrado com esse termo de busca." : "Nenhum visitante cadastrado."}</p>
              <Button
                onClick={handleNewVisitor}
                className="mt-4 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
              >
                Adicionar Visitante
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 dark:divide-gray-700">
                <thead className="bg-stone-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Foto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Documento
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                      Anfitrião
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
                  {filteredVisitors.map((visitor: Visitor, index) => (
                    <motion.tr 
                      key={visitor.id} 
                      className="hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {visitor.photo ? (
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                            <Image
                              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/visitors/${visitor.id}/photo`}
                              alt={`Foto de ${visitor.name}`}
                              className="h-full w-full object-cover"
                              width={40}
                              height={40}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <UserCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-stone-900 dark:text-gray-100">{visitor.name}</div>
                        {visitor.company && (
                          <div className="text-xs text-stone-500 dark:text-gray-400">{visitor.company}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{visitor.documentNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-500 dark:text-gray-400">{visitor.hostName}</div>
                        {visitor.hostDepartment && (
                          <div className="text-xs text-stone-500 dark:text-gray-400">{visitor.hostDepartment}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(visitor.status)}`}>
                          {getStatusText(visitor.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-3">
                          <motion.button
                            onClick={() => handleViewVisitor(visitor)}
                            className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                            title="Ver detalhes"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </motion.button>
                          
                          {visitor.status === VisitorStatus.EXPECTED && (
                            <motion.button
                              onClick={() => handleCheckIn(visitor.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Registrar Entrada"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ArrowRightOnRectangleIcon className="h-5 w-5" />
                            </motion.button>
                          )}
                          
                          {visitor.status === VisitorStatus.CHECKED_IN && (
                            <motion.button
                              onClick={() => handleCheckOut(visitor.id)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Registrar Saída"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                            </motion.button>
                          )}
                          
                          <motion.button
                            onClick={() => {
                              setCurrentVisitor(visitor);
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
        {filteredVisitors.length > 0 && paginationMeta.pages > 1 && (
          <CardFooter className="border-t border-stone-200 dark:border-gray-700">
            <div className="w-full flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setFilters({...filters, page: (filters.page || 1) > 1 ? (filters.page || 1) - 1 : 1})}
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

  // Renderizar formulário de visitante
  const renderVisitorForm = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-stone-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-stone-800 dark:text-white">
              {formMode === 'create' ? 'Novo Visitante' : 'Editar Visitante'}
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
              {/* Nome */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Nome <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                )}
              </div>
              
              {/* Tipo de Documento */}
              <div className="space-y-2">
                <label htmlFor="documentType" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Tipo de Documento <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Select 
                  value={formData.documentType.toString()} 
                  onValueChange={(value) => setFormData({...formData, documentType: value as DocumentType})}
                >
                  <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                    <SelectValue placeholder="Selecione o tipo de documento" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
                    <SelectItem value={DocumentType.RG}>RG</SelectItem>
                    <SelectItem value={DocumentType.CPF}>CPF</SelectItem>
                    <SelectItem value={DocumentType.CNH}>CNH</SelectItem>
                    <SelectItem value={DocumentType.PASSPORT}>Passaporte</SelectItem>
                    <SelectItem value={DocumentType.OTHER}>Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Número do Documento */}
              <div className="space-y-2">
                <label htmlFor="documentNumber" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Número do Documento <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  name="documentNumber"
                  id="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleFormChange}
                  required
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {formErrors.documentNumber && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.documentNumber}</p>
                )}
              </div>
              
              {/* Telefone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Telefone <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  required
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.phone}</p>
                )}
              </div>
              
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {/* Empresa */}
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Empresa
                </label>
                <Input
                  type="text"
                  name="company"
                  id="company"
                  value={formData.company}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {/* Motivo da Visita */}
              <div className="space-y-2">
                <label htmlFor="reason" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Motivo da Visita <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  name="reason"
                  id="reason"
                  value={formData.reason}
                  onChange={handleFormChange}
                  required
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {formErrors.reason && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.reason}</p>
                )}
              </div>
              
              {/* Anfitrião */}
              <div className="space-y-2">
                <label htmlFor="hostName" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Anfitrião <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  name="hostName"
                  id="hostName"
                  value={formData.hostName}
                  onChange={handleFormChange}
                  required
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {formErrors.hostName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.hostName}</p>
                )}
              </div>
              
              {/* Departamento do Anfitrião */}
              <div className="space-y-2">
                <label htmlFor="hostDepartment" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Departamento do Anfitrião
                </label>
                <Input
                  type="text"
                  name="hostDepartment"
                  id="hostDepartment"
                  value={formData.hostDepartment}
                  onChange={handleFormChange}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Observações */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="notes" className="text-sm font-medium text-stone-700 dark:text-gray-300 block">
                  Observações
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                />
              </div>
            </div>
            
            {/* Foto do visitante */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2">
                Foto do Visitante
              </label>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                      setUseWebcam(false);
                    }}
                    className="bg-stone-200 hover:bg-stone-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                  >
                    Selecionar Arquivo
                  </Button>
                  
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCapturePhoto}
                    className="bg-cyan-100 hover:bg-cyan-200 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 dark:hover:bg-cyan-800/40"
                  >
                    <CameraIcon className="h-4 w-4 mr-2" />
                    {useWebcam ? 'Fechar Webcam' : 'Usar Webcam'}
                  </Button>
                  
                  {useWebcam && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={captureWebcamPhoto}
                      className="bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-800/40"
                    >
                      Tirar Foto
                    </Button>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                </div>
                
                <div className="flex-grow">
                  {useWebcam ? (
                    <div className="rounded-lg overflow-hidden border dark:border-gray-700">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width={320}
                        height={240}
                        videoConstraints={{
                          width: 320,
                          height: 240,
                          facingMode: "user"
                        }}
                      />
                    </div>
                  ) : photoPreview ? (
                    <div className="relative rounded-lg overflow-hidden border dark:border-gray-700"> 
                      <Image
                        src={photoPreview}
                        alt="Foto do visitante"
                        className="h-60 w-auto"
                        width={240}
                        height={240}
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => setPhotoPreview(null)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="h-60 w-full border-2 border-dashed border-stone-300 dark:border-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-stone-500 dark:text-gray-400">Nenhuma foto selecionada</span>
                    </div>
                  )}
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
                  {formMode === 'create' ? 'Cadastrando...' : 'Salvando...'}
                </div>
              ) : (
                formMode === 'create' ? 'Cadastrar Visitante' : 'Salvar Alterações'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Renderizar detalhes de um visitante
  const renderVisitorDetails = () => {
    if (!currentVisitor) return null;

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
                Informações do Visitante
              </CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-gray-400">
                Detalhes completos sobre o visitante.
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
            <InfoItem label="Nome" value={currentVisitor.name} />
            <InfoItem label="Tipo de Documento" value={currentVisitor.documentType} />
            <InfoItem label="Número do Documento" value={currentVisitor.documentNumber} />
            <InfoItem label="Telefone" value={currentVisitor.phone} />
            <InfoItem label="Email" value={currentVisitor.email || "-"} />
            <InfoItem label="Empresa" value={currentVisitor.company || "-"} />
            <InfoItem label="Motivo da Visita" value={currentVisitor.reason} />
            <InfoItem label="Anfitrião" value={currentVisitor.hostName} />
            <InfoItem label="Departamento" value={currentVisitor.hostDepartment || "-"} />
            <InfoItem label="Status" value={
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(currentVisitor.status)}`}>
                {getStatusText(currentVisitor.status)}
              </span>
            } />
            <InfoItem label="Entrada Agendada" value={formatDate(currentVisitor.scheduledEntry)} />
            <InfoItem label="Saída Agendada" value={formatDate(currentVisitor.scheduledExit)} />
            <InfoItem label="Entrada Real" value={formatDate(currentVisitor.actualEntry)} />
            <InfoItem label="Saída Real" value={formatDate(currentVisitor.actualExit)} />
            <InfoItem label="Observações" value={currentVisitor.notes || "-"} />
            
            {/* Foto do visitante */}
            {currentVisitor.photo && (
              <InfoItem label="Foto" value={
                <div className="h-32 w-32 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/visitors/${currentVisitor.id}/photo`}
                    alt={`Foto de ${currentVisitor.name}`}
                    className="h-full w-full object-cover"
                    width={128}
                    height={128}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    unoptimized
                  />
                </div>
              } />
            )}
          </dl>
        </CardContent>

        <CardFooter className="bg-stone-50 dark:bg-gray-900 border-t border-stone-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3 w-full">
            {currentVisitor.status === VisitorStatus.EXPECTED && (
              <Button
                onClick={() => handleCheckIn(currentVisitor.id)}
                className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Check-in
              </Button>
            )}
            
            {currentVisitor.status === VisitorStatus.CHECKED_IN && (
              <Button
                onClick={() => handleCheckOut(currentVisitor.id)}
                className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-2" />
                Check-out
              </Button>
            )}
            
            <Button
              onClick={() => {
                setCurrentVisitor(currentVisitor);
                setIsDeleteModalOpen(true);
              }}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
            >
              Excluir
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Renderização condicional das seções
  const renderContent = () => {
    if (loading && visitors.length === 0 && activeSection === 'list') {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
        </div>
      );
    }

    switch (activeSection) {
      case 'list':
        return renderVisitorsList();
      case 'form':
        return renderVisitorForm();
      case 'details':
        return renderVisitorDetails();
      default:
        return renderVisitorsList();
    }
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
        <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Controle de Visitantes</h1>
        <p className="text-stone-500 dark:text-gray-400 mt-1">Cadastre, visualize e gerencie todos os visitantes da empresa</p>
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
                Tem certeza que deseja excluir o visitante <br />
                <strong className="font-semibold">{currentVisitor?.name}</strong>?
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

export default VisitorsPage;