import { cookies } from 'next/headers';

// Função para obter o token de autenticação sem redirecionamento
export async function getAuthToken(): Promise<string | null> {
  // Cookies é uma função assíncrona e deve ser esperada
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  // Apenas retornar o token ou null
  return token || null;
}

// Função para obter os headers de autenticação
export function getAuthHeaders(token: string | null) {
  if (!token) return { 'Content-Type': 'application/json' };
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}