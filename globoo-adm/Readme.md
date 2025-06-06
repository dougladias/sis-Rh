1. **Clone o repositório**

- ( Abra o Terminal Bash ou qualquer outro terminal com autorização para usar node.js )

2. **Instale as dependências do Backend**

- ( Abra o Terminal do vs code na Pasta Backend )

- Digite o Comando *** npm i ou npm install  *** para instalar as dependências do backend

3. **Configure as variáveis de ambiente**

- ( Criar um arquivo chamado *** .env *** na pasta raiz do backend e coloque as variáveis de ambiente )

### Comunicação com o Banco de dados DATABASE_URL
### mude a Senha e o nome do banco de dados conforme o seu ou crie a um banco de dados
### no PG ADM Postgres com SENHA E BANCO DE DADOS IGUAL AO DO PROJETO.

### SENHA: 1425
### TABELA: GlobooAdm

*** Cole no arquivo .env ***

# Environment variables for the backend application
DATABASE_URL="postgresql://postgres:1425@localhost:5432/GlobooAdm?schema=public"

### Chave de segurança pode utilizar a mesma ela esta criptografada.

# Secret JWT
JWT_SECRET=875ddfd6c2668d2a4f85ea19ab3c1b82

4. **Execute as migrações do banco**

- ( Abra o Terminal do vs code na Pasta Backend )

*** Digite esse comando para criar as tabelas no Banco de dados Postgres ***

- npx prisma migrate dev

5. **Gere o clientPrisma**

- ( No mesmo terminal do Passo 4 Digite o comando para gerar as tabelas do projeto )

- npx prisma generate


6. **Inicie o servidor do Backend**

- ( No mesmo terminal do Passo 5 Digite o comando para iniciar o projeto e veja a mensagem *** Servidor Rodando na Porta 4000 *** )

- npm run dev

7. **Instale as dependências do Frontend**

- ( Abra o Terminal do vs code na Pasta frontend/vidaplena )

- Digite o Comando *** npm i ou npm install  *** para instalar as dependências do frontend

8. **Inicie o servidor do Frontend**

- ( No mesmo terminal do Passo 7 Digite o comando para iniciar o projeto e veja a mensagem *** localhost 3000 *** )

- Digite o Comando *** npm run dev ***


### TESTE DE ROTAS NO POSTMAN ###

*** Rotas para criar Usuarios ***

{
  "name": "Carlos Mendes",
  "email": "carlos.mendes@empresa.com",
  "password": "Senha@123",
  "role": "ADMIN"
}


*** Rotas para criar Perfis ***

{
  "success": true,
  "message": "Perfil criado com sucesso",
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Gerente Financeiro",
    "description": "Acesso a todas as funcionalidades financeiras do sistema",
    "permissions": [
      "VIEW_DASHBOARD", 
      "VIEW_FINANCE", 
      "EDIT_FINANCE", 
      "VIEW_PAYROLL",
      "EDIT_PAYROLL",
      "APPROVE_PAYMENTS",
      "MANAGE_INVOICES",
      "VIEW_REPORTS"
    ],
    "isActive": true,
    "createdAt": "2025-06-04T19:30:25.123Z",
    "updatedAt": "2025-06-04T19:30:25.123Z"
  }
}

*** Rotas para criar Permissões de perfis ***

{
  "userId": "SUBSTITUA_ID_DO_USUARIO_AQUI",
  "profileId": "SUBSTITUA_ID_DO_PERFIL_AQUI",
  "permissions": [
    "VIEW_DASHBOARD",
    "VIEW_REPORTS",
    "EDIT_PROFILE"
  ]
}


*** Rotas para criar Funcionarios ***

{
  "employeeCode": "F001",
  "name": "João da Silva",
  "cpf": "123.456.789-00",
  "rg": "12.345.678-9",
  "birthDate": "1990-05-15",
  "admissionDate": "2022-01-10",
  "salary": 5000.00,
  "allowance": 500.00,
  "phone": "(11) 98765-4321",
  "email": "joao.silva@empresa.com",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "contractType": "CLT",
  "position": "Analista de Sistemas",
  "department": "TI"
}

*** Rotas de Registro de Ponto ***

## Entrada
{
  "workerId": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2025-06-04",
  "entryTime": "2025-06-04T08:00:00.000Z",
  "notes": "Entrada registrada normalmente"
}

## Saída
{
  "leaveTime": "2025-06-04T17:00:00.000Z",
  "notes": "Saída registrada normalmente"
}

## consulta médica

{
  "workerId": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2025-06-05",
  "isAbsent": true,
  "absenceType": "Atestado Médico",
  "notes": "Consulta médica agendada"
}


