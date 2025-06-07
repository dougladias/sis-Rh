import { Request, Response } from "express";
import { UpdateProviderService } from "../../services/provider/UpdateProvider.service";
import { DocumentType, ProviderStatus } from "@prisma/client";

class UpdateProviderController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;
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
        actualEntry,
        actualExit,
        status,
        contractNumber,
        notes
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID do prestador não fornecido"
        });
      }

      const updateProviderService = new UpdateProviderService();
      
      const provider = await updateProviderService.execute({
        id,
        name, 
        documentType: documentType as DocumentType, 
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
        actualEntry: actualEntry ? new Date(actualEntry) : undefined,
        actualExit: actualExit ? new Date(actualExit) : undefined,
        status: status as ProviderStatus,
        contractNumber,
        notes
      });

      return res.json({
        success: true,
        provider
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Erro ao atualizar prestador"
      });
    }
  }
}

export { UpdateProviderController };