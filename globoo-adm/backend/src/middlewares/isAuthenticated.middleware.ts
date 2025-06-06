import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

// Define a interface Payload para tipar o conteúdo do token JWT
interface Payload {
    sub: string;
}

// Middleware para verificar se o usuário está autenticado
export function isAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
) {
  // Verifica se o token JWT está presente no cabeçalho Authorization
  const authToken = request.headers.authorization;
  
  // Verifica se o token está na query string (para visualização de documentos)
  const queryToken = request.query.token as string;
  
  let token: string | null = null;
  
  // Extrai o token do cabeçalho Authorization se estiver disponível
  if (authToken) {
    const parts = authToken.split(" ");
    if (parts.length === 2) {
      token = parts[1];
    }
  } 
  // Se não tiver no cabeçalho, usa o token da query string
  else if (queryToken) {
    token = queryToken;
  }
  
  // Se não encontrou o token em nenhum lugar, retorna erro
  if (!token) {
    return response.status(401).json({ error: "Token não fornecido" });
  }

  try {
    // Validar o Token
    const { sub } = verify(
        token, 
        process.env.JWT_SECRET as string
    ) as Payload;  

    // Recuperar o id do token e colocar dentro da request
    request.user_id = sub;
    
    // Se o token for válido, chama a próxima função middleware
    return next();
  } catch (err) {
    return response.status(401).json({ error: "Token inválido" });
  }  
}