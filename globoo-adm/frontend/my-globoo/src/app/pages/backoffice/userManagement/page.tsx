// "use client";

// import { useState, useEffect } from "react";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/buttonf";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { toast } from "sonner";
// import { UserCog, Plus, Edit, Trash2 } from "lucide-react";
// import { motion } from "framer-motion";
// import useBackoffice from "@/hooks/useBackoffice";
// import { useAuth } from "@/contexts/AuthContext";

// // Tipos locais baseados nos tipos do sistema
// interface UIProfile {
//   id: string;
//   name: string;
//   description: string;
//   permissions: string[];
//   userCount: number;
// }

// interface Permission {
//   id: string;
//   name: string;
//   category: string;
// }

// export default function Profiles() {
//   const { 
//     profiles, 
//     loading, 
//     error, 
//     fetchProfiles, 
//     createProfile, 
//     updateProfile, 
//     deleteProfile 
//   } = useBackoffice();
  
//   useAuth();
  
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [currentProfile, setCurrentProfile] = useState<UIProfile | null>(null);
  
//   // Estados do formulário
//   const [profileForm, setProfileForm] = useState({
//     name: '',
//     description: '',
//     permissions: [] as string[]
//   });

//   // Carregar os perfis ao montar o componente
//   useEffect(() => {
//     fetchProfiles();
//   }, [fetchProfiles]);

//   // Exibir erros em toast
//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//     }
//   }, [error]);

//   // Permissões disponíveis do sistema
//   const availablePermissions = [
//   { id: 'backoffice:access', name: 'Acessar BackOffice' },
//   { id: 'dashboard:read', name: 'Visualizar Dashboard' },  
//   { id: 'users:read', name: 'Visualizar Usuários' },
//   { id: 'users:create', name: 'Criar Usuários' },
//   { id: 'users:edit', name: 'Editar Usuários' },
//   { id: 'users:delete', name: 'Excluir Usuários' },
//   { id: 'workers:read', name: 'Visualizar Funcionários' },
//   { id: 'workers:create', name: 'Criar Funcionários' },
//   { id: 'workers:edit', name: 'Editar Funcionários' },
//   { id: 'workers:delete', name: 'Excluir Funcionários' },
//   { id: 'documents:read', name: 'Visualizar Documentos' },
//   { id: 'documents:create', name: 'Criar Documentos' },
//   { id: 'documents:edit', name: 'Editar Documentos' },
//   { id: 'documents:delete', name: 'Excluir Documentos' },
//   { id: 'profiles:read', name: 'Visualizar Perfis' },
//   { id: 'profiles:create', name: 'Criar Perfis' },
//   { id: 'profiles:edit', name: 'Editar Perfis' },
//   { id: 'profiles:delete', name: 'Excluir Perfis' },
//   { id: 'timesheet:read', name: 'Visualizar Ponto' },
//   { id: 'timesheet:edit', name: 'Editar Ponto' },
//   { id: 'payroll:read', name: 'Visualizar Folha' },
//   { id: 'payroll:edit', name: 'Editar Folha' },
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
//   { id: 'tasks:read', name: 'Visualizar Relatórios' },
//   { id: 'tasks:create', name: 'Criar Relatórios' },
//   { id: 'tasks:edit', name: 'Editar Relatórios' },
//   { id: 'tasks:delete', name: 'Excluir Relatórios' }  
// ];

//   // Converter perfis do backend para o formato do componente
//   const uiProfiles: UIProfile[] = profiles.map(profile => ({
//     id: profile._id || "",
//     name: profile.name,
//     description: profile.description || "",
//     permissions: profile.permissions || [],
//     userCount: 0 // Placeholder, não temos essa informação no backend ainda
//   }));

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

//   // Iniciar criação de novo perfil
//   const handleNewProfile = () => {
//     setCurrentProfile(null);
//     setProfileForm({ name: '', description: '', permissions: [] });
//     setIsDialogOpen(true);
//   };

//   // Iniciar edição de perfil existente
//   const handleEditProfile = (profile: UIProfile) => {
//     setCurrentProfile(profile);
//     setProfileForm({
//       name: profile.name,
//       description: profile.description,
//       permissions: profile.permissions
//     });
//     setIsDialogOpen(true);
//   };

