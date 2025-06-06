"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HiUsers, HiDocumentText, HiTemplate, HiMenuAlt2, HiX, HiPlus } from "react-icons/hi";
import { FaMoneyBill1Wave, FaFileInvoice } from "react-icons/fa6";
import { FaUserClock, FaUserCog } from "react-icons/fa";
import { GrUserWorker, GrDocumentVerified } from "react-icons/gr";
import LottieLogo from "@/components/ui/LottieLogo";
import { getCookieClient } from "@/lib/cookieClient/cookieClient";
import ThemeToggle from "@/components/ui/ThemeToggle";

// Interface para o usuário
interface User {
  name: string;
  role?: string;
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

interface ThemeToggledEvent extends CustomEvent {
  detail: {
    theme: 'light' | 'dark';
  };
}

export default function Sidebar({ state, onStateChange }: SidebarProps) {
  // Usar o state interno se não for fornecido via props
  const [internalState, setInternalState] = useState<"open" | "closed" | "hidden">("open");
  const [mounted, setMounted] = useState(false);
  const [visibleMenus, setVisibleMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  
  const [user, setUser] = useState<User | null>(null);

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

  // IMPORTANTE: Mova o useEffect do tema para cima, antes de qualquer return condicional
  useEffect(() => {
    // Listener para mudanças de tema
    const handleThemeChange = (e: ThemeToggledEvent) => {
      console.log("Tema alterado:", e.detail?.theme);
      // Forçar uma atualização do componente
      setMounted(false);
      setTimeout(() => setMounted(true), 0);
    };
    
    window.addEventListener('themeToggled', handleThemeChange as EventListener);
    return () => window.removeEventListener('themeToggled', handleThemeChange as EventListener);
  }, []);

  // Carregue informações do usuário do cookie ou localStorage
  useEffect(() => {
    try {
      const token = getCookieClient();
      
      if (!token) {
        setUser(null);
        return;
      }
      
      const userDataString = localStorage.getItem('user_data');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUser({
          name: userData.name || 'Usuário',
          role: userData.role || 'user'
        });
      } else {
        setUser({
          name: 'Usuário Globoo',
          role: 'user'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar informações do usuário:', error);
      setUser(null);
    }
  }, []);

  // Ensure consistent animations after initial mount
  useEffect(() => {
    setMounted(true);
    
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || 
       (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark'); // Aqui também
    } else {
      document.body.classList.remove('dark');
    }
    
    // Set CSS variable for sidebar width
    if (mounted) {
      const widthMap = {
        open: '16rem',
        closed: '4.5rem',
        hidden: '0rem'
      };
      
      document.documentElement.style.setProperty(
        '--sidebar-width',
        widthMap[currentState]
      );
    }
  }, [currentState, mounted]);

  // Função para verificar permissões
  const hasPagePermission = useCallback(async (key: string) => {
    if (!user) return false;
    
    const rolePermissions: Record<string, string[]> = {
      admin: ['dashboard', 'backoffice', 'workers', 'documents', 'templates', 'timesheet', 'payroll', 'invoices', 'visitors', 'providers', 'tasks'],
      manager: ['dashboard', 'workers', 'documents', 'timesheet', 'visitors'],
      user: ['dashboard', 'backoffice', 'workers', 'documents', 'templates', 'timesheet', 'payroll', 'invoices', 'visitors', 'providers', 'tasks']
    };
    
    const defaultPermissions = ['dashboard'];
    
    if (user.role && rolePermissions[user.role]) {
      return rolePermissions[user.role].includes(key) || defaultPermissions.includes(key);
    }
    
    return defaultPermissions.includes(key);
  }, [user]);

  // Todos os itens do menu disponíveis
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

  // Carregar permissões dos menus
  useEffect(() => {
    const loadMenuPermissions = async () => {
      const allowedMenus = [];

      for (const menuItem of allMenuItems) {
        if (!menuItem.key || await hasPagePermission(menuItem.key)) {
          allowedMenus.push(menuItem);
        }
      }

      setVisibleMenus(allowedMenus);
      setLoading(false);
    };

    loadMenuPermissions();
  }, [allMenuItems, hasPagePermission]);

  // Check if a link is active
  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href);
  };

  // Animation variants
  const sidebarVariants = {
    open: {
      width: "16rem",
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 30,
        mass: 1
      }
    },
    closed: {
      width: "4.5rem",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }
    },
    hidden: {
      width: "0rem",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }
    }
  };

  const linksContainerVariants = {
    open: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
        staggerDirection: 1
      }
    },
    closed: {
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1
      }
    },
    hidden: {
      transition: {
        staggerChildren: 0.01,
        staggerDirection: -1
      }
    }
  };

  const linkVariants = {
    open: {
      y: 0,
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 250,
        damping: 20,
        mass: 0.85
      }
    },
    closed: {
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    hidden: {
      opacity: 0,
      x: -20,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  const bgInitial = { backgroundPosition: "0% 0%" };
  const bgAnimate = {
    backgroundPosition: "100% 100%",
    transition: { duration: 30, repeat: Infinity, repeatType: "mirror" as const, ease: "linear" }
  };

  // Não renderizar se estiver hidden
  if (currentState === "hidden") {
    return null;
  }

  if (loading) {
    return (
      <motion.div
        className="side-nav fixed top-0 left-0 z-40 h-screen border-r border-gray-200 dark:border-gray-800/30"
        initial={false}
        animate={currentState}
        variants={sidebarVariants}
      >
        <motion.div
          className="h-full bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/30 flex flex-col relative overflow-hidden"
          initial={bgInitial}
          animate={bgAnimate}
          style={{
            backgroundSize: "200% 200%",
          }}
        >
          {/* Toggle button */}
          <div className={`flex justify-${isOpen ? 'end' : 'center'} p-4`}>
            <motion.button
              onClick={toggleSidebar}
              className="p-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 dark:text-blue-100 backdrop-blur-sm transition-colors z-50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={false}
              animate={{
                rotate: isOpen ? 0 : 180,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
            >
              {isOpen ? <HiX size={18} /> : <HiMenuAlt2 size={18} />}
            </motion.button>
          </div>

          {/* Loading content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="side-nav fixed top-0 left-0 z-40 h-screen border-r border-gray-200 dark:border-gray-800/30"
      initial={false}
      animate={currentState}
      variants={sidebarVariants}
    >
      <motion.div
        className="h-full bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/30 flex flex-col relative overflow-hidden"
        initial={bgInitial}
        animate={bgAnimate}
        style={{
          backgroundSize: "200% 200%",
        }}
      >
        {/* Toggle button */}
        <div className={`flex justify-${isOpen ? 'end' : 'center'} p-4`}>
          <motion.button
            onClick={toggleSidebar}
            className="p-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 dark:text-blue-100 backdrop-blur-sm transition-colors z-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={false}
            animate={{
              rotate: isOpen ? 0 : 180,
              transition: { type: "spring", stiffness: 300, damping: 20 }
            }}
          >
            {isOpen ? <HiX size={18} /> : <HiMenuAlt2 size={18} />}
          </motion.button>
        </div>

        {/* Logo area */}
        <motion.div
          className={`mx-auto ${isOpen ? 'p-5 pt-0' : 'p-3 justify-center'} ${isOpen ? 'mb-8' : 'mb-1'}`}
        >
          <motion.div
            className={`${isOpen ? "w-22 h-22" : "w-12 h-12"} rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-300/20 dark:shadow-blue-500/20`}
            whileHover={{
              scale: 1.08,
              rotate: [0, -3, 3, 0],
              transition: {
                rotate: {
                  duration: 0.6,
                  ease: "easeInOut",
                  repeat: 0
                },
                scale: {
                  duration: 0.2
                }
              }
            }}
            animate={{
              y: [0, -2, 0],
              transition: {
                y: {
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "easeInOut"
                }
              }
            }}
          >
            <LottieLogo isOpen={isOpen} />
          </motion.div>
        </motion.div>

        {/* User info */}
        <AnimatePresence>
          {isOpen && user && (
            <motion.div
              className="px-4 mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-3 border border-cyan-200 dark:border-cyan-800">
                <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-cyan-600 dark:text-cyan-400 capitalize">
                  {user.role || "user"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation links */}
        <motion.nav
          className="flex-1 px-3 overflow-y-auto"
          variants={linksContainerVariants}
        >
          {visibleMenus.map((item) => {
            const active = isActive(item.href);

            return (
              <motion.div
                key={item.key}
                variants={linkVariants}
                className="mb-3.5"
              >
                <Link href={item.href}>
                  <motion.div
                    className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'} gap-3.5 p-3 rounded-xl ${active
                            ? 'bg-cyan-50 dark:bg-cyan-900/20'
                            : 'hover:bg-blue-50 dark:hover:bg-white/5'
                        } transition-all cursor-pointer group relative overflow-hidden`}
                    whileHover={{
                      x: 5,
                      backgroundColor: active
                          ? "rgba(6, 182, 212, 0.15)"
                          : "rgba(59, 130, 246, 0.1)",
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: mounted ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {/* Active indicator line */}
                    {active && (
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-cyan-500 dark:bg-cyan-400 rounded-r-md"
                        layoutId="activeNavIndicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}

                    {/* Highlight ripple animation on hover */}
                    <motion.div
                      className={`absolute inset-0 ${active ? 'bg-cyan-500/15' : 'bg-cyan-500/10'} rounded-xl`}
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{
                        scale: [0, 2],
                        opacity: [0, 0.15, 0],
                        transition: {
                          scale: { duration: 1.2, ease: "easeOut" },
                          opacity: { duration: 1.2, ease: "easeOut" }
                        }
                      }}
                    />

                    {/* Icon */}
                    <motion.div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg ${active
                              ? 'bg-cyan-200/80 dark:bg-cyan-800/40 text-cyan-700 dark:text-cyan-200'
                              : 'bg-blue-100/80 dark:bg-white/5 text-cyan-600 dark:text-cyan-300'
                          } group-hover:text-cyan-700 dark:group-hover:text-cyan-200 transition-colors`}
                      whileHover={{
                        scale: 1.1,
                        rotate: [0, -4, 4, 0],
                        transition: {
                          rotate: {
                            duration: 0.4,
                            ease: "easeInOut",
                            repeat: 0
                          }
                        }
                      }}
                    >
                      {item.icon}
                    </motion.div>

                    {/* Link text */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span
                          className={`${active
                                  ? 'text-cyan-700 dark:text-cyan-300 font-semibold'
                                  : 'text-gray-700 dark:text-gray-200'
                              } group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors whitespace-nowrap font-medium text-[14px]`}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -5 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30
                          }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}

          {/* Mensagem quando não há links visíveis */}
          {visibleMenus.length === 0 && user && (
            <motion.div
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sem permissões de acesso
              </p>
            </motion.div>
          )}
        </motion.nav>

        {/* Theme toggle button */}
        <div className={`px-3 mx-auto ${isOpen ? 'mb-2' : 'flex justify-center mb-2'}`}>
          <ThemeToggle />
        </div>

        {/* Footer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="p-4 border-t border-gray-200/50 dark:border-white/5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: 0.1
              }}
            >
              <motion.div
                className="text-xs text-gray-500 dark:text-gray-400 text-center"
                whileHover={{ color: "#4B5563" }}
              >
                Globoo Admin © 2025
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}