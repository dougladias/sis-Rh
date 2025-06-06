"use client"
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlusIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  TagIcon 
} from '@heroicons/react/24/outline';

type Categoria = "Pessoal" | "Trabalho" | "Estudos";

type Tarefa = {
  texto: string;
  concluida: boolean;
  categoria: Categoria;
};

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

// Componente de Alerta personalizado para manter consistência com a página de templates
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

export default function PaginaHome() {
  const [tarefa, setTarefa] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Pessoal");
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [erro, setErro] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Efeito para verificar o tema e aplicar o modo escuro
  useEffect(() => {
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
      console.log("Tasks page: Tema alterado para", e.detail?.theme);
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

  // Carrega tarefas do localStorage ao iniciar
  useEffect(() => {
    const tarefasSalvas = localStorage.getItem("tarefas");
    if (tarefasSalvas) {
      setTarefas(JSON.parse(tarefasSalvas));
    }
  }, []);

  // Salva tarefas no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("tarefas", JSON.stringify(tarefas));
  }, [tarefas]);

  // Filtra tarefas com base no termo de busca
  const filteredTarefas = React.useMemo(() => {
    if (!searchTerm) return tarefas;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return tarefas.filter(t => 
      t.texto.toLowerCase().includes(lowerSearchTerm) || 
      t.categoria.toLowerCase().includes(lowerSearchTerm)
    );
  }, [tarefas, searchTerm]);

  function adicionarTarefa() {
    if (tarefa.trim() === "") {
      setErro("Digite uma tarefa!");
      return;
    }
    if (tarefas.some(t => t.texto === tarefa.trim() && t.categoria === categoria)) {
      setErro("Tarefa já existe nesta categoria!");
      return;
    }
    setTarefas([...tarefas, { texto: tarefa.trim(), concluida: false, categoria }]);
    setTarefa("");
    setErro("");
    setConfirmacao("Tarefa adicionada com sucesso!");
    setTimeout(() => setConfirmacao(""), 2000);
  }

  function removerTarefa(index: number) {
    const tarefaIndex = tarefas.findIndex(t => 
      t.texto === filteredTarefas[index].texto && 
      t.categoria === filteredTarefas[index].categoria
    );
    
    if (tarefaIndex !== -1) {
      setTarefas(tarefas.filter((_, i) => i !== tarefaIndex));
      setConfirmacao("Tarefa removida com sucesso!");
      setTimeout(() => setConfirmacao(""), 2000);
    }
  }

  function alternarConcluida(index: number) {
    const tarefaIndex = tarefas.findIndex(t => 
      t.texto === filteredTarefas[index].texto && 
      t.categoria === filteredTarefas[index].categoria
    );
    
    if (tarefaIndex !== -1) {
      setTarefas(tarefas.map((t, i) =>
        i === tarefaIndex ? { ...t, concluida: !t.concluida } : t
      ));
      
      setConfirmacao(
        !tarefas[tarefaIndex].concluida 
          ? "Tarefa marcada como concluída!" 
          : "Tarefa marcada como pendente!"
      );
      setTimeout(() => setConfirmacao(""), 2000);
    }
  }

  function clearNotification(setter: React.Dispatch<React.SetStateAction<string>>) {
    setter("");
  }

  return (
    <motion.div
      className="p-6 min-h-screen bg-stone-50 dark:bg-gray-950"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Minhas Tarefas</h1>
        <p className="text-stone-500 dark:text-gray-400 mt-1">Gerencie suas tarefas diárias</p>
      </motion.div>

      {/* Mensagens de sucesso/erro */}
      <AnimatePresence>
        {erro && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Alert 
              variant="error" 
              message={erro} 
              onClose={() => clearNotification(setErro)} 
            />
          </motion.div>
        )}
        {confirmacao && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Alert 
              variant="success" 
              message={confirmacao} 
              onClose={() => clearNotification(setConfirmacao)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content with shadow and rounded corners */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-stone-100 dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-stone-200 dark:border-gray-700 gap-3">
          <h2 className="text-xl font-semibold text-stone-800 dark:text-gray-100">Lista de Tarefas</h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-grow sm:flex-grow-0">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-stone-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-stone-900 dark:text-gray-100 placeholder-stone-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors"
                placeholder="Buscar tarefa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Formulário de adição */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
              Nova Tarefa
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <input
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors"
                  placeholder="Digite sua tarefa"
                  value={tarefa}
                  onChange={e => setTarefa(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && adicionarTarefa()}
                />
              </div>

              <select
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600"
                value={categoria}
                onChange={e => setCategoria(e.target.value as Categoria)}
              >
                <option value="Pessoal">Pessoal</option>
                <option value="Trabalho">Trabalho</option>
                <option value="Estudos">Estudos</option>
              </select>

              <motion.button
                className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 whitespace-nowrap"
                onClick={adicionarTarefa}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusIcon className="h-5 w-5" />
                <span>Adicionar</span>
              </motion.button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex-1 min-w-[200px]">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Tarefas</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{tarefas.length}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex-1 min-w-[200px]">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tarefas Concluídas</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {tarefas.filter(t => t.concluida).length}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex-1 min-w-[200px]">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tarefas Pendentes</h3>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {tarefas.filter(t => !t.concluida).length}
              </p>
            </div>
          </div>

          {/* Lista de tarefas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                Tarefas {searchTerm ? "Filtradas" : ""}
              </h3>
              {searchTerm && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando {filteredTarefas.length} de {tarefas.length} tarefas
                </p>
              )}
            </div>

            {filteredTarefas.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                {searchTerm ? "Nenhuma tarefa encontrada com esse termo de busca." : "Nenhuma tarefa adicionada."}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTarefas.map((t, i) => (
                  <motion.li
                    key={i}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <motion.button
                          onClick={() => alternarConcluida(i)}
                          className={`flex items-center justify-center h-5 w-5 rounded-full border ${
                            t.concluida
                              ? "bg-green-100 border-green-500 text-green-600 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {t.concluida && <CheckCircleIcon className="h-4 w-4" />}
                        </motion.button>

                        <span
                          className={`text-gray-800 dark:text-gray-200 ${
                            t.concluida ? "line-through text-gray-400 dark:text-gray-500" : ""
                          }`}
                        >
                          {t.texto}
                        </span>

                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          t.categoria === "Pessoal"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                            : t.categoria === "Trabalho"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}>
                          <TagIcon className="h-3 w-3" />
                          {t.categoria}
                        </span>
                      </div>

                      <motion.button
                        onClick={() => removerTarefa(i)}
                        className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Excluir
                      </motion.button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}