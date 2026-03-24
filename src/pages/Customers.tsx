import React, { useState } from 'react';
import { useCustomers } from '../context/CustomerContext';
import { Plus, Search, Filter, X, Zap, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Customer } from '../types';

export function Customers() {
    const { customers, addCustomer, addSmartTransaction, settings, adjustPoints, globalSearchQuery, setGlobalSearchQuery } = useCustomers();
    const [showAddForm, setShowAddForm] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState<string | null>(null);
    const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null);

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'asc' | 'desc' } | null>(null);

    // Form states
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
    const [transactionData, setTransactionData] = useState({ ruleId: '', amount: 0, note: '' });
    const [adjustData, setAdjustData] = useState({ amount: 0, reason: '' });

    // Filter customers
    let filteredCustomers = customers.filter(c =>
        (c.name?.toLowerCase() || '').includes(globalSearchQuery.toLowerCase()) ||
        (c.email?.toLowerCase() || '').includes(globalSearchQuery.toLowerCase())
    );

    // Sort customers
    if (sortConfig !== null) {
        filteredCustomers.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            // Handle undefined/null gracefully (though our types suggest they shouldn't be valid)
            if (aValue === undefined && bValue === undefined) return 0;
            if (aValue === undefined) return 1;
            if (bValue === undefined) return -1;

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    const requestSort = (key: keyof Customer) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleAddCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        addCustomer({ ...newCustomer, status: 'Activo' });
        setNewCustomer({ name: '', email: '', phone: '' });
        setShowAddForm(false);
    };

    const handleSmartTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (showTransactionModal && transactionData.ruleId) {
            addSmartTransaction(showTransactionModal, transactionData.ruleId, transactionData.amount, transactionData.note);
            setShowTransactionModal(null);
            setTransactionData({ ruleId: '', amount: 0, note: '' });
        }
    };

    const handleManualAdjustment = (e: React.FormEvent) => {
        e.preventDefault();
        if (showAdjustModal) {
            adjustPoints(showAdjustModal, adjustData.amount, adjustData.reason);
            setShowAdjustModal(null);
            setAdjustData({ amount: 0, reason: '' });
        }
    };

    const selectedRule = settings.pointRules.find(r => r.id === transactionData.ruleId);

    // Helper to render sort header
    const SortableHeader = ({ label, sortKey }: { label: string, sortKey: keyof Customer }) => (
        <th
            className="px-6 py-3 cursor-pointer hover:bg-muted transition-colors group select-none"
            onClick={() => requestSort(sortKey)}
        >
            <div className="flex items-center gap-2">
                {label}
                {sortConfig?.key === sortKey ? (
                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                ) : (
                    <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                )}
            </div>
        </th>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-800 transition-colors"
                >
                    <Plus size={20} />
                    Nuevo Cliente
                </button>
            </div>

            {showTransactionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card p-6 rounded-lg w-full max-w-md shadow-lg animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Registrar Actividad</h3>
                            <button
                                onClick={() => setShowTransactionModal(null)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSmartTransaction} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo de Actividad</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {settings.pointRules.map(rule => (
                                        <button
                                            key={rule.id}
                                            type="button"
                                            onClick={() => setTransactionData({ ...transactionData, ruleId: rule.id })}
                                            className={`p-3 rounded-md border text-left text-sm transition-all ${transactionData.ruleId === rule.id
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'hover:bg-muted'
                                                }`}
                                        >
                                            <div className="font-medium">{rule.name}</div>
                                            <div className="text-xs text-muted-foreground mt-1">{rule.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedRule && selectedRule.type === 'percentage' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Monto de la Transacción ($)</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                        value={transactionData.amount || ''}
                                        onChange={e => setTransactionData({ ...transactionData, amount: parseFloat(e.target.value) })}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Se calcularán {Math.floor((transactionData.amount || 0) * selectedRule.value)} puntos.
                                    </p>
                                </div>
                            )}

                            {selectedRule && selectedRule.type === 'fixed' && (
                                <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                                    Esta acción otorgará <strong>{selectedRule.value} puntos</strong> automáticamente.
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Nota (Opcional)</label>
                                <input
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    placeholder="Ej: Factura #1234"
                                    value={transactionData.note}
                                    onChange={e => setTransactionData({ ...transactionData, note: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!transactionData.ruleId || (selectedRule?.type === 'percentage' && !transactionData.amount)}
                                className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Procesar y Asignar Puntos
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showAdjustModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card p-6 rounded-lg w-full max-w-md shadow-lg animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Ajuste Manual de Puntos</h3>
                            <button
                                onClick={() => setShowAdjustModal(null)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleManualAdjustment} className="space-y-4">
                            <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm mb-4">
                                Use valores positivos para bonificar y negativos para penalizar.
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Cantidad de Puntos (+/-)</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full px-3 py-2 border rounded-md font-mono bg-background"
                                    placeholder="Ej: 500 o -200"
                                    value={adjustData.amount || ''}
                                    onChange={e => setAdjustData({ ...adjustData, amount: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Motivo</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    placeholder="Ej: Error en facturación, Bonificación especial..."
                                    value={adjustData.reason}
                                    onChange={e => setAdjustData({ ...adjustData, reason: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-slate-800"
                            >
                                Aplicar Ajuste
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showAddForm && (
                <div className="bg-card p-6 rounded-lg border shadow-sm animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4">Nuevo Cliente</h3>
                    <form onSubmit={handleAddCustomer} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre</label>
                            <input
                                required
                                className="w-full px-3 py-2 border rounded-md bg-background"
                                value={newCustomer.name}
                                onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                required
                                type="email"
                                className="w-full px-3 py-2 border rounded-md bg-background"
                                value={newCustomer.email}
                                onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Teléfono</label>
                            <input
                                required
                                className="w-full px-3 py-2 border rounded-md bg-background"
                                value={newCustomer.phone}
                                onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 w-full"
                            >
                                Guardar
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="bg-slate-200 text-slate-800 px-4 py-2 rounded-md hover:bg-slate-300 w-full"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        placeholder="Buscar clientes..."
                        className="pl-9 w-full px-3 py-2 border rounded-md bg-card dark:bg-background/50"
                        value={globalSearchQuery}
                        onChange={e => setGlobalSearchQuery(e.target.value)}
                    />
                </div>

                <div className="border rounded-lg bg-card overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 dark:bg-muted/20 text-muted-foreground uppercase text-xs">
                            <tr>
                                <SortableHeader label="Nombre" sortKey="name" />
                                <SortableHeader label="Estado" sortKey="status" />
                                <SortableHeader label="Puntos" sortKey="loyaltyPoints" />
                                <SortableHeader label="Nivel" sortKey="tier" />
                                <SortableHeader label="Registro" sortKey="joinDate" />
                                <th className="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                        No se encontraron clientes. ¡Añade el primero!
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium">
                                            <div>{customer.name}</div>
                                            <div className="text-xs text-muted-foreground">{customer.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                ${customer.status === 'Activo' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    customer.status === 'Inactivo' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                {customer.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-semibold text-primary">
                                            {customer.loyaltyPoints.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                ${customer.tier === 'Platinum' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                    customer.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        customer.tier === 'Silver' ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300' :
                                                            'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}`}
                                            >
                                                {customer.tier}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(customer.joinDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setShowTransactionModal(customer.id)}
                                                className="bg-primary/10 text-primary dark:bg-primary/20 dark:hover:bg-primary/30 hover:bg-primary/20 p-2 rounded-md transition-colors"
                                                title="Registrar Actividad"
                                            >
                                                <Zap size={16} />
                                            </button>
                                            <button
                                                onClick={() => setShowAdjustModal(customer.id)}
                                                className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-md transition-colors"
                                                title="Ajuste Manual de Puntos"
                                            >
                                                <Filter size={16} className="rotate-90" />
                                            </button>
                                            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs px-3 py-2 transition-colors">
                                                Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
