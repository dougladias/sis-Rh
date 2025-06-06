import { ContractType, WorkerStatus } from './enums.type';

export interface Worker {
  id: string;
  employeeCode: string;
  name: string;
  cpf: string;
  rg?: string | null;
  birthDate: Date | string;
  admissionDate: Date | string;
  terminationDate?: Date | string | null;
  salary: number;
  allowance?: number | null;
  phone: string;
  email: string;
  address: string;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  contractType: ContractType;
  position: string;
  department: string;
  status: WorkerStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateWorkerData {
  employeeCode: string;
  name: string;
  cpf: string;
  rg?: string | null;
  birthDate: Date | string;
  admissionDate: Date | string;
  terminationDate?: Date | string | null;
  salary: number;
  allowance?: number | null;
  phone: string;
  email: string;
  address: string;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  contractType: ContractType;
  position: string;
  department: string;
  status?: WorkerStatus;
}

export interface UpdateWorkerData {
  id: string;
  employeeCode?: string;
  name?: string;
  cpf?: string;
  rg?: string | null;
  birthDate?: Date | string;
  admissionDate?: Date | string;
  terminationDate?: Date | string | null;
  salary?: number;
  allowance?: number | null;
  phone?: string;
  email?: string;
  address?: string;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  contractType?: ContractType;
  position?: string;
  department?: string;
  status?: WorkerStatus;
}

export interface WorkerStats {
  totalWorkers: number;
  activeWorkers: number;
  inactiveWorkers: number;
  terminatedWorkers: number;
  onVacationWorkers: number;
  departmentsCount: number;
  departments: Array<{ name: string; count: number }>;
}