"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HiUsers, HiDocumentText, HiTemplate, HiMenuAlt2, HiX, HiPlus } from "react-icons/hi";
import { TbPigMoney } from "react-icons/tb";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { FaMoneyBill1Wave, FaFileInvoice } from "react-icons/fa6";
import { FaUserClock, FaUserCog } from "react-icons/fa";
import { GrUserWorker, GrDocumentVerified } from "react-icons/gr";
import LottieLogo from "@/components/ui/LottieLogo";
import { getCookieClient } from "@/lib/cookieClient/cookieClient";
import ThemeToggle from "@/components/ui/ThemeToggle";

// Definir todas as permissões em um único local para evitar duplicação
const ALL_PERMISSIONS = {
  dashboard: ["dashboard:read"],
  backoffice: ["backoffice:access"],
  workers: ["worker:read", "worker:write", "worker:delete"], 
  documents: ["document:read", "document:write", "document:delete"], 
  templates: ["templates:read", "templates:write", "templates:delete"],
  timesheet: ["timesheets:read", "timesheets:edit"], 
  payroll: ["payrolls:read", "payrolls:edit", "payrolls:delete"], 
  payslip: ["payslip:read", "payslip:write", "payslip:delete"],
  benefit: ["benefit:read", "benefit:write", "benefit:delete"],
  invoices: ["invoices:read", "invoices:write", "invoices:delete"],
  visitors: ["visitors:read", "visitors:write", "visitors:delete"],
  providers: ["providers:read", "providers:write", "providers:delete"],
  tasks: ["tasks:read", "tasks:write", "tasks:delete"]
};

// Extrair constantes de animação para reduzir redundância
const ANIMATIONS = {
  sidebar: {
    open: { width: "16rem" },
    closed: { width: "4.5rem" },
    hidden: { width: "0rem" }
  },
  transition: {
    spring: { type: "spring", stiffness: 250, damping: 25 }
  }
};

// Interface para o usuário
interface User {
  name: string;
  role?: string;
  permissions?: string[];
}

// Interface para itens do menu
interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

// Interface para as props do Sidebar
interface SidebarProps {
  state?: "open" | "closed" | "hidden";
  onStateChange?: (state: "open" | "closed" | "hidden") => void;
}

