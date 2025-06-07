import { Request, Response } from "express";
import { ListProviderService } from "../../services/provider/ListProvider.service";
import { ProviderStatus } from "@prisma/client";

class ListProviderController {
  async handle(req: Request, res: Response) {
    try {
      const { 
        search, 
        status, 
        startDate, 
        endDate, 
        serviceType,
        company,
        page = "1", 
        limit = "10",
        sort = "createdAt",
        order = "desc"
      } = req.query;

      const listProviderService = new ListProviderService();
      
      const result = await listProviderService.execute({
        search: search as string,
        status: status as ProviderStatus,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        serviceType: serviceType as string,
        company: company as string,
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
        message: error instanceof Error ? error.message : "Erro ao listar prestadores"
      });
    }
  }
}

export { ListProviderController };