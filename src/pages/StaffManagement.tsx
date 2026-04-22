import React, { useState, useEffect } from 'react';
import { useStaff } from '../context/StaffContext';
import { 
    Shield, 
    UserPlus, 
    Save, 
    Users, 
    Key, 
    Mail, 
    Phone, 
    Calendar, 
    Trash2, 
    Edit, 
    CheckCircle, 
    XCircle,
    MoreVertical,
    X,
    UserCheck,
    UserX,
    Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { StaffProfile } from '../types';

export function StaffManagement() {
    const { staff, roles, loadStaffData, createRole, createStaff, updateStaff, deleteStaff, isLoading } = useStaff();
    const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff');
    const [isCreating, setIsCreating] = useState(false);
    
    // Modal State
    const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);
    const [editPassword, setEditPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

    // New Role Form State
    const [newRoleName, setNewRoleName] = useState('');
    const [newRolePermissions, setNewRolePermissions] = useState({
        can_manage_staff: false,
        can_manage_customers: false,
        can_manage_rewards: false,
        can_manage_settings: false,
    });

    // New Staff Form State
    const [newStaff, setNewStaff] = useState({
        username: '',
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role_id: ''
    });

    useEffect(() => {
        loadStaffData();
    }, []);

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName) return toast.error('Nombre de rol requerido');
        const success = await createRole({
            name: newRoleName,
            description: `Rol de ${newRoleName}`,
            ...newRolePermissions
        });
        if (success) {
            setNewRoleName('');
            setNewRolePermissions({
                can_manage_staff: false,
                can_manage_customers: false,
                can_manage_rewards: false,
                can_manage_settings: false,
            });
        }
    };

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStaff.role_id) return toast.error('Debes asignar un rol');
        setIsCreating(true);
        try {
            const success = await createStaff({ ...newStaff, is_active: true });
            if (success) {
                setNewStaff({ username: '', full_name: '', email: '', phone: '', password: '', role_id: '' });
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;

        // Password validation if they tried to change it
        if (editPassword) {
            if (editPassword.length < 6) {
                return toast.error('La contraseña debe tener al menos 6 caracteres');
            }
            if (editPassword !== confirmPassword) {
                return toast.error('Las contraseñas no coinciden');
            }
        }
        
        const success = await updateStaff(editingStaff.id, {
            full_name: editingStaff.full_name,
            username: editingStaff.username,
            email: editingStaff.email,
            phone: editingStaff.phone,
            role_id: editingStaff.role_id,
            is_active: editingStaff.is_active,
            password: editPassword || undefined
        });

        if (success) {
            setIsEditModalOpen(false);
            setEditingStaff(null);
            setEditPassword('');
            setConfirmPassword('');
            setIsRoleDropdownOpen(false);
        }
    };

    const handleDeleteStaff = async (id: string, name: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar a ${name}? Esta acción no se puede deshacer.`)) {
            await deleteStaff(id);
        }
    };

    const toggleStatus = async (item: StaffProfile) => {
        await updateStaff(item.id, { is_active: !item.is_active });
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
        setEditingStaff(null);
        setEditPassword('');
        setConfirmPassword('');
        setIsRoleDropdownOpen(false);
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const getRandomColor = (name: string) => {
        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500', 'bg-indigo-500'];
        const index = name.length % colors.length;
        return colors[index];
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Reciente';
        return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        Operadores
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Gestiona los accesos y permisos de tu equipo de trabajo.</p>
                </div>

                <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border w-fit shadow-inner">
                    <button
                        onClick={() => setActiveTab('staff')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'staff' ? 'bg-card text-primary shadow-lg border border-border scale-[1.02]' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Users className="w-4 h-4" /> Directorio
                    </button>
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'roles' ? 'bg-card text-primary shadow-lg border border-border scale-[1.02]' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Key className="w-4 h-4" /> Roles Seguros
                    </button>
                </div>
            </div>

            {/* ROLES TAB */}
            {activeTab === 'roles' && (
                <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="lg:col-span-1 bg-card border rounded-3xl p-8 shadow-xl relative overflow-hidden h-fit">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Crear Nuevo Rol</h2>
                        <form onSubmit={handleCreateRole} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">Nombre del Rol</label>
                                <input required type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary/30 focus:bg-background outline-none transition-all font-medium" placeholder="Ej: Gerente de Tienda" />
                            </div>
                            <div className="space-y-3 pt-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">Asignación de Permisos</label>
                                {[
                                    { id: 'can_manage_customers', label: 'Gestionar Clientes y Puntos', color: 'text-blue-500' },
                                    { id: 'can_manage_rewards', label: 'Gestionar Sistema de Premios', color: 'text-orange-500' },
                                    { id: 'can_manage_staff', label: 'Gestionar Personal (Admin)', color: 'text-red-500' },
                                    { id: 'can_manage_settings', label: 'Configuración de Sistema', color: 'text-purple-500' }
                                ].map(perm => (
                                    <label key={perm.id} className="flex items-center group cursor-pointer p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                        <div className="relative flex items-center">
                                            <input 
                                                type="checkbox" 
                                                checked={(newRolePermissions as any)[perm.id]} 
                                                onChange={e => setNewRolePermissions(p => ({ ...p, [perm.id]: e.target.checked }))} 
                                                className="w-5 h-5 rounded-md border-2 border-muted-foreground/30 text-primary focus:ring-primary/20 transition-all cursor-pointer" 
                                            />
                                        </div>
                                        <span className={`ml-3 text-sm font-semibold transition-colors ${perm.color}`}>{perm.label}</span>
                                    </label>
                                ))}
                            </div>
                            <button type="submit" className="w-full mt-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-black shadow-lg shadow-primary/20 transition-all active:scale-95">
                                <Save className="w-5 h-5" /> GUARDAR ROL
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {roles.map(r => (
                                <div key={r.id} className="bg-card border border-border p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase bg-muted/50 px-2 py-1 rounded">ID: {r.id.substring(0, 8)}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-foreground mb-4">{r.name}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {r.can_manage_customers && <span className="px-3 py-1 bg-blue-500/10 text-blue-600 text-[10px] font-black rounded-full uppercase border border-blue-500/20">Manejo de Clientes</span>}
                                        {r.can_manage_rewards && <span className="px-3 py-1 bg-orange-500/10 text-orange-600 text-[10px] font-black rounded-full uppercase border border-orange-500/20">Premios</span>}
                                        {r.can_manage_staff && <span className="px-3 py-1 bg-red-500/10 text-red-600 text-[10px] font-black rounded-full uppercase border border-red-500/20">Full Admin</span>}
                                        {r.can_manage_settings && <span className="px-3 py-1 bg-purple-500/10 text-purple-600 text-[10px] font-black rounded-full uppercase border border-purple-500/20">Ajustes</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* STAFF TAB */}
            {activeTab === 'staff' && (
                <div className="grid lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Left: Form for creation */}
                    <div className="lg:col-span-1">
                        <div className="bg-card border-2 border-primary/10 rounded-3xl p-8 shadow-2xl sticky top-6 overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-3"><UserPlus className="w-5 h-5 text-primary" /> Nuevo Acceso</h2>
                            <form onSubmit={handleCreateStaff} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Nombre Completo</label>
                                    <input required type="text" value={newStaff.full_name} onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-background outline-none transition-all placeholder:text-muted-foreground/50 text-sm font-medium" placeholder="Ej: Marcos Pérez" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Nombre de Usuario (Para Login)</label>
                                    <input required type="text" value={newStaff.username} onChange={e => setNewStaff({ ...newStaff, username: e.target.value.toLowerCase().replace(/\s/g, '') })} className="w-full px-4 py-3 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-background outline-none transition-all text-sm font-bold" placeholder="ej: marcosp" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Email</label>
                                    <input type="email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-background outline-none transition-all text-sm font-medium" placeholder="correo@ejemplo.com" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Teléfono</label>
                                    <input type="text" value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-background outline-none transition-all text-sm font-medium" placeholder="+51 ..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Contraseña de acceso</label>
                                    <input required type="password" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-background outline-none transition-all text-sm" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Nivel de Seguridad (Rol)</label>
                                    <select required value={newStaff.role_id} onChange={e => setNewStaff({ ...newStaff, role_id: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-background outline-none transition-all text-sm font-bold appearance-none">
                                        <option value="" disabled>Selecciona un rol</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full mt-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-2xl font-black shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 text-sm"
                                >
                                    {isCreating ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <><Save className="w-4 h-4" /> ACTIVAR CUENTA</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right: Directory Cards */}
                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {staff.map((emp) => (
                                <div key={emp.id} className="bg-card border border-border rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                                    <div className="flex items-start justify-between gap-4 mb-6">
                                        <div className={`w-16 h-16 rounded-[1.5rem] ${getRandomColor(emp.full_name)} flex items-center justify-center text-white text-2xl font-black shadow-inner shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                                            {getInitials(emp.full_name)}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button 
                                                onClick={() => toggleStatus(emp)}
                                                className={`p-2 rounded-xl transition-all ${emp.is_active ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'}`}
                                                title={emp.is_active ? "Desactivar usuario" : "Activar usuario"}
                                            >
                                                {emp.is_active ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setEditingStaff(emp);
                                                    setEditPassword('');
                                                    setConfirmPassword('');
                                                    setIsEditModalOpen(true);
                                                }}
                                                className="p-2 bg-muted hover:bg-muted-foreground/10 text-foreground rounded-xl transition-all"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-black text-foreground leading-tight">{emp.full_name}</h3>
                                            <p className="text-sm font-bold text-primary mt-0.5">
                                                {emp.role?.name || 'Invitado'}
                                            </p>
                                        </div>

                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-3 text-muted-foreground p-2 rounded-xl bg-muted/30 group-hover:bg-muted/50 transition-colors">
                                                <div className="bg-card w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border border-border/50">
                                                    <Mail className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-[11px] font-bold truncate">{emp.email || 'Sin correo asignado'}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 text-muted-foreground p-2 rounded-xl bg-muted/30 group-hover:bg-muted/50 transition-colors">
                                                <div className="bg-card w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border border-border/50">
                                                    <Phone className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-[11px] font-bold">{emp.phone || 'Sin teléfono'}</span>
                                            </div>

                                            <div className="flex items-center gap-3 text-muted-foreground p-2 rounded-xl bg-muted/30 group-hover:bg-muted/50 transition-colors">
                                                <div className="bg-card w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border border-border/50">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-[11px] font-bold">Unido: {formatDate(emp.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-border/50 flex items-center justify-between">
                                        <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                            @{emp.username}
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteStaff(emp.id, emp.full_name)}
                                            className="text-muted-foreground hover:text-red-500 transition-colors p-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT STAFF MODAL */}
            {isEditModalOpen && editingStaff && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={handleCancelEdit}></div>
                    <div className="relative w-full max-w-lg bg-card border border-border rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
                                    <Edit className="w-6 h-6 text-primary" />
                                    Actualizar Miembro
                                </h3>
                                <button onClick={handleCancelEdit} className="p-2 hover:bg-muted rounded-2xl transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateStaff} className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/10 pb-2">Información de Perfil</h4>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">Nombre Completo</label>
                                        <input required type="text" value={editingStaff.full_name} onChange={e => setEditingStaff({ ...editingStaff, full_name: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 outline-none transition-all font-bold" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">Email</label>
                                            <input type="email" value={editingStaff.email} onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 outline-none transition-all text-sm font-medium" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">Teléfono</label>
                                            <input type="text" value={editingStaff.phone || ''} onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 outline-none transition-all text-sm font-medium" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">Asignación de Rol</label>
                                        <div className="relative">
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsRoleDropdownOpen(!isRoleDropdownOpen);
                                                }}
                                                className="w-full px-5 py-4 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 outline-none transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="text-left">
                                                        <p className="text-sm font-black leading-none">{roles.find(r => r.id === editingStaff.role_id)?.name || 'Seleccionar Rol'}</p>
                                                        <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">Click para cambiar permisos</p>
                                                    </div>
                                                </div>
                                                <MoreVertical className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isRoleDropdownOpen ? 'rotate-90' : ''}`} />
                                            </button>

                                            {isRoleDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setIsRoleDropdownOpen(false)}></div>
                                                    <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <div className="max-h-[250px] overflow-y-auto">
                                                            {roles.map((r) => (
                                                                <button
                                                                    key={r.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingStaff({ ...editingStaff, role_id: r.id });
                                                                        setIsRoleDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full text-left p-4 hover:bg-muted/50 flex items-center gap-4 transition-colors border-b border-border/50 last:border-0 ${editingStaff.role_id === r.id ? 'bg-primary/5' : ''}`}
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center justify-between">
                                                                            <p className={`text-sm font-black ${editingStaff.role_id === r.id ? 'text-primary' : 'text-foreground'}`}>{r.name}</p>
                                                                            {editingStaff.role_id === r.id && <CheckCircle className="w-4 h-4 text-primary" />}
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {r.can_manage_staff && <span className="text-[8px] font-black uppercase text-red-500 bg-red-500/10 px-1.5 rounded">Admin</span>}
                                                                            {r.can_manage_customers && <span className="text-[8px] font-black uppercase text-blue-500 bg-blue-500/10 px-1.5 rounded">Clientes</span>}
                                                                            {r.can_manage_rewards && <span className="text-[8px] font-black uppercase text-orange-500 bg-orange-500/10 px-1.5 rounded">Premios</span>}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="bg-muted/30 p-3 text-center border-t border-border/50">
                                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Asignación Directa de Privilegios</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/10 pb-2 flex items-center gap-2">
                                        <Lock className="w-3.5 h-3.5" /> Seguridad de la Cuenta
                                    </h4>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">Nueva Contraseña (Opcional)</label>
                                        <input 
                                            type="password" 
                                            value={editPassword} 
                                            onChange={e => setEditPassword(e.target.value)} 
                                            className="w-full px-5 py-4 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 outline-none transition-all text-sm" 
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">Confirmar Nueva Contraseña</label>
                                        <input 
                                            type="password" 
                                            value={confirmPassword} 
                                            onChange={e => setConfirmPassword(e.target.value)} 
                                            className="w-full px-5 py-4 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 outline-none transition-all text-sm" 
                                            placeholder="••••••••"
                                        />
                                        {editPassword && confirmPassword && editPassword !== confirmPassword && (
                                            <p className="text-[10px] text-red-500 mt-2 ml-1 font-bold">Las contraseñas no coinciden</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-black text-foreground">Estado de Cuenta</h4>
                                        <p className="text-[10px] text-muted-foreground">Si desactivas el acceso, el usuario no podrá entrar al CRM.</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setEditingStaff({ ...editingStaff, is_active: !editingStaff.is_active })}
                                        className={`w-14 h-8 rounded-full p-1 transition-colors relative ${editingStaff.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                    >
                                        <div className={`w-6 h-6 bg-white rounded-full transition-transform ${editingStaff.is_active ? 'translate-x-6' : 'translate-x-0'} shadow-sm`}></div>
                                    </button>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={handleCancelEdit} className="flex-1 py-3 bg-muted hover:bg-muted-foreground/10 text-foreground font-black rounded-2xl transition-all text-sm">
                                        CANCELAR
                                    </button>
                                    <button type="submit" className="flex-2 py-3 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm">
                                        GUARDAR CAMBIOS
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
