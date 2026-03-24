import React, { useState, useRef } from 'react';
import { useCustomers } from '../context/CustomerContext';
import { Database, Server, Save, Plus, Trash2, Upload, Download, Image as ImageIcon, X, Pencil, Shield, Lock, Key, Copy, CheckCircle2 } from 'lucide-react';
import { uploadImage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function Settings() {
    const { settings, updateSettings, customers, importCustomers, rewards, addReward, updateReward, deleteReward } = useCustomers();
    const { user, staffProfile } = useAuth();
    const isSuperAdmin = !staffProfile?.role || staffProfile?.username === 'admin';

    const [localSettings, setLocalSettings] = useState(settings);
    const [activeTab, setActiveTab] = useState<'general' | 'rules' | 'integrations' | 'data' | 'rewards'>('general');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newReward, setNewReward] = useState({ name: '', description: '', pointsCost: 0, image: '' });
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
    const [editingTimeout, setEditingTimeout] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const generateApiKey = () => {
        const newKey = 'qn_' + crypto.randomUUID().replace(/-/g, '') + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
        const newApiKeys = [
            ...(localSettings.apiKeys || []),
            { id: crypto.randomUUID(), name: 'Nueva API Key', key: newKey, createdAt: new Date().toISOString() }
        ];
        setLocalSettings({ ...localSettings, apiKeys: newApiKeys });
    };

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Password Prompt State
    const [passwordPrompt, setPasswordPrompt] = useState<{ isOpen: boolean; action: (() => void) | null; passwordInput: string; isVerifying: boolean }>({ isOpen: false, action: null, passwordInput: '', isVerifying: false });

    const confirmWithPassword = (action: () => void) => {
        setPasswordPrompt({ isOpen: true, action, passwordInput: '', isVerifying: false });
    };

    const handleVerifyPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordPrompt(prev => ({ ...prev, isVerifying: true }));
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: passwordPrompt.passwordInput
            });

            if (error || !data.session) {
                toast.error('Contraseña incorrecta');
                setPasswordPrompt(prev => ({ ...prev, isVerifying: false }));
                return;
            }

            // Success
            toast.success('Autorización de seguridad confirmada');
            if (passwordPrompt.action) {
                passwordPrompt.action();
            }
            setPasswordPrompt({ isOpen: false, action: null, passwordInput: '', isVerifying: false });

        } catch (error) {
            toast.error('Error al verificar contraseña');
            setPasswordPrompt(prev => ({ ...prev, isVerifying: false }));
        }
    };

    const handleAddReward = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newReward.name || newReward.pointsCost <= 0) {
            toast.error('Nombre y costo de puntos son obligatorios');
            return;
        }

        setIsUploading(true);
        let finalImageUrl = newReward.image;

        try {
            // Si el usuario seleccionó un archivo local, lo subimos a Supabase
            if (selectedImageFile) {
                const uploadedUrl = await uploadImage(selectedImageFile, 'recompensas');
                if (uploadedUrl) {
                    finalImageUrl = uploadedUrl;
                } else {
                    toast.error('No se pudo subir la imagen, usando valor por defecto/vacío');
                }
            }

            if (editingRewardId) {
                await updateReward(editingRewardId, { ...newReward, image: finalImageUrl });
                toast.success('Recompensa actualizada');
            } else {
                await addReward({ ...newReward, image: finalImageUrl, id: crypto.randomUUID() });
            }

            // Reset form
            setNewReward({ name: '', description: '', pointsCost: 0, image: '' });
            setSelectedImageFile(null);
            setEditingRewardId(null);

        } catch (error) {
            toast.error(editingRewardId ? 'Error al actualizar la recompensa' : 'Error al crear la recompensa');
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditRewardClick = (reward: any) => {
        setNewReward({
            name: reward.name,
            description: reward.description,
            pointsCost: reward.pointsCost,
            image: reward.image
        });
        setEditingRewardId(reward.id);
        setSelectedImageFile(null);
        // Scroll to top of the form smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setNewReward({ name: '', description: '', pointsCost: 0, image: '' });
        setEditingRewardId(null);
        setSelectedImageFile(null);
    };

    const handleSave = () => {
        updateSettings(localSettings);
        toast.success('Configuración guardada correctamente');
    };

    const clearData = () => {
        if (confirm('¿Estás seguro de que deseas borrar todos los datos? Esta acción no se puede deshacer.')) {
            localStorage.removeItem('customers');
            localStorage.removeItem('appSettings');
            window.location.reload();
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
                    <p className="text-muted-foreground">Administra las reglas de puntos y conexiones.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-800 transition-colors"
                >
                    <Save size={20} />
                    Guardar Cambios
                </button>
            </div>

            <div className="flex gap-4 border-b">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                >
                    General
                </button>
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'rules' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                >
                    Reglas de Puntos
                </button>
                <button
                    onClick={() => setActiveTab('rewards')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'rewards' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                >
                    Recompensas
                </button>
                <button
                    onClick={() => setActiveTab('integrations')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'integrations' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                >
                    Integraciones (API)
                </button>
                <button
                    onClick={() => setActiveTab('data')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'data' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                >
                    Gestión de Datos
                </button>
            </div>

            {activeTab === 'general' && (
                <div className="grid gap-6">
                    {/* Session Security Card */}
                    <div className="bg-card p-6 rounded-xl border shadow-sm flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <Shield className="h-6 w-6 text-indigo-700 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Seguridad de Sesión</h3>
                                <p className="text-muted-foreground">Cierre de sesión automático por inactividad.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {editingTimeout ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-20 px-3 py-1.5 border rounded-md"
                                        value={localSettings.sessionTimeout || 60}
                                        onChange={(e) => setLocalSettings({ ...localSettings, sessionTimeout: parseInt(e.target.value) || 1 })}
                                    />
                                    <span className="text-sm text-muted-foreground">minutos</span>
                                    <button
                                        onClick={() => setEditingTimeout(false)}
                                        className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md"
                                    >
                                        OK
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{localSettings.sessionTimeout || 60} minutos</span>
                                    <button
                                        onClick={() => setEditingTimeout(true)}
                                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                        title="Editar tiempo"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-card p-6 rounded-xl border shadow-sm flex items-center justify-between mt-6 border-red-200">
                        <div className="flex gap-4">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <Database className="h-6 w-6 text-red-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-red-700">Zona de Peligro</h3>
                                <p className="text-muted-foreground">Borrar base de datos local y reiniciar.</p>
                            </div>
                        </div>
                        {isSuperAdmin ? (
                            <button
                                onClick={() => confirmWithPassword(clearData)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                            >
                                <Database size={16} />
                                Borrar Todos los Datos
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 text-red-700 bg-red-50/50 px-4 py-2 rounded-md border border-red-100">
                                <Lock size={16} />
                                <span className="text-sm font-medium">Solo SuperAdministradores</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'rules' && (
                <div className="space-y-6">
                    <div className="bg-card p-6 rounded-xl border shadow-sm">
                        <h3 className="font-semibold text-lg mb-4">Reglas de Automatización</h3>
                        <p className="text-sm text-muted-foreground mb-6">Define cuántos puntos ganan los clientes por cada acción.</p>

                        <div className="space-y-4">
                            {localSettings.pointRules.map((rule, index) => (
                                <div key={rule.id} className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">Acción</label>
                                            <input
                                                className="w-full bg-transparent font-medium focus:outline-none border-b border-transparent focus:border-primary"
                                                value={rule.name}
                                                onChange={(e) => {
                                                    const newRules = [...localSettings.pointRules];
                                                    newRules[index].name = e.target.value;
                                                    setLocalSettings({ ...localSettings, pointRules: newRules });
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">Tipo</label>
                                            <select
                                                className="w-full bg-transparent border-b border-transparent focus:border-primary"
                                                value={rule.type}
                                                onChange={(e) => {
                                                    const newRules = [...localSettings.pointRules];
                                                    newRules[index].type = e.target.value as 'percentage' | 'fixed';
                                                    setLocalSettings({ ...localSettings, pointRules: newRules });
                                                }}
                                            >
                                                <option value="fixed">Puntos Fijos</option>
                                                <option value="percentage">Porcentaje del Monto</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">Valor</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step={rule.type === 'percentage' ? '0.1' : '1'}
                                                    className="w-full bg-transparent font-mono focus:outline-none border-b border-transparent focus:border-primary"
                                                    value={rule.value}
                                                    onChange={(e) => {
                                                        const newRules = [...localSettings.pointRules];
                                                        newRules[index].value = parseFloat(e.target.value);
                                                        setLocalSettings({ ...localSettings, pointRules: newRules });
                                                    }}
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                    {rule.type === 'percentage' ? 'x Monto' : 'pts'}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">Descripción</label>
                                            <input
                                                className="w-full bg-transparent text-sm text-muted-foreground focus:outline-none border-b border-transparent focus:border-primary"
                                                value={rule.description}
                                                onChange={(e) => {
                                                    const newRules = [...localSettings.pointRules];
                                                    newRules[index].description = e.target.value;
                                                    setLocalSettings({ ...localSettings, pointRules: newRules });
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newRules = localSettings.pointRules.filter((_, i) => i !== index);
                                            setLocalSettings({ ...localSettings, pointRules: newRules });
                                        }}
                                        className="p-2 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                setLocalSettings({
                                    ...localSettings,
                                    pointRules: [...localSettings.pointRules, {
                                        id: crypto.randomUUID(),
                                        name: 'Nueva Regla',
                                        type: 'fixed',
                                        value: 10,
                                        description: 'Descripción de la regla'
                                    }]
                                });
                            }}
                            className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                        >
                            <Plus size={16} />
                            Agregar Nueva Regla
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'rewards' && (
                <div className="space-y-6">
                    <div className="bg-card p-6 rounded-xl border shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">{editingRewardId ? 'Editar Recompensa' : 'Catálogo de Recompensas'}</h3>
                            {editingRewardId && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="text-sm bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1 rounded-md transition-colors"
                                >
                                    Cancelar Edición
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">Agrega, edita o elimina los productos disponibles para canje.</p>

                        {/* Add Reward Form */}
                        <form onSubmit={handleAddReward} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg mb-6 grid gap-4 md:grid-cols-2 items-end">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre del Producto</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Ej: Router Wi-Fi"
                                    value={newReward.name}
                                    onChange={e => setNewReward({ ...newReward, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Costo en Puntos</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Ej: 1500"
                                    value={newReward.pointsCost || ''}
                                    onChange={e => setNewReward({ ...newReward, pointsCost: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Descripción</label>
                                <input
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Breve descripción del producto"
                                    value={newReward.description}
                                    onChange={e => setNewReward({ ...newReward, description: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Imagen del Producto</label>

                                {selectedImageFile ? (
                                    <div className="flex items-center justify-between p-3 border rounded-md bg-white dark:bg-slate-950">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                                                <img src={URL.createObjectURL(selectedImageFile)} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-sm truncate font-medium">{selectedImageFile.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedImageFile(null)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                className="w-full pl-3 pr-10 py-2 border rounded-md"
                                                placeholder="https://ejemplo.com/imagen.jpg o sube un archivo ➡️"
                                                value={newReward.image}
                                                onChange={e => setNewReward({ ...newReward, image: e.target.value })}
                                            />
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                id="reward-image-upload"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files.length > 0) {
                                                        setSelectedImageFile(e.target.files[0]);
                                                        // Limpiamos la URL manual si selecciona archivo
                                                        setNewReward({ ...newReward, image: '' });
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor="reward-image-upload"
                                                className="flex items-center justify-center h-full px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md cursor-pointer transition-colors border border-transparent shadow-sm"
                                                title="Subir imagen desde mi PC"
                                            >
                                                <ImageIcon size={18} />
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-md hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                >
                                    {isUploading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <><Plus size={18} /> {editingRewardId ? 'Guardar Cambios' : 'Agregar Recompensa'}</>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="grid gap-4 md:grid-cols-2">
                            {rewards.map(reward => (
                                <div key={reward.id} className="flex gap-4 p-4 border rounded-lg items-center bg-card">
                                    <div className="h-16 w-16 bg-white dark:bg-slate-900 border rounded-md overflow-hidden flex-shrink-0 p-1 flex items-center justify-center">
                                        <img src={reward.image} alt={reward.name} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate">{reward.name}</h4>
                                        <p className="text-sm text-primary font-bold">{reward.pointsCost} pts</p>
                                        <p className="text-xs text-muted-foreground truncate">{reward.description}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEditRewardClick(reward)}
                                            className="p-2 text-muted-foreground hover:text-blue-500 transition-colors"
                                            title="Editar Recompensa"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('¿Eliminar esta recompensa?')) deleteReward(reward.id);
                                            }}
                                            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                                            title="Eliminar Recompensa"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'integrations' && (
                <div className="space-y-6">
                    <div className="bg-card p-6 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Server className="h-6 w-6 text-blue-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">MikroTik RouterOS</h3>
                                <p className="text-muted-foreground">Conecta tu router para sincronizar clientes y cortes.</p>
                            </div>
                            <div className="ml-auto">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={localSettings.integrations.mikrotik.enabled}
                                        onChange={(e) => setLocalSettings({
                                            ...localSettings,
                                            integrations: {
                                                ...localSettings.integrations,
                                                mikrotik: { ...localSettings.integrations.mikrotik, enabled: e.target.checked }
                                            }
                                        })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        {localSettings.integrations.mikrotik.enabled && (
                            <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Dirección IP / Host</label>
                                    <input
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="192.168.88.1"
                                        value={localSettings.integrations.mikrotik.ip}
                                        onChange={(e) => setLocalSettings({
                                            ...localSettings,
                                            integrations: {
                                                ...localSettings.integrations,
                                                mikrotik: { ...localSettings.integrations.mikrotik, ip: e.target.value }
                                            }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Usuario API</label>
                                    <input
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="admin"
                                        value={localSettings.integrations.mikrotik.user}
                                        onChange={(e) => setLocalSettings({
                                            ...localSettings,
                                            integrations: {
                                                ...localSettings.integrations,
                                                mikrotik: { ...localSettings.integrations.mikrotik, user: e.target.value }
                                            }
                                        })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
                                        Nota: Para esta demo, la integración es simulada. En producción, esto conectaría al API de MikroTik.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Nueva sección de API Keys */}
                    <div className="bg-card p-6 rounded-xl border shadow-sm mt-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Key className="h-6 w-6 text-purple-700 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Claves de API Externas</h3>
                                <p className="text-muted-foreground">Genera tokens para conectar un Chatbot (ej: WhatsApp) u otras aplicaciones.</p>
                            </div>
                            <div className="ml-auto">
                                <button
                                    onClick={generateApiKey}
                                    className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/50 dark:hover:bg-purple-800/50 dark:text-purple-300 font-medium rounded-md flex items-center gap-2 transition-colors"
                                >
                                    <Plus size={16} />
                                    Generar API Key
                                </button>
                            </div>
                        </div>

                        {(!localSettings.apiKeys || localSettings.apiKeys.length === 0) ? (
                            <div className="text-center py-8 text-muted-foreground bg-slate-50 dark:bg-slate-900/50 border border-dashed rounded-lg">
                                No tienes ninguna API Key generada.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {localSettings.apiKeys.map((apiKey, index) => (
                                    <div key={apiKey.id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50 relative group items-start md:items-center">
                                        <div className="flex-1 w-full min-w-0">
                                            <input
                                                className="bg-transparent font-medium focus:outline-none border-b border-transparent focus:border-primary w-full md:w-1/2 mb-2 text-foreground"
                                                value={apiKey.name}
                                                onChange={(e) => {
                                                    const newKeys = [...localSettings.apiKeys];
                                                    newKeys[index].name = e.target.value;
                                                    setLocalSettings({ ...localSettings, apiKeys: newKeys });
                                                }}
                                                placeholder="Nombre de la integración (ej: Chatbot IA)"
                                            />
                                            <div className="flex items-center gap-2 mt-1">
                                                <code className="text-xs font-mono bg-white dark:bg-slate-950 px-3 py-1.5 rounded border text-muted-foreground flex-1 truncate select-all">
                                                    {apiKey.key}
                                                </code>
                                                <button
                                                    onClick={() => handleCopyKey(apiKey.key)}
                                                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0 bg-white dark:bg-slate-950 border rounded-md"
                                                    title="Copiar API Key"
                                                >
                                                    {copiedKey === apiKey.key ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-2">Creado el {new Date(apiKey.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center justify-end shrink-0 mt-2 md:mt-0">
                                            <button
                                                onClick={() => {
                                                    if (confirm('¿Eliminar esta API Key? Cualquier sistema usando esta clave dejará de funcionar inmediatamente.')) {
                                                        const newKeys = localSettings.apiKeys.filter(k => k.id !== apiKey.id);
                                                        setLocalSettings({ ...localSettings, apiKeys: newKeys });
                                                    }
                                                }}
                                                className="p-2 text-muted-foreground hover:text-red-500 transition-colors bg-white dark:bg-slate-950 border rounded-md"
                                                title="Revocar API Key"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-md text-sm border border-blue-100 dark:border-blue-800/50 flex items-start gap-2">
                            <Shield className="h-5 w-5 shrink-0" />
                            <p>Protege estas claves de API como si fueran contraseñas. Nunca las compartas públicamente o en aplicaciones frontend client-side.</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'data' && (
                <div className="space-y-6">
                    <div className="bg-card p-6 rounded-xl border shadow-sm">
                        <h3 className="font-semibold text-lg mb-4">Importar / Exportar Datos</h3>
                        <p className="text-sm text-muted-foreground mb-6">Gestiona la base de datos de tus clientes.</p>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Import Section */}
                            <div className="p-6 border rounded-lg bg-slate-50 dark:bg-slate-900">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Upload className="h-5 w-5 text-blue-700" />
                                    </div>
                                    <h4 className="font-medium">Importar Clientes</h4>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Sube un archivo JSON con la lista de clientes.
                                </p>
                                <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                try {
                                                    const json = JSON.parse(event.target?.result as string);
                                                    if (Array.isArray(json)) {
                                                        importCustomers(json);
                                                        toast.success(`Se importaron ${json.length} clientes exitosamente.`);
                                                    } else {
                                                        toast.error('El archivo no tiene el formato correcto (debe ser un array).');
                                                    }
                                                } catch (error) {
                                                    toast.error('Error al leer el archivo JSON.');
                                                }
                                            };
                                            reader.readAsText(file);
                                        }
                                    }}
                                />
                                {isSuperAdmin ? (
                                    <button
                                        onClick={() => confirmWithPassword(() => fileInputRef.current?.click())}
                                        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Upload size={18} />
                                        Seleccionar Archivo JSON
                                    </button>
                                ) : (
                                    <div className="w-full py-2 bg-slate-100 text-slate-500 rounded-md flex items-center justify-center gap-2 cursor-not-allowed border">
                                        <Lock size={18} />
                                        Acceso Denegado
                                    </div>
                                )}
                            </div>

                            {/* Export Section */}
                            <div className="p-6 border rounded-lg bg-slate-50 dark:bg-slate-900">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Download className="h-5 w-5 text-green-700" />
                                    </div>
                                    <h4 className="font-medium">Exportar Base de Datos</h4>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Descarga una copia completa de tus clientes y transacciones.
                                </p>
                                <div className="grid gap-2">
                                    {isSuperAdmin ? (
                                        <>
                                            <button
                                                onClick={() => confirmWithPassword(() => {
                                                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customers, null, 2));
                                                    const downloadAnchorNode = document.createElement('a');
                                                    downloadAnchorNode.setAttribute("href", dataStr);
                                                    downloadAnchorNode.setAttribute("download", "clientes_backup.json");
                                                    document.body.appendChild(downloadAnchorNode);
                                                    downloadAnchorNode.click();
                                                    downloadAnchorNode.remove();
                                                })}
                                                className="w-full py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Database size={18} />
                                                Descargar JSON (Backup)
                                            </button>

                                            <button
                                                onClick={() => confirmWithPassword(() => {
                                                    const headers = ['ID', 'Nombre', 'Email', 'Telefono', 'Puntos', 'Nivel', 'Fecha Registro'];
                                                    const rows = customers.map(c => [
                                                        c.id,
                                                        `"${c.name}"`,
                                                        c.email,
                                                        c.phone,
                                                        c.loyaltyPoints,
                                                        c.tier,
                                                        c.joinDate
                                                    ].join(','));

                                                    const csvContent = "data:text/csv;charset=utf-8,"
                                                        + headers.join(',') + "\n"
                                                        + rows.join('\n');

                                                    const encodedUri = encodeURI(csvContent);
                                                    const link = document.createElement("a");
                                                    link.setAttribute("href", encodedUri);
                                                    link.setAttribute("download", "clientes_crm.csv");
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                })}
                                                className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Download size={18} />
                                                Descargar Excel (CSV)
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full py-8 flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-100 rounded-md border h-full">
                                            <Lock size={24} className="mb-1 opacity-50" />
                                            <span className="text-sm font-medium px-4 text-center">Exportación restringida a roles Supremos</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Confirmation Modal for Sensitive Actions */}
            {passwordPrompt.isOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-card p-6 rounded-xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 border border-border">
                        <div className="flex flex-col items-center mb-6 text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <Key size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Autorización Requerida</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Para realizar esta acción crítica, por favor confirma tu contraseña de SuperAdministrador.
                            </p>
                        </div>

                        <form onSubmit={handleVerifyPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    autoFocus
                                    className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono"
                                    placeholder="••••••••"
                                    value={passwordPrompt.passwordInput}
                                    onChange={e => setPasswordPrompt(prev => ({ ...prev, passwordInput: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPasswordPrompt({ isOpen: false, action: null, passwordInput: '', isVerifying: false })}
                                    className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                                    disabled={passwordPrompt.isVerifying}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordPrompt.isVerifying || !passwordPrompt.passwordInput}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2 disabled:opacity-70 transition-colors"
                                >
                                    {passwordPrompt.isVerifying ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        'Confirmar'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
