import { Request, Response } from "express";
import { ListVisitorService } from "../../services/visitor/ListVisitor.service";
import { VisitorStatus } from "@prisma/client";

class ListVisitorController {
  async handle(req: Request, res: Response) {
    try {
      const { 
        search, 
        status, 
        startDate, 
        endDate, 
        page = "1", 
        limit = "10",
        sort = "createdAt",
        order = "desc"
      } = req.query;

      const listVisitorService = new ListVisitorService();
      
      const result = await listVisitorService.execute({
        search: search as string,
        status: status as VisitorStatus,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: sort as string,
        order: order as "asc" | "desc"
      });

      return res.json({
        success: true,
        ...result
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao listar visitantes"
      });
    }
  }
}

export { ListVisitorController };