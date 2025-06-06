// "use client";

// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/buttonf";
// import { UserCog, Users, Shield, Eye, Edit, Trash2, Plus, ArrowLeft } from "lucide-react";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { motion } from "framer-motion";
// import { useAuth } from "@/contexts/AuthContext";
// import { useAuthManagement } from "@/hooks/useAuth";
// import useBackoffice from "@/hooks/useBackoffice";
// import { toast } from "sonner";

// export default function BackofficeIndex() {
//   const { user, checkPermission } = useAuth();
//   const {
//     users,
//     fetchUsers,
//     createUser,
//     updateUser,
//     deleteUser,
//     loading: usersLoading,
//     error: usersError
//   } = useAuthManagement();

//   const {
//     profiles,
//     fetchProfiles,
//     createProfile,
//     updateProfile,
//     deleteProfile,
//     assignProfileToUser,
//     loading: profilesLoading,
//     error: profilesError
//   } = useBackoffice();

//   // Estados principais
//   const [currentSection, setCurrentSection] = useState('dashboard');

//   // Estados de formulários
//   const [userForm, setUserForm] = useState({
//     name: '',
//     email: '',
//     password: '',
//     role: 'viewer',
//     profileId: ''
//   });
//   const [profileForm, setProfileForm] = useState({
//     name: '',
//     description: '',
//     permissions: [] as string[]
//   });

//   // Estados de diálogos
//   const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
//   const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
//   interface User {
//     id?: string;
//     _id?: string;
//     name: string;
//     email: string;
//     role: string;
//     isActive?: boolean;
//   }

//   const [editingUser, setEditingUser] = useState<User | null>(null);
//   interface Profile {
//     id?: string;
//     _id?: string;
//     name: string;
//     description?: string;
//     permissions: string[];
//   }

//   const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

//   // Verificação de permissões
//   const [hasUserPermission, setHasUserPermission] = useState(false);
//   const [hasProfilePermission, setHasProfilePermission] = useState(false);

//   // Carregar dados iniciais
//   useEffect(() => {
//     const loadData = async () => {
//       await fetchUsers();
//       await fetchProfiles();
//     };

//     loadData();
//   }, [fetchUsers, fetchProfiles]);

//   // Verificar permissões
//   useEffect(() => {
//     const checkPermissions = async () => {
//       if (user) {
//         try {
//           const userManagement = await checkPermission("users", "read");
//           const profileManagement = await checkPermission("profiles", "read") ||
//             await checkPermission("backoffice", "access") ||
//             (user && 'role' in user && user.role === 'manager');
    
//           setHasUserPermission(userManagement || (user && 'role' in user && user.role === 'manager'));
//           setHasProfilePermission(profileManagement);
//         } catch {
//             setHasUserPermission('role' in user && user.role === 'manager');
//             setHasProfilePermission('role' in user && user.role === 'manager');
//         }
//       }
//     };

//     checkPermissions();
//   }, [user, checkPermission]);

//   // Mostrar erros
//   useEffect(() => {
//     if (usersError) {
//       toast.error(`Erro nos usuários: ${usersError}`);
//     }
//     if (profilesError) {
//       toast.error(`Erro nos perfis: ${profilesError}`);
//     }
//   }, [usersError, profilesError]);

//   // Funções CRUD para usuários
//   const handleCreateUser = async () => {
//     if (!userForm.name || !userForm.email || !userForm.password) {
//       toast.error('Preencha todos os campos obrigatórios');
//       return;
//     }

//     try {
//       const newUser = await createUser({
//         name: userForm.name,
//         email: userForm.email,
//         password: userForm.password,
//         role: userForm.role
//       });

//       if (newUser) {
//         // Se um perfil foi selecionado, vincular o usuário ao perfil
//         if (userForm.profileId) {
//           await assignProfileToUser({
//             userId: newUser._id || newUser.id || '',
//             userEmail: newUser.email,
//             profileId: userForm.profileId
//           });
//         }

//         toast.success('Usuário criado com sucesso!');
//         setUserForm({ name: '', email: '', password: '', role: 'viewer', profileId: '' });
//         setIsUserDialogOpen(false);
//         await fetchUsers(); // Recarregar lista
//       }
//     } catch {
//       toast.error('Erro ao criar usuário');
//     }
//   };

//   const handleUpdateUser = async () => {
//     if (!editingUser || !userForm.name || !userForm.email) {
//       toast.error('Preencha todos os campos obrigatórios');
//       return;
//     }

