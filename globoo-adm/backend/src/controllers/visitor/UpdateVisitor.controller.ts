import { Request, Response } from "express";
import { UpdateVisitorService } from "../../services/visitor/UpdateVisitor.service";
import { DocumentType, VisitorStatus } from "@prisma/client";

class UpdateVisitorController {
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
        reason, 
        hostName, 
        hostDepartment, 
        scheduledEntry, 
        scheduledExit,
        actualEntry,
        actualExit,
        status,
        temperature,
        notes
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID do visitante não fornecido"
        });
      }

      const updateVisitorService = new UpdateVisitorService();
      
      const visitor = await updateVisitorService.execute({
        id,
        name, 
        documentType: documentType as DocumentType, 
        documentNumber, 
        phone, 
        email, 
        company, 
        reason, 
        hostName, 
        hostDepartment, 
        scheduledEntry: scheduledEntry ? new Date(scheduledEntry) : undefined,
        scheduledExit: scheduledExit ? new Date(scheduledExit) : undefined,
        actualEntry: actualEntry ? new Date(actualEntry) : undefined,
        actualExit: actualExit ? new Date(actualExit) : undefined,
        status: status as VisitorStatus,
        temperature: temperature ? parseFloat(temperature) : undefined,
        notes
      });

      return res.json({
        success: true,
        visitor
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Erro ao atualizar visitante"
      });
    }
  }
}

export { UpdateVisitorController };