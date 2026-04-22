import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Users, Gift, Settings, LogOut, FileText, Shield, User, Search, Bell, Key, Info, CheckCircle, AlertTriangle, Sun, Moon, ScanLine } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useCustomers } from '../context/CustomerContext';
import { useNotifications } from '../context/NotificationContext';

interface LayoutProps {
    children: React.ReactNode;
    activePage: 'dashboard' | 'customers' | 'loyalty' | 'reports' | 'settings' | 'staff' | 'profile' | 'scanner';
    onNavigate: (page: 'dashboard' | 'customers' | 'loyalty' | 'reports' | 'settings' | 'staff' | 'profile' | 'scanner') => void;
}

export function Layout({ children, activePage, onNavigate }: LayoutProps) {
    const { logout, user, staffProfile } = useAuth();
    const { customers, settings, setGlobalSearchQuery } = useCustomers();
    const sessionSettingsTimeout = settings?.sessionTimeout || 60;

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    // Header Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
        }
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    // --- Session Timeout Logic ---
    const [timeLeft, setTimeLeft] = useState(sessionSettingsTimeout * 60);

    // Reset time on user activity
    useEffect(() => {
        const resetTimer = () => setTimeLeft(sessionSettingsTimeout * 60);

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
        let throttleTimer: NodeJS.Timeout | null = null;

        const handleActivity = () => {
            if (throttleTimer) return;
            throttleTimer = setTimeout(() => {
                resetTimer();
                throttleTimer = null;
            }, 1000); // Check activity once per second at most
        };

        events.forEach(e => document.addEventListener(e, handleActivity));

        return () => {
            events.forEach(e => document.removeEventListener(e, handleActivity));
            if (throttleTimer) clearTimeout(throttleTimer);
        };
    }, [sessionSettingsTimeout]);

    // Timer countdown
    useEffect(() => {
        if (timeLeft <= 0) {
            logout();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, logout]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };
    // ----------------------------

    // Cerrar dropdowns al hacer click afuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchResults = customers.filter(c =>
        (c.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (c.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (c.phone || '').includes(searchQuery)
    ).slice(0, 5); // Max 5 results

    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const role = staffProfile?.role;
    const isSuperAdmin = !role || staffProfile?.username === 'admin'; // Fail-safe for initial admin before migration

    const allNavItems = [
        { id: 'dashboard', label: 'Panel', icon: LayoutDashboard, show: true },
        { id: 'scanner', label: 'Escáner QR', icon: ScanLine, show: true },
        { id: 'customers', label: 'Clientes', icon: Users, show: isSuperAdmin || role?.can_manage_customers },
        { id: 'loyalty', label: 'Programa Lealtad', icon: Gift, show: isSuperAdmin || role?.can_manage_customers || role?.can_manage_rewards },
        { id: 'reports', label: 'Reportes', icon: FileText, show: true },
        { id: 'settings', label: 'Configuración', icon: Settings, show: isSuperAdmin || role?.can_manage_settings },
        { id: 'staff', label: 'Personal (Usuarios)', icon: Shield, show: isSuperAdmin || role?.can_manage_staff },
    ] as const;

    const navItems = allNavItems.filter(item => item.show);

    // Obtener datos del usuario
    const fullName = user?.user_metadata?.full_name || 'Operador';

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0 z-20">
                <div className="h-16 border-b border-border flex items-center px-6 shrink-0">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <img src="/quantica-logo.png" alt="QUANTICA Logo" className="w-8 h-8 object-contain" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400">
                            QUANTICA
                        </span>
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${activePage === item.id
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 z-10 shadow-sm relative">

                    {/* Left side / Search */}
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative max-w-md w-full" ref={searchRef}>
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar cliente por nombre, email o teléfono..."
                                value={searchQuery}
                                onFocus={() => setIsSearchOpen(true)}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsSearchOpen(true);
                                }}
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900/50 border border-transparent dark:border-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all dark:text-slate-200"
                            />

                            {/* Floating Search Results */}
                            {isSearchOpen && searchQuery.trim() !== '' && (
                                <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-xl shadow-black/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    {searchResults.length > 0 ? (
                                        <div className="py-2">
                                            {searchResults.map(customer => (
                                                <button
                                                    key={customer.id}
                                                    onClick={() => {
                                                        // Navigate to customers page and pre-fill global search
                                                        setGlobalSearchQuery(customer.name); // Fill exact name to filter table
                                                        setSearchQuery(''); // Clear local search
                                                        setIsSearchOpen(false);
                                                        if (activePage !== 'customers') onNavigate('customers');
                                                    }}
                                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors text-left"
                                                >
                                                    <div>
                                                        <h4 className="text-sm font-semibold">{customer.name}</h4>
                                                        <p className="text-xs text-muted-foreground">{customer.email || customer.phone || 'Sin contacto'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                                                            {customer.loyaltyPoints} pts
                                                        </span>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{customer.tier}</p>
                                                    </div>
                                                </button>
                                            ))}
                                            <div className="px-4 py-2 border-t border-border mt-1">
                                                <button
                                                    className="text-xs font-medium text-primary hover:underline w-full text-center"
                                                    onClick={() => {
                                                        setGlobalSearchQuery(searchQuery);
                                                        setSearchQuery('');
                                                        setIsSearchOpen(false);
                                                        if (activePage !== 'customers') onNavigate('customers');
                                                    }}
                                                >
                                                    Ver todos los resultados
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 flex flex-col items-center justify-center text-center text-muted-foreground">
                                            <Search className="w-8 h-8 opacity-20 mb-2" />
                                            <p className="text-sm font-medium">No se encontraron clientes</p>
                                            <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side / Actions & Profile */}
                    <div className="flex items-center gap-5 ml-4">

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="relative p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors focus:outline-none"
                        >
                            {isDark ? <Sun className="w-[22px] h-[22px]" /> : <Moon className="w-[22px] h-[22px]" />}
                        </button>

                        {/* Notifications */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                                className="relative p-2 text-slate-400 hover:text-white transition-colors focus:outline-none"
                            >
                                <Bell className="w-[22px] h-[22px]" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-slate-900">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {notificationsOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-[#1e293b] border border-slate-700/50 rounded-xl shadow-xl shadow-black/40 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
                                        <h3 className="font-semibold text-sm text-slate-200">Notificaciones</h3>
                                        <button
                                            onClick={() => markAllAsRead()}
                                            className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                                        >
                                            Marcar leídas
                                        </button>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-slate-400 text-sm">No hay notificaciones nuevas</div>
                                        ) : notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => { if (!notif.is_read) markAsRead(notif.id); }}
                                                className={`p-4 border-b border-slate-700/30 flex gap-3 hover:bg-slate-800/30 transition-colors cursor-pointer ${!notif.is_read ? 'bg-slate-800/10' : ''}`}
                                            >
                                                <div className="shrink-0 mt-0.5">
                                                    {notif.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                                                    {notif.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                                                    {notif.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                                                    {notif.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${!notif.is_read ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>{notif.message}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-2 bg-slate-800/50 border-t border-slate-700/50 text-center">
                                        <button className="text-xs text-slate-400 hover:text-slate-200 font-medium p-1">Ver todas las notificaciones</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center p-1.5 hover:bg-muted rounded-lg transition-colors border border-transparent focus:outline-none"
                            >
                                <div className="w-8 h-8 rounded-lg border border-border bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-card border border-border rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2">

                                    {/* User header inside dropdown */}
                                    <div className="px-4 py-3 border-b border-border mb-1 bg-muted/50">
                                        <p className="text-sm font-semibold text-foreground">{fullName}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            onNavigate('profile');
                                            setDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
                                    >
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        Mi cuenta
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
                                    >
                                        <Key className="w-4 h-4 text-muted-foreground" />
                                        Cambiar contraseña
                                    </button>

                                    <div className="h-px bg-border my-1"></div>

                                    <button
                                        onClick={() => {
                                            logout();
                                            setDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Cerrar sesión
                                    </button>

                                    <div className="border-t border-border mt-1 pt-2 px-4 pb-1">
                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                            Auto-cierre en {formatTime(timeLeft)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Scrollable Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-[#0f172a] p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl animate-fade-in-up">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
