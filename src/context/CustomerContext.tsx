import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer, TIERS, LoyaltyTier, Reward } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface PointRule {
    id: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    description: string;
}

export interface ApiKey {
    id: string;
    name: string;
    key: string;
    createdAt: string;
}

interface AppSettings {
    pointRules: PointRule[];
    integrations: {
        mikrotik: { enabled: boolean; ip: string; user: string; };
        billing: { enabled: boolean; apiUrl: string; };
    };
    apiKeys: ApiKey[];
    sessionTimeout: number; // in minutes
}

const DEFAULT_SETTINGS: AppSettings = {
    pointRules: [
        { id: 'payment', name: 'Pago de Internet', type: 'percentage', value: 1, description: '1 punto por cada $1 pagado' },
        { id: 'camera', name: 'Compra de Cámara', type: 'percentage', value: 2, description: '2 puntos por cada $1 en equipos' },
        { id: 'support', name: 'Visita Técnica', type: 'fixed', value: 50, description: '50 puntos por visita técnica' },
        { id: 'referral', name: 'Referido', type: 'fixed', value: 200, description: '200 puntos por nuevo cliente referido' },
    ],
    integrations: {
        mikrotik: { enabled: false, ip: '', user: '' },
        billing: { enabled: false, apiUrl: '' },
    },
    apiKeys: [],
    sessionTimeout: 60
};

interface CustomerContextType {
    customers: Customer[];
    settings: AppSettings;
    isLoading: boolean;
    updateSettings: (newSettings: AppSettings) => void;
    addCustomer: (customer: Omit<Customer, 'id' | 'transactions' | 'joinDate' | 'loyaltyPoints' | 'tier'>) => Promise<void>;
    updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
    addTransaction: (customerId: string, amount: number, description: string) => Promise<void>;
    addSmartTransaction: (customerId: string, ruleId: string, amount?: number, note?: string) => Promise<void>;
    importCustomers: (newCustomers: any[]) => Promise<void>;
    redeemReward: (customerId: string, rewardId: string, pointsCost: number, rewardName: string) => Promise<boolean>;

    rewards: Reward[];
    addReward: (reward: Reward) => Promise<void>;
    updateReward: (id: string, data: Partial<Reward>) => Promise<void>;
    deleteReward: (id: string) => Promise<void>;

    adjustPoints: (customerId: string, amount: number, reason: string) => Promise<void>;
    getCustomer: (id: string) => Customer | undefined;

    globalSearchQuery: string;
    setGlobalSearchQuery: (query: string) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomers = () => {
    const context = useContext(CustomerContext);
    if (!context) {
        throw new Error('useCustomers must be used within a CustomerProvider');
    }
    return context;
};

const calculateTier = (points: number): LoyaltyTier => {
    if (points >= TIERS.Platinum) return 'Platinum';
    if (points >= TIERS.Gold) return 'Gold';
    if (points >= TIERS.Silver) return 'Silver';
    return 'Bronze';
};

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');

