// Enum para status do holerite
export enum PayslipStatus {
  DRAFT = "DRAFT",
  PROCESSED = "PROCESSED",
  PAID = "PAID",
  CANCELLED = "CANCELLED"
}

// Interface principal do holerite
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
    contractType?: string;
    cpf?: string;
    email?: string;
  };
  payroll?: {
    id: string;
    month: number;
    year: number;
    status: string;
  };
  deductions?: Deduction[];
  benefits?: Benefits[];
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

// Interface para criação de holerite
export interface CreatePayslipRequest {
  payrollId: string;
  workerId: string;
  baseSalary?: number;
  totalBenefits?: number;
  totalDeductions?: number;
  netSalary?: number;
  status?: PayslipStatus;
  paymentDate?: Date | string | null;
  deductions?: Array<{
    code: string;
    type: string;
    description?: string;
    percentage?: number;
    value: number;
    isRequired?: boolean;
  }>;
  benefits?: Array<{
    code: string;
    type: string;
    description?: string;
    value: number;
  }>;
}

// Interface para atualização de holerite
export interface UpdatePayslipRequest {
  baseSalary?: number;
  totalBenefits?: number;
  totalDeductions?: number;
  netSalary?: number;
  status?: PayslipStatus;
  paymentDate?: Date | string | null;
}

// Interface para filtros de listagem
export interface PayslipFilters {
  payrollId?: string;
  workerId?: string;
  status?: PayslipStatus | '';
  department?: string;
  page?: number;
  limit?: number;
  details?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Interface para resposta de listagem de holerites
export interface PayslipListResponse {
  success: boolean;
  payslips: Payslip[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Interface para resposta de um único holerite
export interface PayslipResponse {
  success: boolean;
  payslip: Payslip;
}

// Tipos para as respostas da API
export interface PayslipApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  payslip?: Payslip;
}

// Interface para estatísticas de holerites
export interface PayslipStats {
  totalPayslips: number;
  draftPayslips: number;
  processedPayslips: number;
  paidPayslips: number;
  cancelledPayslips: number;
  payslipsByStatus: Record<PayslipStatus, number>;
  totalPayslipsValue: number;
  averagePayslipValue: number;
  payslipsByDepartment: Array<{
    department: string;
    count: number;
    totalValue: number;
  }>;
  payslipsByMonth: Array<{
    month: number;
    year: number;
    count: number;
    totalValue: number;
  }>;
  recentPayslips?: Payslip[];
}

// Interface para resumo de departamento
export interface DepartmentPayslipSummary {
  department: string;
  totalEmployees: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalBenefits: number;
  totalNetSalary: number;
  averageSalary: number;
  payslips: Payslip[];
}