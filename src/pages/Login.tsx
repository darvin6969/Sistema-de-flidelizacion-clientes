import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ArrowRight } from 'lucide-react';

export function Login({ onNavigateToPortal }: { onNavigateToPortal: () => void }) {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const sanitizedUsername = username.toLowerCase().trim();
            const success = await login(sanitizedUsername, password);
            if (!success) {
                // Error is handled by toast in context
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col justify-center items-center p-4 font-sans text-slate-200">
            {/* Minimalist Centered Card */}
            <div className="w-full max-w-sm animate-fade-in-up">

                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-10">
                    <img src="/quantica-logo.png" alt="QUANTICA" className="w-20 h-20 object-contain mb-6 drop-shadow-md" />
                    <h1 className="text-2xl font-semibold tracking-wide text-white">Iniciar Sesión</h1>
                    <p className="text-sm text-slate-400 mt-2">Acceso al panel de operador</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Usuario</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                                <User className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400" />
                            </div>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3 bg-[#1e293b] border border-slate-700/50 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all sm:text-sm placeholder:text-slate-500 shadow-sm"
                                placeholder="Ej: admin"
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Contraseña</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                                <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3 bg-[#1e293b] border border-slate-700/50 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all sm:text-sm placeholder:text-slate-500 shadow-sm"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 pb-4">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-600 bg-[#1e293b] text-blue-500 focus:ring-blue-500 focus:ring-offset-[#0f172a]"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-400">
                                Recordarme
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f172a] focus:ring-blue-500 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                Ingresar al Sistema
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer Links */}
                <div className="mt-12 pt-8 flex flex-col items-center gap-4">
                    <button
                        onClick={onNavigateToPortal}
                        className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/5"
                    >
                        <User className="h-4 w-4" />
                        Acceder al Portal de Clientes
                    </button>
                    <p className="text-xs text-slate-600 mt-4">
                        &copy; {new Date().getFullYear()} QUANTICA. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}
