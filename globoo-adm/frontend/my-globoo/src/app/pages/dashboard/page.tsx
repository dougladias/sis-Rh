"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
interface UserPermissions {
  role: string;
  permissions: string[];
}

interface DashboardModule {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  requiredPermissions: string[];
  requiredRoles?: string[];
  getData?: () => Promise<Record<string, unknown>>;
  value?: string | number;
  subtitle?: string;
  href?: string;
  isVisible: boolean;
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

// Correção para os tipos que estavam usando "any"
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
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({ role: '', permissions: [] });
  const [availableModules, setAvailableModules] = useState<DashboardModule[]>([]);
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

  // Função para obter permissões do usuário
  const getUserPermissions = useCallback((): UserPermissions => {
    try {
      const userDataString = document.cookie
        .split('; ')
        .find(row => row.startsWith('user='))
        ?.split('=')[1];
      
      if (!userDataString) {
        return { role: 'viewer', permissions: [] };
      }

      const userData = JSON.parse(decodeURIComponent(userDataString));
      
      // Definir permissões baseadas na role (pode ser expandido para usar permissões específicas)
      const rolePermissions: Record<string, string[]> = {
        admin: [
          'dashboard:read', 'workers:read', 'documents:read', 'visitors:read', 
          'providers:read', 'invoices:read', 'templates:read', 'timesheet:read',
          'workers:create', 'documents:create', 'visitors:create', 'providers:create'
        ],
        manager: [
          'dashboard:read', 'workers:read', 'documents:read', 'visitors:read',
          'timesheet:read', 'workers:create', 'documents:create'
        ],
        user: [
          'dashboard:read', 'workers:read', 'documents:read', 'timesheet:read'
        ],
        administrative: [
          'dashboard:read', 'workers:read', 'documents:read', 'visitors:read',
          'providers:read', 'invoices:read', 'templates:read'
        ],
        viewer: ['dashboard:read']
      };
      
      return {
        role: userData.role || 'viewer',
        permissions: rolePermissions[userData.role] || rolePermissions.viewer
      };
    } catch (error) {
      console.error('Erro ao obter permissões do usuário:', error);
      return { role: 'viewer', permissions: ['dashboard:read'] };
    }
  }, []);

  // Função para verificar se tem permissão
  const hasPermission = useCallback((permission: string): boolean => {
    return userPermissions.permissions.includes(permission) || 
           userPermissions.role === 'admin';
  }, [userPermissions]);

  
  // Definir módulos do dashboard
  const dashboardModules = useMemo((): DashboardModule[] => [
    {
      id: 'workers',
      title: 'Total de Funcionários',
      icon: UsersIcon,
      color: 'text-blue-600 dark:text-blue-400',
      requiredPermissions: ['workers:read'],
      href: '/pages/worker',
      isVisible: false
    },
    {
      id: 'documents',
      title: 'Documentos',
      icon: DocumentTextIcon,
      color: 'text-green-600 dark:text-green-400',
      requiredPermissions: ['documents:read'],
      href: '/pages/document',
      isVisible: false
    },
    {
      id: 'visitors',
      title: 'Visitantes',
      icon: UserGroupIcon,
      color: 'text-purple-600 dark:text-purple-400',
      requiredPermissions: ['visitors:read'],
      href: '/pages/visitor',
      isVisible: false
    },
    {
      id: 'providers',
      title: 'Prestadores',
      icon: BuildingOfficeIcon,
      color: 'text-orange-600 dark:text-orange-400',
      requiredPermissions: ['providers:read'],
      href: '/pages/provider',
      isVisible: false
    },
    {
      id: 'invoices',
      title: 'Faturas',
      icon: CurrencyDollarIcon,
      color: 'text-red-600 dark:text-red-400',
      requiredPermissions: ['invoices:read'],
      href: '/pages/invoice',
      isVisible: false
    },
    {
      id: 'templates',
      title: 'Templates',
      icon: DocumentTextIcon,
      color: 'text-indigo-600 dark:text-indigo-400',
      requiredPermissions: ['templates:read'],
      href: '/pages/template',
      isVisible: false
    },
    {
      id: 'timesheet',
      title: 'Registros de Ponto',
      icon: ClockIcon,
      color: 'text-teal-600 dark:text-teal-400',
      requiredPermissions: ['timesheet:read'],
      href: '/pages/timeSheet',
      isVisible: false
    },
    {
      id: 'departments',
      title: 'Departamentos',
      icon: BuildingOfficeIcon,
      color: 'text-pink-600 dark:text-pink-400',
      requiredPermissions: ['workers:read'],
      href: '/pages/worker',
      isVisible: false
    }
  ], []);