//     try {
//       const userId = editingUser._id || editingUser.id;
//       const updatedUser = await updateUser(userId || '', {
//         name: userForm.name,
//         email: userForm.email,
//         role: userForm.role,
//         ...(userForm.password && { password: userForm.password })
//       });

//       if (updatedUser) {
//         // Se um perfil foi selecionado, vincular o usuário ao perfil
//         if (userForm.profileId) {
//           await assignProfileToUser({
//             userId: userId || '',
//             userEmail: updatedUser.email,
//             profileId: userForm.profileId
//           });
//         }

//         toast.success('Usuário atualizado com sucesso!');
//         setEditingUser(null);
//         setUserForm({ name: '', email: '', password: '', role: 'viewer', profileId: '' });
//         setIsUserDialogOpen(false);
//         await fetchUsers(); // Recarregar lista
//       }
//     } catch {
//       toast.error('Erro ao atualizar usuário');
//     }
//   };

//   const handleDeleteUser = async (userId: string) => {
//     if (confirm('Tem certeza que deseja excluir este usuário?')) {
//       try {
//         const success = await deleteUser(userId);
//         if (success) {
//           toast.success('Usuário excluído com sucesso!');
//           await fetchUsers(); // Recarregar lista
//         }
//       } catch {
//         toast.error('Erro ao excluir usuário');
//       }
//     }
//   };

//   // Funções CRUD para perfis
//   const handleCreateProfile = async () => {
//     if (!profileForm.name) {
//       toast.error('Nome do perfil é obrigatório');
//       return;
//     }

//     try {
//       const newProfile = await createProfile({
//         name: profileForm.name,
//         description: profileForm.description,
//         permissions: profileForm.permissions
//       });

//       if (newProfile) {
//         toast.success('Perfil criado com sucesso!');
//         setProfileForm({ name: '', description: '', permissions: [] });
//         setIsProfileDialogOpen(false);
//         await fetchProfiles(); // Recarregar lista
//       }
//     } catch {
//       toast.error('Erro ao criar perfil');
//     }
//   };

//   const handleUpdateProfile = async () => {
//     if (!editingProfile || !profileForm.name) {
//       toast.error('Nome do perfil é obrigatório');
//       return;
//     }

//     try {
//       const profileId = editingProfile._id || editingProfile.id;
//       const updatedProfile = await updateProfile(profileId || '', {
//         name: profileForm.name,
//         description: profileForm.description,
//         permissions: profileForm.permissions
//       });

//       if (updatedProfile) {
//         toast.success('Perfil atualizado com sucesso!');
//         setEditingProfile(null);
//         setProfileForm({ name: '', description: '', permissions: [] });
//         setIsProfileDialogOpen(false);
//         await fetchProfiles(); // Recarregar lista
//       }
//     } catch {
//       toast.error('Erro ao atualizar perfil');
//     }
//   };

//   const handleDeleteProfile = async (profileId: string) => {
//     if (confirm('Tem certeza que deseja excluir este perfil?')) {
//       try {
//         const success = await deleteProfile(profileId);
//         if (success) {
//           toast.success('Perfil excluído com sucesso!');
//           await fetchProfiles(); // Recarregar lista
//         }
//       } catch {
//         toast.error('Erro ao excluir perfil');
//       }
//     }
//   };

//   // Handlers de formulários
//   const handleEditUser = (user: User) => {
//     setEditingUser(user);
//     setUserForm({
//       name: user.name,
//       email: user.email,
//       password: '',
//       role: user.role,
//       profileId: '' // Você pode implementar lógica para buscar o perfil atual do usuário
//     });
//     setIsUserDialogOpen(true);
//   };

//   const handleEditProfile = (profile: Profile) => {
//     setEditingProfile(profile);
//     setProfileForm({
//       name: profile.name,
//       description: profile.description || '',
//       permissions: profile.permissions || []
//     });
//     setIsProfileDialogOpen(true);
//   };

