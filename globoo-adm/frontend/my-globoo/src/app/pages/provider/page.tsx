"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import Image from 'next/image';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { 
  getProviders,   
  handleCheckInOut, 
  handleDeleteProvider,
  handleCreateProvider
} from '@/server/provider/provider.actions';
import { DocumentType } from '@/types/enums.type';
import { Provider, ProviderStatus, CreateProviderRequest } from '@/types/provider.type';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Componente de Alerta personalizado
type AlertProps = {
  type: "success" | "error" | "warning" | "info";
  message: string;
  onClose: () => void;
};

const Alert = ({ type, message, onClose }: AlertProps) => {
  const bgColor = {
    success: "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600",
    error: "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600",
    warning: "bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600",
    info: "bg-cyan-100 border-cyan-500 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-600"
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${bgColor[type]} flex justify-between items-center`}>
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

// Componente principal da página de prestadores
const ProvidersPage: React.FC = () => {
  // Estados
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProviders, setShowProviders] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
  });
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });

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

  // Formulário de prestador
  const [providerForm, setProviderForm] = useState({
    name: '',
    documentType: DocumentType.RG,
    documentNumber: '',
    phone: '',
    email: '',
    company: '',
    serviceType: '',
    reason: '',
    hostName: '',
    hostDepartment: '',
    contractNumber: '',
    notes: ''
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Funções auxiliares
  const clearError = () => setError('');

  // Buscar prestadores
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProviders(filters);
      if (result) {
        // Verifica se providers existe antes de atualizar o estado
        if (result.providers) {
          setProviders(result.providers);
        } else {
          setProviders([]);
        }
        
        // Atualiza a paginação
        if (result) {
          setPaginationMeta({
            total: result.total || 0,
            page: result.page || 1,
            limit: result.limit || 10,
            pages: result.totalPages || 1
          });
        }
      }
    } catch (err) {
      console.error('Erro ao buscar prestadores:', err);
      setError('Falha ao carregar a lista de prestadores.');
      toast.error("Erro", { description: "Falha ao carregar prestadores." });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Carregar prestadores quando o componente montar ou filtros mudarem
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Filtrar prestadores com base no termo de busca
  const filteredProviders = React.useMemo(() => {
    if (!searchTerm.trim()) return providers;
    
    const searchLower = searchTerm.toLowerCase();
    return providers.filter(provider => 
      provider.name?.toLowerCase().includes(searchLower) || 
      provider.documentNumber?.includes(searchTerm) || 
      provider.company?.toLowerCase().includes(searchLower) || 
      provider.serviceType?.toLowerCase().includes(searchLower) ||
      provider.hostName?.toLowerCase().includes(searchLower)
    );
  }, [providers, searchTerm]);

  // Manipula mudanças no formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProviderForm(prev => ({ ...prev, [name]: value }));
  };

  // Manipula a seleção de foto
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Cria uma URL para preview
      const fileUrl = URL.createObjectURL(file);
      setPhotoPreview(fileUrl);
      
      // Desativa a webcam se estiver ativa
      setUseWebcam(false);
    }
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
      }
    }
  };

  // Converter base64 para Blob
  const base64toBlob = (base64Data: string, contentType: string) => {
    contentType = contentType || '';
    const sliceSize = 1024;
    const byteCharacters = atob(base64Data.split(',')[1]);
    const bytesLength = byteCharacters.length;
    const slicesCount = Math.ceil(bytesLength / sliceSize);
    const byteArrays = new Array(slicesCount);

    for (let sliceIndex = 0; sliceIndex < slicesCount; sliceIndex++) {
      const begin = sliceIndex * sliceSize;
      const end = Math.min(begin + sliceSize, bytesLength);

      const bytes = new Array(end - begin);
      for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
        bytes[i] = byteCharacters[offset].charCodeAt(0);
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  // Enviar o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // Preparar dados do prestador
      const createData: CreateProviderRequest = {
        name: providerForm.name,
        documentType: providerForm.documentType,
        documentNumber: providerForm.documentNumber,
        phone: providerForm.phone,
        email: providerForm.email || undefined,
        company: providerForm.company || undefined,
        serviceType: providerForm.serviceType || undefined,
        reason: providerForm.reason,
        hostName: providerForm.hostName,
        hostDepartment: providerForm.hostDepartment || undefined,
        contractNumber: providerForm.contractNumber || undefined,
        notes: providerForm.notes || undefined,
        status: ProviderStatus.EXPECTED
      };
      
      const result = await handleCreateProvider(createData);
      
      if (result.success) {
        setSuccessMessage('Prestador cadastrado com sucesso!');
        toast.success("Sucesso", { description: 'Prestador cadastrado com sucesso!' });
        
        // Se houver foto, fazer upload separadamente
        if (photoPreview && result.provider?.id) {
          const formData = new FormData();
          
          // Determinar o tipo MIME
          let mimetype = 'image/jpeg';
          if (photoPreview.startsWith('data:image/png')) {
            mimetype = 'image/png';
          }
          
          // Criar nome de arquivo
          const originalName = `foto_${providerForm.name.replace(/\s+/g, '_').toLowerCase()}.jpg`;
          
          // Converte para blob para obter o tamanho
          const blob = base64toBlob(photoPreview, mimetype);
          
          // Criar arquivo a partir do blob
          const photoFile = new File([blob], originalName, { type: mimetype });
          formData.append('photo', photoFile);
          
          // Aqui você adicionaria a chamada para upload da foto
          // await handleUploadProviderPhoto(result.provider.id, formData);
        }
        
        resetForm();
        setShowProviders(true);
        fetchProviders();
      } else {
        setError(result.message || 'Erro ao cadastrar prestador');
        toast.error("Erro", { description: result.message || 'Erro ao cadastrar prestador' });
      }
    } catch (err) {
      console.error('Erro ao cadastrar prestador:', err);
      setError('Falha ao cadastrar prestador.');
      toast.error("Erro", { description: "Falha ao cadastrar prestador." });
    } finally {
      setLoading(false);
    }
  };

  // Reseta o formulário
  const resetForm = () => {
    setProviderForm({
      name: '',
      documentType: DocumentType.RG,
      documentNumber: '',
      phone: '',
      email: '',
      company: '',
      serviceType: '',
      reason: '',
      hostName: '',
      hostDepartment: '',
      contractNumber: '',
      notes: ''
    });
    setPhotoPreview(null);
    setUseWebcam(false);
  };

  // Registra entrada de prestador
  const handleCheckIn = async (id: string) => {
    setLoading(true);
    try {
      const result = await handleCheckInOut(id, 'checkin', {});
      
      if (result.success) {
        setSuccessMessage('Entrada registrada com sucesso!');
        toast.success("Sucesso", { description: 'Entrada registrada com sucesso!' });
        fetchProviders();
      } else {
        setError(result.message || 'Erro ao registrar entrada');
        toast.error("Erro", { description: result.message || 'Erro ao registrar entrada' });
      }
    } catch (err) {
      console.error('Erro ao registrar entrada:', err);
      setError('Falha ao registrar entrada.');
      toast.error("Erro", { description: "Falha ao registrar entrada." });
    } finally {
      setLoading(false);
    }
  };

  // Registra saída de prestador
  const handleCheckOut = async (id: string) => {
    setLoading(true);
    try {
      const result = await handleCheckInOut(id, 'checkout', {});
      
      if (result.success) {
        setSuccessMessage('Saída registrada com sucesso!');
        toast.success("Sucesso", { description: 'Saída registrada com sucesso!' });
        fetchProviders();
      } else {
        setError(result.message || 'Erro ao registrar saída');
        toast.error("Erro", { description: result.message || 'Erro ao registrar saída' });
      }
    } catch (err) {
      console.error('Erro ao registrar saída:', err);
      setError('Falha ao registrar saída.');
      toast.error("Erro", { description: "Falha ao registrar saída." });
    } finally {
      setLoading(false);
    }
  };

  // Prepara para excluir um prestador
  const handleDeleteClick = (id: string) => {
    setProviderToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Exclui um prestador
  const handleDeleteConfirm = async () => {
    if (!providerToDelete) return;
    
    setLoading(true);
    try {
      const result = await handleDeleteProvider(providerToDelete);
      
      if (result.error) {
        setError(result.error);
        toast.error("Erro", { description: result.error });
      } else {
        setSuccessMessage('Prestador excluído com sucesso!');
        toast.success("Sucesso", { description: 'Prestador excluído com sucesso!' });
        fetchProviders();
      }
    } catch (err) {
      console.error('Erro ao excluir prestador:', err);
      setError('Falha ao excluir prestador.');
      toast.error("Erro", { description: "Falha ao excluir prestador." });
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setProviderToDelete(null);
    }
  };

  // Retorna o texto do status para exibição
  const getStatusText = (status: ProviderStatus) => {
    switch (status) {
      case ProviderStatus.EXPECTED:
        return 'Aguardando';
      case ProviderStatus.CHECKED_IN:
        return 'Em serviço';
      case ProviderStatus.CHECKED_OUT:
        return 'Finalizado';
      case ProviderStatus.CANCELLED:
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Retorna a cor do status
  const getStatusColor = (status: ProviderStatus) => {
    switch (status) {
      case ProviderStatus.EXPECTED:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case ProviderStatus.CHECKED_IN:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case ProviderStatus.CHECKED_OUT:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case ProviderStatus.CANCELLED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Toggle entre formulário e lista
  const handleToggleForm = () => {
    setShowProviders(!showProviders);
    if (showProviders) {
      resetForm();
    }
  };

  // Renderizar lista de prestadores
  const renderProvidersList = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Lista de Prestadores
            </CardTitle>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-grow sm:flex-grow-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors"
                  placeholder="Buscar prestador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* New Provider Button */}
              <motion.button 
                className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-4 py-2 flex items-center rounded-lg text-[14px] gap-2 text-white shadow-sm transition-colors whitespace-nowrap"
                onClick={handleToggleForm}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Novo Prestador</span>
                <PlusIcon className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredProviders.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <p>{searchTerm ? "Nenhum prestador encontrado com esse termo de busca." : "Nenhum prestador cadastrado."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Foto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Empresa/Serviço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Responsável
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProviders.map((provider: Provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {provider.photo ? (
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                            <Image
                              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/providers/${provider.id}/photo`}
                              alt={`Foto de ${provider.name}`}
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
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{provider.name}</div>
                        {provider.company && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{provider.company}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{provider.documentNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {provider.company && <div>{provider.company}</div>}
                          {provider.serviceType && <div className="text-xs">{provider.serviceType}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{provider.hostName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(provider.status)}`}>
                          {getStatusText(provider.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-3">
                          {provider.status === ProviderStatus.EXPECTED && provider.id && (
                            <motion.button
                              onClick={() => handleCheckIn(provider.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Registrar Entrada"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ArrowRightOnRectangleIcon className="h-5 w-5" />
                            </motion.button>
                          )}
                          
                          {provider.status === ProviderStatus.CHECKED_IN && provider.id && (
                            <motion.button
                              onClick={() => handleCheckOut(provider.id)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Registrar Saída"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                            </motion.button>
                          )}
                          
                          {provider.id && (
                            <motion.button
                              onClick={() => handleDeleteClick(provider.id)}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Paginação */}
        {filteredProviders.length > 0 && paginationMeta.pages > 1 && (
          <CardFooter className="border-t border-gray-200 dark:border-gray-700">
            <div className="w-full flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setFilters({...filters, page: filters.page > 1 ? filters.page - 1 : 1})}
                  disabled={filters.page <= 1}
                  variant="outline"
                  className="dark:border-gray-600 dark:text-gray-300"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => setFilters({...filters, page: filters.page + 1})}
                  disabled={filters.page >= paginationMeta.pages}
                  variant="outline"
                  className="dark:border-gray-600 dark:text-gray-300"
                >
                  Próxima
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> a{" "}
                    <span className="font-medium">
                      {Math.min(filters.page * filters.limit, paginationMeta.total)}
                    </span>{" "}
                    de <span className="font-medium">{paginationMeta.total}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginação">
                    <Button
                      onClick={() => setFilters({...filters, page: filters.page > 1 ? filters.page - 1 : 1})}
                      disabled={filters.page <= 1}
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
                          variant={pageNum === filters.page ? "default" : "outline"}
                          className={`relative inline-flex items-center px-4 py-2 ${
                            pageNum === filters.page 
                              ? "bg-cyan-500 dark:bg-cyan-600 text-white" 
                              : "dark:border-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button
                      onClick={() => setFilters({...filters, page: filters.page + 1})}
                      disabled={filters.page >= paginationMeta.pages}
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

  // Renderiza o formulário de cadastro de prestadores
  const renderProviderForm = () => {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white">
              Cadastrar Novo Prestador
            </CardTitle>
            <motion.button
              onClick={handleToggleForm}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <XMarkIcon className="h-6 w-6" />
            </motion.button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={providerForm.name}
                    onChange={handleFormChange}
                    required
                    className="mt-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo de Documento <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <Select 
                    value={providerForm.documentType.toString()} 
                    onValueChange={(value) => setProviderForm({...providerForm, documentType: value as DocumentType})}
                  >
                    <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                      <SelectValue placeholder="Selecione o tipo de documento" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700">
                      <SelectItem value={DocumentType.RG}>RG</SelectItem>
                      <SelectItem value={DocumentType.CPF}>CPF</SelectItem>
                      <SelectItem value={DocumentType.CNH}>CNH</SelectItem>
                      <SelectItem value={DocumentType.PASSPORT}>Passaporte</SelectItem>
                      <SelectItem value={DocumentType.OTHER}>Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Número do Documento <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    name="documentNumber"
                    value={providerForm.documentNumber}
                    onChange={handleFormChange}
                    required
                    className="mt-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Telefone <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={providerForm.phone}
                    onChange={handleFormChange}
                    required
                    className="mt-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={providerForm.email}
                    onChange={handleFormChange}
                    className="mt-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Empresa
                  </label>
                  <Input
                    type="text"
                    name="company"
                    value={providerForm.company}
                    onChange={handleFormChange}
                    className="mt-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo de Serviço
                  </label>
                  <Input
                    type="text"
                    name="serviceType"
                    value={providerForm.serviceType}
                    onChange={handleFormChange}
                    placeholder="Ex: Manutenção, Limpeza, Segurança..."
                    className="mt-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Motivo da Visita <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    name="reason"
                    value={providerForm.reason}
                    onChange={handleFormChange}
                    required
                    placeholder="Ex: Manutenção de equipamentos, Entrega de materiais..."
                    className="mt-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Responsável <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    name="hostName"
                    value={providerForm.hostName}
                    onChange={handleFormChange}
                    required
                    className="mt-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Departamento
                  </label>
                  <Input
                    type="text"
                    name="hostDepartment"
                    value={providerForm.hostDepartment}
                    onChange={handleFormChange}
                    className="mt-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Número do Contrato
                  </label>
                  <Input
                    type="text"
                    name="contractNumber"
                    value={providerForm.contractNumber}
                    onChange={handleFormChange}
                    className="mt-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Observações
                  </label>
                  <textarea
                    name="notes"
                    value={providerForm.notes}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder="Informações adicionais, equipamentos necessários, horários específicos..."
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Foto do prestador */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Foto do Prestador
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
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                  >
                    Selecionar Arquivo
                  </Button>
                  
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCapturePhoto}
                    className="bg-cyan-100 hover:bg-cyan-200 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 dark:hover:bg-cyan-800/40"
                  >
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
                        alt="Foto do prestador"
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
                    <div className="h-60 w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">Nenhuma foto selecionada</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={handleToggleForm}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
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
                  Cadastrando...
                </div>
              ) : 'Cadastrar Prestador'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

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

  return (
    <motion.div 
      className="p-6 min-h-screen bg-stone-50 dark:bg-gray-950"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Controle de Prestadores</h1>
        <p className="text-stone-500 dark:text-gray-400 mt-1">Cadastre, visualize e gerencie todos os prestadores de serviços da empresa</p>
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
              type="success"
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
              type="error"
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
        {showProviders ? renderProvidersList() : renderProviderForm()}
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
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
            >
              Cancelar
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
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
        <div className="text-center p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 text-red-500 dark:text-red-400 mb-4">
              <TrashIcon className="h-8 w-8" />
            </div>
          </div>

          <p className="text-gray-700 dark:text-gray-300 text-lg mb-2">
            Tem certeza que deseja excluir este prestador?
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">
            Esta ação não pode ser desfeita.
          </p>
        </div>
      </Modal>
    </motion.div>
  );
};

export default ProvidersPage;