import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { StaffProfile } from '../types';

interface AuthContextType {
    isAuthenticated: boolean;
    user: any | null;
    staffProfile: StaffProfile | null;
    isLoading: boolean;
    login: (usernameOrEmail: string, password: string) => Promise<boolean>;
    signUp: (email: string, password: string, fullName: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Removed default admin password as we use real auth now

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<any | null>(null);
    const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadStaffProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('staff_profiles')
                .select('*, role:roles(*)')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setStaffProfile(data as StaffProfile);
            } else {
                setStaffProfile(null);
            }
        } catch (e) {
            console.error("Error loading staff profile", e);
            setStaffProfile(null);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (mounted && session) {
                    setIsAuthenticated(true);
                    setUser(session.user);
                    await loadStaffProfile(session.user.id);
                }
            } catch (err) {
                console.error("Error al obtener sesión inicial", err);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        // Arrancamos la inicialización asíncrona
        initSession();

        // Escuchamos silenciosamente los cambios
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event: string, session: any) => {
                if (!mounted) return;

                if (session) {
                    setIsAuthenticated(true);
                    setUser(session.user);
                    // Cargamos en segundo plano sin bloquear interfaz
                    loadStaffProfile(session.user.id).catch(console.error);
                } else {
                    setIsAuthenticated(false);
                    setUser(null);
                    setStaffProfile(null);
                }
            }
        );

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []);

    const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
        try {
            let loginEmail = usernameOrEmail.trim();

            // If it doesn't look like an email, intercept it by checking staff_profiles username
            // 1. Resolve username to its deterministic auth email
            if (!loginEmail.includes('@')) {
                const username = loginEmail.toLowerCase().trim();
                
                // First check if user exists and is active
                const { data: profile, error: profileError } = await supabase
                    .from('staff_profiles')
                    .select('is_active')
                    .eq('username', username)
                    .single();

                if (profileError || !profile) {
                    console.error("Login Error: Username not found", username);
                    toast.error('Nombre de usuario no encontrado.');
                    return false;
                }

                if (!profile.is_active) {
                    toast.error('Esta cuenta está inactiva.');
                    return false;
                }

                // Generate the same deterministic internal email used in StaffContext
                loginEmail = `${username.replace(/[^a-zA-Z0-9]/g, '')}@vanguard.internal`;
            }

            const { error, data } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password,
            });

            if (error) {
                toast.error(error.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : error.message);
                return false;
            }

            if (data.session) {
                setIsAuthenticated(true);
                setUser(data.user);
                toast.success('Sesión iniciada correctamente');
                return true;
            } else {
                toast.error('Sesión no pudo ser iniciada, faltan permisos.');
                return false;
            }
        } catch (error: any) {
            toast.error(error.message);
            return false;
        }
    };

    const signUp = async (email: string, password: string, fullName: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });

            if (error) {
                console.error("[Supabase signUp error]:", error);
                toast.error(`Error al registrar: ${error.message}`);
                return false;
            }

            // Supabase auto-logins after signup if email confirmations are disabled.
            // Si el correo necesita confirmación, `data.session` será nulo.
            if (data.session) {
                setIsAuthenticated(true);
                setUser(data.user);

                toast.success('Cuenta creada y sesión iniciada');
                return true;
            } else {
                toast.success('Cuenta creada. Revisa tu correo (si está configurado) o inicia sesión.');
                return true;
            }

        } catch (error: any) {
            toast.error(error.message);
            return false;
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setIsAuthenticated(false);
            setUser(null);
        } catch (error: any) {
            toast.error('Error al cerrar sesión');
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, staffProfile, isLoading, login, signUp, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
