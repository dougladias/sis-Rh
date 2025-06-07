import { Request, Response } from "express";
import { CreateProviderService } from "../../services/provider/CreateProvider.service";
import { DocumentType, ProviderStatus } from "@prisma/client";

class CreateProviderController {
  async handle(req: Request, res: Response) {
    try {
      const { 
        name, 
        documentType, 
        documentNumber, 
        phone, 
        email, 
        company, 
        serviceType,
        reason, 
        hostName, 
        hostDepartment, 
        scheduledEntry, 
        scheduledExit,
        contractNumber,
        notes
      } = req.body;

      // Validações básicas
      if (!name || !documentNumber || !phone || !reason || !hostName) {
        return res.status(400).json({
          success: false,
          message: "Campos obrigatórios não preenchidos"
        });
      }

      const createProviderService = new CreateProviderService();
      
      const provider = await createProviderService.execute({
        name,
        documentType: documentType as DocumentType || DocumentType.RG,
        documentNumber,
        phone,
        email,
        company,
        serviceType,
        reason,
        hostName,
        hostDepartment,
        scheduledEntry: scheduledEntry ? new Date(scheduledEntry) : undefined,
        scheduledExit: scheduledExit ? new Date(scheduledExit) : undefined,
        status: ProviderStatus.EXPECTED,
        contractNumber,
        notes
      });

      return res.status(201).json({
        success: true,
        provider
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao criar prestador"
      });
    }
  }
}

export { CreateProviderController };