export default function Sidebar({ state, onStateChange }: SidebarProps) {
  const [internalState, setInternalState] = useState<"open" | "closed" | "hidden">("open");
  const [mounted, setMounted] = useState(false);
  const [visibleMenus, setVisibleMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  // Determinar qual estado usar (props ou interno)
  const currentState = state !== undefined ? state : internalState;
  const isOpen = currentState === "open";

  // Função para mudar o estado
  const handleStateChange = (newState: "open" | "closed" | "hidden") => {
    if (onStateChange) {
      onStateChange(newState);
    } else {
      setInternalState(newState);
    }
  };

  // Toggle entre open e closed
  const toggleSidebar = () => {
    const newState = isOpen ? "closed" : "open";
    handleStateChange(newState);
  };

  // Função auxiliar para obter dados do usuário do cookie
  const getUserDataFromCookie = useCallback(() => {
    try {
      const token = getCookieClient();
      if (!token) return null;

      if (typeof token === 'string') {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) return null;

        const payload = JSON.parse(atob(tokenParts[1]));
        return {
          id: payload.id || payload.sub,
          name: payload.name || 'Usuário',
          email: payload.email,
          role: (payload.role || 'USER').toUpperCase()
        };
      }

      return null;
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      return null;
    }
  }, []);

  // Carregue informações do usuário e suas permissões
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = getCookieClient();

        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const userData = getUserDataFromCookie();
        if (!userData) {
          setUser({ name: 'Usuário Globoo', role: 'USER' });
          setLoading(false);
          return;
        }

        try {
          const response = await fetch('http://localhost:4000/permissions/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.permissions) {
              setUser({
                name: userData.name,
                role: userData.role,
                permissions: data.permissions
              });

              localStorage.setItem('user_permissions', JSON.stringify(data.permissions));
            } else {
              fallbackToCache(userData);
            }
          } else {
            fallbackToCache(userData);
          }
        } catch (error) {
          console.error('Erro ao buscar permissões do usuário:', error);
          fallbackToCache(userData);
        }
      } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Função simplificada para usar permissões em cache
    const fallbackToCache = (userData: { name?: string; role?: string; email?: string }) => {
      if (userData.role === 'MANAGER') {
        // Extrair todas as permissões de leitura da constante ALL_PERMISSIONS
        const allPermissions = Object.values(ALL_PERMISSIONS).flat();

        setUser({
          name: userData.name || 'Usuário',
          role: userData.role
        });

        localStorage.setItem('user_permissions', JSON.stringify(allPermissions));
        return;
      }

      // Recuperar permissões em cache para usuários não-manager
      const cachedPermissions = localStorage.getItem('user_permissions');
      setUser({
        name: userData.name || 'Usuário',
        role: userData.role || 'USER',
        permissions: cachedPermissions ? JSON.parse(cachedPermissions) : []
      });
    };

    loadUserData();
  }, [getUserDataFromCookie]);

  // Configuração de tema e CSS vars
  useEffect(() => {
    setMounted(true);

    // Aplicar tema salvo
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    // Definir largura do sidebar como variável CSS
    if (mounted) {
      const widthMap = {
        open: '16rem',
        closed: '4.5rem',
        hidden: '0rem'
      };

      document.documentElement.style.setProperty('--sidebar-width', widthMap[currentState]);
    }
  }, [currentState, mounted]);

  // Mapeamento de permissões simplificado usando a constante ALL_PERMISSIONS
  const permissionMap = useMemo(() => {
    const readMap: Record<string, string[]> = {};

    // Extrair somente permissões de leitura para a navegação
    Object.entries(ALL_PERMISSIONS).forEach(([key, permissions]) => {
      readMap[key] = permissions.filter(p => p.includes(':read')) || [permissions[0]];
    });

    return readMap;
  }, []);

  // Verificar permissões de forma otimizada
  const hasPagePermission = useCallback((key: string) => {
    if (!user) return false;

    if (user.role?.toUpperCase() === 'MANAGER') return true;

    if (user.permissions?.length) {
      const requiredPermissions = permissionMap[key];
      return requiredPermissions?.some(p => user.permissions?.includes(p)) || false;
    }

    return false;
  }, [user, permissionMap]);

  // Definição de menus
  const allMenuItems = useMemo(() => [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <HiPlus size={21} />,
      href: '/pages/dashboard'
    },
    {
      key: 'backoffice',
      label: 'BackOffice',
      icon: <FaUserCog size={21} />,
      href: '/pages/backoffice'
    },
    {
      key: 'workers',
      label: 'Funcionários',
      icon: <HiUsers size={21} />,
      href: '/pages/worker'
    },
    {
      key: 'benefit',
      label: 'Benefícios',
      icon: <TbPigMoney size={21} />,
      href: '/pages/benefit'
    },
    {
      key: 'documents',
      label: 'Documentos',
      icon: <HiDocumentText size={21} />,
      href: '/pages/document'
    },
    {
      key: 'templates',
      label: 'Templates',
      icon: <HiTemplate size={21} />,
      href: '/pages/template'
    },
    {
      key: 'timesheet',
      label: 'Controle de Ponto',
      icon: <FaUserClock size={21} />,
      href: '/pages/timeSheet'
    },
    {
      key: 'payroll',
      label: 'Folha de Pagamento',
      icon: <FaMoneyBill1Wave size={21} />,
      href: '/pages/payroll'
    },
    {
      key: 'payslip',
      label: 'Holerite',
      icon: <RiMoneyDollarCircleLine size={21} />,
      href: '/pages/payslip'
    },
    {
      key: 'invoices',
      label: 'Notas Fiscais',
      icon: <FaFileInvoice size={21} />,
      href: '/pages/invoice'
    },
    {
      key: 'visitors',
      label: 'Visitantes',
      icon: <FaUserCog size={21} />,
      href: '/pages/visitor'
    },
    {
      key: 'providers',
      label: 'Prestador de Serviço',
      icon: <GrUserWorker size={21} />,
      href: '/pages/provider'
    },
    {
      key: 'tasks',
      label: 'Tarefas',
      icon: <GrDocumentVerified size={21} />,
      href: '/pages/task'
    }
  ], []);

  // Filtrar menus com base em permissões
  useEffect(() => {
    if (!user) {
      setVisibleMenus([]);
      setLoading(false);
      return;
    }

    const allowedMenus = allMenuItems.filter(menuItem =>
      !menuItem.key || hasPagePermission(menuItem.key)
    );

    setVisibleMenus(allowedMenus);
    setLoading(false);
  }, [allMenuItems, hasPagePermission, user]);

  // Verificar link ativo
  const isActive = useCallback((href: string) => {
    return pathname === href || pathname?.startsWith(href);
  }, [pathname]);

  // Renderização condicional simplificada
  if (currentState === "hidden") return null;

  return (
    <motion.div
      className="side-nav fixed top-0 left-0 z-40 h-screen border-r border-gray-200 dark:border-gray-800/30"
      initial={false}
      animate={currentState}
      variants={ANIMATIONS.sidebar}
      transition={ANIMATIONS.transition.spring}
    >
      <div className="h-full bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/30 flex flex-col relative overflow-hidden">
        {/* Toggle button */}
        <div className={`flex justify-${isOpen ? 'end' : 'center'} p-4`}>
          <motion.button
            onClick={toggleSidebar}
            className="p-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 dark:text-blue-100 backdrop-blur-sm transition-colors z-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isOpen ? <HiX size={18} /> : <HiMenuAlt2 size={18} />}
          </motion.button>
        </div>

        {/* Logo e conteúdo */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <>
            {/* Logo */}
            <div className={`mx-auto ${isOpen ? 'p-5 pt-0' : 'p-3 justify-center'} ${isOpen ? 'mb-8' : 'mb-1'}`}>
              <motion.div className={`${isOpen ? "w-22 h-22" : "w-12 h-12"} rounded-full flex items-center justify-center`}>
                <LottieLogo isOpen={isOpen} />
              </motion.div>
            </div>

            {/* User info (somente se aberto) */}
            <AnimatePresence>
              {isOpen && user && (
                <motion.div
                  className="px-4 mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-3 border border-cyan-200 dark:border-cyan-800">
                    <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-cyan-600 mt-1 dark:text-cyan-400 capitalize">
                      {user.role || "user"}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Links de navegação */}
            <nav className="flex-1 px-3 overflow-y-auto">
              {visibleMenus.map((item) => {
                const active = isActive(item.href);
                return (
                  <div key={item.key} className="mb-3.5">
                    <Link href={item.href}>
                      <div className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'} gap-3.5 p-3 rounded-xl 
                        ${active ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'hover:bg-blue-50 dark:hover:bg-white/5'} 
                        transition-all cursor-pointer group relative overflow-hidden`}>

                        {/* Indicador ativo */}
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-cyan-500 dark:bg-cyan-400 rounded-r-md" />
                        )}

                        {/* Ícone */}
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg 
                          ${active ? 'bg-cyan-200/80 dark:bg-cyan-800/40 text-cyan-700 dark:text-cyan-200' :
                            'bg-blue-100/80 dark:bg-white/5 text-cyan-600 dark:text-cyan-300'}`}>
                          {item.icon}
                        </div>

                        {/* Texto (somente se aberto) */}
                        {isOpen && (
                          <span className={`${active ? 'text-cyan-700 dark:text-cyan-300 font-semibold' :
                            'text-gray-700 dark:text-gray-200'} whitespace-nowrap font-medium text-[14px]`}>
                            {item.label}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}

              {/* Mensagem quando não há links */}
              {visibleMenus.length === 0 && user && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sem permissões de acesso
                  </p>
                </div>
              )}
            </nav>

            {/* Botão de tema */}
            <div className={`px-3 mx-auto ${isOpen ? 'mb-2' : 'flex justify-center mb-2'}`}>
              <ThemeToggle />
            </div>

            {/* Footer */}
            {isOpen && (
              <div className="p-4 border-t border-gray-200/50 dark:border-white/5">
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Globoo Admin © 2025
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}