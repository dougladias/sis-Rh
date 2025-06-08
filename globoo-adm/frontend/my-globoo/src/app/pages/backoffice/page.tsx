"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, Users, Shield, Eye, Edit, Trash2, Plus, ArrowLeft } from "lucide-react";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

// Componente de Alerta personalizado para evitar conflitos com o componente do shadcn
type AlertProps = {
  variant: "success" | "error" | "warning" | "info";
  message: string;
  onClose: () => void;
};

const Alert = ({ variant, message, onClose }: AlertProps) => {
  const bgColor = {
    success: "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600",
    error: "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600",
    warning: "bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600",
    info: "bg-cyan-100 border-cyan-500 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-600"
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${bgColor[variant]} flex justify-between items-center`}>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-stone-500 hover:text-stone-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

// Interfaces corrigidas baseadas no backend
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Profile {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BackofficeIndex() {
  // Estados principais
  const [currentSection, setCurrentSection] = useState('dashboard');
  
  // Estados de dados
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados de formulários
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    profileId: ''
  });
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  // Estados de diálogos
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  // Permissões disponíveis (baseadas no seu schema)
  const availablePermissions = [
    { id: 'backoffice:access', name: 'Acessar BackOffice' },     
    { id: 'users:read', name: 'Visualizar Usuários' },
    { id: 'users:create', name: 'Criar Usuários' },
    { id: 'users:edit', name: 'Editar Usuários' },
    { id: 'users:delete', name: 'Excluir Usuários' },
    { id: 'profiles:read', name: 'Visualizar Perfis' },
    { id: 'profiles:create', name: 'Criar Perfis' },
    { id: 'profiles:edit', name: 'Editar Perfis' },
    { id: 'profiles:delete', name: 'Excluir Perfis' },
    { id: 'workers:read', name: 'Visualizar Funcionários' },
    { id: 'workers:create', name: 'Criar Funcionários' },
    { id: 'workers:edit', name: 'Editar Funcionários' },
    { id: 'workers:delete', name: 'Excluir Funcionários' },
    { id: 'documents:read', name: 'Visualizar Documentos' },
    { id: 'documents:create', name: 'Criar Documentos' },
    { id: 'documents:edit', name: 'Editar Documentos' },
    { id: 'documents:delete', name: 'Excluir Documentos' },
    { id: 'timesheet:read', name: 'Visualizar Ponto' },
    { id: 'timesheet:edit', name: 'Editar Ponto' },
    { id: 'payroll:read', name: 'Visualizar Folha de Pagamento' },
    { id: 'payroll:edit', name: 'Editar Folha de Pagamento' },
    { id: 'templates:read', name: 'Visualizar Templates' },
    { id: 'templates:edit', name: 'Editar Templates' },
    { id: 'templates:create', name: 'Criar Templates' },
    { id: 'templates:delete', name: 'Excluir Templates' },
    { id: 'invoices:read', name: 'Visualizar Notas Fiscais' },
    { id: 'invoices:create', name: 'Criar Notas Fiscais' },
    { id: 'invoices:edit', name: 'Editar Notas Fiscais' },
    { id: 'invoices:delete', name: 'Excluir Notas Fiscais' },
    { id: 'visitors:read', name: 'Visualizar Visitantes' },
    { id: 'visitors:create', name: 'Criar Visitantes' },
    { id: 'visitors:edit', name: 'Editar Visitantes' },
    { id: 'visitors:delete', name: 'Excluir Visitantes' },
    { id: 'providers:read', name: 'Visualizar Prestadores' },
    { id: 'providers:create', name: 'Criar Prestadores' },
    { id: 'providers:edit', name: 'Editar Prestadores' },
    { id: 'providers:delete', name: 'Excluir Prestadores' }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 20 }
    }
  };

  // Função para limpar erros
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Detectar e reagir às mudanças de tema
  useEffect(() => {
    // Verificar o tema inicial
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listener para mudanças de tema
    const handleThemeChange = (e: CustomEvent) => {      
      const newTheme = e.detail?.theme || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    window.addEventListener('themeToggled', handleThemeChange as EventListener);
    return () => window.removeEventListener('themeToggled', handleThemeChange as EventListener);
  }, []);

  // Função para fazer requisições autenticadas
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`http://localhost:4000${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro na requisição');
    }

    return response.json();
  }, []);

  // Função para obter token (ajuste conforme sua implementação)
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return document.cookie
        .split('; ')
        .find(row => row.startsWith('session='))
        ?.split('=')[1];
    }
    return null;
  };

  // Funções de carregamento com useCallback para evitar re-renders desnecessários
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall('/users');
      if (response.success) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError('Erro ao carregar usuários');
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall('/profiles');
      if (response.success) {
        setProfiles(response.profiles);
      }
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
      setError('Erro ao carregar perfis');
      toast.error('Erro ao carregar perfis');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Carregar dados iniciais
  useEffect(() => {
    loadUsers();
    loadProfiles();
  }, [loadUsers, loadProfiles]);

  // Funções CRUD para usuários
  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const response = await apiCall('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role
        })
      });

      if (response.success) {
        // Se um perfil foi selecionado, vincular o usuário ao perfil
        if (userForm.profileId) {
          // Encontrar o perfil selecionado para obter suas permissões
          const selectedProfile = profiles.find(profile => profile.id === userForm.profileId);
          
          if (selectedProfile && selectedProfile.permissions && selectedProfile.permissions.length > 0) {
            await apiCall('/permissions', {
              method: 'POST',
              body: JSON.stringify({
                userId: response.user.id,
                profileId: userForm.profileId,
                permissions: selectedProfile.permissions // Usar as permissões do perfil
              })
            });
          } else {
            // Se o perfil não tiver permissões, informe o usuário
            toast.warning('O perfil selecionado não possui permissões. Adicione permissões ao perfil primeiro.');
          }
        }

        setSuccessMessage('Usuário criado com sucesso!');
        toast.success('Usuário criado com sucesso!');
        setUserForm({ name: '', email: '', password: '', role: 'EMPLOYEE', profileId: '' });
        setIsUserDialogOpen(false);
        await loadUsers();
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      setError(error instanceof Error ? error.message : 'Erro ao criar usuário');
      toast.error(error instanceof Error ? error.message : 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !userForm.name || !userForm.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const updateData: { name: string; email: string; role: string; password?: string } = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role
      };

      if (userForm.password) {
        updateData.password = userForm.password;
      }

      const response = await apiCall(`/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response.success) {
        setSuccessMessage('Usuário atualizado com sucesso!');
        toast.success('Usuário atualizado com sucesso!');
        setEditingUser(null);
        setUserForm({ name: '', email: '', password: '', role: 'EMPLOYEE', profileId: '' });
        setIsUserDialogOpen(false);
        await loadUsers();
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar usuário');
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        setLoading(true);
        await apiCall(`/users/${userId}`, { method: 'DELETE' });
        setSuccessMessage('Usuário excluído com sucesso!');
        toast.success('Usuário excluído com sucesso!');
        await loadUsers();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        setError(error instanceof Error ? error.message : 'Erro ao excluir usuário');
        toast.error(error instanceof Error ? error.message : 'Erro ao excluir usuário');
      } finally {
        setLoading(false);
      }
    }
  };

  // Funções CRUD para perfis
  const handleCreateProfile = async () => {
    if (!profileForm.name) {
      toast.error('Nome do perfil é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const response = await apiCall('/profiles', {
        method: 'POST',
        body: JSON.stringify(profileForm)
      });

      if (response.success) {
        setSuccessMessage('Perfil criado com sucesso!');
        toast.success('Perfil criado com sucesso!');
        setProfileForm({ name: '', description: '', permissions: [] });
        setIsProfileDialogOpen(false);
        await loadProfiles();
      }
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro ao criar perfil');
      toast.error(error instanceof Error ? error.message : 'Erro ao criar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile || !profileForm.name) {
      toast.error('Nome do perfil é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const response = await apiCall(`/profiles/${editingProfile.id}`, {
        method: 'PUT',
        body: JSON.stringify(profileForm)
      });

      if (response.success) {
        setSuccessMessage('Perfil atualizado com sucesso!');
        toast.success('Perfil atualizado com sucesso!');
        setEditingProfile(null);
        setProfileForm({ name: '', description: '', permissions: [] });
        setIsProfileDialogOpen(false);
        await loadProfiles();
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (confirm('Tem certeza que deseja excluir este perfil?')) {
      try {
        setLoading(true);
        await apiCall(`/profiles/${profileId}`, { method: 'DELETE' });
        setSuccessMessage('Perfil excluído com sucesso!');
        toast.success('Perfil excluído com sucesso!');
        await loadProfiles();
      } catch (error) {
        console.error('Erro ao excluir perfil:', error);
        setError(error instanceof Error ? error.message : 'Erro ao excluir perfil');
        toast.error(error instanceof Error ? error.message : 'Erro ao excluir perfil');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handlers de formulários
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      profileId: ''
    });
    setIsUserDialogOpen(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setProfileForm({
      name: profile.name,
      description: profile.description || '',
      permissions: profile.permissions || []
    });
    setIsProfileDialogOpen(true);
  };

  return (
    <motion.div
      className="p-6 min-h-screen bg-stone-50 dark:bg-gray-950"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-3xl font-bold text-stone-800 dark:text-white">BackOffice</h1>
        <p className="text-stone-500 dark:text-gray-400 mt-1">
          Sistema de gerenciamento e controle de acessos integrado
        </p>
      </motion.div>

      {/* Mensagens de sucesso/erro */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Alert
              variant="success"
              message={successMessage}
              onClose={() => setSuccessMessage('')}
            />
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Alert
              variant="error"
              message={error}
              onClose={clearError}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard */}
      {currentSection === 'dashboard' && (
        <>
          {/* Estatísticas */}
          <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-3 mb-6">
            <Card className="shadow-lg border border-stone-100 dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-600 dark:text-gray-400">
                      Total de Usuários
                    </p>
                    <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                      {users.length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-cyan-500 dark:text-cyan-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-stone-100 dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-600 dark:text-gray-400">
                      Perfis de Acesso
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {profiles.length}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-green-500 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-stone-100 dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-600 dark:text-gray-400">
                      Usuários Ativos
                    </p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {users.filter(u => u.isActive).length}
                    </p>
                  </div>
                  <UserCog className="h-8 w-8 text-orange-500 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Módulos disponíveis */}
          <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-2">
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden shadow-lg border border-stone-100 dark:border-gray-700 dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      <Users className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-stone-800 dark:text-white">Gerenciamento de Usuários</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="min-h-[40px] text-stone-600 dark:text-gray-400">
                    Adicionar, editar e remover usuários do sistema
                  </CardDescription>
                  <Button
                    className="w-full bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors"
                    onClick={() => setCurrentSection('users')}
                  >
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden shadow-lg border border-stone-100 dark:border-gray-700 dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                      <UserCog className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-stone-800 dark:text-white">Perfis de Acesso</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="min-h-[40px] text-stone-600 dark:text-gray-400">
                    Gerenciar perfis e grupos de usuários
                  </CardDescription>
                  <Button
                    className="w-full bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors"
                    onClick={() => setCurrentSection('profiles')}
                  >
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}

      {/* Gerenciamento de Usuários */}
      {currentSection === 'users' && (
        <>
          <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Usuários</h1>
              <p className="text-stone-500 dark:text-gray-400 mt-1">
                Gerenciamento de usuários do sistema
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentSection('dashboard')}
                className="border-stone-300 dark:border-gray-600 dark:text-gray-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ name: '', email: '', password: '', role: 'EMPLOYEE', profileId: '' });
                  setIsUserDialogOpen(true);
                }}
                className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-white rounded-xl shadow-lg overflow-hidden border border-stone-100 dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="border-b border-stone-200 dark:border-gray-700">
                <CardTitle className="text-xl font-semibold text-stone-800 dark:text-white">Lista de Usuários</CardTitle>
                <CardDescription className="text-stone-500 dark:text-gray-400">
                  Usuários cadastrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 dark:border-cyan-400 mx-auto"></div>
                    <p className="mt-2 text-stone-600 dark:text-gray-400">Carregando usuários...</p>
                  </div>
                ) : users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-stone-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-900">
                        <tr>
                          <th className="text-left p-4 text-stone-500 dark:text-gray-400 font-medium">Nome</th>
                          <th className="text-left p-4 text-stone-500 dark:text-gray-400 font-medium">Email</th>
                          <th className="text-left p-4 text-stone-500 dark:text-gray-400 font-medium">Role</th>
                          <th className="text-left p-4 text-stone-500 dark:text-gray-400 font-medium">Status</th>
                          <th className="text-left p-4 text-stone-500 dark:text-gray-400 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                        {users.map(user => (
                          <tr key={user.id} className="hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="p-4 text-stone-900 dark:text-gray-100">{user.name}</td>
                            <td className="p-4 text-stone-900 dark:text-gray-100">{user.email}</td>
                            <td className="p-4">
                              <span className="px-2 py-1 rounded text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                {user.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-sm ${
                                user.isActive 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                              }`}>
                                {user.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Eye size={16} className="text-cyan-500 dark:text-cyan-400 cursor-pointer" />
                                <Edit
                                  size={16}
                                  className="text-green-500 dark:text-green-400 cursor-pointer"
                                  onClick={() => handleEditUser(user)}
                                />
                                <Trash2
                                  size={16}
                                  className="text-red-500 dark:text-red-400 cursor-pointer"
                                  onClick={() => handleDeleteUser(user.id)}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-stone-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-lg font-medium text-stone-700 dark:text-gray-300">
                      Nenhum usuário encontrado
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-gray-400">
                      Clique em &quot;Novo Usuário&quot; para adicionar o primeiro usuário
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* Gerenciamento de Perfis */}
      {currentSection === 'profiles' && (
        <>
          <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-stone-800 dark:text-white">Perfis de Acesso</h1>
              <p className="text-stone-500 dark:text-gray-400 mt-1">
                Gerencie grupos de permissões para facilitar a administração de usuários
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentSection('dashboard')}
                className="border-stone-300 dark:border-gray-600 dark:text-gray-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => {
                  setEditingProfile(null);
                  setProfileForm({ name: '', description: '', permissions: [] });
                  setIsProfileDialogOpen(true);
                }}
                className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Perfil
              </Button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-white rounded-xl shadow-lg overflow-hidden border border-stone-100 dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="border-b border-stone-200 dark:border-gray-700">
                <CardTitle className="text-xl font-semibold text-stone-800 dark:text-white">Perfis Disponíveis</CardTitle>
                <CardDescription className="text-stone-500 dark:text-gray-400">
                  Lista de perfis configurados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 dark:border-cyan-400 mx-auto"></div>
                    <p className="mt-2 text-stone-600 dark:text-gray-400">Carregando perfis...</p>
                  </div>
                ) : profiles.length > 0 ? (
                  <div className="space-y-4">
                    {profiles.map(profile => (
                      <div key={profile.id} className="p-4 border rounded-lg border-stone-200 dark:border-gray-700 hover:bg-stone-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-lg text-stone-900 dark:text-gray-100">{profile.name}</h4>
                            <p className="text-sm text-stone-600 dark:text-gray-400">
                              {profile.description || 'Sem descrição'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Edit
                              size={16}
                              className="text-green-500 dark:text-green-400 cursor-pointer"
                              onClick={() => handleEditProfile(profile)}
                            />
                            <Trash2
                              size={16}
                              className="text-red-500 dark:text-red-400 cursor-pointer"
                              onClick={() => handleDeleteProfile(profile.id)}
                            />
                          </div>
                        </div>
                        <div className="text-sm text-stone-600 dark:text-gray-400">
                          <strong>Permissões:</strong> {profile.permissions?.length || 0} configuradas
                        </div>
                        {profile.permissions && profile.permissions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {profile.permissions.slice(0, 5).map((permission, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded"
                              >
                                {availablePermissions.find(p => p.id === permission)?.name || permission}
                              </span>
                            ))}
                            {profile.permissions.length > 5 && (
                              <span className="px-2 py-1 bg-stone-100 dark:bg-gray-700 text-stone-600 dark:text-gray-300 text-xs rounded">
                                +{profile.permissions.length - 5} mais
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserCog className="mx-auto h-12 w-12 text-stone-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-lg font-medium text-stone-700 dark:text-gray-300">
                      Nenhum perfil criado
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-gray-400">
                      Clique em &quot;Novo Perfil&quot; para criar o primeiro perfil
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* Dialog para Usuários */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 dark:text-gray-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-stone-900 dark:text-white">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription className="text-stone-600 dark:text-gray-400">
              {editingUser ? 'Atualize as informações do usuário' : 'Preencha os dados do novo usuário'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2">Nome *</label>
              <Input
                type="text"
                className="w-full dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2">Email *</label>
              <Input
                type="email"
                className="w-full dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2">
                Senha {editingUser ? '(deixe em branco para manter a atual)' : '*'}
              </label>
              <Input
                type="password"
                className="w-full dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Senha do usuário"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2">Role</label>
              <select
                className="w-full p-2 border rounded border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-cyan-500"
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="EMPLOYEE">Funcionário</option>
                <option value="ASSISTANT">Assistente</option>
                <option value="RH">RH</option>
                <option value="FINANCE">Financeiro</option>
                <option value="ADMIN">Administrador</option>
                <option value="MANAGER">Gerente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2">Perfil (Opcional)</label>
              <select
                className="w-full p-2 border rounded border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-cyan-500"
                value={userForm.profileId}
                onChange={(e) => setUserForm({ ...userForm, profileId: e.target.value })}
              >
                <option value="">Selecione um perfil</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1 border-stone-300 dark:border-gray-600 dark:text-gray-300"
                onClick={() => setIsUserDialogOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                disabled={loading}
              >
                {loading ? 'Processando...' : (editingUser ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Perfis */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 dark:text-gray-100 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-stone-900 dark:text-white">{editingProfile ? 'Editar Perfil' : 'Novo Perfil'}</DialogTitle>
            <DialogDescription className="text-stone-600 dark:text-gray-400">
              {editingProfile ? 'Atualize as informações e permissões deste perfil' : 'Configure as informações e permissões para o novo perfil'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2">Nome *</label>
              <Input
                type="text"
                className="w-full dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Nome do perfil"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2">Descrição</label>
              <textarea
                className="w-full p-2 border rounded border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-cyan-500"
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                placeholder="Descrição do perfil"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-3">Permissões</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-3 border-stone-300 dark:border-gray-600">
                {availablePermissions.map(permission => (
                  <label key={permission.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={profileForm.permissions.includes(permission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProfileForm({
                            ...profileForm,
                            permissions: [...profileForm.permissions, permission.id]
                          });
                        } else {
                          setProfileForm({
                            ...profileForm,
                            permissions: profileForm.permissions.filter(p => p !== permission.id)
                          });
                        }
                      }}
                      className="rounded border-stone-300 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="text-sm text-stone-700 dark:text-gray-300">{permission.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-stone-500 dark:text-gray-400 mt-2">
                {profileForm.permissions.length} permissão(ões) selecionada(s)
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1 border-stone-300 dark:border-gray-600 dark:text-gray-300"
                onClick={() => setIsProfileDialogOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                onClick={editingProfile ? handleUpdateProfile : handleCreateProfile}
                disabled={loading}
              >
                {loading ? 'Processando...' : (editingProfile ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}