  // Função para verificar autenticação (mesmo padrão da página de documentos)
  const checkAuth = useCallback(() => {
    const hasAuthCookie = document.cookie.includes('session=');
    if (!hasAuthCookie) {
      window.location.href = '/auth/login';
      return false;
    }
    return true;
  }, []);

  // Função para buscar todas as estatísticas (mesmo padrão da página de documentos)
  const fetchDashboardData = useCallback(async () => {
    if (!checkAuth()) return;

    setLoading(true);
    setError('');

    try {
      // Obter permissões do usuário uma única vez
      const permissions = getUserPermissions();
      setUserPermissions(permissions);

      // Use as permissões obtidas diretamente, não a referência ao estado
      const hasPermissionLocal = (permission: string): boolean => {
        return permissions.permissions.includes(permission) || 
              permissions.role === 'admin';
      };

      // Determinar quais módulos são visíveis com a função local
      const modules = dashboardModules.map(module => ({
        ...module,
        isVisible: module.requiredPermissions.some(perm => hasPermissionLocal(perm)) || permissions.role === 'admin'
      }));
      setAvailableModules(modules);

      // Buscar dados baseado nas permissões
      const promises: Promise<unknown>[] = [];
      
      if (hasPermissionLocal('workers:read')) {
        promises.push(getWorkers(), getWorkerStats());
      } else {
        promises.push(Promise.resolve([]), Promise.resolve(null));
      }
      
      if (hasPermissionLocal('documents:read')) {
        promises.push(getDocuments({ limit: 1000 }));
      } else {
        promises.push(Promise.resolve(null));
      }
      
      if (hasPermissionLocal('invoices:read')) {
        promises.push(getInvoices({ limit: 1000 }));
      } else {
        promises.push(Promise.resolve(null));
      }
      
      if (hasPermissionLocal('templates:read')) {
        promises.push(getTemplates({ limit: 1000 }));
      } else {
        promises.push(Promise.resolve(null));
      }
      
      if (hasPermissionLocal('timesheet:read')) {
        promises.push(getTimeSheets({ limit: 1000 }));
      } else {
        promises.push(Promise.resolve([]));
      }
      
      if (hasPermissionLocal('visitors:read')) {
        promises.push(getVisitors({ limit: 100 }), getVisitorStats());
      } else {
        promises.push(Promise.resolve(null), Promise.resolve(null));
      }
      
      if (hasPermissionLocal('providers:read')) {
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

      // Gerar atividade recente baseada nas permissões
      const recentActivity: DashboardStats['recentActivity'] = [];

      if (hasPermissionLocal('workers:read')) {
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

      if (hasPermissionLocal('visitors:read')) {
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

      if (hasPermissionLocal('providers:read')) {
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

      if (hasPermissionLocal('documents:read')) {
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
      
      // Verificar se o erro indica falta de autenticação (mesmo padrão da página de documentos)
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        window.location.href = '/auth/login';
        return;
      }
      
      setError('Erro ao carregar informações do dashboard');
      toast.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, [checkAuth, dashboardModules, getUserPermissions]); // Adicionamos getUserPermissions, mas mantemos hasPermission fora

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

  // Efeito para carregar dados quando a página carrega (mesmo padrão da página de documentos)
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Funções de navegação
  const navigateToPage = (page: string) => {
    window.location.href = `/pages/${page}`;
  };

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
        <h1 className="text-4xl font-bold text-stone-800 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-stone-500 dark:text-gray-400">
          Visão geral do sistema Globoo - {userPermissions.role && (
            <span className="capitalize font-medium text-cyan-600 dark:text-cyan-400">
              Perfil: {userPermissions.role}
            </span>
          )}
        </p>
      </motion.div>

      {/* Stats Cards - Primeira linha */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Funcionários"
          value={stats.workers?.totalWorkers || 0}
          subtitle={`${stats.workers?.activeWorkers || 0} ativos`}
          icon={UsersIcon}
          color="text-blue-600 dark:text-blue-400"
          onClick={() => navigateToPage('worker')}
          isRestricted={!hasPermission('workers:read')}
        />
        
        <StatCard
          title="Documentos"
          value={stats.documentsCount}
          subtitle="Total no sistema"
          icon={DocumentTextIcon}
          color="text-green-600 dark:text-green-400"
          onClick={() => navigateToPage('document')}
          isRestricted={!hasPermission('documents:read')}
        />
        
        <StatCard
          title="Visitantes"
          value={stats.visitors?.totalVisitors || 0}
          subtitle={`${stats.visitors?.checkedInCount || 0} presentes`}
          icon={UserGroupIcon}
          color="text-purple-600 dark:text-purple-400"
          onClick={() => navigateToPage('visitor')}
          isRestricted={!hasPermission('visitors:read')}
        />
        
        <StatCard
          title="Prestadores"
          value={stats.providers?.totalProviders || 0}
          subtitle={`${stats.providers?.checkedInCount || 0} presentes`}
          icon={BuildingOfficeIcon}
          color="text-orange-600 dark:text-orange-400"
          onClick={() => navigateToPage('provider')}
          isRestricted={!hasPermission('providers:read')}
        />
      </motion.div>

      {/* Segunda linha de cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Faturas"
          value={stats.invoicesCount}
          subtitle={hasPermission('invoices:read') ? `R$ ${stats.totalInvoiceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Acesso restrito'}
          icon={CurrencyDollarIcon}
          color="text-red-600 dark:text-red-400"
          onClick={() => navigateToPage('invoice')}
          isRestricted={!hasPermission('invoices:read')}
        />
        
        <StatCard
          title="Templates"
          value={stats.templatesCount}
          subtitle="Modelos disponíveis"
          icon={DocumentTextIcon}
          color="text-indigo-600 dark:text-indigo-400"
          onClick={() => navigateToPage('template')}
          isRestricted={!hasPermission('templates:read')}
        />
        
        <StatCard
          title="Registros de Ponto"
          value={stats.timeSheetsCount}
          subtitle="Total de registros"
          icon={ClockIcon}
          color="text-teal-600 dark:text-teal-400"
          onClick={() => navigateToPage('timeSheet')}
          isRestricted={!hasPermission('timesheet:read')}
        />
        
        <StatCard
          title="Departamentos"
          value={stats.workers?.departmentsCount || 0}
          subtitle="Setores ativos"
          icon={BuildingOfficeIcon}
          color="text-pink-600 dark:text-pink-400"
          onClick={() => navigateToPage('worker')}
          isRestricted={!hasPermission('workers:read')}
        />
      </motion.div>

      {/* Departamentos e Atividade Recente */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Departamentos */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 relative">
          {!hasPermission('workers:read') && (
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
              {!hasPermission('workers:read') ? (
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
          hasPermission={hasPermission('dashboard:read')} 
        />
      </motion.div>

      {/* Status dos Funcionários - só mostra se tem permissão */}
      {hasPermission('workers:read') && (
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

      {/* Seção de Permissões do Usuário */}
      <motion.div variants={itemVariants} className="mb-8">
        <Card className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Suas Permissões de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Perfil:</span>
                  <span className="ml-2 px-3 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 rounded-full text-sm font-medium capitalize">
                    {userPermissions.role}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {userPermissions.permissions.length} permissões ativas
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableModules.map((module) => (
                  <div 
                    key={module.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      module.isVisible 
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <module.icon className={`h-5 w-5 ${
                        module.isVisible ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`} />
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${
                          module.isVisible ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                        }`}>
                          {module.title}
                        </span>
                        <div className={`text-xs ${
                          module.isVisible ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {module.isVisible ? 'Acesso liberado' : 'Acesso negado'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mensagem de Acesso Limitado (se aplicável) */}
      {userPermissions.role === 'viewer' && (
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                    Acesso Limitado
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Você possui um perfil de visualização limitado. Para acessar mais funcionalidades, 
                    entre em contato com o administrador do sistema para solicitar permissões adicionais.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Botão de Atualizar */}
      <motion.div 
        variants={itemVariants} 
        className="fixed bottom-6 right-6"
      >
        <Button
          onClick={fetchDashboardData}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 shadow-lg"
          size="lg"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Atualizando...
            </div>
          ) : (
            'Atualizar Dashboard'
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}