import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import prisma from "../prisma";

interface Payload {
    sub: string;
    name: string;
    email: string;
    role: string;
}

export async function isAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authToken = request.headers.authorization;
  const queryToken = request.query.token as string;
  
  let token: string | null = null;
  
  if (authToken) {
    const parts = authToken.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  } else if (queryToken) {
    token = queryToken;
  }
  
  if (!token) {
    return response.status(401).json({ 
      success: false,
      message: "Token não fornecido" 
    });
  }

  try {
    // Verificar e decodificar o token
    const decoded = verify(
      token, 
      process.env.JWT_SECRET as string
    ) as Payload;

    // Buscar dados atualizados do usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return response.status(401).json({ 
        success: false,
        message: "Usuário não encontrado" 
      });
    }

    if (!user.isActive) {
      return response.status(401).json({ 
        success: false,
        message: "Usuário inativo" 
      });
    }

    // Adicionar dados do usuário à requisição
    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    return next();
  } catch (err) {
    console.error("Erro na validação do token:", err);
    return response.status(401).json({ 
      success: false,
      message: "Token inválido ou expirado" 
    });
  }
}