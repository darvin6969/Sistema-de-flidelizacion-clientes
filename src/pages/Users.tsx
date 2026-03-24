import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, UserPlus, Lock, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function Users() {
    const { signUp } = useAuth();

    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('operator');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName.trim() || !username.trim() || !password.trim()) {
            toast.error('Todos los campos son obligatorios');
            return;
        }

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            // Utilizamos la misma función signUp del AuthContext, adaptando el username a email de dominio si es necesario
            const sanitizedUsername = username.toLowerCase().trim().replace(/\s+/g, '');
            const mockEmail = sanitizedUsername.includes('@') ? sanitizedUsername : `${sanitizedUsername}@quantica.com`;
            const success = await signUp(mockEmail, password, fullName);

            if (success) {
                toast.success('Usuario creado exitosamente.');
                // Clear form
                setUsername('');
                setPassword('');
                setFullName('');
                setRole('operator');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold tracking-tight">Gestión de Personal</h2>
                <p className="text-muted-foreground">
                    Crea y administra los accesos para los miembros de tu equipo.
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Formulario de Creación */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <UserPlus className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold">Crear Nuevo Usuario</h3>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-400">
                                <p className="font-semibold mb-1">Aviso importante sobre el sistema de sesiones</p>
                                <p>Por cómo funciona la seguridad web, crear un usuario nuevo iniciará sesión automáticamente con esa cuenta. Deberás volver a iniciar sesión con tu cuenta de administrador después de crearlo.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Nombre Completo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                        placeholder="Ej: Ana López"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Nombre de Usuario</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                        placeholder="Ej: ana.lopez o admin"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Contraseña</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                        placeholder="Min. 6 caracteres"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Rol del Sistema</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
                                    >
                                        <option value="operator">Operador (Atención al Cliente)</option>
                                        <option value="admin">Administrador Total</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-6 py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    "Registrar Membro del Equipo"
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Lista de Usuarios (Decorativa/Informativa por ahora) */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold">Usuarios Activos</h3>
                        </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-slate-400" />
                        </div>
                        <h4 className="text-lg font-medium mb-2">Gestor de Personal</h4>
                        <p className="text-muted-foreground text-sm max-w-[250px]">
                            Se ha restringido la lista de usuarios por seguridad. Por el momento solo puedes crear usuarios nuevos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
