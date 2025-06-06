"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, X, Calendar, FileText } from "lucide-react";
import { Worker } from "@/types/worker.type";
import { TimeSheet } from "@/types/timeSheet.type";
import { getActiveWorkers } from "@/server/worker/worker.actions";
import { 
  getTimeSheets, 
  getTimeSheetsByWorker,
  handleCreateTimeSheet,
  handleUpdateTimeSheet
} from "@/server/timeSheet/timeSheet.actions";
import Modal from "@/components/ui/Modal";

// Variantes para animação do container principal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Variantes para animação dos itens
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 }
  }
};

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
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

// Função para formatar data e hora
const formatDateTime = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return "Não registrada";

  try {
    // Garantir que estamos trabalhando com um objeto Date
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) return "Data inválida";

    // Normalizar para o fuso horário local sem alterar a data/hora
    const formattedDate = date.toLocaleDateString("pt-BR");
    const formattedTime = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false // Garantir formato 24h para evitar confusões
    });

    // Retornar a data e hora formatadas
    return `${formattedDate} às ${formattedTime}`;
  } catch (error) {
    console.error("Erro formatando data:", error);
    return "Erro no formato";
  }
};

// Função para formatar apenas a data
const formatDate = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return "Não registrada";

  try {
    // Garantir que estamos trabalhando com um objeto Date
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) return "Data inválida";
    
    // Usar opções específicas para garantir consistência
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch (error) {
    console.error("Erro formatando data:", error);
    return "Erro no formato";
  }
};

// Função para comparar se duas datas são do mesmo dia
const isSameDay = (date1: Date | string | undefined | null, date2: Date | string | undefined | null): boolean => {
  if (!date1 || !date2) return false;
  
  // Garantir que estamos trabalhando com objetos Date
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  
  // Verificar se as datas são válidas
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  
  // Comparar ano, mês e dia
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// Função auxiliar para formatar data no formato aceito pela API (YYYY-MM-DD)
const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Componente para exibir o histórico de registros de ponto
interface LogHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
}