//   // Permissões disponíveis para seleção
//   const availablePermissions = [
//   { id: 'backoffice:access', name: 'Acessar BackOffice' },
//   { id: 'dashboard:read', name: 'Acessar Dashboard' },  
//   { id: 'users:read', name: 'Visualizar Usuários' },
//   { id: 'users:create', name: 'Criar Usuários' },
//   { id: 'users:edit', name: 'Editar Usuários' },
//   { id: 'users:delete', name: 'Excluir Usuários' },
//   { id: 'profiles:read', name: 'Visualizar Perfis' },
//   { id: 'profiles:create', name: 'Criar Perfis' },
//   { id: 'profiles:edit', name: 'Editar Perfis' },
//   { id: 'profiles:delete', name: 'Excluir Perfis' },
//   { id: 'workers:read', name: 'Visualizar Workers' },
//   { id: 'workers:create', name: 'Criar Workers' },
//   { id: 'workers:edit', name: 'Editar Workers' },
//   { id: 'workers:delete', name: 'Excluir ' },
//   { id: 'documents:read', name: 'Visualizar Documentos' },
//   { id: 'documents:create', name: 'Criar Documentos' },
//   { id: 'documents:edit', name: 'Editar Documentos' },
//   { id: 'documents:delete', name: 'Excluir Documentos' }, 
//   { id: 'timesheet:read', name: 'Visualizar Ponto' },
//   { id: 'timesheet:edit', name: 'Editar Ponto' },
//   { id: 'payroll:read', name: 'Visualizar Folha de Pagamento' },
//   { id: 'payroll:edit', name: 'Editar Folha de Pagamento' },  
//   { id: 'templates:read', name: 'Visualizar Templates' },
//   { id: 'templates:edit', name: 'Editar Templates' },
//   { id: 'templates:create', name: 'Criar Templates' },
//   { id: 'templates:delete', name: 'Excluir Templates' },  
//   { id: 'invoices:read', name: 'Visualizar Notas Fiscais' },     
//   { id: 'invoices:create', name: 'Criar Notas Fiscais' },        
//   { id: 'invoices:edit', name: 'Editar Notas Fiscais' },         
//   { id: 'invoices:delete', name: 'Excluir Notas Fiscais' },      
//   { id: 'visitors:read', name: 'Visualizar Visitantes' },
//   { id: 'visitors:create', name: 'Criar Visitantes' },
//   { id: 'visitors:edit', name: 'Editar Visitantes' },
//   { id: 'visitors:delete', name: 'Excluir Visitantes' },
//   { id: 'providers:read', name: 'Visualizar Prestadores' },
//   { id: 'providers:create', name: 'Criar Prestadores' },
//   { id: 'providers:edit', name: 'Editar Prestadores' },
//   { id: 'providers:delete', name: 'Excluir Prestadores' },
//   { id: 'tasks:read', name: 'Visualizar Lista de Tarefas' },
//   { id: 'tasks:create', name: 'Criar Lista de Tarefas' },
//   { id: 'tasks:edit', name: 'Editar Lista de Tarefas' },
//   { id: 'tasks:delete', name: 'Excluir Lista de Tarefas' }
//   ];

//   // Animation variants
//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         when: "beforeChildren",
//         staggerChildren: 0.1
//       }
//     }
//   };

//   const itemVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { type: "spring", stiffness: 260, damping: 20 }
//     }
//   };

//   // Módulos disponíveis baseados em permissões
//   const availableModules = [
//     {
//       title: "Gerenciamento de Usuários",
//       description: "Adicionar, editar e remover usuários do sistema",
//       icon: Users,
//       section: "users",
//       color: "bg-blue-100 text-blue-700",
//       permission: hasUserPermission
//     },
//     {
//       title: "Perfis de Acesso",
//       description: "Gerenciar perfis e grupos de usuários",
//       icon: UserCog,
//       section: "profiles",
//       color: "bg-green-100 text-green-700",
//       permission: hasProfilePermission
//     }
//   ].filter(module => module.permission);

//   return (
//     <motion.div
//       className="p-6 ml-[var(--sidebar-width,4.5rem)] transition-all duration-300 bg-gray-50 dark:bg-gray-900 min-h-screen"
//       initial="hidden"
//       animate="visible"
//       variants={containerVariants}
//       style={{ width: "calc(100% - var(--sidebar-width, 4.5rem))" }}
//     >
//       {/* Dashboard */}
//       {currentSection === 'dashboard' && (
//         <>
//           <motion.div variants={itemVariants} className="mb-6">
//             <h1 className="text-3xl font-bold text-gray-800 dark:text-white">BackOffice</h1>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">
//               Sistema de gerenciamento e controle de acessos integrado
//             </p>
//           </motion.div>

