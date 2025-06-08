'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Search,
  Bus,
  Utensils,
  Heart,
  GraduationCap,
  Gift,
  Coffee,
  SaveIcon,  
} from 'lucide-react'

// Importar actions e types
import {
  getBenefitsByPayslip,  
  handleCreateBenefit,
  handleUpdateBenefit,
  handleDeleteBenefit,  
} from '@/server/benefit/benefit.actions'
import { getWorkers } from '@/server/worker/worker.actions'
import { 
  Benefit, 
  CreateBenefitRequest,  
  BenefitTypeDescriptions
} from '@/types/benefit.type'
import { Worker } from '@/types/worker.type'
import { toast } from "sonner"

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
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 }
  }
}

// CSS para remover setas dos inputs number
const inputStyles = `
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

// Interface para tipos de benefícios customizados (similar ao projeto original)
interface BenefitType {
  id: string;
  name: string;
  description: string;
  hasDiscount: boolean;
  discountPercentage?: number;
  defaultValue: number;
  status: 'active' | 'inactive';
}

// Mock de holerites (substitua pela sua implementação real)
interface Payslip {
  id: string;
  month: string;
  year: number;
  employeeId: string;
  employeeName: string;
  status: string;
}

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
        ×
      </button>
    </div>
  );
};

export default function BeneficiosPage() {
  const [activeTab, setActiveTab] = useState('funcionarios')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [selectedPayslip, setSelectedPayslip] = useState<string | null>(null)
  const [isEditingEmployee, setIsEditingEmployee] = useState(false)
  const [newBenefit, setNewBenefit] = useState({
    code: '',
    type: '',
    value: 0,
    description: ''
  })

  // Estados para gerenciamento de tipos de benefícios
  const [isNewBenefitTypeModalOpen, setIsNewBenefitTypeModalOpen] = useState(false)
  const [newBenefitType, setNewBenefitType] = useState({
    name: '',
    description: '',
    defaultValue: 0,
    hasDiscount: false,
    discountPercentage: 6
  })
  const [isEditingBenefitType, setIsEditingBenefitType] = useState(false)
  const [editingBenefitType, setEditingBenefitType] = useState<BenefitType | null>(null)
  const [editingValues, setEditingValues] = useState<Record<string, string>>({})

  // Estados de dados
  const [workers, setWorkers] = useState<Worker[]>([])
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Mock de tipos de benefícios baseado no CommonBenefitCodes
  const mockBenefitTypes: BenefitType[] = useMemo(() => 
    Object.entries(BenefitTypeDescriptions).map(([code, description]) => ({
      id: code,
      name: description,
      description: `Benefício de ${description.toLowerCase()}`,
      hasDiscount: code === 'VT' || code === 'VR', // Vale Transporte e Vale Refeição têm desconto
      discountPercentage: code === 'VT' ? 6 : code === 'VR' ? 20 : 0,
      defaultValue: code === 'VT' ? 200 : code === 'VR' ? 500 : code === 'AS' ? 300 : 150,
      status: 'active' as const
    })), 
    []
  )

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

  // Funções auxiliares com useCallback
  const handleError = useCallback((message: string, err: unknown) => {
    console.error(`${message}:`, err);
    setError(message);
    toast.error(message);
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Funções de busca
  const fetchWorkers = useCallback(async () => {
    setLoading(true)
    try {
      const workersData = await getWorkers()

      // Se a resposta for array vazio, pode verificar se foi por falta de autenticação
      if (workersData.length === 0) {
        const hasAuthCookie = document.cookie.includes('session=');
        if (!hasAuthCookie) {
          window.location.href = '/auth/login';
          return;
        }
      }

      setWorkers(workersData)
      
      // Mock de holerites para cada worker
      const mockPayslips: Payslip[] = workersData.flatMap(worker => [
        {
          id: `${worker.id}-2024-01`,
          month: 'Janeiro 2024',
          year: 2024,
          employeeId: worker.id,
          employeeName: worker.name,
          status: 'processed'
        },
        {
          id: `${worker.id}-2024-02`,
          month: 'Fevereiro 2024', 
          year: 2024,
          employeeId: worker.id,
          employeeName: worker.name,
          status: 'processed'
        },
        {
          id: `${worker.id}-2024-03`,
          month: 'Março 2024',
          year: 2024,
          employeeId: worker.id,
          employeeName: worker.name,
          status: 'draft'
        }
      ])
      setPayslips(mockPayslips)
      
    } catch (err: unknown) {
      // Verifica se o erro indica falta de autenticação
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        window.location.href = '/auth/login';
        return;
      }
      
      handleError('Erro ao buscar funcionários', err);
    } finally {
      setLoading(false)
    }
  }, [handleError])

  const fetchBenefits = useCallback(async () => {
    if (!selectedPayslip) return
    
    setLoading(true)
    try {
      const benefitsData = await getBenefitsByPayslip(selectedPayslip)
      setBenefits(benefitsData)
    } catch (err) {
      handleError('Erro ao buscar benefícios', err);
    } finally {
      setLoading(false)
    }
  }, [selectedPayslip, handleError])

  // Effects
  useEffect(() => {
    fetchWorkers()
    setBenefitTypes(mockBenefitTypes)
  }, [fetchWorkers, mockBenefitTypes])

  useEffect(() => {
    if (selectedPayslip) {
      fetchBenefits()
    }
  }, [selectedPayslip, fetchBenefits])

  // Ícone para o tipo de benefício
  const getBenefitIcon = (benefitTypeName: string) => {
    const iconMap: Record<string, typeof Bus> = {
      'Vale Transporte': Bus,
      'Vale Refeição': Utensils,
      'Vale Alimentação': Coffee,
      'Auxílio Saúde': Heart,
      'Auxílio Educação': GraduationCap,
      'Participação nos Lucros e Resultados': Gift,
      'Adicional Noturno': Gift,
      'Horas Extras': Gift,
      'Seguro de Vida': Heart,
      'Bônus': Gift,
      'Comissão': Gift,
      'Auxílio Geral': Gift,
      'Prêmio': Gift
    }
    return iconMap[benefitTypeName] || Gift
  }

  // Filtra funcionários com base no termo de busca
  const filteredEmployees = useMemo(() =>
    workers.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [workers, searchTerm]
  )

  // Agrupa os benefícios por funcionário
  const benefitsByEmployee = useMemo(() => {
    const benefitsMap: Record<string, Benefit[]> = {}
    
    // Para demonstração, vamos criar alguns benefícios mock para cada funcionário
    workers.forEach(worker => {
      const workerPayslips = payslips.filter(p => p.employeeId === worker.id)
      const workerBenefits: Benefit[] = []
      
      workerPayslips.forEach(payslip => {
        // Adicionar alguns benefícios de exemplo
        if (Math.random() > 0.3) { // 70% chance de ter VT
          workerBenefits.push({
            id: `${payslip.id}-vt`,
            payslipId: payslip.id,
            code: 'VT',
            type: 'Vale Transporte',
            value: 200,
            description: 'Auxílio transporte mensal'
          })
        }
        if (Math.random() > 0.4) { // 60% chance de ter VR
          workerBenefits.push({
            id: `${payslip.id}-vr`,
            payslipId: payslip.id,
            code: 'VR',
            type: 'Vale Refeição',
            value: 500,
            description: 'Auxílio alimentação'
          })
        }
      })
      
      benefitsMap[worker.id] = workerBenefits
    })
    
    return benefitsMap
  }, [workers, payslips])

  // Funções de manipulação
  const handleEditEmployeeBenefits = (employeeId: string) => {
    setSelectedEmployee(employeeId)
    // Selecionar o holerite mais recente do funcionário
    const employeePayslips = payslips.filter(p => p.employeeId === employeeId)
    if (employeePayslips.length > 0) {
      setSelectedPayslip(employeePayslips[0].id)
    }
    setIsEditingEmployee(true)
  }

  const handleAddBenefit = async () => {
    if (!selectedPayslip || !newBenefit.code) {
      toast.error('Por favor, selecione um tipo de benefício')
      return
    }

    try {
      const benefitData: CreateBenefitRequest = {
        payslipId: selectedPayslip,
        code: newBenefit.code,
        type: newBenefit.type,
        description: newBenefit.description,
        value: newBenefit.value
      }

      const result = await handleCreateBenefit(benefitData)
      
      if (result.success) {
        setSuccessMessage('Benefício adicionado com sucesso!');
        toast.success('Benefício adicionado com sucesso!')
        await fetchBenefits()
        setNewBenefit({ code: '', type: '', value: 0, description: '' })
      } else {
        setError(result.message || 'Erro ao adicionar benefício');
        toast.error(result.message || 'Erro ao adicionar benefício')
      }
    } catch (err) {
      handleError('Erro ao adicionar benefício', err);
    }
  }

  const handleRemoveBenefit = async (benefitId: string) => {
    if (window.confirm('Tem certeza que deseja remover este benefício?')) {
      try {
        const result = await handleDeleteBenefit(benefitId)
        
        if (result.success) {
          setSuccessMessage('Benefício removido com sucesso!');
          toast.success('Benefício removido com sucesso!')
          await fetchBenefits()
        } else {
          setError(result.error || 'Erro ao remover benefício');
          toast.error(result.error || 'Erro ao remover benefício')
        }
      } catch (err) {
        handleError('Erro ao remover benefício', err);
      }
    }
  }

  const handleBenefitValueChange = (benefitId: string, value: string) => {
    setEditingValues(prev => ({
      ...prev,
      [benefitId]: value
    }))
  }

  const handleBenefitValueBlur = async (benefit: Benefit) => {
    const newValue = editingValues[benefit.id]
    
    if (newValue === undefined || parseFloat(newValue) === benefit.value) {
      return
    }
    
    const numericValue = parseFloat(newValue)
    if (isNaN(numericValue)) {
      setEditingValues(prev => ({
        ...prev,
        [benefit.id]: benefit.value.toString()
      }))
      return
    }
    
    try {
      const result = await handleUpdateBenefit({
        id: benefit.id,
        value: numericValue
      })
      
      if (result.success) {
        setSuccessMessage('Benefício atualizado com sucesso!');
        toast.success('Benefício atualizado com sucesso!')
        await fetchBenefits()
      } else {
        setError(result.message || 'Erro ao atualizar benefício');
        toast.error(result.message || 'Erro ao atualizar benefício')
        setEditingValues(prev => ({
          ...prev,
          [benefit.id]: benefit.value.toString()
        }))
      }
    } catch {
      handleError('Erro ao atualizar benefício', 'Erro desconhecido');
      setEditingValues(prev => ({
        ...prev,
        [benefit.id]: benefit.value.toString()
      }))
    }
  }

  // Funções para tipos de benefícios (mock - implementar conforme necessário)
  const handleAddBenefitType = () => {
    if (!newBenefitType.name.trim()) {
      toast.error('O nome do benefício é obrigatório')
      return
    }

    if (newBenefitType.defaultValue <= 0) {
      toast.error('O valor padrão deve ser maior que zero')
      return
    }

    const newType: BenefitType = {
      id: Date.now().toString(),
      ...newBenefitType,
      status: 'active'
    }

    setBenefitTypes(prev => [...prev, newType])
    setIsNewBenefitTypeModalOpen(false)
    setNewBenefitType({
      name: '',
      description: '',
      defaultValue: 0,
      hasDiscount: false,
      discountPercentage: 6
    })
    setSuccessMessage('Tipo de benefício criado com sucesso!');
    toast.success('Tipo de benefício criado com sucesso!')
  }

  const handleEditBenefitType = (benefitType: BenefitType) => {
    setEditingBenefitType(benefitType)
    setIsEditingBenefitType(true)
  }

  const handleUpdateBenefitTypeStatus = (benefitTypeId: string, newStatus: 'active' | 'inactive') => {
    setBenefitTypes(prev => 
      prev.map(type => 
        type.id === benefitTypeId 
          ? { ...type, status: newStatus }
          : type
      )
    )
    setSuccessMessage('Status atualizado com sucesso!');
    toast.success('Status atualizado com sucesso!')
  }

  return (
    <motion.div 
      className="p-6 min-h-screen bg-stone-50 dark:bg-gray-950"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <style>{inputStyles}</style>
      
      {/* Page header */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-2">
          <Link href="/pages/payroll">
            <motion.button
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-stone-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-stone-600 dark:text-gray-300 hover:bg-stone-50 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="h-4 w-4" />
            </motion.button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Benefícios</h1>
            <p className="text-stone-500 dark:text-gray-400 mt-1">Gerenciamento de benefícios para funcionários</p>
          </div>
        </div>
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-stone-200 dark:border-gray-700 p-4">
            <TabsList className="grid w-full grid-cols-2 bg-stone-100 dark:bg-gray-800">
              <TabsTrigger value="funcionarios" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-gray-200">Por Funcionário</TabsTrigger>
              <TabsTrigger value="beneficios" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-gray-200">Tipos de Benefícios</TabsTrigger>
            </TabsList>
          </div>

          {/* Aba de Benefícios por Funcionário */}
          <TabsContent value="funcionarios" className="p-0">
            <div className="p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                <div className="relative w-full md:w-80">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-stone-400 dark:text-gray-500" />
                  </div>
                  <Input
                    type="search"
                    placeholder="Buscar funcionário..."
                    className="pl-10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <Card className="border-0 shadow-none">
                <CardHeader>
                  <CardTitle className="text-stone-800 dark:text-gray-100">Benefícios por Funcionário</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Visualize e gerencie os benefícios concedidos a cada funcionário
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  {loading && filteredEmployees.length === 0 ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-stone-200 dark:border-gray-700">
                            <TableHead className="text-stone-500 dark:text-gray-400">Funcionário</TableHead>
                            <TableHead className="text-stone-500 dark:text-gray-400">Cargo</TableHead>
                            <TableHead className="text-stone-500 dark:text-gray-400">Benefícios Ativos</TableHead>
                            <TableHead className="text-right text-stone-500 dark:text-gray-400">Valor Total</TableHead>
                            <TableHead className="text-center text-stone-500 dark:text-gray-400">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEmployees.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-stone-500 dark:text-gray-400">
                                Nenhum funcionário encontrado
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredEmployees.map((emp, index) => {
                              const employeeBenefitsList = benefitsByEmployee[emp.id] || []
                              const totalValue = employeeBenefitsList.reduce((sum, b) => sum + b.value, 0)

                              return (
                                <motion.tr 
                                  key={emp.id}
                                  className="border-stone-200 dark:border-gray-700 hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <TableCell className="font-medium text-stone-900 dark:text-gray-100">{emp.name}</TableCell>
                                  <TableCell className="text-stone-500 dark:text-gray-400">{emp.position}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {employeeBenefitsList.map((benefit) => {
                                        const BenefitIcon = getBenefitIcon(benefit.type)
                                        return (
                                          <div key={benefit.id} className="inline-flex items-center bg-stone-100 dark:bg-gray-700 px-2 py-1 rounded-md text-xs text-stone-700 dark:text-gray-300">
                                            <BenefitIcon className="mr-1 h-3 w-3" />
                                            <span>{benefit.type}</span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right text-stone-900 dark:text-gray-100">
                                    R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-center">
                                      <motion.button
                                        className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300 p-2"
                                        onClick={() => handleEditEmployeeBenefits(emp.id)}
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </motion.button>
                                    </div>
                                  </TableCell>
                                </motion.tr>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba de Tipos de Benefícios */}
          <TabsContent value="beneficios" className="p-0">
            <Card className="border-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between border-b border-stone-200 dark:border-gray-700">
                <div>
                  <CardTitle className="text-stone-800 dark:text-gray-100">Tipos de Benefícios</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Gerencie os tipos de benefícios disponíveis na empresa
                  </CardDescription>
                </div>
                <motion.button
                  onClick={() => setIsNewBenefitTypeModalOpen(true)}
                  className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="h-4 w-4" />
                  Novo Benefício
                </motion.button>
              </CardHeader>
              <CardContent className="px-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-stone-200 dark:border-gray-700">
                        <TableHead className="text-stone-500 dark:text-gray-400">Benefício</TableHead>
                        <TableHead className="text-stone-500 dark:text-gray-400">Descrição</TableHead>
                        <TableHead className="text-right text-stone-500 dark:text-gray-400">Valor Padrão</TableHead>
                        <TableHead className="text-stone-500 dark:text-gray-400">Desconto em Folha</TableHead>
                        <TableHead className="text-stone-500 dark:text-gray-400">Status</TableHead>
                        <TableHead className="text-center text-stone-500 dark:text-gray-400">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {benefitTypes.map((benefit, index) => {
                        const BenefitIcon = getBenefitIcon(benefit.name)
                        return (
                          <motion.tr 
                            key={benefit.id}
                            className="border-stone-200 dark:border-gray-700 hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <TableCell>
                              <div className="flex items-center text-stone-900 dark:text-gray-100">
                                <BenefitIcon className="mr-2 h-4 w-4" />
                                <span className="font-medium">{benefit.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-stone-500 dark:text-gray-400">{benefit.description}</TableCell>
                            <TableCell className="text-right text-stone-900 dark:text-gray-100">
                              R$ {benefit.defaultValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-stone-500 dark:text-gray-400">
                              {benefit.hasDiscount ? (
                                <div className="flex items-center">
                                  <span className="inline-block w-10 text-right mr-2">
                                    {benefit.discountPercentage}%
                                  </span>
                                  <div className="text-xs">
                                    do salário
                                  </div>
                                </div>
                              ) : 'Não'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`status-${benefit.id}`}
                                  checked={benefit.status === 'active'}
                                  onCheckedChange={(checked) => 
                                    handleUpdateBenefitTypeStatus(
                                      benefit.id, 
                                      checked ? 'active' : 'inactive'
                                    )
                                  }
                                  className="data-[state=checked]:bg-cyan-500 dark:data-[state=checked]:bg-cyan-600"
                                />
                                <Label htmlFor={`status-${benefit.id}`} className="text-stone-600 dark:text-gray-300">
                                  {benefit.status === 'active' ? 'Ativo' : 'Inativo'}
                                </Label>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center space-x-2">
                                <motion.button 
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-2"
                                  onClick={() => handleEditBenefitType(benefit)}
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </motion.button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Modal para editar benefícios do funcionário */}
      <Dialog open={isEditingEmployee} onOpenChange={setIsEditingEmployee}>
        <DialogContent className="max-w-3xl dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              Editar Benefícios - {workers.find(e => e.id === selectedEmployee)?.name}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Adicione ou remova benefícios para este funcionário
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2 dark:text-gray-200">Informações do Funcionário</h3>
                  <div className="space-y-1">
                    <p className="dark:text-gray-300">
                      <span className="text-stone-500 dark:text-gray-400">Nome:</span>{' '}
                      {workers.find(e => e.id === selectedEmployee)?.name}
                    </p>
                    <p className="dark:text-gray-300">
                      <span className="text-stone-500 dark:text-gray-400">Cargo:</span>{' '}
                      {workers.find(e => e.id === selectedEmployee)?.position}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2 dark:text-gray-200">Adicionar Novo Benefício</h3>
                  <div className="flex space-x-2">
                    <Select
                      value={newBenefit.code}
                      onValueChange={(value) => {
                        const selectedType = BenefitTypeDescriptions[value as keyof typeof BenefitTypeDescriptions]
                        setNewBenefit(prev => ({
                          ...prev,
                          code: value,
                          type: selectedType || ''
                        }))
                      }}
                    >
                      <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                        <SelectValue placeholder="Selecione um benefício" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {Object.entries(BenefitTypeDescriptions).map(([code, description]) => (
                          <SelectItem key={code} value={code} className="dark:text-gray-100 dark:hover:bg-gray-700">
                            {code} - {description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Valor"
                      className="w-24 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      value={newBenefit.value || ''}
                      onChange={(e) => setNewBenefit(prev => ({
                        ...prev,
                        value: parseFloat(e.target.value) || 0
                      }))}
                    />
                    <Button
                      onClick={handleAddBenefit}
                      disabled={!newBenefit.code}
                      className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">Benefícios Atuais</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Lista de benefícios ativos do funcionário no holerite selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-stone-200 dark:border-gray-700">
                        <TableHead className="text-stone-500 dark:text-gray-400">Benefício</TableHead>
                        <TableHead className="text-right text-stone-500 dark:text-gray-400">Valor (R$)</TableHead>
                        <TableHead className="text-stone-500 dark:text-gray-400">Descrição</TableHead>
                        <TableHead className="text-center text-stone-500 dark:text-gray-400">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {benefits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-stone-500 dark:text-gray-400">
                            Nenhum benefício encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        benefits.map((benefit) => {
                          const BenefitIcon = getBenefitIcon(benefit.type)
                          return (
                            <TableRow key={benefit.id} className="border-stone-200 dark:border-gray-700">
                              <TableCell>
                                <div className="flex items-center text-stone-900 dark:text-gray-100">
                                  <BenefitIcon className="mr-2 h-4 w-4" />
                                  <span>{benefit.code} - {benefit.type}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="text"
                                  value={editingValues[benefit.id] !== undefined 
                                    ? editingValues[benefit.id] 
                                    : benefit.value.toString()}
                                  onChange={(e) => handleBenefitValueChange(benefit.id, e.target.value)}
                                  onBlur={() => handleBenefitValueBlur(benefit)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur()
                                    }
                                  }}
                                  className="w-28 ml-auto text-right dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-stone-500 dark:text-gray-400">
                                  {benefit.description || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center">
                                  <motion.button
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2"
                                    onClick={() => handleRemoveBenefit(benefit.id)}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </motion.button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingEmployee(false)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancelar
            </Button>
            <Button onClick={() => setIsEditingEmployee(false)} className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700">
              <SaveIcon className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para adicionar novo tipo de benefício */}
      <Dialog open={isNewBenefitTypeModalOpen} onOpenChange={setIsNewBenefitTypeModalOpen}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Novo Tipo de Benefício</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Crie um novo tipo de benefício para seus funcionários
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="benefit-name" className="dark:text-gray-200">Nome do Benefício</Label>
              <Input
                id="benefit-name"
                value={newBenefitType.name}
                onChange={(e) => setNewBenefitType(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                placeholder="Ex: Vale Transporte"
                className="dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefit-description" className="dark:text-gray-200">Descrição</Label>
              <Input
                id="benefit-description"
                value={newBenefitType.description}
                onChange={(e) => setNewBenefitType(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                placeholder="Uma breve descrição do benefício"
                className="dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefit-value" className="dark:text-gray-200">Valor Padrão (R$)</Label>
              <Input
                id="benefit-value"
                type="number"
                value={newBenefitType.defaultValue || ''}
                onChange={(e) => setNewBenefitType(prev => ({
                  ...prev,
                  defaultValue: parseFloat(e.target.value) || 0
                }))}
                placeholder="Valor padrão do benefício"
                min="0"
                step="0.01"
                className="dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="has-discount"
                checked={newBenefitType.hasDiscount}
                onCheckedChange={(checked) => setNewBenefitType(prev => ({
                  ...prev,
                  hasDiscount: checked
                }))}
                className="data-[state=checked]:bg-cyan-500 dark:data-[state=checked]:bg-cyan-600"
              />
              <Label htmlFor="has-discount" className="dark:text-gray-200">Desconto em Folha</Label>
            </div>

            {newBenefitType.hasDiscount && (
              <div className="space-y-2">
                <Label htmlFor="discount-percentage" className="dark:text-gray-200">Percentual de Desconto (%)</Label>
                <Input
                  id="discount-percentage"
                  type="number"
                  value={newBenefitType.discountPercentage || ''}
                  onChange={(e) => setNewBenefitType(prev => ({
                    ...prev,
                    discountPercentage: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="Percentual de desconto"
                  min="0"
                  max="100"
                  step="0.01"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewBenefitTypeModalOpen(false)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancelar
            </Button>
            <Button onClick={handleAddBenefitType} className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar tipo de benefício */}
      <Dialog open={isEditingBenefitType} onOpenChange={setIsEditingBenefitType}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Editar Tipo de Benefício</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Atualize as informações deste tipo de benefício
            </DialogDescription>
          </DialogHeader>

          {editingBenefitType && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-benefit-name" className="dark:text-gray-200">Nome do Benefício</Label>
                <Input
                  id="edit-benefit-name"
                  value={editingBenefitType.name}
                  onChange={(e) => setEditingBenefitType({
                    ...editingBenefitType,
                    name: e.target.value
                  })}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-benefit-description" className="dark:text-gray-200">Descrição</Label>
                <Input
                  id="edit-benefit-description"
                  value={editingBenefitType.description}
                  onChange={(e) => setEditingBenefitType({
                    ...editingBenefitType,
                    description: e.target.value
                  })}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-benefit-value" className="dark:text-gray-200">Valor Padrão (R$)</Label>
                <Input
                  id="edit-benefit-value"
                  type="number"
                  value={editingBenefitType.defaultValue}
                  onChange={(e) => setEditingBenefitType({
                    ...editingBenefitType,
                    defaultValue: parseFloat(e.target.value) || 0
                  })}
                  min="0"
                  step="0.01"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-has-discount"
                  checked={editingBenefitType.hasDiscount}
                  onCheckedChange={(checked) => setEditingBenefitType({
                    ...editingBenefitType,
                    hasDiscount: checked,
                    // Se desabilitar o desconto, zera a porcentagem
                    ...(checked ? {} : { discountPercentage: 0 })
                  })}
                  className="data-[state=checked]:bg-cyan-500 dark:data-[state=checked]:bg-cyan-600"
                />
                <Label htmlFor="edit-has-discount" className="dark:text-gray-200">Desconto em Folha</Label>
              </div>

              {editingBenefitType.hasDiscount && (
                <div className="space-y-2">
                  <Label htmlFor="edit-discount-percentage" className="dark:text-gray-200">Percentual de Desconto (%)</Label>
                  <Input
                    id="edit-discount-percentage"
                    type="number"
                    value={editingBenefitType.discountPercentage || 0}
                    onChange={(e) => setEditingBenefitType({
                      ...editingBenefitType,
                      discountPercentage: parseFloat(e.target.value) || 0
                    })}
                    placeholder="Percentual de desconto"
                    min="0"
                    max="100"
                    step="0.01"
                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-status"
                  checked={editingBenefitType.status === 'active'}
                  onCheckedChange={(checked) => setEditingBenefitType({
                    ...editingBenefitType,
                    status: checked ? 'active' : 'inactive'
                  })}
                  className="data-[state=checked]:bg-cyan-500 dark:data-[state=checked]:bg-cyan-600"
                />
                <Label htmlFor="edit-status" className="dark:text-gray-200">
                  {editingBenefitType.status === 'active' ? 'Ativo' : 'Inativo'}
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditingBenefitType(false);
              setEditingBenefitType(null);
            }} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (editingBenefitType) {
                  // Atualizar o tipo de benefício na lista local
                  setBenefitTypes(prev => 
                    prev.map(type => 
                      type.id === editingBenefitType.id 
                        ? editingBenefitType 
                        : type
                    )
                  );
                  
                  setIsEditingBenefitType(false);
                  setEditingBenefitType(null);
                  setSuccessMessage('Tipo de benefício atualizado com sucesso!');
                  toast.success('Tipo de benefício atualizado com sucesso!');
                }
              }}
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de seleção de holerite */}
      <Dialog open={selectedEmployee !== null && !selectedPayslip && isEditingEmployee} onOpenChange={() => {}}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Selecionar Holerite</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Escolha o holerite para gerenciar os benefícios
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Label className="dark:text-gray-200">Holerites Disponíveis</Label>
            <div className="space-y-2">
              {payslips
                .filter(p => p.employeeId === selectedEmployee)
                .map(payslip => (
                  <motion.div
                    key={payslip.id}
                    className="flex items-center justify-between p-3 border border-stone-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => setSelectedPayslip(payslip.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>
                      <p className="font-medium dark:text-gray-100">{payslip.month}</p>
                      <p className="text-sm text-stone-500 dark:text-gray-400">
                        Status: {payslip.status === 'processed' ? 'Processado' : 'Rascunho'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      Selecionar
                    </Button>
                  </motion.div>
                ))
              }
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditingEmployee(false);
              setSelectedEmployee(null);
              setSelectedPayslip(null);
            }} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}