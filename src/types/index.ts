export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    loyaltyPoints: number; // Current balance
    totalPointsEarned?: number; // Lifetime points (for tier calculation)
    referralCode?: string; // e.g., JUAN-1234
    joinDate: string;
    transactions: Transaction[];
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    status: 'Activo' | 'Inactivo' | 'Suspendido';
}

export interface Transaction {
    id: string;
    customerId: string;
    amount: number; // Monetary amount (if applicable)
    pointsEarned: number; // Points added or subtracted
    date: string;
    description: string;
    type: 'Earning' | 'Redemption' | 'Penalty' | 'Referral';
}

export interface Reward {
    id: string;
    name: string;
    description: string;
    pointsCost: number;
    image?: string;
}

export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export const TIERS: Record<LoyaltyTier, number> = {
    Bronze: 0,
    Silver: 1000,
    Gold: 5000,
    Platinum: 10000,
};

export interface Role {
    id: string;
    name: string;
    description: string;
    can_manage_staff: boolean;
    can_manage_customers: boolean;
    can_manage_rewards: boolean;
    can_manage_settings: boolean;
    created_at?: string;
}

export interface StaffProfile {
    id: string; // matches auth.users.id
    username: string;
    full_name: string;
    email: string;
    phone?: string;
    role_id: string;
    is_active: boolean;
    role?: Role; // Joined data
    created_at?: string;
}