//           {/* Estatísticas */}
//           <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-3 mb-6">
//             <Card className="shadow-lg border border-gray-100 dark:border-gray-700">
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                       Total de Usuários
//                     </p>
//                     <p className="text-3xl font-bold text-blue-600">
//                       {users?.length || 0}
//                     </p>
//                   </div>
//                   <Users className="h-8 w-8 text-blue-500" />
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="shadow-lg border border-gray-100 dark:border-gray-700">
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                       Perfis de Acesso
//                     </p>
//                     <p className="text-3xl font-bold text-green-600">
//                       {profiles?.length || 0}
//                     </p>
//                   </div>
//                   <Shield className="h-8 w-8 text-green-500" />
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="shadow-lg border border-gray-100 dark:border-gray-700">
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                       Usuários Ativos
//                     </p>
//                     <p className="text-3xl font-bold text-orange-600">
//                       {users?.filter(u => u.isActive)?.length || 0}
//                     </p>
//                   </div>
//                   <UserCog className="h-8 w-8 text-orange-500" />
//                 </div>
//               </CardContent>
//             </Card>
//           </motion.div>

//           {availableModules.length > 0 ? (
//             <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-2">
//               {availableModules.map((module, i) => (
//                 <motion.div key={i} variants={itemVariants}>
//                   <Card className="overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
//                     <CardHeader className="pb-3">
//                       <div className="flex items-center gap-2">
//                         <div className={`p-2 rounded-md ${module.color}`}>
//                           <module.icon className="h-5 w-5" />
//                         </div>
//                         <CardTitle>{module.title}</CardTitle>
//                       </div>
//                     </CardHeader>
//                     <CardContent className="space-y-4">
//                       <CardDescription className="min-h-[40px] text-gray-600 dark:text-gray-400">
//                         {module.description}
//                       </CardDescription>
//                       <Button
//                         className="w-full bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors"
//                         onClick={() => setCurrentSection(module.section)}
//                       >
//                         Acessar
//                       </Button>
//                     </CardContent>
//                   </Card>
//                 </motion.div>
//               ))}
//             </motion.div>
//           ) : (
//             <motion.div variants={itemVariants} className="text-center py-12">
//               <Shield className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600" />
//               <h3 className="mt-4 text-xl font-medium text-gray-700 dark:text-gray-300">
//                 Acesso Restrito
//               </h3>
//               <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
//                 Você não possui permissões para acessar os módulos do backoffice.
//                 Entre em contato com o administrador do sistema.
//               </p>
//             </motion.div>
//           )}
//         </>
//       )}

//       {/* Gerenciamento de Usuários */}
//       {currentSection === 'users' && hasUserPermission && (
//         <>
//           <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Usuários</h1>
//               <p className="text-gray-500 dark:text-gray-400 mt-1">
//                 Gerenciamento de usuários do sistema
//               </p>
//             </div>
//             <div className="flex gap-2">
//               <Button
//                 variant="outline"
//                 onClick={() => setCurrentSection('dashboard')}
//               >
//                 <ArrowLeft className="h-4 w-4 mr-2" />
//                 Voltar
//               </Button>
//               <Button
//                 onClick={() => {
//                   setEditingUser(null);
//                   setUserForm({ name: '', email: '', password: '', role: 'viewer', profileId: '' });
//                   setIsUserDialogOpen(true);
//                 }}
//                 className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
//                 disabled={usersLoading}
//               >
//                 <Plus className="h-4 w-4 mr-2" />
//                 Novo Usuário
//               </Button>
//             </div>
//           </motion.div>

