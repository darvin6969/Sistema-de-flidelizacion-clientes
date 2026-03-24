import { useState, useRef, useEffect } from 'react';
import { useCustomers } from '../context/CustomerContext';
import { Reward } from '../types';
import { Search, History, UserPlus, Ticket, Flame, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { PointsHistoryModal } from '../modals/PointsHistoryModal';
import { TIERS } from '../types';

export function Loyalty() {
    const { customers, redeemReward, rewards, addTransaction } = useCustomers();
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [referralInput, setReferralInput] = useState('');
    const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);

    const filteredCustomers = customers.filter(c =>
        (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // Auto-update selected customer if global array changes (e.g. points added)
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRedeem = async (reward: Reward) => {
        if (!selectedCustomerId) {
            toast.error('Por favor seleccione un cliente primero.');
            return;
        }

        if (!selectedCustomer) return;

        if (selectedCustomer.loyaltyPoints < reward.pointsCost) {
            toast.error('Puntos insuficientes.');
            return;
        }

        try {
            const success = await redeemReward(selectedCustomerId, reward.id, reward.pointsCost, reward.name);
            if (success) {
                toast.success(`¡${reward.name} canjeado exitosamente!`);
            } else {
                toast.error('El canje falló. Verifique sus puntos o conexión.');
            }
        } catch (error) {
            toast.error('Error procesando el canje.');
        }
    };

    const getNextTierThreshold = (points: number) => {
        if (points < TIERS.Silver) return { name: 'Silver', threshold: TIERS.Silver };
        if (points < TIERS.Gold) return { name: 'Gold', threshold: TIERS.Gold };
        if (points < TIERS.Platinum) return { name: 'Platinum', threshold: TIERS.Platinum };
        return { name: 'Max', threshold: points };
    };

    const handleApplyReferral = async () => {
        if (!selectedCustomer) return;
        if (!referralInput.trim()) {
            toast.error('Ingrese un código de referido');
            return;
        }

        // Find referring customer
        const referringCustomer = customers.find(c => c.referralCode === referralInput.trim() && c.id !== selectedCustomer.id);

        if (!referringCustomer) {
            toast.error('Código de referido inválido o ingresó su propio código');
            return;
        }

        try {
            // Apply 500 points to both
            toast.loading('Procesando referido...', { id: 'ref' });

            await addTransaction(selectedCustomer.id, 500, `Bono por Referido: ${referringCustomer.name}`);
            await addTransaction(referringCustomer.id, 500, `Bono por referir a: ${selectedCustomer.name}`);

            toast.success(`Referido aplicado con éxito. +500 pts añadidos a ambos clientes.`, { id: 'ref' });
            setReferralInput('');
        } catch (e) {
            toast.error('Error al aplicar referido', { id: 'ref' });
        }
    }

    const handleBuyTicket = async () => {
        if (!selectedCustomer) return;
        if (selectedCustomer.loyaltyPoints < 50) {
            toast.error('No tienes suficientes puntos (50 pts requeridos).');
            return;
        }

        setIsRouletteSpinning(true);
        const toastId = toast.loading('Adquiriendo boleto y girando la ruleta...', { duration: 2000 });

        setTimeout(async () => {
            try {
                const won = Math.random() > 0.7; // 30% win chance

                if (won) {
                    toast.success('¡FELICIDADES! Has ganado 200 Puntos Extra.', { id: toastId, duration: 5000 });
                    // First deduct 50, then add 200 (net +150)
                    await addTransaction(selectedCustomer.id, -50, 'Sorteo Mensual - Boleto');
                    await addTransaction(selectedCustomer.id, 200, '¡Premio Sorteo! (Puntos Extra)');
                } else {
                    toast.error('Suerte para la próxima. No ganaste esta vez.', { id: toastId, duration: 4000 });
                    await addTransaction(selectedCustomer.id, -50, 'Sorteo Mensual - Boleto (No premiado)');
                }
            } catch (error) {
                toast.error('Error procesando el sorteo', { id: toastId });
            } finally {
                setIsRouletteSpinning(false);
            }
        }, 2000);
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Programa de Lealtad</h2>
                <p className="text-muted-foreground">Administra recompensas y canjea puntos por cliente.</p>
            </div>



            <div className="bg-card p-6 rounded-xl border shadow-sm">
                <div className="mb-4" ref={searchRef}>
                    <label className="block text-sm font-medium mb-2">Buscar Cliente para Canje</label>
                    <div className="relative w-full md:w-1/2">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Escribe el nombre del cliente..."
                            className="pl-9 w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            value={searchTerm}
                            onClick={() => setIsSearchOpen(true)}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsSearchOpen(true);
                            }}
                        />

                        {/* Autocomplete Dropdown */}
                        {isSearchOpen && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border shadow-xl rounded-lg z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => {
                                                setSelectedCustomerId(c.id);
                                                setSearchTerm(''); // Limpia la búsqueda para que el input se vea limpio al mostrar el perfil
                                                setIsSearchOpen(false);
                                            }}
                                            className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors border-b border-border/50 last:border-0 ${selectedCustomerId === c.id
                                                    ? 'bg-primary/10 hover:bg-primary/20'
                                                    : 'hover:bg-muted'
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm">{c.name}</span>
                                                <span className="text-xs text-muted-foreground">{c.email || c.phone || 'Sin contacto'}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{c.loyaltyPoints} pts</span>
                                                <p className="text-[10px] text-muted-foreground mt-1">{c.tier}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center">
                                        <Search className="w-6 h-6 opacity-20 mb-2" />
                                        No se encontraron clientes con "{searchTerm}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {selectedCustomer && (
                    <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between border border-border gap-6">
                        <div className="flex gap-4 items-center flex-1 w-full">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center text-xl font-bold shadow-md shrink-0">
                                {selectedCustomer.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-lg">{selectedCustomer.name}</p>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                                        {selectedCustomer.tier}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">Código Embajador: <span className="font-mono text-foreground font-medium">{selectedCustomer.referralCode || 'N/A'}</span></p>

                                {/* Progress Bar */}
                                {selectedCustomer.tier !== 'Platinum' && (
                                    <div className="mt-3 w-full max-w-md">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-muted-foreground">Progreso para {getNextTierThreshold(selectedCustomer.totalPointsEarned || selectedCustomer.loyaltyPoints).name}</span>
                                            <span className="font-medium">{selectedCustomer.totalPointsEarned || selectedCustomer.loyaltyPoints} / {getNextTierThreshold(selectedCustomer.totalPointsEarned || selectedCustomer.loyaltyPoints).threshold}</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                                                style={{ width: `${Math.min(100, ((selectedCustomer.totalPointsEarned || selectedCustomer.loyaltyPoints) / getNextTierThreshold(selectedCustomer.totalPointsEarned || selectedCustomer.loyaltyPoints).threshold) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Balance Actual</p>
                                <p className="text-3xl font-extrabold text-primary">{selectedCustomer.loyaltyPoints} <span className="text-base font-medium text-muted-foreground">pts</span></p>
                            </div>
                            <button
                                onClick={() => setIsHistoryModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                <History className="w-4 h-4" />
                                Ver Historial
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Loyalty Tools Section (New) */}
            {selectedCustomer && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Referrals */}
                    <div className="bg-card p-6 rounded-xl border border-border flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <UserPlus className="w-5 h-5 text-blue-500" />
                                <h3 className="font-semibold text-lg">Canjear Código Referido</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">Si el cliente vino recomendado por alguien, ingresa el código del embajador para premiar a ambos con 500 pts.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Ej: JUAN-1234"
                                    value={referralInput}
                                    onChange={(e) => setReferralInput(e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-blue-500 uppercase font-mono text-sm"
                                />
                                <button
                                    onClick={handleApplyReferral}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sorteo / Roulette Trigger */}
                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-6 rounded-xl border border-purple-700/50 flex flex-col justify-between text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <Ticket className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <Ticket className="w-5 h-5 text-purple-300" />
                                <h3 className="font-semibold text-lg">Sorteo Mensual Silver/Gold</h3>
                            </div>
                            <p className="text-sm text-purple-200 mb-4 max-w-[80%]">Compra un boleto virtual por 50 puntos para participar en la ruleta de premios mayores.</p>
                            <button
                                onClick={handleBuyTicket}
                                disabled={isRouletteSpinning || selectedCustomer.loyaltyPoints < 50}
                                className="px-5 py-2.5 bg-white text-indigo-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-bold transition-colors shadow-md flex items-center gap-2"
                            >
                                {isRouletteSpinning ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin"></div>
                                        Girando...
                                    </>
                                ) : (
                                    <>Comprar Boleto (50 pts)</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Streaks and Boosters Section */}
            {selectedCustomer && (
                <div>
                    <h3 className="text-xl font-bold tracking-tight mb-4">Beneficios y Misiones Activas</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Streaks */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-border flex items-start gap-4">
                            <div className="p-3 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg shrink-0">
                                <Flame className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-base flex items-center gap-2">
                                    Racha de Pagos Puntuales
                                    <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full uppercase">Activa</span>
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">Lleva <strong className="text-foreground">2 meses</strong> seguidos pagando a tiempo. Al llegar a 3, ganará un bono automático de 200 pts.</p>
                                <div className="mt-3 flex gap-1">
                                    <div className="flex-1 h-1.5 bg-orange-500 rounded-full"></div>
                                    <div className="flex-1 h-1.5 bg-orange-500 rounded-full"></div>
                                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Boosters */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-border flex items-start gap-4">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg shrink-0">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-base flex items-center gap-2">
                                    Multiplicador de Fin de Semana
                                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full uppercase">Evento Global</span>
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">Todos los pagos procesados este fin de semana otorgan <strong className="text-foreground text-yellow-600 dark:text-yellow-400">Puntos al Doble (x2)</strong>.</p>
                                <p className="text-xs text-muted-foreground mt-2 font-mono">Termina en: 48h 12m</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {rewards.map((reward) => (
                    <div key={reward.id} className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
                        <div className="h-48 overflow-hidden bg-white dark:bg-slate-950/50 flex items-center justify-center p-4 border-b border-border/50">
                            <img src={reward.image} alt={reward.name} className="max-w-full max-h-full object-contain drop-shadow-sm" />
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="font-semibold text-lg">{reward.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1 flex-1">{reward.description}</p>
                            <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                <span className="font-bold text-primary">{reward.pointsCost} pts</span>
                                <button
                                    onClick={() => handleRedeem(reward)}
                                    disabled={!selectedCustomer || selectedCustomer.loyaltyPoints < reward.pointsCost}
                                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                                >
                                    Canjear
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <PointsHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                customer={selectedCustomer || null}
            />
        </div>
    );
}