// Componente para exibir o histórico de registros de ponto
const LogHistoryModal: React.FC<LogHistoryModalProps> = ({ isOpen, onClose, worker }) => {
  const [timeSheets, setTimeSheets] = useState<TimeSheet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Usando useCallback para evitar recriações desnecessárias da função
  const fetchWorkerTimeSheets = useCallback(async (workerId: string) => {
    setLoading(true);
    try {
      const data = await getTimeSheetsByWorker(workerId);
      setTimeSheets(data);
    } catch (error) {
      console.error('Erro ao buscar registros de ponto:', error);
      setTimeSheets([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Busca os registros quando o modal é aberto
  useEffect(() => {
    if (isOpen && worker.id) {
      fetchWorkerTimeSheets(worker.id);
    }
  }, [isOpen, worker.id, fetchWorkerTimeSheets]);

  // Função para agrupar logs por data
  const groupTimeSheetsByDate = useCallback((): Record<string, TimeSheet[]> => {
    const grouped: Record<string, TimeSheet[]> = {};

    if (timeSheets && timeSheets.length > 0) {
      timeSheets.forEach((timeSheet) => {
        // Determina qual data usar para agrupar
        let dateToUse: string | Date;

        // Prioriza a data efetiva do registro (entryTime para registros normais)
        if (timeSheet.entryTime) {
          dateToUse = timeSheet.entryTime;
        } else if (timeSheet.isAbsent && timeSheet.createdAt) {
          // Para ausências sem entrada, usa a data de criação
          dateToUse = timeSheet.createdAt;
        } else if (timeSheet.date) {
          // Usa a data do registro se disponível
          dateToUse = timeSheet.date;
        } else {
          // Fallback para casos extremos
          dateToUse = new Date().toISOString();
        }
        
        // Cria uma data com apenas ano, mês e dia para garantir consistência
        const date = new Date(dateToUse);
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        
        // Cria uma nova data às 12:00 para evitar problemas de fuso horário
        const normalizedDate = new Date(year, month, day, 12, 0, 0);
        const dateKey = normalizedDate.toISOString().split("T")[0]; // Formato YYYY-MM-DD

        // Agrupa os logs pela data normalizada
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        
        grouped[dateKey].push(timeSheet);
      });
    }

    return grouped;
  }, [timeSheets]);

  const groupedTimeSheets = useMemo(() => groupTimeSheetsByDate(), [groupTimeSheetsByDate]);
  
  // Ordena as datas do mais recente para o mais antigo
  const sortedDates = useMemo(() => 
    Object.keys(groupedTimeSheets).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    ), 
    [groupedTimeSheets]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Histórico de Ponto - ${worker.name}`}
      size="lg"
      closeOnOutsideClick={true}
    >
      <div className="flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mr-6">
          <span className="font-medium">Cargo:</span> {worker.position}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">E-mail:</span> {worker.email}
        </div>
      </div>

      <div className="p-1 flex-1 max-h-[60vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <Calendar className="mr-2 text-cyan-500" size={18} />
          Histórico de Registros de Ponto
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <motion.div
              className="w-8 h-8 border-4 border-gray-200 rounded-full"
              style={{ borderTopColor: "#22d3ee" }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Nenhum registro de ponto encontrado
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((dateKey) => (
              <div
                key={dateKey}
                className="border rounded-lg overflow-hidden"
              >
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium">
                  {(() => {
                    // Garantir que a data mostrada no cabeçalho corresponda às entradas
                    const dateForDisplay = groupedTimeSheets[dateKey][0].entryTime || 
                                          groupedTimeSheets[dateKey][0].date || 
                                          groupedTimeSheets[dateKey][0].createdAt || 
                                          dateKey;
                    
                    // Cria uma nova data normalizada para exibição consistente
                    const date = new Date(dateForDisplay);
                    return date.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
                  })()}
                </div>
                <div className="divide-y">
                  {groupedTimeSheets[dateKey].map((timeSheet, idx) => (
                    <div key={idx} className="px-4 py-3">
                      {timeSheet.isAbsent ? (
                        <div className="flex flex-col">
                          <div className="flex items-center text-yellow-600">
                            <FileText size={16} className="mr-2" />
                            <span className="font-medium">
                              Dia não trabalhado
                            </span>
                            <span className="text-gray-500 dark:text-gray-300 ml-2 text-sm">
                              {formatDate(timeSheet.date || timeSheet.createdAt)}
                            </span>
                          </div>
                          {timeSheet.entryTime && (
                            <div className="flex items-center text-green-600 mt-1 ml-6">
                              <Clock size={16} className="mr-2" />
                              <span>
                                Entrada atrasada: {formatDateTime(timeSheet.entryTime)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center text-green-600">
                            <Clock size={16} className="mr-2" />
                            <span>
                              Entrada: {formatDateTime(timeSheet.entryTime)}
                            </span>
                          </div>
                          {timeSheet.leaveTime && (
                            <div className="flex items-center text-red-600">
                              <Clock size={16} className="mr-2" />
                              <span>
                                Saída: {formatDateTime(timeSheet.leaveTime)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

/**
 * Props para o componente WorkerRow
 */
interface WorkerRowProps {
  worker: Worker;
  timeSheets: TimeSheet[];
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onFaltou: (id: string) => void;
  onNameClick: (worker: Worker) => void;
}

/**
 * Componente que exibe uma linha da tabela com informações de um funcionário
 */
const WorkerRow: React.FC<WorkerRowProps> = ({
  worker,
  timeSheets,
  onCheckIn,
  onCheckOut,
  onFaltou,
  onNameClick,
}) => {
  // Obtém o último registro de ponto do funcionário (se houver)
  const lastTimeSheet = timeSheets && timeSheets.length > 0
    ? timeSheets[0] // Assumindo que já está ordenado por data
    : null;

  // Verifica se o último log é do dia atual
  const isToday = lastTimeSheet ? 
    isSameDay(new Date(), lastTimeSheet.entryTime || lastTimeSheet.date || lastTimeSheet.createdAt) : 
    false;
  
  // Define o estado dos botões
  const checkInDisabled = useMemo(() => {
    // Se não há registro, entrada sempre habilitada
    if (!lastTimeSheet) return false;
    
    // Se não é hoje, entrada sempre habilitada
    if (!isToday) return false;
    
    // Se já tem qualquer registro de hoje (incluindo falta), desabilitar entrada
    if (isToday) {
      // Se é uma falta sem entrada, desabilitar entrada normal
      if (lastTimeSheet.isAbsent === true && !lastTimeSheet.entryTime) {
        return true;
      }
      
      // Se já tem entrada (sem saída) hoje, desabilitar entrada
      if (lastTimeSheet.entryTime && !lastTimeSheet.leaveTime && !lastTimeSheet.isAbsent) {
        return true;
      }
      
      // Se já tem entrada E saída hoje, desabilitar entrada (ciclo completo)
      if (lastTimeSheet.entryTime && lastTimeSheet.leaveTime && !lastTimeSheet.isAbsent) {
        return true;
      }
    }
    
    // Nos outros casos, habilitar entrada
    return false;
  }, [lastTimeSheet, isToday]);
  
  // Só permite saída se há uma entrada sem saída no dia de hoje
  const checkOutDisabled = useMemo(() => {
    // Se não há registro, saída desabilitada
    if (!lastTimeSheet) return true;
    
    // Se não é hoje, saída desabilitada
    if (!isToday) return true;
    
    // Se tem entrada mas não tem saída, habilitar saída
    if (lastTimeSheet.entryTime && !lastTimeSheet.leaveTime && !lastTimeSheet.isAbsent)
      return false;
      
    // Nos outros casos, desabilitar saída
    return true;
  }, [lastTimeSheet, isToday]);

  // Desativa o botão "Faltou" se já existe um registro para hoje
  const faltouDisabled = useMemo(() => isToday, [isToday]);

  /**
   * Determina o status atual do funcionário
   * @returns Status como string: "Ausente", "Presente", "Faltou" ou "Atrasado"
   */
  const getStatus = useCallback((): string => {
    if (!lastTimeSheet) return "Ausente";
    
    // Não está presente hoje
    if (!isToday) return "Ausente";
    
    // Se há um registro de falta, mas também há um horário de entrada após a falta
    if (lastTimeSheet.isAbsent === true && lastTimeSheet.entryTime) {
      return "Atrasado";
    }
    
    // Se há apenas o registro de falta (sem entrada)
    if (lastTimeSheet.isAbsent === true) return "Faltou";
    
    // Se tem entrada mas não tem saída
    if (!lastTimeSheet.leaveTime) return "Presente";
    
    // Se tem entrada e saída no mesmo dia
    return "Ausente";
  }, [lastTimeSheet, isToday]);

  const status = useMemo(() => getStatus(), [getStatus]);

  return (
    <tr className="hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors">
      <td 
        className="px-6 py-4 whitespace-nowrap cursor-pointer"
        onClick={() => onNameClick(worker)}
      >
        <div className="text-sm font-medium text-stone-900 dark:text-gray-100 flex items-center">
          {worker.name}
          <Calendar className="ml-2 h-4 w-4 text-stone-400 dark:text-gray-500" />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-stone-500 dark:text-gray-400">{worker.position}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {lastTimeSheet ? (
          lastTimeSheet.isAbsent ? (
            <div className="flex flex-col">
              <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                <FileText className="h-4 w-4 mr-1" />
                <span className="text-xs">
                  Dia não trabalhado: {formatDate(lastTimeSheet.date || lastTimeSheet.createdAt)}
                </span>
              </div>
              {/* Mostra entrada atrasada se houver */}
              {lastTimeSheet.entryTime && (
                <div className="flex items-center text-xs text-stone-600 dark:text-gray-300 mt-1">
                  <Clock className="h-3 w-3 mr-1" /> Entrada atrasada: {formatDateTime(lastTimeSheet.entryTime)}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center text-xs text-stone-600 dark:text-gray-300 mb-1">
                <Clock className="h-3 w-3 mr-1" /> Entrada:{" "}
                {lastTimeSheet.entryTime
                  ? formatDateTime(lastTimeSheet.entryTime)
                  : "Não registrada"}
              </div>
              <div className="flex items-center text-xs text-stone-600 dark:text-gray-300">
                <Clock className="h-3 w-3 mr-1" /> Saída:{" "}
                {lastTimeSheet.leaveTime
                  ? formatDateTime(lastTimeSheet.leaveTime)
                  : "Não registrada"}
              </div>
            </div>
          )
        ) : (
          <span className="text-xs text-stone-500 dark:text-gray-400">Sem registros</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${status === "Presente"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              : status === "Faltou"
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
              : status === "Atrasado"
              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          {status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="flex space-x-2 justify-center">
          <motion.button
            onClick={() => onCheckIn(worker.id)}
            disabled={checkInDisabled}
            className={`px-3 py-1 rounded text-xs font-medium ${
              checkInDisabled
                ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-800/40"
            }`}
            whileHover={!checkInDisabled ? { scale: 1.05 } : {}}
            whileTap={!checkInDisabled ? { scale: 0.95 } : {}}
          >
            Entrada
          </motion.button>
          <motion.button
            onClick={() => onCheckOut(worker.id)}
            disabled={checkOutDisabled}
            className={`px-3 py-1 rounded text-xs font-medium ${
              checkOutDisabled
                ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/40"
            }`}
            whileHover={!checkOutDisabled ? { scale: 1.05 } : {}}
            whileTap={!checkOutDisabled ? { scale: 0.95 } : {}}
          >
            Saída
          </motion.button>
          <motion.button
            onClick={() => onFaltou(worker.id)}
            disabled={faltouDisabled}
            className={`px-3 py-1 rounded text-xs font-medium ${
              faltouDisabled
                ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-800/40"
            }`}
            whileHover={!faltouDisabled ? { scale: 1.05 } : {}}
            whileTap={!faltouDisabled ? { scale: 0.95 } : {}}
          >
            Faltou
          </motion.button>
        </div>
      </td>
    </tr>
  );
};

/**
 * Componente principal da página de controle de ponto
 */
const TimeSheetPage: React.FC = () => {
  // Estados locais
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerTimeSheets, setWorkerTimeSheets] = useState<Record<string, TimeSheet[]>>({}); // Corrigido para TimeSheet[]
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);

  // Limpa as mensagens de sucesso e erro - usando useCallback para evitar recriações desnecessárias
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  // Função para buscar os dados dos funcionários e seus registros
  // Usando useCallback para evitar problemas de dependência no useEffect
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const workersData = await getActiveWorkers();
      
      if (!workersData || workersData.length === 0) {
        setWorkers([]);
        setWorkerTimeSheets({});
        return;
      }
      
      setWorkers(workersData);
      
      // Busca os timeSheets recentes de cada funcionário
      const timeSheetsByWorker: Record<string, TimeSheet[]> = {}; // Corrigido para TimeSheet[]
      
      for (const worker of workersData) {
        if (!worker.id) continue;
        
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        try {
          // Busca os timeSheets dos últimos 30 dias
          const workerTimeSheets = await getTimeSheets({
            workerId: worker.id,
            startDate: formatDateForAPI(thirtyDaysAgo),
            endDate: formatDateForAPI(today),
          });
          
          // Ordena os timeSheets pelo mais recente
          if (workerTimeSheets && workerTimeSheets.length > 0) {
            workerTimeSheets.sort((a, b) => {
              const dateA = new Date(a.date || a.createdAt || '');
              const dateB = new Date(b.date || b.createdAt || '');
              return dateB.getTime() - dateA.getTime();
            });
            
            timeSheetsByWorker[worker.id] = workerTimeSheets;
          } else {
            timeSheetsByWorker[worker.id] = [];
          }
        } catch (workerError) {
          console.error(`Erro ao buscar dados para o funcionário ${worker.id}:`, workerError);
          timeSheetsByWorker[worker.id] = [];
        }
      }
      
      setWorkerTimeSheets(timeSheetsByWorker);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar dados. Por favor, tente novamente.');
      setWorkers([]);
      setWorkerTimeSheets({});
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega os funcionários e configura atualização periódica
  useEffect(() => {
    fetchData();
    
    // Configura um intervalo para atualizar a lista a cada minuto
    const intervalId = setInterval(() => {
      fetchData();
    }, 60000); // 60 segundos
    
    // Limpa o intervalo ao desmontar o componente
    return () => clearInterval(intervalId);
  }, [fetchData]); 

  // Ordenar os trabalhadores por nome
  const sortedWorkers = useMemo(() => {
    return [...workers].sort((a, b) => 
      a.name.localeCompare(b.name, 'pt-BR')
    );
  }, [workers]);

  // Obter o funcionário selecionado
  const selectedWorker = useMemo(() => 
    selectedWorkerId ? sortedWorkers.find((w) => w.id === selectedWorkerId) : null
  , [selectedWorkerId, sortedWorkers]);

  // Filtrar funcionários com base no termo de busca
  const filteredWorkers = useMemo(() => {
    return sortedWorkers.filter(
      (worker) =>
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (worker.department?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  }, [sortedWorkers, searchTerm]);

  /**
   * Handler para registrar entrada de um funcionário
   * @param workerId - ID do funcionário
   */
  const handleCheckIn = useCallback(async (workerId: string): Promise<void> => {
    try {
      clearMessages();
      const today = new Date();
      const workerSheets = workerTimeSheets[workerId] || [];
      const lastSheet = workerSheets.length > 0 ? workerSheets[0] : null;
      
      // Verifica se já tem um registro de hoje
      const isLastLogToday = lastSheet ? 
        isSameDay(today, lastSheet.entryTime || lastSheet.date || lastSheet.createdAt) : 
        false;
      
      // Verificar se já existe qualquer registro para hoje
      const hasAnyTodayRecord = workerSheets.some(sheet => 
        isSameDay(today, sheet.date || sheet.entryTime || sheet.createdAt)
      );
      
      // Se já existe um registro hoje que não seja falta sem entrada, mostra uma mensagem informativa
      if (hasAnyTodayRecord && !(lastSheet?.isAbsent === true && !lastSheet?.entryTime && isLastLogToday)) {
        // Vamos analisar o tipo de registro existente para dar uma mensagem mais precisa
        if (lastSheet) {
          if (lastSheet.isAbsent && !lastSheet.entryTime) {
            setError("Este funcionário já foi marcado como ausente hoje. Para registrar presença, clique no botão de entrada para marcar uma entrada atrasada.");
            return;
          } else if (lastSheet.entryTime && !lastSheet.leaveTime) {
            setError("Este funcionário já registrou entrada hoje às " + 
              formatDateTime(lastSheet.entryTime) + " e ainda não registrou saída.");
            return;
          } else if (lastSheet.entryTime && lastSheet.leaveTime) {
            setError("Este funcionário já completou o registro de ponto hoje (entrada às " + 
              formatDateTime(lastSheet.entryTime) + " e saída às " + 
              formatDateTime(lastSheet.leaveTime) + ").");
            return;
          }
        }
        
        // Mensagem genérica como fallback
        setError("Já existe um registro de ponto para este funcionário hoje. Não é possível registrar uma nova entrada.");
        return;
      }
      
      // Se for uma ausência hoje sem entrada, permite registrar entrada atrasada
      if (lastSheet && lastSheet.isAbsent === true && isLastLogToday && !lastSheet.entryTime && lastSheet.id) {
        // Atualiza o registro de falta para entrada atrasada
        const response = await handleUpdateTimeSheet(lastSheet.id, {
          entryTime: today.toISOString(),
        });
        
        if (response.error) {
          if (typeof response.error === 'string' && 
              response.error.includes("Já existe um registro")) {
            setError("Não é possível registrar entrada atrasada pois já existe outro registro para hoje.");
          } else {
            throw new Error(response.error);
          }
          return;
        }
        
        setSuccessMessage("Entrada atrasada registrada com sucesso!");
        await fetchData();
        return;
      }
      
      // Caso não exista registro hoje, cria um novo
      const response = await handleCreateTimeSheet({
        workerId: workerId,
        date: formatDateForAPI(today),
        entryTime: today.toISOString(),
        isAbsent: false
      });
      
      if (response.error) {
        if (typeof response.error === 'string' && 
            response.error.includes("Já existe um registro")) {
          setError("Não foi possível registrar entrada pois já existe um registro para hoje. Atualize a página para ver o registro atual.");
        } else {
          throw new Error(response.error);
        }
        return;
      }
      
      setSuccessMessage("Entrada registrada com sucesso!");
      
      // Atualiza os dados
      await fetchData();
    } catch (error) {
      console.error("Erro ao registrar entrada:", error);
      
      // Mensagem de erro mais amigável e informativa
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("Já existe um registro")) {
        setError("Já existe um registro de ponto para este funcionário hoje. Atualize a página para visualizar o registro atual.");
      } else {
        setError("Não foi possível registrar a entrada. Erro: " + errorMessage);
      }
    }
  }, [workerTimeSheets, fetchData, clearMessages]);

  /**
   * Handler para registrar saída de um funcionário
   * @param workerId - ID do funcionário
   */
  const handleCheckOut = useCallback(async (workerId: string): Promise<void> => {
    try {
      clearMessages();
      const now = new Date();
      const workerSheets = workerTimeSheets[workerId] || [];
      
      // Encontrar o registro sem saída mais recente
      const openTimeSheet = workerSheets.find(sheet => 
        sheet.entryTime && !sheet.leaveTime && !sheet.isAbsent
      );
      
      if (openTimeSheet && openTimeSheet.id) {
        // Verificar se a entrada e saída são de dias diferentes
        const entryDate = openTimeSheet.entryTime instanceof Date 
          ? openTimeSheet.entryTime 
          : new Date(openTimeSheet.entryTime || '');
        
        // Se for no mesmo dia, atualiza o registro normalmente
        if (isSameDay(entryDate, now)) {
          const response = await handleUpdateTimeSheet(openTimeSheet.id, { 
            leaveTime: now.toISOString() 
          });
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          setSuccessMessage("Saída registrada com sucesso!");
        } else {
          // Se for em dias diferentes, fechamos o registro anterior e criamos um novo
          const entryDayEnd = new Date(
            entryDate.getFullYear(),
            entryDate.getMonth(),
            entryDate.getDate(),
            23, 59, 59
          );
          
          const updateResponse = await handleUpdateTimeSheet(openTimeSheet.id, { 
            leaveTime: entryDayEnd.toISOString()
          });
          
          if (updateResponse.error) {
            throw new Error(updateResponse.error);
          }
          
          // Criamos um novo registro para o dia atual
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0, 0, 0
          );
          
          const createResponse = await handleCreateTimeSheet({
            workerId: workerId,
            date: formatDateForAPI(now),
            entryTime: todayStart.toISOString(),
            leaveTime: now.toISOString(),
            isAbsent: false
          });
          
          if (createResponse.error) {
            throw new Error(createResponse.error);
          }
          
          setSuccessMessage("Registros atualizados com sucesso!");
        }
      } else {
        // Fallback - se não houver entrada, cria um registro apenas com saída
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        
        const response = await handleCreateTimeSheet({
          workerId: workerId,
          date: formatDateForAPI(now),
          entryTime: today.toISOString(),
          leaveTime: today.toISOString(),
          isAbsent: false
        });
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        setSuccessMessage("Entrada e saída registradas com sucesso!");
      }
      
      // Atualiza os dados
      await fetchData();
    } catch (error) {
      console.error("Erro ao registrar saída:", error);
      setError(typeof error === 'object' && error !== null && 'message' in error
        ? String((error as Error).message)
        : "Não foi possível registrar a saída. Tente novamente.");
    }
  }, [workerTimeSheets, fetchData, clearMessages]);

  /**
   * Handler para registrar falta de um funcionário
   * @param workerId - ID do funcionário
   */
  const handleFaltou = useCallback(async (workerId: string): Promise<void> => {
    try {
      clearMessages();
      const now = new Date();
      
      // Verificar se já existe um registro para o funcionário nesta data
      const workerSheets = workerTimeSheets[workerId] || [];
      const today = new Date();
      const hasEntryToday = workerSheets.some(sheet => 
        isSameDay(today, sheet.date || sheet.entryTime || sheet.createdAt)
      );
      
      if (hasEntryToday) {
        setError("Já existe um registro para este funcionário hoje. Não é possível marcar falta.");
        return;
      }
      
      const response = await handleCreateTimeSheet({
        workerId: workerId,
        date: formatDateForAPI(now),
        isAbsent: true
      });
      
      if (response.error) {
        // Verifica se a mensagem de erro contém a string específica
        if (typeof response.error === 'string' && 
            response.error.includes("Já existe um registro")) {
          setError("Já existe um registro para este funcionário hoje. Não é possível marcar falta.");
        } else {
          throw new Error(response.error);
        }
      } else {
        setSuccessMessage("Falta registrada com sucesso!");
        // Atualiza os dados
        await fetchData();
      }
    } catch (error) {
      console.error("Erro ao registrar falta:", error);
      setError(typeof error === 'object' && error !== null && 'message' in error
        ? String((error as Error).message)
        : "Não foi possível registrar a falta. Tente novamente.");
    }
  }, [workerTimeSheets, fetchData, clearMessages]);

  /**
   * Handler para abrir o modal de histórico de um funcionário
   * @param worker - Objeto do funcionário
   */
  const handleNameClick = useCallback((worker: Worker): void => {
    if (worker.id) {
      setSelectedWorkerId(worker.id);
      setIsLogModalOpen(true);
    }
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
        <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Controle de Ponto</h1>
        <p className="text-stone-500 dark:text-gray-400 mt-1">Registro de entradas e saídas dos funcionários</p>
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
              onClose={() => setSuccessMessage(null)}
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
              onClose={() => setError(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-stone-100 dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b dark:border-gray-700 gap-3">
          <h2 className="text-xl font-semibold text-stone-800 dark:text-gray-100">Registro de Ponto</h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-grow sm:flex-grow-0">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-stone-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-stone-900 dark:text-gray-100 placeholder-stone-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors"
                placeholder="Buscar funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabela de Funcionários */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 dark:divide-gray-700">
            <thead className="bg-stone-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                  Cargo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
                  Último Registro
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-stone-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <motion.div
                        className="w-12 h-12 mb-3 border-4 border-stone-200 dark:border-gray-700 rounded-full"
                        style={{ borderTopColor: "#22d3ee" }}
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <motion.span
                        className="text-cyan-500 dark:text-cyan-400 font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        Carregando dados...
                      </motion.span>
                    </div>
                  </td>
                </tr>
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-stone-500 dark:text-gray-400">
                    {searchTerm
                      ? "Nenhum funcionário encontrado com esse termo de busca."
                      : "Nenhum funcionário encontrado."}
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <WorkerRow
                    key={worker.id}
                    worker={worker}
                    timeSheets={workerTimeSheets[worker.id] || []}
                    onCheckIn={handleCheckIn}
                    onCheckOut={handleCheckOut}
                    onFaltou={handleFaltou}
                    onNameClick={handleNameClick}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal para exibir histórico de ponto */}
      {selectedWorker && (
        <LogHistoryModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          worker={selectedWorker}
        />
      )}
    </motion.div>
  );
};

export default TimeSheetPage;