import prismaClient from "../../prisma";
import { ContractType, WorkerStatus } from "@prisma/client";

interface UpdateWorkerRequest {
  id: string;
  employeeCode?: string;
  name?: string;
  cpf?: string;
  rg?: string;
  birthDate?: Date;
  admissionDate?: Date;
  terminationDate?: Date | null;
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

class UpdateWorkerService {
  async execute(data: UpdateWorkerRequest) {
    const { id } = data;

    // Verificar se o funcionário existe
    const workerExists = await prismaClient.worker.findUnique({
      where: { id }
    });

    if (!workerExists) {
      throw new Error("Funcionário não encontrado");
    }

    // Verificar se o código de funcionário já existe (caso esteja sendo atualizado)
    if (data.employeeCode && data.employeeCode !== workerExists.employeeCode) {
      const existingEmployeeCode = await prismaClient.worker.findFirst({
        where: {
          employeeCode: data.employeeCode,
          NOT: { id }
        }
      });

      if (existingEmployeeCode) {
        throw new Error("Já existe um funcionário com este código");
      }
    }

    // Verificar se o CPF já existe (caso esteja sendo atualizado)
    if (data.cpf && data.cpf !== workerExists.cpf) {
      const existingCpf = await prismaClient.worker.findFirst({
        where: {
          cpf: data.cpf,
          NOT: { id }
        }
      });

      if (existingCpf) {
        throw new Error("Já existe um funcionário com este CPF");
      }
    }

    // Verificar se o email já existe (caso esteja sendo atualizado)
    if (data.email && data.email !== workerExists.email) {
      const existingEmail = await prismaClient.worker.findFirst({
        where: {
          email: data.email,
          NOT: { id }
        }
      });

      if (existingEmail) {
        throw new Error("Já existe um funcionário com este email");
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (data.employeeCode) updateData.employeeCode = data.employeeCode;
    if (data.name) updateData.name = data.name;
    if (data.cpf) updateData.cpf = data.cpf;
    if (data.rg !== undefined) updateData.rg = data.rg;
    if (data.birthDate) updateData.birthDate = new Date(data.birthDate);
    if (data.admissionDate) updateData.admissionDate = new Date(data.admissionDate);
    if (data.terminationDate !== undefined) {
      updateData.terminationDate = data.terminationDate ? new Date(data.terminationDate) : null;
    }
    if (data.salary !== undefined) updateData.salary = data.salary;
    if (data.allowance !== undefined) updateData.allowance = data.allowance;
    if (data.phone) updateData.phone = data.phone;
    if (data.email) updateData.email = data.email;
    if (data.address) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    if (data.contractType) updateData.contractType = data.contractType;
    if (data.position) updateData.position = data.position;
    if (data.department) updateData.department = data.department;
    if (data.status) updateData.status = data.status;
    
    // Atualizar data de modificação
    updateData.updatedAt = new Date();
    
    // Atualizar o funcionário no banco
    const updatedWorker = await prismaClient.worker.update({
      where: { id },
      data: updateData
    });

    return updatedWorker;
  }
}

export { UpdateWorkerService };