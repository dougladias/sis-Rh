import { Request, Response } from "express";
import { CreateWorkerService } from "../../services/worker/CreateWorker.service";
import { ContractType, WorkerStatus } from "@prisma/client";

class CreateWorkerController {
    async handle(req: Request, res: Response) {
        try {
            const {
                employeeCode,
                name,
                cpf,
                rg,
                birthDate,
                admissionDate,
                terminationDate,
                salary,
                allowance,
                phone,
                email,
                address,
                city,
                state,
                zipCode,
                contractType,
                position,
                department,
                status
            } = req.body;

            // Validar o contractType
            if (!Object.values(ContractType).includes(contractType as ContractType)) {
                return res.status(400).json({
                    success: false,
                    message: "Tipo de contrato inválido"
                });
            }

            // Validar o status (se fornecido)
            if (status && !Object.values(WorkerStatus).includes(status as WorkerStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Status de funcionário inválido"
                });
            }

            // Instanciar o serviço
            const createWorkerService = new CreateWorkerService();

            // Executar o serviço
            const worker = await createWorkerService.execute({
                employeeCode,
                name,
                cpf,
                rg,
                birthDate,
                admissionDate,
                terminationDate,
                salary: Number(salary),
                allowance: allowance ? Number(allowance) : undefined,
                phone,
                email,
                address,
                city,
                state,
                zipCode,
                contractType: contractType as ContractType,
                position,
                department,
                status: status as WorkerStatus
            });

            return res.status(201).json({
                success: true,
                message: "Funcionário cadastrado com sucesso",
                worker
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { CreateWorkerController };