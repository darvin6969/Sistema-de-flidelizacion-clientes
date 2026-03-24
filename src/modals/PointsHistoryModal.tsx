import { Customer, Transaction } from '../types';
import { X, ArrowUpRight, ArrowDownRight, Gift, UserPlus, FileText } from 'lucide-react';

interface PointsHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer | null;
}

export function PointsHistoryModal({ isOpen, onClose, customer }: PointsHistoryModalProps) {
    if (!isOpen || !customer) return null;

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'Earning': return <ArrowUpRight className="w-5 h-5 text-emerald-500" />;
            case 'Redemption': return <Gift className="w-5 h-5 text-rose-500" />;
            case 'Referral': return <UserPlus className="w-5 h-5 text-blue-500" />;
            case 'Penalty': return <ArrowDownRight className="w-5 h-5 text-orange-500" />;
            default: return <FileText className="w-5 h-5 text-slate-500" />;
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'Earning': return 'text-emerald-500';
            case 'Redemption': return 'text-rose-500';
            case 'Referral': return 'text-blue-500';
            case 'Penalty': return 'text-orange-500';
            default: return 'text-slate-500';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div
                className={`flex flex-col h-full w-full max-w-md bg-card border-l border-border shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-bold">Historial de Puntos</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {customer.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="p-6 grid grid-cols-2 gap-4 border-b border-border bg-background">
                    <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Balance Actual</p>
                        <p className="text-2xl font-bold text-primary">{customer.loyaltyPoints}</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Puntos Históricos</p>
                        <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                            {customer.totalPointsEarned || customer.loyaltyPoints}
                        </p>
                    </div>
                </div>

                {/* Ledger / Transactions List */}
                <div className="flex-1 overflow-y-auto p-6 bg-background">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Movimientos</h3>

                    {customer.transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                            <p className="text-muted-foreground">No hay movimientos registrados.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {customer.transactions.map((tx: Transaction) => (
                                <div key={tx.id} className="flex flex-col gap-3 p-4 rounded-xl border border-border/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                                                {getTransactionIcon(tx.type)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-foreground">{tx.description}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(tx.date))}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`font-bold ${getTransactionColor(tx.type)}`}>
                                                {tx.pointsEarned > 0 ? '+' : ''}{tx.pointsEarned}
                                            </span>
                                            <p className="text-[10px] text-muted-foreground uppercase mt-1 hidden sm:block">Pts</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