//   // Salvar perfil (criar novo ou atualizar existente)
//   const handleSaveProfile = async () => {
//     if (!profileForm.name.trim()) {
//       toast.error('Nome do perfil é obrigatório');
//       return;
//     }

//     try {
//       if (currentProfile) {
//         // Atualizar perfil existente
//         const success = await updateProfile(currentProfile.id, {
//           name: profileForm.name,
//           description: profileForm.description,
//           permissions: profileForm.permissions
//         });
        
//         if (success) {
//           toast.success(`Perfil "${profileForm.name}" atualizado com sucesso`);
//           setIsDialogOpen(false);
//           await fetchProfiles(); // Recarregar lista
//         }
//       } else {
//         // Criar novo perfil
//         const newProfile = await createProfile({
//           name: profileForm.name,
//           description: profileForm.description,
//           permissions: profileForm.permissions
//         });
        
//         if (newProfile) {
//           toast.success(`Perfil "${profileForm.name}" criado com sucesso`);
//           setIsDialogOpen(false);
//           await fetchProfiles(); // Recarregar lista
//         }
//       }
//     } catch {
//       toast.error(currentProfile ? 'Erro ao atualizar perfil' : 'Erro ao criar perfil');
//     }
//   };

//   // Remover perfil
//   const handleDeleteProfile = async (profileId: string) => {
//     const profile = uiProfiles.find(p => p.id === profileId);
//     if (!profile) return;

//     if (confirm(`Tem certeza que deseja excluir o perfil "${profile.name}"?`)) {
//       try {
//         const success = await deleteProfile(profileId);
//         if (success) {
//           toast.success(`Perfil "${profile.name}" removido com sucesso`);
//           await fetchProfiles(); // Recarregar lista
//         }
//       } catch {
//         toast.error('Erro ao excluir perfil');
//       }
//     }
//   };

//   // Componente do formulário de perfil
//   const ProfileForm = () => {
//     const groupedPermissions = availablePermissions.reduce((acc, permission) => {
//       // Extract category from permission ID (text before the colon)
//       const category = permission.id.split(':')[0] || 'Other';
      
//       if (!acc[category]) {
//         acc[category] = [];
//       }
//       acc[category].push({
//         ...permission,
//         category: category
//       });
//       return acc;
//     }, {} as Record<string, Permission[]>);

//     const handlePermissionChange = (permissionId: string, checked: boolean) => {
//       if (checked) {
//         setProfileForm({
//           ...profileForm,
//           permissions: [...profileForm.permissions, permissionId]
//         });
//       } else {
//         setProfileForm({
//           ...profileForm,
//           permissions: profileForm.permissions.filter(p => p !== permissionId)
//         });
//       }
//     };

//     return (
//       <div className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium mb-2">Nome do Perfil *</label>
//           <input
//             type="text"
//             className="w-full p-2 border rounded focus:ring-2 focus:ring-cyan-500"
//             value={profileForm.name}
//             onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
//             placeholder="Digite o nome do perfil"
//           />
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium mb-2">Descrição</label>
//           <textarea
//             className="w-full p-2 border rounded focus:ring-2 focus:ring-cyan-500"
//             value={profileForm.description}
//             onChange={(e) => setProfileForm({...profileForm, description: e.target.value})}
//             placeholder="Descreva o propósito deste perfil"
//             rows={3}
//           />
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium mb-3">Permissões</label>
//           <div className="max-h-80 overflow-y-auto border rounded p-3 space-y-4">
//             {Object.entries(groupedPermissions).map(([category, perms]) => (
//               <div key={category}>
//                 <h4 className="font-medium text-sm text-gray-700 mb-2">{category}</h4>
//                 <div className="grid grid-cols-1 gap-2 ml-4">
//                   {perms.map(permission => (
//                     <label key={permission.id} className="flex items-center space-x-2">
//                       <input
//                         type="checkbox"
//                         checked={profileForm.permissions.includes(permission.id)}
//                         onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
//                         className="rounded"
//                       />
//                       <span className="text-sm">{permission.name}</span>
//                     </label>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>
//           <p className="text-xs text-gray-500 mt-2">
//             {profileForm.permissions.length} permissão(ões) selecionada(s)
//           </p>
//         </div>
        
