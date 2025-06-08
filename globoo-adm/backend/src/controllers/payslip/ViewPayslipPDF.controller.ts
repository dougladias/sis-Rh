import { Request, Response } from "express";
import { GeneratePayslipPDFService } from "../../services/payslip/ViewPayslipPDF.service";

class GeneratePayslipPDFController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "ID do holerite é obrigatório"
                });
            }

            // Instanciar o serviço
            const generatePDFService = new GeneratePayslipPDFService();

            // Executar o serviço para gerar o PDF
            const pdfBuffer = await generatePDFService.execute(id);

            // Configurar headers para download do PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=holerite-${id}.pdf`);
            res.setHeader('Content-Length', pdfBuffer.length);

            // Enviar o PDF
            return res.send(pdfBuffer);
        } catch (error) {
            console.error('Erro ao gerar PDF do holerite:', error);
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

class ViewPayslipPDFController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "ID do holerite é obrigatório"
                });
            }

            // Instanciar o serviço
            const generatePDFService = new GeneratePayslipPDFService();

            // Executar o serviço para gerar o PDF
            const pdfBuffer = await generatePDFService.execute(id);

            // Configurar headers para visualização inline
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=holerite-${id}.pdf`);
            res.setHeader('Content-Length', pdfBuffer.length);

            // Enviar o PDF
            return res.send(pdfBuffer);
        } catch (error) {
            console.error('Erro ao visualizar PDF do holerite:', error);
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { GeneratePayslipPDFController, ViewPayslipPDFController };