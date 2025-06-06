import { Request, Response } from "express";
import { CreateVisitorService } from "../../services/visitor/CreateVisitor.service";
import { DocumentType, VisitorStatus } from "@prisma/client";

class CreateVisitorController {
  async handle(req: Request, res: Response) {
    try {
      const { 
        name, 
        documentType, 
        documentNumber, 
        phone, 
        email, 
        company, 
        reason, 
        hostName, 
        hostDepartment, 
        scheduledEntry, 
        scheduledExit,
        notes
      } = req.body;

      // Validações básicas
      if (!name || !documentNumber || !phone || !reason || !hostName) {
        return res.status(400).json({
          success: false,
          message: "Campos obrigatórios não preenchidos"
        });
      }

      const createVisitorService = new CreateVisitorService();
      
      const visitor = await createVisitorService.execute({
        name,
        documentType: documentType as DocumentType || DocumentType.RG,
        documentNumber,
        phone,
        email,
        company,
        reason,
        hostName,
        hostDepartment,
        scheduledEntry: scheduledEntry ? new Date(scheduledEntry) : undefined,
        scheduledExit: scheduledExit ? new Date(scheduledExit) : undefined,
        status: VisitorStatus.EXPECTED,
        notes
      });

      return res.status(201).json({
        success: true,
        visitor
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao criar visitante"
      });
    }
  }
}

export { CreateVisitorController };