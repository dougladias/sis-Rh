import { Request, Response } from "express";
import { UpdateWorkerService } from "../../services/worker/UpdateWorker.service";
import { ContractType, WorkerStatus } from "@prisma/client";

class UpdateWorkerController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
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

            // Validar o contractType (se fornecido)
            if (contractType && !Object.values(ContractType).includes(contractType as ContractType)) {
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
            const updateWorkerService = new UpdateWorkerService();

            // Executar o serviço
            const worker = await updateWorkerService.execute({
                id,
                employeeCode,
                name,
                cpf,
                rg,
                birthDate: birthDate ? new Date(birthDate) : undefined,
                admissionDate: admissionDate ? new Date(admissionDate) : undefined,
                terminationDate: terminationDate === undefined ? undefined :
                    terminationDate ? new Date(terminationDate) : null,
                salary: salary ? Number(salary) : undefined,
                allowance: allowance === undefined ? undefined :
                    allowance ? Number(allowance) : null,
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

            return res.status(200).json({
                success: true,
                message: "Funcionário atualizado com sucesso",
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

export { UpdateWorkerController };