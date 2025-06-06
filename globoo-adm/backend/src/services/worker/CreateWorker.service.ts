import prismaClient from "../../prisma";
import { ContractType, WorkerStatus } from "@prisma/client";

// Interface para definir os dados necessários para criar um worker
interface WorkerRequest {
  employeeCode: string;
  name: string;
  cpf: string;
  rg?: string;
  birthDate: Date;
  admissionDate: Date;
  terminationDate?: Date;
  salary: number;
  allowance?: number;
  phone: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contractType: ContractType;
  position: string;
  department?: string;
  status?: WorkerStatus;
}

class CreateWorkerService {
  async execute(data: WorkerRequest) {
    const { 
      employeeCode,
      name,
      cpf,
      email,
      position,
      contractType,
      salary,
      birthDate,
      admissionDate,
      phone,
      address
    } = data;

    // Validações básicas
    if (!employeeCode || !name || !cpf || !email || !position || !contractType || 
        !salary || !birthDate || !admissionDate || !phone || !address) {
      throw new Error("Campos obrigatórios não informados");
    }

    // Verificar se já existe um funcionário com o mesmo código
    const existingEmployeeCode = await prismaClient.worker.findUnique({
      where: { employeeCode }
    });

    if (existingEmployeeCode) {
      throw new Error("Já existe um funcionário com este código");
    }

    // Verificar se já existe um funcionário com o mesmo CPF
    const existingCpf = await prismaClient.worker.findUnique({
      where: { cpf }
    });

    if (existingCpf) {
      throw new Error("Já existe um funcionário com este CPF");
    }

    // Verificar se já existe um funcionário com o mesmo email
    const existingEmail = await prismaClient.worker.findUnique({
      where: { email }
    });

    if (existingEmail) {
      throw new Error("Já existe um funcionário com este email");
    }

    // Criar o funcionário no banco de dados
    const worker = await prismaClient.worker.create({
      data: {
        employeeCode,
        name,
        cpf,
        rg: data.rg,
        birthDate: new Date(birthDate),
        admissionDate: new Date(admissionDate),
        terminationDate: data.terminationDate ? new Date(data.terminationDate) : null,
        salary: salary,
        allowance: data.allowance || null,
        phone,
        email,
        address,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
        contractType,
        position,
        department: data.department || "Geral",
        status: data.status || WorkerStatus.ACTIVE
      }
    });

    return worker;
  }
}

export { CreateWorkerService };