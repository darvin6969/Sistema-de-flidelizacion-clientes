import React, { useState, useEffect } from 'react';
import { useStaff } from '../context/StaffContext';
import { Shield, UserPlus, Save, Users, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export function StaffManagement() {
    const { staff, roles, loadStaffData, createRole, createStaff, updateStaff, isLoading } = useStaff();
    const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff');

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
    const [isCreating, setIsCreating] = useState(false);

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
            const success = await createStaff({
                ...newStaff,
                is_active: true
            });

            if (success) {
                setNewStaff({
                    username: '',
                    full_name: '',
                    email: '',
                    phone: '',
                    password: '',
                    role_id: ''
                });
            }
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                    Gestión de Empleados y Roles
                </h1>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('staff')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all focus:outline-none flex items-center gap-2 ${activeTab === 'staff' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    <Users className="w-4 h-4" /> Personal
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all focus:outline-none flex items-center gap-2 ${activeTab === 'roles' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    <Key className="w-4 h-4" /> Roles y Permisos
                </button>
            </div>

            {isLoading && <p>Cargando datos...</p>}

            {/* ROLES TAB */}
            {!isLoading && activeTab === 'roles' && (
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Key className="w-5 h-5" /> Crear Nuevo Rol</h2>
                        <form onSubmit={handleCreateRole} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre del Rol</label>
                                <input required type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Vendedor" />
                            </div>
                            <div className="space-y-2 mt-4">
                                <label className="block text-sm font-medium mb-2">Permisos Otorfados</label>
                                <label className="flex items-center gap-2 text-sm text-foreground">
                                    <input type="checkbox" checked={newRolePermissions.can_manage_customers} onChange={e => setNewRolePermissions(p => ({ ...p, can_manage_customers: e.target.checked }))} className="rounded border-slate-300" /> Gestionar Clientes y Puntos
                                </label>
                                <label className="flex items-center gap-2 text-sm text-foreground">
                                    <input type="checkbox" checked={newRolePermissions.can_manage_rewards} onChange={e => setNewRolePermissions(p => ({ ...p, can_manage_rewards: e.target.checked }))} className="rounded border-slate-300" /> Gestionar Recompensas
                                </label>
                                <label className="flex items-center gap-2 text-sm text-foreground">
                                    <input type="checkbox" checked={newRolePermissions.can_manage_staff} onChange={e => setNewRolePermissions(p => ({ ...p, can_manage_staff: e.target.checked }))} className="rounded border-slate-300" /> <b>Gestionar Empleados (Peligroso)</b>
                                </label>
                                <label className="flex items-center gap-2 text-sm text-foreground">
                                    <input type="checkbox" checked={newRolePermissions.can_manage_settings} onChange={e => setNewRolePermissions(p => ({ ...p, can_manage_settings: e.target.checked }))} className="rounded border-slate-300" /> Editar Configuración Global
                                </label>
                            </div>
                            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors">
                                <Save className="w-4 h-4" /> Guardar Rol
                            </button>
                        </form>
                    </div>

                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold mb-4">Roles Existentes</h2>
                        <ul className="space-y-3">
                            {roles.map(r => (
                                <li key={r.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                                    <strong className="text-foreground">{r.name}</strong>
                                    <div className="flex gap-2 flex-wrap mt-2">
                                        {r.can_manage_customers && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Clientes</span>}
                                        {r.can_manage_rewards && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Premios</span>}
                                        {r.can_manage_settings && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Ajustes</span>}
                                        {r.can_manage_staff && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Personal</span>}
                                    </div>
                                </li>
                            ))}
                            {roles.length === 0 && <p className="text-muted-foreground text-sm">No hay roles (crea uno base o corre el script SQL).</p>}
                        </ul>
                    </div>
                </div>
            )}

            {/* STAFF TAB */}
            {!isLoading && activeTab === 'staff' && (
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-card border rounded-xl p-6 shadow-sm h-fit sticky top-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5" /> Nuevo Empleado</h2>
                        <form onSubmit={handleCreateStaff} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                                <input required type="text" value={newStaff.full_name} onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Usuario (Para Login)</label>
                                <input required type="text" value={newStaff.username} onChange={e => setNewStaff({ ...newStaff, username: e.target.value.toLowerCase().replace(/\s/g, '') })} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ej: marinaj" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Correo Electrónico (Opcional)</label>
                                <input type="text" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Opcional" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Contraseña</label>
                                <input required type="password" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Asignar Rol</label>
                                <select required value={newStaff.role_id} onChange={e => setNewStaff({ ...newStaff, role_id: e.target.value })} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="" disabled>Selecciona un rol</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isCreating ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <><Save className="w-4 h-4" /> Crear Cuenta de Empleado</>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 bg-card border rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-slate-50 dark:bg-slate-900 border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Nombre y Usuario</th>
                                        <th className="px-6 py-4 font-semibold">Rol</th>
                                        <th className="px-6 py-4 font-semibold">Estado</th>
                                        <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.map((emp) => (
                                        <tr key={emp.id} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-foreground">{emp.full_name}</p>
                                                <p className="text-xs text-muted-foreground">@{emp.username} · {emp.email}</p>
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                {emp.role?.name || 'Sin Rol'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${emp.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {emp.is_active ? 'Activo' : 'Suspendido'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {/* Edit User Button simply toggles simple state for prototype */}
                                                <button
                                                    onClick={() => {
                                                        const p = prompt("Actualizar username:", emp.username);
                                                        if (p) updateStaff(emp.id, { username: p });
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Editar Usuario
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {staff.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">No hay empleados registrados.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
