import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldCheck, Key, Calendar } from 'lucide-react';

export function Profile() {
    const { user } = useAuth();

    // Extrayendo información de usuario de Supabase
    const fullName = user?.user_metadata?.full_name || 'Operador sin nombre';
    // Reconstruimos el username quitando el dominio mock si existe
    const displayEmail = user?.email || '';
    const isMockEmail = displayEmail.endsWith('@quantica.com');
    const username = isMockEmail ? displayEmail.split('@')[0] : displayEmail;

    // Obtener la fecha de creación
    const joinDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Desconocida';

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            <header className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Mi Perfil</h2>
                <p className="text-muted-foreground mt-1">
                    Gestiona tu información personal y preferencias de la cuenta.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Tarjeta de Perfil Principal */}
                <div className="md:col-span-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col items-center p-6 text-center">
                    <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 border-4 border-white dark:border-slate-800 shadow-sm relative">
                        <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" title="Conectado"></div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{fullName}</h3>
                    <div className="flex items-center justify-center gap-1.5 mt-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full font-medium">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Administrador</span>
                    </div>

                    <div className="w-full mt-6 pt-6 border-t border-border flex flex-col gap-3">
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <Calendar className="w-4 h-4 mr-3 shrink-0" />
                            <span>Miembro desde: {joinDate}</span>
                        </div>
                    </div>
                </div>

                {/* Detalles de la Cuenta */}
                <div className="md:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-500" />
                            Configuración de Acceso
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Campo: Nombre Completo */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Nombre de Pantalla
                            </label>
                            <div className="flex relative">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground sm:text-sm">
                                    <User className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    disabled
                                    value={fullName}
                                    className="flex-1 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-border bg-slate-50 dark:bg-slate-900 cursor-not-allowed opacity-70"
                                />
                            </div>
                        </div>

                        {/* Campo: Identificador de Inicio de Sesión */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Identificador de Acceso (Usuario / Correo)
                            </label>
                            <div className="flex relative">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground sm:text-sm">
                                    <Mail className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    disabled
                                    value={username}
                                    className="flex-1 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-border bg-slate-50 dark:bg-slate-900 cursor-not-allowed opacity-70"
                                />
                            </div>
                            {isMockEmail && (
                                <p className="mt-2 text-xs text-slate-500">
                                    Inicias sesión usando este usuario corto.
                                </p>
                            )}
                        </div>

                        {/* Notificación de Seguridad */}
                        <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded-lg flex items-start gap-3">
                            <Key className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-1">
                                    Seguridad de la Cuenta
                                </h4>
                                <p className="text-sm text-orange-700 dark:text-orange-400/80">
                                    Para cambiar tu contraseña o realizar ajustes a tus permisos, contacta al Administrador Principal del sistema. La edición directa del perfil está deshabilitada temporalmente en este portal.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
