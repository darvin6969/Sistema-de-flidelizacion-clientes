import { useMemo } from 'react';
import { useCustomers } from '../context/CustomerContext';
import { Users, CreditCard, TrendingUp, Award, Activity, Star, PieChart as PieChartIcon } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

export function Dashboard() {
    const { customers } = useCustomers();

    const totalPoints = customers.reduce((acc, c) => acc + c.loyaltyPoints, 0);
    const totalTransactions = customers.reduce((acc, c) => acc + c.transactions.length, 0);
    const activeMembers = customers.filter(c => c.transactions.length > 0).length;

    const stats = [
        {
            label: 'Total de Clientes',
            value: customers.length,
            icon: Users,
            trend: '+12% vs mes anterior',
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
        },
        {
            label: 'Puntos Emitidos',
            value: totalPoints.toLocaleString(),
            icon: Award,
            trend: '+24% vs mes anterior',
            color: 'text-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400'
        },
        {
            label: 'Total Transacciones',
            value: totalTransactions,
            icon: CreditCard,
            trend: '+8% vs mes anterior',
            color: 'text-green-600',
            bg: 'bg-green-100 dark:bg-green-900/30 dark:text-green-400'
        },
        {
            label: 'Miembros Activos',
            value: activeMembers,
            icon: TrendingUp,
            trend: '+4% vs mes anterior',
            color: 'text-orange-600',
            bg: 'bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400'
        },
    ];

    const tierData = useMemo(() => {
        const counts = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
        customers.forEach(c => {
            if (counts[c.tier] !== undefined) counts[c.tier]++;
        });
        return [
            { name: 'Bronze', value: counts.Bronze, color: '#fb923c' }, // orange-400
            { name: 'Silver', value: counts.Silver, color: '#94a3b8' }, // slate-400
            { name: 'Gold', value: counts.Gold, color: '#eab308' },   // yellow-500
            { name: 'Platinum', value: counts.Platinum, color: '#a855f7' } // purple-500
        ].filter(t => t.value > 0);
    }, [customers]);

    const lineData = useMemo(() => {
        const grouped: Record<string, { otorgados: number, canjeados: number }> = {};

        // Generate last 7 days labels
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            grouped[dateStr] = { otorgados: 0, canjeados: 0 };
        }

        customers.forEach(c => {
            c.transactions.forEach(t => {
                const dateStr = new Date(t.date).toISOString().split('T')[0];
                if (grouped[dateStr]) {
                    if (t.pointsEarned > 0) {
                        grouped[dateStr].otorgados += t.pointsEarned;
                    } else if (t.pointsEarned < 0) {
                        grouped[dateStr].canjeados += Math.abs(t.pointsEarned);
                    }
                }
            });
        });

        return Object.keys(grouped).map(date => ({
            name: date.split('-').slice(1).join('/'), // MM/DD
            'Puntos Otorgados': grouped[date].otorgados,
            'Puntos Canjeados': grouped[date].canjeados
        }));

    }, [customers]);

    const topCustomersData = useMemo(() => {
        return [...customers]
            .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
            .slice(0, 5)
            .map(c => ({
                name: c.name.split(' ')[0], // Solo el primer nombre para no saturar
                'Puntos': c.loyaltyPoints
            }));
    }, [customers]);

    const pointsBalanceData = useMemo(() => {
        let otorgados = 0;
        let canjeados = 0;
        customers.forEach(c => {
            c.transactions.forEach(t => {
                if (t.pointsEarned > 0) otorgados += t.pointsEarned;
                if (t.pointsEarned < 0) canjeados += Math.abs(t.pointsEarned);
            });
        });
        return [
            { name: 'Emitidos', value: otorgados, color: '#8b5cf6' }, // violeta
            { name: 'Canjeados', value: canjeados, color: '#f43f5e' } // rosa
        ].filter(d => d.value > 0);
    }, [customers]);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
                <p className="text-muted-foreground">Resumen del rendimiento de tu programa de lealtad.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-card p-6 rounded-xl border shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                            <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Line Chart */}
                <div className="col-span-1 lg:col-span-4 bg-card p-6 rounded-xl border shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="text-primary h-5 w-5" />
                        <h3 className="font-semibold">Tendencia de Puntos (Últimos 7 días)</h3>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="currentColor" />
                                <XAxis dataKey="name" stroke="currentColor" fontSize={12} opacity={0.6} tickLine={false} axisLine={false} />
                                <YAxis stroke="currentColor" fontSize={12} opacity={0.6} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="Puntos Otorgados" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="Puntos Canjeados" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="col-span-1 lg:col-span-3 bg-card p-6 rounded-xl border shadow-sm flex flex-col">
                    <h3 className="font-semibold mb-6">Distribución de Niveles</h3>
                    <div className="flex-1 min-h-[300px]">
                        {tierData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={tierData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {tierData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                No hay datos suficientes
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Fila 2 de Gráficos */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Bar Chart: Top Customers */}
                <div className="col-span-1 lg:col-span-4 bg-card p-6 rounded-xl border shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <Star className="text-yellow-500 h-5 w-5" />
                        <h3 className="font-semibold">Top 5 Clientes Más Leales</h3>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topCustomersData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="currentColor" horizontal={true} vertical={false} />
                                <XAxis type="number" stroke="currentColor" fontSize={12} opacity={0.6} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" stroke="currentColor" fontSize={12} opacity={0.6} tickLine={false} axisLine={false} width={80} />
                                <Tooltip
                                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                />
                                <Bar dataKey="Puntos" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart: Balance Total */}
                <div className="col-span-1 lg:col-span-3 bg-card p-6 rounded-xl border shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <PieChartIcon className="text-purple-500 h-5 w-5" />
                        <h3 className="font-semibold">Balance Histórico de Puntos</h3>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        {pointsBalanceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pointsBalanceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pointsBalanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                No hay transacciones aún
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Actividad Reciente */}
            <div className="bg-card p-6 rounded-xl border shadow-sm">
                <h3 className="font-semibold mb-4">Actividad Reciente</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {customers.flatMap(c => c.transactions).length === 0 ? (
                        <p className="text-sm text-muted-foreground col-span-full py-4">No hay actividad reciente.</p>
                    ) : (
                        customers
                            .flatMap(c => c.transactions.map(t => ({ ...t, customerName: c.name })))
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 6)
                            .map((t) => (
                                <div key={t.id} className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shadow-sm">
                                        {t.customerName.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{t.customerName}</p>
                                        <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                                    </div>
                                    <div className="text-right whitespace-nowrap">
                                        <p className={`text-sm font-bold ${t.pointsEarned > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {t.pointsEarned > 0 ? '+' : ''}{t.pointsEarned} pts
                                        </p>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>
        </div>
    );
}
