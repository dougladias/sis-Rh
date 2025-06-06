import {Request, Response} from 'express';
import { AuthService } from '../../services/auth/Auth.service';

// É responsável por autenticar um usuário
class AuthController {

    // Método handle é responsável por receber a requisição e retornar a resposta
    async handle(request: Request, response: Response) {
        const {email, password} = request.body;

        // Verifica se o email e a senha foram fornecidos
        const authUserService = new AuthService();
        
        // Tenta autenticar o usuário com o email e a senha fornecidos
        const auth = await authUserService.execute({
            email,
            password
        })

        // Se a autenticação for bem-sucedida, retorna o objeto de autenticação
        return response.json(auth);
 }
}

export { AuthController };