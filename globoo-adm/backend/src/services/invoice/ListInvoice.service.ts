import prismaClient from "../../prisma";
import { InvoiceStatus } from "@prisma/client";

interface ListInvoiceParams {
  number?: string;
  status?: InvoiceStatus;
  startDate?: Date;
  endDate?: Date;
  minValue?: number;
  maxValue?: number;
  issuerName?: string;
  recipientName?: string;
  page?: number;
  limit?: number;
}

class ListInvoiceService {
  async execute({ 
    number,
    status,
    startDate,
    endDate,
    minValue,
    maxValue,
    issuerName,
    recipientName,
    page = 1, 
    limit = 10 
  }: ListInvoiceParams) {
    // Garantir que page e limit são números positivos
    const currentPage = page > 0 ? page : 1;
    const itemsPerPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * itemsPerPage;

    // Construir filtros dinâmicos
    const where: any = {};
    
    if (number) {
      where.number = {
        contains: number,
        mode: 'insensitive'
      };
    }
    
    if (status) {
      where.status = status;
    }
    
    // Filtros de data
    if (startDate || endDate) {
      where.issueDate = {};
      
      if (startDate) {
        where.issueDate.gte = startDate;
      }
      
      if (endDate) {
        where.issueDate.lte = endDate;
      }
    }
    
    // Filtros de valor
    if (minValue !== undefined || maxValue !== undefined) {
      where.value = {};
      
      if (minValue !== undefined) {
        where.value.gte = minValue;
      }
      
      if (maxValue !== undefined) {
        where.value.lte = maxValue;
      }
    }
    
    // Filtros de nome
    if (issuerName) {
      where.issuerName = {
        contains: issuerName,
        mode: 'insensitive'
      };
    }
    
    if (recipientName) {
      where.recipientName = {
        contains: recipientName,
        mode: 'insensitive'
      };
    }

    // Buscar faturas com paginação - CORRIGIDO: Incluindo attachments
    const invoices = await prismaClient.invoice.findMany({
      where,
      select: {
        id: true,
        number: true,
        issueDate: true,
        dueDate: true,
        value: true,
        description: true,
        status: true,
        issuerName: true,
        issuerDocument: true,
        issuerEmail: true,
        recipientName: true,
        recipientDocument: true,
        recipientEmail: true,
        paymentDate: true,
        paymentMethod: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        // ✅ CORRIGIDO: Incluindo attachments na listagem
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimetype: true,
            size: true,
            uploadDate: true
          }
        }
      },
      skip,
      take: itemsPerPage,
      orderBy: { issueDate: 'desc' }
    });

    // Contar o total de registros
    const total = await prismaClient.invoice.count({ where });

    // Retornar as faturas e metadados de paginação
    return {
      invoices,
      meta: {
        total,
        page: currentPage,
        limit: itemsPerPage,
        pages: Math.ceil(total / itemsPerPage)
      }
    };
  }
}

export { ListInvoiceService };