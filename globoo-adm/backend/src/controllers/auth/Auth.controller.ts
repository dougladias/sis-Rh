import {Request, Response} from 'express';
import { AuthService } from '../../services/auth/Auth.service';
import  prisma  from '../../prisma';

// É responsável por autenticar um usuário
class AuthController {

    // Método handle é responsável por receber a requisição e retornar a resposta
    async handle(request: Request, response: Response) {
        try {
            const {email, password} = request.body;
            
            // Verifica se o email e a senha foram fornecidos
            if (!email || !password) {
                return response.status(400).json({
                    success: false,
                    message: "Email e senha são obrigatórios"
                });
            }

            // Tenta autenticar o usuário com o email e a senha fornecidos
            const authUserService = new AuthService();
            
            const auth = await authUserService.execute({
                email,
                password
            });
            
            // Se a autenticação falhar, o serviço deve lançar uma exceção
            // que será capturada pelo bloco catch
            
            // Buscar informações completas do usuário para garantir que o role está correto
            const user = await prisma.user.findUnique({
                where: { email }
            });
            
            if (!user) {
                return response.status(404).json({
                    success: false,
                    message: "Usuário não encontrado"
                });
            }           
            
            
            // Formatar resposta garantindo que o role está em maiúsculo
            return response.json({
                success: true,
                token: auth.token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role?.toUpperCase() || 'USER' // Garantir formato maiúsculo
                }
            });
        } catch (error) {
            console.error("Erro na autenticação:", error);
            const errorMessage = error instanceof Error ? error.message : "Falha na autenticação";
            return response.status(401).json({
                success: false,
                message: errorMessage
            });
        }
    }
}

export { AuthController };