    // Initial Data Fetch from Supabase
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Check if user is actually authenticated before trying to fetch
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);

                // Fetch Customers
                const { data: customersData, error: customersError } = await supabase
                    .from('customers')
                    .select('*, transactions(*)');

                if (customersError) throw customersError;

                // Map Supabase schema back to frontend types
                const formattedCustomers: Customer[] = (customersData || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    email: c.email,
                    phone: c.phone || '',
                    loyaltyPoints: c.loyalty_points,
                    totalPointsEarned: c.total_points_earned || c.loyalty_points, // Fallback to current points
                    referralCode: c.referral_code || `${c.name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
                    tier: c.tier as LoyaltyTier,
                    status: c.status,
                    joinDate: c.join_date,
                    transactions: (c.transactions || []).map((t: any) => ({
                        id: t.id,
                        customerId: t.customer_id,
                        amount: 0, // Legacy support, we rely mostly on points_earned now
                        pointsEarned: t.points_earned,
                        description: t.description,
                        date: t.date,
                        type: t.points_earned > 0 ? (t.description.includes('Referido') ? 'Referral' : 'Earning') : 'Redemption'
                    }))
                }));
                setCustomers(formattedCustomers);

                // Fetch Rewards
                const { data: rewardsData, error: rewardsError } = await supabase
                    .from('rewards')
                    .select('*')
                    .eq('active', true);

                if (rewardsError) throw rewardsError;

                // Use default if empty, real production would insert these defaults to DB on initial setup
                if (rewardsData && rewardsData.length > 0) {
                    setRewards(rewardsData.map((r: any) => ({
                        id: r.id,
                        name: r.name,
                        description: r.description,
                        pointsCost: r.points_cost,
                        image: r.image_url
                    })));
                } else {
                    // Fallback mock rewards if DB is empty: Insert them so they get real UUIDs
                    const defaultRewards = [
                        { name: 'Router Wi-Fi 6', description: 'Router de doble banda para mejor cobertura', points_cost: 2500, image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bbcbf?auto=format&fit=crop&q=80&w=300&h=200' },
                        { name: 'Cámara de Seguridad IP', description: 'Cámara HD con visión nocturna y WiFi', points_cost: 1500, image_url: 'https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?auto=format&fit=crop&q=80&w=300&h=200' },
                    ];

                    const { data: insertedRewards } = await supabase
                        .from('rewards')
                        .insert(defaultRewards)
                        .select();

                    if (insertedRewards && insertedRewards.length > 0) {
                        setRewards(insertedRewards.map((r: any) => ({
                            id: r.id,
                            name: r.name,
                            description: r.description,
                            pointsCost: r.points_cost,
                            image: r.image_url
                        })));
                    } else {
                        setRewards([]);
                    }
                }

                // Fetch Settings (Mocked in localStorage for now since we didn't migrate settings table fully yet)
                const savedSettings = localStorage.getItem('appSettings');
                if (savedSettings) setSettings(JSON.parse(savedSettings));

            } catch (error: any) {
                // Ignore errors if they are due to missing auth/JWT from being logged out
                const errMsg = error?.message || error?.toString() || '';
                if (!errMsg.toLowerCase().includes('jwt') && !errMsg.toLowerCase().includes('auth') && !errMsg.toLowerCase().includes('token')) {
                    console.error('Error fetching Supabase data:', error);
                    toast.error('Error al conectar con la base de datos.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Effect for Settings only (Local)
    useEffect(() => {
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
    };

    const addCustomer = async (data: Omit<Customer, 'id' | 'transactions' | 'joinDate' | 'loyaltyPoints' | 'tier'>) => {
        try {
            const tempReferral = `${data.name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

            const { data: newCustomer, error } = await supabase
                .from('customers')
                .insert([{
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    status: data.status,
                    tier: 'Bronze',
                    loyalty_points: 0,
                    // If supabase doesn't have these columns yet, they might silently fail or error.
                    // Assuming we'll add them to DB schema if needed or rely on local memory temporarily
                    // total_points_earned: 0,
                    // referral_code: tempReferral
                }])
                .select()
                .single();

            if (error) throw error;

            // Update local state instantly
            setCustomers(prev => [...prev, {
                id: newCustomer.id,
                name: newCustomer.name,
                email: newCustomer.email,
                phone: newCustomer.phone,
                loyaltyPoints: newCustomer.loyalty_points,
                totalPointsEarned: 0,
                referralCode: tempReferral,
                tier: newCustomer.tier,
                status: newCustomer.status,
                joinDate: newCustomer.join_date,
                transactions: []
            }]);

            toast.success('Cliente creado exitosamente');
        } catch (error: any) {
            console.error('Error adding customer:', error);
            toast.error(error.message || 'Error al crear cliente');
            throw error;
        }
    };

    const updateCustomer = async (id: string, data: Partial<Customer>) => {
        try {
            const { error } = await supabase
                .from('customers')
                .update({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    status: data.status,
                })
                .eq('id', id);

            if (error) throw error;

            setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
            toast.success('Cliente actualizado');
        } catch (error: any) {
            toast.error('Error al actualizar cliente');
            throw error;
        }
    };

    const _insertTransaction = async (customerId: string, currentPoints: number, pointsEarned: number, description: string) => {
        const newPoints = currentPoints + pointsEarned;

        // Find current total lifetime points safely
        const customer = customers.find(c => c.id === customerId);
        const currentTotal = customer?.totalPointsEarned || currentPoints; // Fallback
        const newTotalPointsEarned = pointsEarned > 0 ? currentTotal + pointsEarned : currentTotal;

        // Calculate tier based on LIFETIME points
        const newTier = calculateTier(newTotalPointsEarned);

        // 1. Insert Transaction
        const { data: newTransaction, error: txError } = await supabase
            .from('transactions')
            .insert([{
                customer_id: customerId,
                points_earned: pointsEarned,
                description: description
            }])
            .select()
            .single();

        if (txError) throw txError;

        // 2. Update Customer Points
        // In reality, we should also update total_points_earned here if the DB column existed
        const { error: custError } = await supabase
            .from('customers')
            .update({
                loyalty_points: newPoints,
                tier: newTier
            })
            .eq('id', customerId);

        if (custError) throw custError;

        // 3. Update Local State
        setCustomers(prev => prev.map(c => {
            if (c.id === customerId) {
                return {
                    ...c,
                    loyaltyPoints: newPoints,
                    totalPointsEarned: newTotalPointsEarned,
                    tier: newTier,
                    transactions: [{
                        id: newTransaction.id,
                        customerId: customerId,
                        amount: 0,
                        pointsEarned: pointsEarned,
                        date: newTransaction.date,
                        description: description,
                        type: pointsEarned > 0 ? (description.includes('Referido') ? 'Referral' : 'Earning') : 'Redemption'
                    }, ...c.transactions]
                };
            }
            return c;
        }));
    };

    const addTransaction = async (customerId: string, amount: number, description: string) => {
        const customer = getCustomer(customerId);
        if (!customer) return;

        try {
            await _insertTransaction(customerId, customer.loyaltyPoints, Math.floor(amount), description);
            toast.success('Transacción añadida');
        } catch (error) {
            console.error(error);
            toast.error('Error al procesar la transacción');
        }
    };

    const addSmartTransaction = async (customerId: string, ruleId: string, amount: number = 0, note: string = '') => {
        const customer = getCustomer(customerId);
        const rule = settings.pointRules.find(r => r.id === ruleId);

        if (!customer || !rule) return;

        let pointsEarned = rule.type === 'fixed' ? rule.value : Math.floor(amount * rule.value);
        const desc = `${rule.name}${note ? ` - ${note}` : ''}`;

        try {
            await _insertTransaction(customerId, customer.loyaltyPoints, pointsEarned, desc);
            toast.success('Regla aplicada correctamente');
        } catch (error) {
            console.error(error);
            toast.error('Error al aplicar regla');
        }
    };

    const redeemReward = async (customerId: string, rewardId: string, pointsCost: number, rewardName: string): Promise<boolean> => {
        // rewardId is kept in the signature for future DB relation if needed
        console.log(`Redeeming reward ${rewardId}`);
        const customer = getCustomer(customerId);
        if (!customer || customer.loyaltyPoints < pointsCost) return false;

        try {
            await _insertTransaction(customerId, customer.loyaltyPoints, -pointsCost, `Canjeado: ${rewardName}`);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const addReward = async (reward: Reward) => {
        try {
            const { data, error } = await supabase
                .from('rewards')
                .insert([{
                    name: reward.name,
                    description: reward.description,
                    points_cost: reward.pointsCost,
                    image_url: reward.image
                }])
                .select()
                .single();

            if (error) throw error;

            setRewards(prev => [...prev, {
                id: data.id,
                name: data.name,
                description: data.description,
                pointsCost: data.points_cost,
                image: data.image_url
            }]);
            toast.success('Recompensa añadida al catálogo');
        } catch (error) {
            toast.error('Error al añadir recompensa');
            console.error(error);
        }
    };

    const updateReward = async (id: string, data: Partial<Reward>) => {
        try {
            const updateProps: any = {};
            if (data.name !== undefined) updateProps.name = data.name;
            if (data.description !== undefined) updateProps.description = data.description;
            if (data.pointsCost !== undefined) updateProps.points_cost = data.pointsCost;
            if (data.image !== undefined) updateProps.image_url = data.image;

            const { error } = await supabase
                .from('rewards')
                .update(updateProps)
                .eq('id', id);

            if (error) throw error;

            setRewards(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
            toast.success('Recompensa actualizada correctamente');
        } catch (error) {
            toast.error('Error al actualizar recompensa');
            console.error(error);
        }
    };

    const deleteReward = async (id: string) => {
        try {
            const { error } = await supabase
                .from('rewards')
                .update({ active: false }) // Soft delete
                .eq('id', id);

            if (error) throw error;
            setRewards(prev => prev.filter(r => r.id !== id));
            toast.success('Recompensa eliminada');
        } catch (error) {
            toast.error('Error al eliminar recompensa');
            console.error(error);
        }
    };

    const adjustPoints = async (customerId: string, amount: number, reason: string) => {
        const customer = getCustomer(customerId);
        if (!customer) return;

        try {
            await _insertTransaction(customerId, customer.loyaltyPoints, amount, `Ajuste Manual: ${reason}`);
            toast.success('Puntos ajustados');
        } catch (error) {
            console.error(error);
            toast.error('Error al ajustar puntos');
        }
    };

    const importCustomers = async (newCustomers: any[]) => {
        toast.loading('Importando clientes a Supabase...', { id: 'import' });
        try {
            let processed = 0;
            for (const c of newCustomers) {
                const name = c.name || c.Nombre || 'Sin Nombre';
                const email = c.email || c.Correo || `${crypto.randomUUID()}@import.local`;
                const phone = c.phone || c.Telefono || '';
                const loyalty_points = c.loyaltyPoints !== undefined ? c.loyaltyPoints : (c.Puntos || 0);

                // Insert only customer for now, skip transaction history on mass import to save API calls
                const { error } = await supabase.from('customers').insert([{
                    name, email, phone, loyalty_points, tier: calculateTier(loyalty_points)
                }]);

                if (!error) processed++;
            }
            toast.success(`Se importaron ${processed} clientes exitosamente. Refresca la página.`, { id: 'import' });
            // Force reload to get fresh data with Supabase IDs
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error('Error masivo en la importación. Algunos fallaron.', { id: 'import' });
        }
    };

    const getCustomer = (id: string) => customers.find(c => c.id === id);

    return (
        <CustomerContext.Provider value={{
            customers,
            settings,
            isLoading,
            updateSettings,
            addCustomer,
            updateCustomer,
            addTransaction,
            addSmartTransaction,
            importCustomers,
            redeemReward,
            getCustomer,
            rewards,
            addReward,
            updateReward,
            deleteReward,
            adjustPoints,
            globalSearchQuery,
            setGlobalSearchQuery,
        }}>
            {children}
        </CustomerContext.Provider>
    );
};
