"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from 'framer-motion';
import {
  UsersIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  UserIcon,
  EyeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getCookieClient } from "@/lib/cookieClient/cookieClient";

// Importar todas as server actions
import { getWorkers, getWorkerStats } from '@/server/worker/worker.actions';
import { getDocuments } from '@/server/document/document.actions';
import { getInvoices } from '@/server/invoice/invoice.actions';
import { getTemplates } from '@/server/template/template.actions';
import { getTimeSheets } from '@/server/timeSheet/timeSheet.actions';
import { getVisitors, getVisitorStats } from '@/server/visitor/visitor.actions';
import { getProviders, getProviderStats } from '@/server/provider/provider.actions';

// Importar tipos necessários apenas
import { Worker, WorkerStats } from '@/types/worker.type';
import { TimeSheet } from '@/types/timeSheet.type';
import { VisitorStats } from '@/types/visitor.type';
import { ProviderStats } from '@/types/provider.type';

// Interfaces para permissões e módulos dinâmicos
interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserPermissions {
  role: string;
  permissions: string[];
}

// Interfaces para estatísticas do dashboard
interface DashboardStats {
  workers: WorkerStats | null;
  visitors: VisitorStats | null;
  providers: ProviderStats | null;
  documentsCount: number;
  invoicesCount: number;
  templatesCount: number;
  timeSheetsCount: number;
  totalInvoiceValue: number;
  recentActivity: Array<{
    id: string;
    type: 'worker' | 'visitor' | 'provider' | 'document' | 'invoice';
    title: string;
    subtitle: string;
    time: string;
  }>;
}

