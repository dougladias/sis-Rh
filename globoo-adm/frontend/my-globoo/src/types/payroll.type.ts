// Enum para status da folha de pagamento
export enum PayrollStatus {
  DRAFT = "DRAFT",
  PROCESSING = "PROCESSING", 
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

// Interface principal da folha de pagamento
export interface Payroll {
  id: string;
  month: number;
  year: number;
  description?: string | null;
  status: PayrollStatus;
  processedAt?: Date | string | null;
  processedBy?: string | null;
  totalGrossSalary: number;
  totalDeductions: number;
  totalBenefits: number;
  totalNetSalary: number;
  employeeCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  payslips?: Payslip[];
  payslipsCount?: number;
}

// Interface para holerite (payslip)
export interface Payslip {
  id: string;
  payrollId: string;
  workerId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  position: string;
  baseSalary: number;
  totalBenefits: number;
  totalDeductions: number;
  netSalary: number;
  status: PayslipStatus;
  paymentDate?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  worker?: {
    id: string;
    name: string;
    employeeCode: string;
    department: string;
    position: string;
  };
  deductions?: Deduction[];
  benefits?: Benefits[];
}

// Enum para status do holerite
export enum PayslipStatus {
  DRAFT = "DRAFT",
  PROCESSED = "PROCESSED",
  PAID = "PAID",
  CANCELLED = "CANCELLED"
}

// Interface para deduções
export interface Deduction {
  id: string;
  payslipId: string;
  code: string;
  type: string;
  description?: string | null;
  percentage?: number | null;
  value: number;
  isRequired: boolean;
}

// Interface para benefícios
export interface Benefits {
  id: string;
  payslipId: string;
  code: string;
  type: string;
  description?: string | null;
  value: number;
}

// Interface para criação de folha de pagamento
export interface CreatePayrollRequest {
  month: number;
  year: number;
  description?: string;
  status?: PayrollStatus;
}

// Interface para atualização de folha de pagamento
export interface UpdatePayrollRequest {
  description?: string;
  status?: PayrollStatus;
  processedAt?: Date | string | null;
  processedBy?: string | null;
}

// Interface para filtros de listagem
export interface PayrollFilters {
  year?: number;
  month?: number;
  status?: PayrollStatus | '';
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Interface para processamento de folha
export interface ProcessPayrollRequest {
  processedBy: string;
}

// Interface para resposta de listagem de folhas
export interface PayrollListResponse {
  success: boolean;
  payrolls: Payroll[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Interface para resposta de uma única folha
export interface PayrollResponse {
  success: boolean;
  payroll: Payroll;
}

// Tipos para as respostas da API
export interface PayrollApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  payroll?: Payroll;
  payslipsCreated?: number;
}

// Interface para estatísticas de folha de pagamento
export interface PayrollStats {
  totalPayrolls: number;
  draftPayrolls: number;
  processingPayrolls: number;
  completedPayrolls: number;
  cancelledPayrolls: number;
  payrollsByStatus: Record<PayrollStatus, number>;
  totalEmployeesInLastPayroll: number;
  totalValueInLastPayroll: number;
  averagePayrollValue: number;
  payrollsByMonth: Array<{
    month: number;
    year: number;
    count: number;
    totalValue: number;
  }>;
  recentPayrolls?: Payroll[];
}

// Interface para resumo mensal
export interface MonthlyPayrollSummary {
  month: number;
  year: number;
  totalEmployees: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalBenefits: number;
  totalNetSalary: number;
  status: PayrollStatus;
  processedAt?: Date | string | null;
  processedBy?: string | null;
}