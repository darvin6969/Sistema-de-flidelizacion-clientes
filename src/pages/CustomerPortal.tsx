import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Gift, ArrowLeft, Star, Award, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export function CustomerPortal({ onBackToLogin }: { onBackToLogin: () => void }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [customerData, setCustomerData] = useState<any>(null);
    const [rewards, setRewards] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Fetch public rewards to display in the catalog
        const fetchRewards = async () => {
            const { data, error } = await supabase
                .from('rewards')
                .select('*')
                .eq('active', true);
            if (!error && data) {
                setRewards(data);
            }
        };
        fetchRewards();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setCustomerData(null);

        try {
            // Buscamos por correo o nombre exacto (case insensitive en ilike)
            const { data, error } = await supabase
                .from('customers')
                .select('name, email, loyalty_points, tier, join_date')
                .or(`email.ilike.${searchQuery},name.ilike.%${searchQuery}%`)
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned
                    toast.error('No se encontró ningún cliente con ese dato. Verifique si el correo o nombre coincide exactamente.', { duration: 4000 });
                } else {
                    toast.error('Garantice su conexión a internet.');
                }
            } else if (data) {
                setCustomerData(data);
                toast.success('¡Hola de nuevo!', { icon: '👋' });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'Platinum': return 'from-slate-300 via-slate-100 to-slate-400 text-slate-800 shadow-slate-300/50';
            case 'Gold': return 'from-yellow-400 via-yellow-300 to-yellow-500 text-yellow-900 shadow-yellow-500/50';
            case 'Silver': return 'from-gray-300 via-gray-200 to-gray-400 text-gray-800 shadow-gray-400/50';
            default: return 'from-amber-700 via-amber-600 to-amber-800 text-amber-50 shadow-amber-700/50'; // Bronze
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-white overflow-hidden relative selection:bg-blue-500/30">
            {/* Fondo dinámico y profesional */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="max-w-4xl mx-auto px-4 py-8 relative z-10 min-h-screen flex flex-col">

                {/* Header Navbar */}
                <header className="flex items-center justify-between mb-12">
                    <button
                        onClick={onBackToLogin}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Volver a inicio</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/20 p-1">
                            <img src="/quantica-logo.png" alt="QUANTICA Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-bold text-xl tracking-tight hidden sm:block">QUANTICA Loyalty</span>
                    </div>
                </header>

                {/* Hero Search Section */}
                <div className={`transition-all duration-700 ease-in-out ${customerData ? 'h-auto mb-10' : 'flex-1 flex flex-col justify-center mb-0'}`}>
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Descubre tus recompensas
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Ingresa tu correo o nombre completo para consultar tus QuántiPuntos acumulados y ver qué puedes canjear hoy.
                        </p>
                    </div>

                    <form onSubmit={handleSearch} className="max-w-xl mx-auto w-full relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Ej: tu@correo.com o Juan Pérez"
                            className="block w-full pl-14 pr-32 py-4 md:py-5 border border-white/10 rounded-2xl bg-slate-900/60 backdrop-blur-md text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-xl placeholder:text-slate-500"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !searchQuery.trim()}
                            className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-md active:scale-95 flex items-center"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                "Buscar"
                            )}
                        </button>
                    </form>
                </div>

                {/* Customer Data Display */}
                {customerData && (
                    <div className="animate-fade-in-up space-y-8">

                        {/* Status Card */}
                        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                <div>
                                    <p className="text-slate-400 font-medium mb-1">Resumen de cuenta</p>
                                    <h2 className="text-3xl font-bold text-white mb-2">{customerData.name}</h2>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        Miembro desde {new Date(customerData.join_date).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <div className={`px-6 py-4 rounded-2xl bg-gradient-to-br ${getTierColor(customerData.tier)} shadow-lg flex items-center gap-3 transform hover:scale-105 transition-transform cursor-default border border-white/20`}>
                                        <Award className="w-8 h-8 opacity-80" />
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Nivel Actual</p>
                                            <p className="text-xl font-black">{customerData.tier}</p>
                                        </div>
                                    </div>

                                    <div className="px-6 py-4 rounded-2xl bg-slate-800 border border-white/5 shadow-inner flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                                            <Star className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-400">Puntos Acumulados</p>
                                            <p className="text-2xl font-black text-white">{customerData.loyalty_points.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Catálogo de Recompensas */}
                        <div className="mt-12">
                            <div className="flex items-center gap-3 mb-6">
                                <Gift className="text-purple-400 w-6 h-6" />
                                <h3 className="text-2xl font-bold">Catálogo de Recompensas</h3>
                            </div>

                            {rewards.length === 0 ? (
                                <div className="text-center py-10 bg-slate-900/30 rounded-2xl border border-white/5">
                                    <p className="text-slate-400">No hay recompensas disponibles en este momento.</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {rewards.map((reward) => {
                                        const canAfford = customerData.loyalty_points >= reward.points_cost;

                                        return (
                                            <div key={reward.id} className={`group bg-slate-900/50 backdrop-blur-sm border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${canAfford ? 'border-blue-500/30 hover:border-blue-500/60 shadow-blue-900/20' : 'border-white/5 opacity-80'}`}>
                                                <div className="h-40 overflow-hidden relative">
                                                    <img
                                                        src={reward.image_url || 'https://images.unsplash.com/photo-1544197150-b99a580bbcbf?auto=format&fit=crop&q=80&w=400&h=300'}
                                                        alt={reward.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>

                                                    {canAfford && (
                                                        <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-green-400/50 flex items-center gap-1 animate-pulse-slow">
                                                            <span>¡Puedes canjearlo!</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-5">
                                                    <h4 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{reward.name}</h4>
                                                    <p className="text-sm text-slate-400 line-clamp-2 mb-4 h-10">{reward.description}</p>

                                                    <div className="flex items-center justify-between mt-auto">
                                                        <div className="flex items-center gap-1.5 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-white/5">
                                                            <Star className={`w-4 h-4 ${canAfford ? 'text-yellow-500' : 'text-slate-500'}`} />
                                                            <span className={`font-bold ${canAfford ? 'text-yellow-500' : 'text-slate-400'}`}>
                                                                {reward.points_cost.toLocaleString()} pts
                                                            </span>
                                                        </div>

                                                        {canAfford ? (
                                                            <div className="text-xs font-medium text-blue-400 flex items-center gap-1">
                                                                Contacta soporte <TrendingUp className="w-3 h-3" />
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs font-medium text-slate-500">
                                                                Te faltan {(reward.points_cost - customerData.loyalty_points).toLocaleString()} pts
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