//           <motion.div variants={itemVariants}>
//             <Card className="shadow-lg border border-gray-100 dark:border-gray-700">
//               <CardHeader className="pb-3">
//                 <CardTitle>Lista de Usuários</CardTitle>
//                 <CardDescription>
//                   Usuários cadastrados no sistema
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 {usersLoading ? (
//                   <div className="text-center py-8">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//                     <p className="mt-2">Carregando usuários...</p>
//                   </div>
//                 ) : users && users.length > 0 ? (
//                   <div className="overflow-x-auto">
//                     <table className="w-full">
//                       <thead className="border-b">
//                         <tr>
//                           <th className="text-left p-4">Nome</th>
//                           <th className="text-left p-4">Email</th>
//                           <th className="text-left p-4">Role</th>
//                           <th className="text-left p-4">Status</th>
//                           <th className="text-left p-4">Ações</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {users.map(user => (
//                           <tr key={user._id || user.id} className="border-b">
//                             <td className="p-4">{user.name}</td>
//                             <td className="p-4">{user.email}</td>
//                             <td className="p-4">
//                               <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
//                                 {user.role}
//                               </span>
//                             </td>
//                             <td className="p-4">
//                               <span className={`px-2 py-1 rounded text-sm ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                                 }`}>
//                                 {user.isActive ? 'Ativo' : 'Inativo'}
//                               </span>
//                             </td>
//                             <td className="p-4">
//                               <div className="flex gap-2">
//                                 <Eye size={16} className="text-blue-500 cursor-pointer" />
//                                 <Edit
//                                   size={16}
//                                   className="text-green-500 cursor-pointer"
//                                   onClick={() => handleEditUser(user)}
//                                 />
//                                 <Trash2
//                                   size={16}
//                                   className="text-red-500 cursor-pointer"
//                                   onClick={() => handleDeleteUser(user._id || user.id || '')}
//                                 />
//                               </div>
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 ) : (
//                   <div className="text-center py-8">
//                     <Users className="mx-auto h-12 w-12 text-gray-400" />
//                     <h3 className="mt-2 text-lg font-medium text-gray-700 dark:text-gray-300">
//                       Nenhum usuário encontrado
//                     </h3>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">
//                       Clique em &quot;Novo Usuário&quot; para adicionar o primeiro usuário
//                     </p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </motion.div>
//         </>
//       )}

//       {/* Gerenciamento de Perfis */}
//       {currentSection === 'profiles' && hasProfilePermission && (
//         <>
//           <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Perfis de Acesso</h1>
//               <p className="text-gray-500 dark:text-gray-400 mt-1">
//                 Gerencie grupos de permissões para facilitar a administração de usuários
//               </p>
//             </div>
//             <div className="flex gap-2">
//               <Button
//                 variant="outline"
//                 onClick={() => setCurrentSection('dashboard')}
//               >
//                 <ArrowLeft className="h-4 w-4 mr-2" />
//                 Voltar
//               </Button>
//               <Button
//                 onClick={() => {
//                   setEditingProfile(null);
//                   setProfileForm({ name: '', description: '', permissions: [] });
//                   setIsProfileDialogOpen(true);
//                 }}
//                 className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
//                 disabled={profilesLoading}
//               >
//                 <Plus className="h-4 w-4 mr-2" />
//                 Novo Perfil
//               </Button>
//             </div>
//           </motion.div>

//           <motion.div variants={itemVariants}>
//             <Card className="shadow-lg border border-gray-100 dark:border-gray-700">
//               <CardHeader className="pb-3">
//                 <CardTitle>Perfis Disponíveis</CardTitle>
//                 <CardDescription>
//                   Lista de perfis configurados no sistema
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 {profilesLoading ? (
//                   <div className="text-center py-8">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//                     <p className="mt-2">Carregando perfis...</p>
//                   </div>
//                 ) : profiles && profiles.length > 0 ? (
//                   <div className="space-y-4">
//                     {profiles.map(profile => (
//                       <div key={profile._id || profile.id} className="p-4 border rounded-lg">
//                         <div className="flex justify-between items-start mb-2">
//                           <div>
//                             <h4 className="font-semibold text-lg">{profile.name}</h4>
//                             <p className="text-sm text-gray-600 dark:text-gray-400">
//                               {profile.description || 'Sem descrição'}
//                             </p>
//                           </div>
//                           <div className="flex gap-2">
//                             <Edit
//                               size={16}
//                               className="text-green-500 cursor-pointer"
//                               onClick={() => handleEditProfile(profile)}
//                             />
//                             <Trash2
//                               size={16}
//                               className="text-red-500 cursor-pointer"
//                               onClick={() => handleDeleteProfile(profile._id || profile.id || '')}
//                             />
//                           </div>
//                         </div>
//                         <div className="text-sm">
//                           <strong>Permissões:</strong> {profile.permissions?.length || 0} configuradas
//                         </div>
//                         {profile.permissions && profile.permissions.length > 0 && (
//                           <div className="mt-2 flex flex-wrap gap-1">
//                             {profile.permissions.slice(0, 5).map((permission, index) => (
//                               <span
//                                 key={index}
//                                 className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
//                               >
//                                 {permission}
//                               </span>
//                             ))}
//                             {profile.permissions.length > 5 && (
//                               <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
//                                 +{profile.permissions.length - 5} mais
//                               </span>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-8">
//                     <UserCog className="mx-auto h-12 w-12 text-gray-400" />
//                     <h3 className="mt-2 text-lg font-medium text-gray-700 dark:text-gray-300">
//                       Nenhum perfil criado
//                     </h3>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">
//                       Clique em &quot;Novo Perfil&quot; para criar o primeiro perfil
//                     </p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </motion.div>
//         </>
//       )}

//       {/* Dialog para Usuários */}
//       <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
//             <DialogDescription>
//               {editingUser ? 'Atualize as informações do usuário' : 'Preencha os dados do novo usuário'}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium mb-2">Nome *</label>
//               <input
//                 type="text"
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-cyan-500"
//                 value={userForm.name}
//                 onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
//                 placeholder="Nome completo"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-2">Email *</label>
//               <input
//                 type="email"
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-cyan-500"
//                 value={userForm.email}
//                 onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
//                 placeholder="email@exemplo.com"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-2">
//                 Senha {editingUser ? '(deixe em branco para manter a atual)' : '*'}
//               </label>
//               <input
//                 type="password"
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-cyan-500"
//                 value={userForm.password}
//                 onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
//                 placeholder="Senha do usuário"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-2">Role</label>
//               <select
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-cyan-500"
//                 value={userForm.role}
//                 onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
//               >
//                 <option value="viewer">Visualizador</option>
//                 <option value="assistant">Assistente</option>
//                 <option value="manager">Gerente</option>
//                 <option value="administrative">Administrative</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-2">Perfil (Opcional)</label>
//               <select
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-cyan-500"
//                 value={userForm.profileId}
//                 onChange={(e) => setUserForm({ ...userForm, profileId: e.target.value })}
//               >
//                 <option value="">Selecione um perfil</option>
//                 {profiles?.map(profile => (
//                   <option key={profile._id || profile.id} value={profile._id || profile.id}>
//                     {profile.name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="flex gap-2 pt-4">
//               <Button
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => setIsUserDialogOpen(false)}
//                 disabled={usersLoading}
//               >
//                 Cancelar
//               </Button>
//               <Button
//                 className="flex-1 bg-cyan-500 hover:bg-cyan-600"
//                 onClick={editingUser ? handleUpdateUser : handleCreateUser}
//                 disabled={usersLoading}
//               >
//                 {usersLoading ? 'Processando...' : (editingUser ? 'Atualizar' : 'Criar')}
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* Dialog para Perfis */}
//       <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
//         <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>{editingProfile ? 'Editar Perfil' : 'Novo Perfil'}</DialogTitle>
//             <DialogDescription>
//               {editingProfile ? 'Atualize as informações e permissões deste perfil' : 'Configure as informações e permissões para o novo perfil'}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium mb-2">Nome *</label>
//               <input
//                 type="text"
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-cyan-500"
//                 value={profileForm.name}
//                 onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
//                 placeholder="Nome do perfil"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-2">Descrição</label>
//               <textarea
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-cyan-500"
//                 value={profileForm.description}
//                 onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
//                 placeholder="Descrição do perfil"
//                 rows={3}
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-3">Permissões</label>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-3">
//                 {availablePermissions.map(permission => (
//                   <label key={permission.id} className="flex items-center space-x-2">
//                     <input
//                       type="checkbox"
//                       checked={profileForm.permissions.includes(permission.id)}
//                       onChange={(e) => {
//                         if (e.target.checked) {
//                           setProfileForm({
//                             ...profileForm,
//                             permissions: [...profileForm.permissions, permission.id]
//                           });
//                         } else {
//                           setProfileForm({
//                             ...profileForm,
//                             permissions: profileForm.permissions.filter(p => p !== permission.id)
//                           });
//                         }
//                       }}
//                       className="rounded"
//                     />
//                     <span className="text-sm">{permission.name}</span>
//                   </label>
//                 ))}
//               </div>
//               <p className="text-xs text-gray-500 mt-2">
//                 {profileForm.permissions.length} permissão(ões) selecionada(s)
//               </p>
//             </div>

//             <div className="flex gap-2 pt-4">
//               <Button
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => setIsProfileDialogOpen(false)}
//                 disabled={profilesLoading}
//               >
//                 Cancelar
//               </Button>
//               <Button
//                 className="flex-1 bg-cyan-500 hover:bg-cyan-600"
//                 onClick={editingProfile ? handleUpdateProfile : handleCreateProfile}
//                 disabled={profilesLoading}
//               >
//                 {profilesLoading ? 'Processando...' : (editingProfile ? 'Atualizar' : 'Criar')}
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </motion.div>
//   );
// }