// Componente de card de estatística
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  isRestricted?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  trend, 
  onClick,
  isRestricted = false
}) => {
  return (
    <motion.div
      whileHover={{ scale: isRestricted ? 1 : 1.02 }}
      whileTap={{ scale: isRestricted ? 1 : 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={`relative border border-gray-100 dark:border-gray-800 shadow-lg transition-all duration-300 ${
          isRestricted 
            ? 'bg-gray-100 dark:bg-gray-800 opacity-60' 
            : 'bg-white dark:bg-gray-900 hover:shadow-xl'
        } ${onClick && !isRestricted ? 'cursor-pointer' : ''}`}
        onClick={!isRestricted ? onClick : undefined}
      >
        {isRestricted && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/20 dark:bg-gray-600/20 rounded-lg">
            <div className="flex flex-col items-center text-gray-600 dark:text-gray-400">
              <EyeIcon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Sem Acesso</span>
            </div>
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {title}
              </p>
              <p className={`text-3xl font-bold ${isRestricted ? 'text-gray-400' : color}`}>
                {isRestricted ? '---' : (typeof value === 'number' ? value.toLocaleString() : value)}
              </p>
              {subtitle && !isRestricted && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
              {trend && !isRestricted && (
                <div className="flex items-center mt-2">
                  {trend.isPositive ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {trend.value}%
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full ${
              isRestricted 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                : `${color.replace('text-', 'bg-').replace('600', '100')} ${color.replace('text-', 'text-').replace('600', '600')} dark:bg-opacity-20`
            }`}>
              <Icon className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de atividade recente
interface RecentActivityProps {
  activities: DashboardStats['recentActivity'];
  hasPermission: boolean;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities, hasPermission }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'worker': return UserIcon;
      case 'visitor': return UsersIcon;
      case 'provider': return BuildingOfficeIcon;
      case 'document': return DocumentTextIcon;
      case 'invoice': return CurrencyDollarIcon;
      default: return ChartBarIcon;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'worker': return 'text-blue-600 dark:text-blue-400';
      case 'visitor': return 'text-green-600 dark:text-green-400';
      case 'provider': return 'text-purple-600 dark:text-purple-400';
      case 'document': return 'text-orange-600 dark:text-orange-400';
      case 'invoice': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 relative">
      {!hasPermission && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/20 dark:bg-gray-600/20 rounded-lg z-10">
          <div className="flex flex-col items-center text-gray-600 dark:text-gray-400">
            <EyeIcon className="h-6 w-6 mb-1" />
            <span className="text-sm font-medium">Acesso Restrito</span>
          </div>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {!hasPermission ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
              <p>Você não tem permissão para ver esta informação</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Nenhuma atividade recente
            </div>
          ) : (
            activities.map((activity) => {
              const IconComponent = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);
              
              return (
                <motion.div
                  key={activity.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 ${colorClass}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {activity.subtitle}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {activity.time}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Interfaces para correção dos tipos
interface DocumentResponse {
  documents?: Array<{
    id: string;
    originalName: string;
    description?: string;
    uploadDate: string;
  }>;
}

interface InvoiceResponse {
  invoices?: Array<{
    id: string;
    value?: number;
  }>;
}

interface TemplateResponse {
  templates?: Array<unknown>;
}

interface VisitorResponse {
  visitors?: Array<{
    id: string;
    name: string;
    reason: string;
    createdAt: string;
  }>;
}

interface ProviderResponse {
  providers?: Array<{
    id: string;
    name: string;
    serviceType?: string;
    reason?: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({ role: '', permissions: [] });
  const [stats, setStats] = useState<DashboardStats>({
    workers: null,
    visitors: null,
    providers: null,
    documentsCount: 0,
    invoicesCount: 0,
    templatesCount: 0,
    timeSheetsCount: 0,
    totalInvoiceValue: 0,
    recentActivity: []
  });

  // Adicionar estados para controle de debounce e carregamento
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Função para obter dados do usuário do token JWT - sem dependências externas
  const getUserDataFromToken = useCallback((): UserData | null => {
    try {
      const token = getCookieClient();
      if (!token || typeof token !== 'string') return null;
      
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;
      
      const payload = JSON.parse(atob(tokenParts[1]));     
      return {
        id: payload.id || payload.sub,
        name: payload.name || 'Usuário',
        email: payload.email,
        role: (payload.role || 'USER').toUpperCase() 
      };
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      return null;
    }
  }, []);

  // Função para buscar permissões do usuário do banco de dados - sem dependências externas
  const fetchUserPermissions = useCallback(async (token: string): Promise<string[]> => {
    try {
      const response = await fetch('http://localhost:4000/permissions/me', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Resposta da API de permissões:', data);
        
        if (data.success && Array.isArray(data.permissions)) {
          return data.permissions;
        } else if (Array.isArray(data.data)) {
          return data.data;
        } else if (Array.isArray(data)) {
          return data;
        }
      } else {
        console.error('Erro na resposta da API de permissões:', response.status, response.statusText);
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao buscar permissões do usuário:', error);
      return [];
    }
  }, []);


  // Corrigir a função hasPermission
  const hasPermission = useCallback((permission: string, permissions?: UserPermissions): boolean => {
    const currentPermissions = permissions || userPermissions;
    
    if (currentPermissions.role === 'ADMIN' || currentPermissions.role === 'MANAGER') {
      return true;
    }
    
    return currentPermissions.permissions.includes(permission);
  }, [userPermissions]);

  // Função para carregar dados do usuário e permissões
  const loadUserData = useCallback(async () => {
    try {
      const token = getCookieClient();
      
      if (!token) {
        setUserData(null);
        setUserPermissions({ role: '', permissions: [] });
        return;
      }
      
      // Obter dados do usuário do token
      const userData = getUserDataFromToken();
      if (!userData) {
        setUserData(null);
        setUserPermissions({ role: '', permissions: [] });
        return;
      }
      
      setUserData(userData);
      
      // Buscar permissões do banco de dados
      if (typeof token !== 'string') {
        setUserData(null);
        setUserPermissions({ role: '', permissions: [] });
        return;
      }
      const permissions = await fetchUserPermissions(token);
      console.log('Permissões obtidas do banco:', permissions);
      
      setUserPermissions({
        role: userData.role,
        permissions: permissions
      });
      
      // Salvar permissões no localStorage para cache
      localStorage.setItem('user_permissions', JSON.stringify(permissions));
      
    } catch (error) {
      console.error('Erro ao carregar informações do usuário:', error);
      setUserData(null);
      setUserPermissions({ role: '', permissions: [] });
    }
  }, [getUserDataFromToken, fetchUserPermissions]);

  // Modificar a função fetchDashboardData com todas as dependências
  const fetchDashboardData = useCallback(async () => {
    console.log("Iniciando fetchDashboardData");
    
    try {
      const token = getCookieClient();
      if (!token) {
        console.log("Redirecionando: Token não encontrado");
        window.location.href = '/auth/login';
        return;
      }
      
      setLoading(true);
      setError('');

      // Carregar dados do usuário e permissões primeiro
      await loadUserData();
      
      // Buscar permissões atualizadas diretamente do cookie, não do estado
      let currentPermissions: UserPermissions = { role: '', permissions: [] };
      try {
        if (token) {
          const userData = getUserDataFromToken();
          if (userData) {
            const fetchedPermissions = await fetchUserPermissions(token as string);
            currentPermissions = {
              role: userData.role,
              permissions: fetchedPermissions
            };
          }
        }
      } catch (err) {
        console.error("Erro ao obter permissões:", err);
      }
      
      // Atualizar estado de permissões após busca (única vez)
      setUserPermissions(currentPermissions);
      console.log("Permissões atualizadas:", currentPermissions);

      // Criar uma função local para verificar permissões
      const checkPermission = (permission: string): boolean => {
        if (currentPermissions.role === 'ADMIN' || currentPermissions.role === 'MANAGER') {
          return true;
        }
        return currentPermissions.permissions.includes(permission);
      };

      // Buscar dados baseado nas permissões - CORRIGIR as permissões aqui
      const promises: Promise<unknown>[] = [];
     
      if (checkPermission('worker:read')) {
        promises.push(getWorkers(), getWorkerStats());
      } else {
        promises.push(Promise.resolve([]), Promise.resolve(null));
      }
      
      if (checkPermission('document:read')) {
        promises.push(getDocuments({ limit: 1000 }));
      } else {
        promises.push(Promise.resolve(null));
      }
      
      if (checkPermission('invoices:read')) {
        promises.push(getInvoices({ limit: 1000 }));
      } else {
        promises.push(Promise.resolve(null));
      }
      
      if (checkPermission('templates:read')) {
        promises.push(getTemplates({ limit: 1000 }));
      } else {
        promises.push(Promise.resolve(null));
      }      
      
      if (checkPermission('timesheets:read')) {
        promises.push(getTimeSheets({ limit: 1000 }));
      } else {
        promises.push(Promise.resolve([]));
      }
      
      if (checkPermission('visitors:read')) {
        promises.push(getVisitors({ limit: 100 }), getVisitorStats());
      } else {
        promises.push(Promise.resolve(null), Promise.resolve(null));
      }
      
      if (checkPermission('providers:read')) {
        promises.push(getProviders({ limit: 100 }), getProviderStats());
      } else {
        promises.push(Promise.resolve(null), Promise.resolve(null));
      }

      const [
        workersData,
        workerStatsData,
        documentsData,
        invoicesData,
        templatesData,
        timeSheetsData,
        visitorsData,
        visitorStatsData,
        providersData,
        providerStatsData
      ] = await Promise.allSettled(promises);

      // Processar resultados
      const workers: Worker[] = workersData.status === 'fulfilled' ? (workersData.value as Worker[]) : [];
      const workerStats: WorkerStats | null = workerStatsData.status === 'fulfilled' ? workerStatsData.value as WorkerStats : null;

      // Correção para os objetos com estrutura aninhada
      const documents = documentsData.status === 'fulfilled' && documentsData.value ? 
        Array.isArray(documentsData.value) ? documentsData.value : ((documentsData.value as DocumentResponse).documents || []) : [];
        
      const invoices = invoicesData.status === 'fulfilled' && invoicesData.value ? 
        Array.isArray(invoicesData.value) ? invoicesData.value : ((invoicesData.value as InvoiceResponse).invoices || []) : [];
        
      const templates = templatesData.status === 'fulfilled' && templatesData.value ? 
        Array.isArray(templatesData.value) ? templatesData.value : ((templatesData.value as TemplateResponse).templates || []) : [];

      const timeSheets: TimeSheet[] = timeSheetsData.status === 'fulfilled' && Array.isArray(timeSheetsData.value) ? 
        timeSheetsData.value as TimeSheet[] : [];
        
      const visitors = visitorsData.status === 'fulfilled' && visitorsData.value ? 
        Array.isArray(visitorsData.value) ? visitorsData.value : ((visitorsData.value as VisitorResponse).visitors || []) : [];
        
      const visitorStats: VisitorStats | null = visitorStatsData.status === 'fulfilled' ? visitorStatsData.value as VisitorStats : null;

      const providers = providersData.status === 'fulfilled' && providersData.value ? 
        Array.isArray(providersData.value) ? providersData.value : ((providersData.value as ProviderResponse).providers || []) : [];
        
      const providerStats: ProviderStats | null = providerStatsData.status === 'fulfilled' ? providerStatsData.value as ProviderStats : null;

      // Calcular valor total das faturas
      const totalInvoiceValue = invoices.reduce((sum: number, invoice: { value?: number }) => sum + (invoice.value || 0), 0);

      // Gerar atividade recente baseada nas permissões - CORRIGIR aqui também
      const recentActivity: DashboardStats['recentActivity'] = [];
      
      if (checkPermission('worker:read')) {
        workers.slice(0, 3).forEach(worker => {
          recentActivity.push({
            id: `worker-${worker.id}`,
            type: 'worker',
            title: `Funcionário: ${worker.name}`,
            subtitle: `${worker.department} - ${worker.position}`,
            time: new Date(worker.createdAt).toLocaleDateString('pt-BR')
          });
        });
      }

      if (checkPermission('visitors:read')) {
        visitors.slice(0, 2).forEach((visitor: { id: string; name: string; reason: string; createdAt: string }) => {
          recentActivity.push({
            id: `visitor-${visitor.id}`,
            type: 'visitor',
            title: `Visitante: ${visitor.name}`,
            subtitle: visitor.reason,
            time: new Date(visitor.createdAt).toLocaleDateString('pt-BR')
          });
        });
      }

      if (checkPermission('providers:read')) {
        providers.slice(0, 2).forEach((provider: { id: string; name: string; serviceType?: string; reason?: string; createdAt: string }) => {
          recentActivity.push({
            id: `provider-${provider.id}`,
            type: 'provider',
            title: `Prestador: ${provider.name}`,
            subtitle: provider.serviceType || provider.reason || '',
            time: new Date(provider.createdAt).toLocaleDateString('pt-BR')
          });
        });
      }

      // ✅ CORRIGIDO: documents com 'S'
      if (checkPermission('document:read')) {
        documents.slice(0, 2).forEach((document: { id: string; originalName: string; description?: string; uploadDate: string }) => {
          recentActivity.push({
            id: `document-${document.id}`,
            type: 'document',
            title: `Documento: ${document.originalName}`,
            subtitle: document.description || 'Sem descrição',
            time: new Date(document.uploadDate).toLocaleDateString('pt-BR')
          });
        });
      }

      // Ordenar por data (mais recentes primeiro)
      recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setStats({
        workers: workerStats,
        visitors: visitorStats,
        providers: providerStats,
        documentsCount: documents.length,
        invoicesCount: invoices.length,
        templatesCount: templates.length,
        timeSheetsCount: timeSheets.length,
        totalInvoiceValue,
        recentActivity: recentActivity.slice(0, 8) // Limitar a 8 itens
      });

    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError('Erro ao carregar informações do dashboard');
      toast.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, [loadUserData, getUserDataFromToken, fetchUserPermissions]);

  // Modificar o useEffect para evitar múltiplas chamadas
  useEffect(() => {
    if (!hasLoaded) {
      fetchDashboardData().then(() => {
        setHasLoaded(true);
      });
    }
  }, [fetchDashboardData, hasLoaded]);

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

  // Funções de navegação
  const navigateToPage = (page: string) => {
    window.location.href = `/pages/${page}`;
  };

  // Corrigir o debouncedFetchData com todas as dependências
  const debouncedFetchData = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await fetchDashboardData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000); // Prevent calls for 1 second
    }
  }, [isRefreshing, fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-stone-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-stone-50 dark:bg-gray-950">
        <Card className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button 
              onClick={fetchDashboardData}
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 min-h-screen bg-stone-50 dark:bg-gray-950"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-stone-800 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-stone-500 dark:text-gray-400">
              Bem-vindo ao Sistema de Gerenciamento{userData?.name && (
                <span className="capitalize font-medium text-cyan-600 dark:text-cyan-400 ml-2">
                  {userData.name}
                </span>
              )}
            </p>
          </div>
          
          {/* Botão de Atualizar */}
          <Button
            onClick={debouncedFetchData}
            disabled={loading || isRefreshing}
            className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 shadow-lg"
            size="lg"
          >
            {loading || isRefreshing ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Atualizando...
              </div>
            ) : (
              'Atualizar Dashboard'
            )}
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards - Primeira linha */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Funcionários"
          value={hasPermission('worker:read') ? (stats.workers?.totalWorkers || 0) : '---'}
          subtitle={hasPermission('worker:read') ? `${stats.workers?.activeWorkers || 0} ativos` : 'Sem acesso'}
          icon={UsersIcon}
          color="text-blue-600 dark:text-blue-400"
          onClick={hasPermission('worker:read') ? () => navigateToPage('worker') : undefined}
          isRestricted={!hasPermission('worker:read')}
        />
        
        <StatCard
          title="Documentos"
          value={hasPermission('document:read') ? stats.documentsCount : '---'}
          subtitle={hasPermission('document:read') ? "Total no sistema" : 'Sem acesso'}
          icon={DocumentTextIcon}
          color="text-green-600 dark:text-green-400"
          onClick={hasPermission('document:read') ? () => navigateToPage('document') : undefined}
          isRestricted={!hasPermission('document:read')}
        />
        
        <StatCard
          title="Visitantes"
          value={hasPermission('visitors:read') ? (stats.visitors?.totalVisitors || 0) : '---'}
          subtitle={hasPermission('visitors:read') ? `${stats.visitors?.checkedInCount || 0} presentes` : 'Sem acesso'}
          icon={UserGroupIcon}
          color="text-purple-600 dark:text-purple-400"
          onClick={hasPermission('visitors:read') ? () => navigateToPage('visitor') : undefined}
          isRestricted={!hasPermission('visitors:read')}
        />
        
        <StatCard
          title="Prestadores"
          value={hasPermission('providers:read') ? (stats.providers?.totalProviders || 0) : '---'}
          subtitle={hasPermission('providers:read') ? `${stats.providers?.checkedInCount || 0} presentes` : 'Sem acesso'}
          icon={BuildingOfficeIcon}
          color="text-orange-600 dark:text-orange-400"
          onClick={hasPermission('providers:read') ? () => navigateToPage('provider') : undefined}
          isRestricted={!hasPermission('providers:read')}
        />
      </motion.div>

      {/* Segunda linha de cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Faturas"
          value={hasPermission('invoices:read') ? stats.invoicesCount : '---'}
          subtitle={hasPermission('invoices:read') ? `R$ ${stats.totalInvoiceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sem acesso'}
          icon={CurrencyDollarIcon}
          color="text-red-600 dark:text-red-400"
          onClick={hasPermission('invoices:read') ? () => navigateToPage('invoice') : undefined}
          isRestricted={!hasPermission('invoices:read')}
        />
        
        <StatCard
          title="Templates"
          value={hasPermission('templates:read') ? stats.templatesCount : '---'}
          subtitle={hasPermission('templates:read') ? "Modelos disponíveis" : 'Sem acesso'}
          icon={DocumentTextIcon}
          color="text-indigo-600 dark:text-indigo-400"
          onClick={hasPermission('templates:read') ? () => navigateToPage('template') : undefined}
          isRestricted={!hasPermission('templates:read')}
        />
        
        <StatCard
          title="Registros de Ponto"
          value={hasPermission('timesheets:read') ? stats.timeSheetsCount : '---'}
          subtitle={hasPermission('timesheets:read') ? "Total de registros" : 'Sem acesso'}
          icon={ClockIcon}
          color="text-teal-600 dark:text-teal-400"
          onClick={hasPermission('timesheets:read') ? () => navigateToPage('timeSheet') : undefined}
          isRestricted={!hasPermission('timesheets:read')}
        />
        
        <StatCard
          title="Departamentos"
          value={hasPermission('worker:read') ? (stats.workers?.departmentsCount || 0) : '---'}
          subtitle={hasPermission('worker:read') ? "Setores ativos" : 'Sem acesso'}
          icon={BuildingOfficeIcon}
          color="text-pink-600 dark:text-pink-400"
          onClick={hasPermission('worker:read') ? () => navigateToPage('worker') : undefined}
          isRestricted={!hasPermission('worker:read')}
        />
      </motion.div>

      {/* Departamentos e Atividade Recente */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Departamentos */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 relative">
          {!hasPermission('worker:read') && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/20 dark:bg-gray-600/20 rounded-lg z-10">
              <div className="flex flex-col items-center text-gray-600 dark:text-gray-400">
                <EyeIcon className="h-6 w-6 mb-1" />
                <span className="text-sm font-medium">Acesso Restrito</span>
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Funcionários por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {!hasPermission('worker:read') ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
                  <p>Você não tem permissão para ver esta informação</p>
                </div>
              ) : stats.workers?.departments && stats.workers.departments.length > 0 ? (
                stats.workers.departments.slice(0, 6).map((dept, index) => (
                  <motion.div
                    key={dept.name}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {dept.name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                          {dept.count}
                        </span>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-cyan-500 dark:bg-cyan-400 h-2 rounded-full transition-all"
                            style={{
                              width: `${(dept.count / (stats.workers?.totalWorkers || 1)) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  Nenhum departamento encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <RecentActivity 
          activities={stats.recentActivity} 
          hasPermission={
            hasPermission('worker:read') || 
            hasPermission('document:read') || 
            hasPermission('visitors:read') || 
            hasPermission('providers:read')
          } 
        />
      </motion.div>

      {/* Status dos Funcionários - Só aparece se tiver permissão */}
      {hasPermission('worker:read') && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Funcionários Ativos"
            value={stats.workers?.activeWorkers || 0}
            icon={UsersIcon}
            color="text-green-600 dark:text-green-400"
          />
          
          <StatCard
            title="Funcionários Inativos"
            value={stats.workers?.inactiveWorkers || 0}
            icon={UsersIcon}
            color="text-yellow-600 dark:text-yellow-400"
          />
          
          <StatCard
            title="Em Férias"
            value={stats.workers?.onVacationWorkers || 0}
            icon={CalendarDaysIcon}
            color="text-blue-600 dark:text-blue-400"
          />
          
          <StatCard
            title="Desligados"
            value={stats.workers?.terminatedWorkers || 0}
            icon={UsersIcon}
            color="text-red-600 dark:text-red-400"
          />
        </motion.div>
      )}

      {/* Mensagem de Acesso Limitado (se aplicável) */}
      {userPermissions.permissions.length === 0 && (
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                    Nenhuma Permissão Encontrada
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Você não possui permissões configuradas no sistema. Entre em contato com o administrador 
                    para solicitar as permissões necessárias para acessar as funcionalidades do sistema.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

    </motion.div>
  );
}