//         <div className="flex gap-2 pt-4">
//           <Button 
//             variant="outline" 
//             className="flex-1"
//             onClick={() => setIsDialogOpen(false)}
//             disabled={loading}
//           >
//             Cancelar
//           </Button>
//           <Button 
//             className="flex-1 bg-cyan-500 hover:bg-cyan-600"
//             onClick={handleSaveProfile}
//             disabled={loading}
//           >
//             {loading ? 'Processando...' : (currentProfile ? 'Atualizar' : 'Criar')}
//           </Button>
//         </div>
//       </div>
//     );
//   };

//   // Componente da tabela de perfis
//   const ProfilesTable = () => (
//     <div className="space-y-4">
//       {uiProfiles.map(profile => (
//         <div key={profile.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
//           <div className="flex justify-between items-start mb-3">
//             <div>
//               <h3 className="font-semibold text-lg">{profile.name}</h3>
//               <p className="text-sm text-gray-600 mt-1">
//                 {profile.description || 'Sem descrição'}
//               </p>
//             </div>
//             <div className="flex gap-2">
//               <span title="Editar perfil">
//                 <Edit 
//                   size={18} 
//                   className="text-green-500 cursor-pointer hover:text-green-700" 
//                   onClick={() => handleEditProfile(profile)}
//                 />
//               </span>
//               <span title="Excluir perfil">
//                 <Trash2 
//                   size={18} 
//                   className="text-red-500 cursor-pointer hover:text-red-700" 
//                   onClick={() => handleDeleteProfile(profile.id)}
//                 />
//               </span>
//             </div>
//           </div>
          
//           <div className="text-sm">
//             <div className="flex justify-between items-center mb-2">
//               <span className="font-medium">Permissões:</span>
//               <span className="text-gray-500">{profile.permissions.length} configuradas</span>
//             </div>
            
//             {profile.permissions.length > 0 && (
//               <div className="flex flex-wrap gap-1">
//                 {profile.permissions.slice(0, 6).map((permission, index) => (
//                   <span 
//                     key={index}
//                     className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
//                   >
//                     {availablePermissions.find(p => p.id === permission)?.name || permission}
//                   </span>
//                 ))}
//                 {profile.permissions.length > 6 && (
//                   <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
//                     +{profile.permissions.length - 6} mais
//                   </span>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       ))}
//     </div>
//   );

//   return (
//     <motion.div 
//       className="p-6 ml-[var(--sidebar-width,4.5rem)] transition-all duration-300 bg-gray-50 dark:bg-gray-900 min-h-screen"
//       initial="hidden"
//       animate="visible"
//       variants={containerVariants}
//       style={{ width: "calc(100% - var(--sidebar-width, 4.5rem))" }}
//     >
//       <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Perfis de Acesso</h1>
//           <p className="text-gray-500 dark:text-gray-400 mt-1">
//             Gerencie grupos de permissões para facilitar a administração de usuários.
//           </p>
//         </div>
//         <Button 
//           onClick={handleNewProfile}
//           className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors"
//           disabled={loading}
//         >
//           <Plus className="mr-2 h-4 w-4" />
//           Novo Perfil
//         </Button>
//       </motion.div>

//       <motion.div variants={itemVariants}>
//         <Card className="shadow-lg border border-gray-100 dark:border-gray-700">
//           <CardHeader className="pb-3">
//             <CardTitle>Perfis Disponíveis</CardTitle>
//             <CardDescription className="text-gray-600 dark:text-gray-400">
//               Lista de perfis configurados no sistema
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <div className="text-center py-8">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//                 <p className="mt-2">Carregando perfis...</p>
//               </div>
//             ) : uiProfiles.length === 0 ? (
//               <div className="text-center py-8">
//                 <UserCog className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
//                 <h3 className="mt-2 text-lg font-medium text-gray-700 dark:text-gray-300">
//                   Nenhum perfil criado
//                 </h3>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                   Clique em &quot;Novo Perfil&quot; para criar o primeiro perfil
//                 </p>
//               </div>
//             ) : (
//               <ProfilesTable />
//             )}
//           </CardContent>
//         </Card>
//       </motion.div>

//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>{currentProfile ? "Editar Perfil" : "Novo Perfil"}</DialogTitle>
//             <DialogDescription>
//               {currentProfile 
//                 ? "Atualize as informações e permissões deste perfil"
//                 : "Configure as informações e permissões para o novo perfil"}
//             </DialogDescription>
//           </DialogHeader>
          
//           <ProfileForm />
//         </DialogContent>
//       </Dialog>
//     </motion.div>
//   );
// }