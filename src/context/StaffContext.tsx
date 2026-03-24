import { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { StaffProfile, Role } from '../types';
import toast from 'react-hot-toast';

interface StaffContextType {
    staff: StaffProfile[];
    roles: Role[];
    isLoading: boolean;
    loadStaffData: () => Promise<void>;
    createRole: (role: Omit<Role, 'id' | 'created_at'>) => Promise<boolean>;
    createStaff: (staff: Omit<StaffProfile, 'id' | 'created_at' | 'role'> & { password?: string }) => Promise<boolean>;
    updateStaff: (id: string, updates: Partial<StaffProfile>) => Promise<boolean>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const useStaff = () => {
    const context = useContext(StaffContext);
    if (!context) throw new Error('useStaff must be used within StaffProvider');
    return context;
};

export const StaffProvider = ({ children }: { children: ReactNode }) => {
    const [staff, setStaff] = useState<StaffProfile[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadStaffData = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: rolesData, error: rolesError } = await supabase.from('roles').select('*').order('name');
            if (rolesError) throw rolesError;
            setRoles(rolesData || []);

            const { data: staffData, error: staffError } = await supabase.from('staff_profiles').select('*, role:roles(*)').order('created_at');
            if (staffError) throw staffError;
            setStaff(staffData || []);
        } catch (error: any) {
            console.error(error);
            toast.error('Error cargando datos del personal: ' + (error?.message || 'Error desconocido'));
        } finally {
            setIsLoading(false);
        }
    };

    const createRole = async (role: Omit<Role, 'id' | 'created_at'>) => {
        try {
            const { error } = await supabase.from('roles').insert([role]);
            if (error) throw error;
            toast.success('Rol creado con éxito');
            await loadStaffData();
            return true;
        } catch (error: any) {
            toast.error(`Error al crear rol: ${error.message}`);
            return false;
        }
    };

    const createStaff = async (staffData: Omit<StaffProfile, 'id' | 'created_at' | 'role'> & { password?: string }) => {
        try {
            if (!staffData.password) throw new Error("Contraseña requerida");

            // Wait, we can GET the env vars! Let's just create a secondary client dynamically to prevent logout.
            const url = import.meta.env.VITE_SUPABASE_URL;
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

            let authId = '';

            if (url && key) {
                // Dynamic import or just standard createClient from supabase-js
                const { createClient } = await import('@supabase/supabase-js');
                const secondarySupabase = createClient(url, key, {
                    auth: { persistSession: false, autoRefreshToken: false }
                });

                // Generate a dummy email to satisfy Supabase Auth requirements
                // while bypassing real email confirmation and rate limits.
                const dummyAuthEmail = `${staffData.username.replace(/[^a-zA-Z0-9]/g, '')}${Date.now()}@quanticasystem.com`;

                const { data: authData, error: authError } = await secondarySupabase.auth.signUp({
                    email: dummyAuthEmail,
                    password: staffData.password,
                    options: { data: { full_name: staffData.full_name } }
                });

                if (authError) throw authError;
                if (!authData.user) throw new Error("No se pudo crear el usuario");
                authId = authData.user.id;
            } else {
                toast.error("Faltan variables de entorno para crear cuenta");
                return false;
            }

            // Insert into staff_profiles
            const newProfile = {
                id: authId,
                username: staffData.username.toLowerCase().trim(),
                full_name: staffData.full_name,
                email: staffData.email,
                phone: staffData.phone,
                role_id: staffData.role_id,
                is_active: staffData.is_active
            };

            const { error: profileError } = await supabase.from('staff_profiles').insert([newProfile]);

            if (profileError) throw profileError;

            toast.success('Personal creado con éxito');
            await loadStaffData();
            return true;
        } catch (error: any) {
            toast.error(`Error al crear personal: ${error.message}`);
            return false;
        }
    };

    const updateStaff = async (id: string, updates: Partial<StaffProfile>) => {
        try {
            const { error } = await supabase.from('staff_profiles').update(updates).eq('id', id);
            if (error) throw error;
            toast.success('Perfil actualizado');
            await loadStaffData();
            return true;
        } catch (error: any) {
            toast.error(`Error al actualizar: ${error.message}`);
            return false;
        }
    };

    return (
        <StaffContext.Provider value={{ staff, roles, isLoading, loadStaffData, createRole, createStaff, updateStaff }}>
            {children}
        </StaffContext.Provider>
    );
};
