import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { useCustomers } from '../context/CustomerContext';
import { useNotifications } from '../context/NotificationContext';
import { 
    Camera, 
    Award, 
    PlusCircle, 
    CheckCircle2, 
    X, 
    AlertCircle, 
    History,
    Gift,
    Hash,
    RefreshCw,
    Power,
    Maximize2,
    CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export function Scanner() {
    const { customers, addTransaction, redeemReward, rewards } = useCustomers();
    const { addNotification } = useNotifications();
    
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const [identifiedCustomer, setIdentifiedCustomer] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [pointsToAdd, setPointsToAdd] = useState('0');
    const [reason, setReason] = useState('Venta de Servicio');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Manual Camera State
    const [isScanning, setIsScanning] = useState(false);
    const [cameras, setCameras] = useState<any[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
    const [isStartingCamera, setIsStartingCamera] = useState(false);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    // Load available cameras
    useEffect(() => {
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length > 0) {
                setCameras(devices);
                setSelectedCameraId(devices[0].id);
            }
        }).catch(err => {
            console.error("No se pudieron obtener las cámaras", err);
        });

        // Cleanup on unmount
        return () => {
            if (html5QrCodeRef.current && isScanning) {
                html5QrCodeRef.current.stop().catch(err => console.error("Error stopping scanner on unmount", err));
            }
        };
    }, [isScanning]);

    const startScanning = async () => {
        setIsStartingCamera(true);
        setError(null);
        
        try {
            // Ensure any previous instance is stopped
            if (html5QrCodeRef.current) {
                try { await html5QrCodeRef.current.stop(); } catch (e) {}
            }

            const html5QrCode = new Html5Qrcode("reader");
            html5QrCodeRef.current = html5QrCode;

            const qrConfig = {
                fps: 15, // Higher FPS for smoother scanning
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            };

            // If we have a selected ID, use it, otherwise use facingMode as fallback
            const cameraConfig = selectedCameraId ? { deviceId: { exact: selectedCameraId } } : { facingMode: "environment" };

            await html5QrCode.start(
                cameraConfig,
                qrConfig,
                (decodedText) => {
                    onScanSuccess(decodedText);
                },
                (errorMessage) => {
                    // Constant failures are normal during search
                }
            );

            setIsScanning(true);
            setIsStartingCamera(false);
            toast.success("Escaner Activo");
        } catch (err: any) {
            console.error("Error starting camera", err);
            let userMessage = "Error al iniciar la cámara.";
            if (err?.message?.includes("NotAllowedError")) userMessage = "Permiso de cámara denegado.";
            if (err?.message?.includes("NotFoundError")) userMessage = "No se encontró ninguna cámara.";
            
            setError(userMessage);
            toast.error(userMessage);
            setIsStartingCamera(false);
            setIsScanning(false);
        }
    };

    const stopScanning = async () => {
        if (html5QrCodeRef.current && isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current = null;
                setIsScanning(false);
                toast.success("Cámara desconectada");
            } catch (err) {
                console.error("Error stopping camera", err);
                // Force state reset even if stop fails
                setIsScanning(false);
                html5QrCodeRef.current = null;
            }
        }
    };

    const switchCamera = async () => {
        if (cameras.length < 2) return;
        
        await stopScanning();
        const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;
        setSelectedCameraId(cameras[nextIndex].id);
        
        // Auto restart with new camera
        setTimeout(() => startScanning(), 500);
    };

    function onScanSuccess(decodedText: string) {
        setScannedResult(decodedText);
        const customer = customers.find(c => 
            c.referralCode === decodedText || 
            (c.email && c.email.split('@')[0].toUpperCase() === decodedText)
        );

        if (customer) {
            setIdentifiedCustomer(customer);
            setShowModal(true);
            setError(null);
            toast.success(`Cliente Identificado: ${customer.name}`);
            addNotification({ message: `Escaneo exitoso: ${customer.name} identificado.`, type: 'success' });
            if (window.navigator.vibrate) window.navigator.vibrate(100);
            
            // Auto stop scanning on success to focus on modal
            stopScanning();
        } else {
            setError(`Código no reconocido: ${decodedText}`);
            toast.error("Código no reconocido");
        }
    }

    function onScanFailure(error: any) {
        // Quiet failure to avoid flooding
    }

    const handleAddPoints = async () => {
        if (!identifiedCustomer || isProcessing) return;
        const pts = parseInt(pointsToAdd);
        if (isNaN(pts) || pts <= 0) {
            toast.error("Por favor ingrese un monto válido de puntos.");
            return;
        }
        setIsProcessing(true);
        try {
            await addTransaction(identifiedCustomer.id, pts, reason);
            toast.success(`+${pts} puntos añadidos a ${identifiedCustomer.name}`);
            setShowModal(false);
            setPointsToAdd('0');
            setReason('Venta de Servicio');
        } catch (err) {
            toast.error("Error al procesar los puntos.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleQuickRedeem = async (reward: any) => {
        if (!identifiedCustomer || isProcessing) return;
        if (identifiedCustomer.loyaltyPoints < reward.pointsCost) {
            toast.error("Puntos insuficientes para este premio.");
            return;
        }
        setIsProcessing(true);
        try {
            const success = await redeemReward(identifiedCustomer.id, reward.id, reward.pointsCost, reward.name);
            if (success) {
                toast.success(`¡Canje de ${reward.name} exitoso!`);
                setShowModal(false);
            } else {
                toast.error("No se pudo completar el canje.");
            }
        } catch (err) {
            toast.error("Error en la conexión.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Escáner de Operadores
                    </h2>
                    <p className="text-muted-foreground mt-1">Identificación instantánea para carga de puntos y canjes.</p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Left Side: Scanner View */}
                <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-2xl relative group">
                    <div className="p-5 bg-muted/30 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                            <span className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Visor en Tiempo Real</span>
                        </div>
                        {isScanning && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Cámara Activa</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-8 flex flex-col items-center justify-center min-h-[500px] relative bg-slate-900/10">
                        {/* CAMERA WRAPPER */}
                        <div className="relative w-full max-w-[400px] aspect-square rounded-[3rem] overflow-hidden bg-background shadow-inner border-4 border-muted/20">
                            {/* THE SCANNER DOM ELEMENT - Keep it clean for the library */}
                            <div id="reader" className="w-full h-full"></div>

                            {/* OVERLAY UI (React Managed) */}
                            {!isScanning && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10 bg-background/80 backdrop-blur-sm transition-all duration-500">
                                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                        <Camera className="w-8 h-8 text-primary/40" />
                                    </div>
                                    <h4 className="text-sm font-black text-foreground uppercase tracking-widest mb-2">Cámara Lista</h4>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[180px]">
                                        Presione el botón de abajo para activar el lente.
                                    </p>
                                </div>
                            )}

                            {/* SCANNING RADAR ANIMATION */}
                            {isScanning && (
                                <div className="absolute inset-0 pointer-events-none z-20">
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scanner-line shadow-[0_0_20px_rgba(var(--primary),0.8)]"></div>
                                    {/* Frame Accents */}
                                    <div className="absolute inset-10 border-2 border-primary/20 rounded-3xl"></div>
                                    <div className="absolute top-10 left-10 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl"></div>
                                    <div className="absolute top-10 right-10 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl"></div>
                                    <div className="absolute bottom-10 left-10 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl"></div>
                                    <div className="absolute bottom-10 right-10 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl"></div>
                                </div>
                            )}

                            {/* LOADING STATE */}
                            {isStartingCamera && (
                                <div className="absolute inset-0 z-30 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center">
                                    <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-tighter animate-pulse">Iniciando Sensor...</p>
                                </div>
                            )}
                        </div>

                        {/* CUSTOM CONTROLS */}
                        <div className="mt-8 flex items-center justify-center w-full max-w-[400px]">
                            {!isScanning ? (
                                <button
                                    onClick={startScanning}
                                    disabled={isStartingCamera}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70 text-sm uppercase tracking-widest"
                                >
                                    <Power className="w-5 h-5" />
                                    {isStartingCamera ? 'CARGANDO...' : 'ENCENDER CÁMARA'}
                                </button>
                            ) : (
                                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
                                    <button
                                        onClick={stopScanning}
                                        className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 text-sm uppercase tracking-widest"
                                    >
                                        <X className="w-5 h-5" /> APAGAR
                                    </button>
                                    
                                    {cameras.length > 1 && (
                                        <button
                                            onClick={switchCamera}
                                            className="p-4 bg-white dark:bg-slate-800 text-foreground rounded-2xl font-black shadow-xl border border-border transition-all active:scale-95 hover:bg-muted"
                                            title="Cambiar Cámara"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Instructions & Info */}
                <div className="space-y-8 flex flex-col">
                    <div className="bg-card p-10 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        
                        <h3 className="font-black text-sm uppercase tracking-[0.2em] text-primary mb-8 border-b border-primary/10 pb-4">
                            Pasos de Operación
                        </h3>
                        
                        <ul className="space-y-6">
                            {[
                                { num: '1', title: 'Activar Dispositivo', desc: 'Pulsa el botón "Encender Cámara" y permite el acceso al navegador.' },
                                { num: '2', title: 'Escaneo de Código', desc: 'Apunta la cámara hacia el código QR que el cliente tiene en su APP.' },
                                { num: '3', title: 'Validación Automática', desc: 'El sistema abrirá el formulario de carga de puntos en cuanto identifique al cliente.' }
                            ].map((step, i) => (
                                <li key={i} className="flex gap-5 group">
                                    <div className="h-10 w-10 rounded-2xl bg-muted text-primary flex items-center justify-center text-sm font-black shrink-0 transition-colors group-hover:bg-primary group-hover:text-white">
                                        {step.num}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-foreground mb-1">{step.title}</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* MOCK SCAN BUTTON FOR TESTING */}
                        <div className="mt-12 pt-8 border-t border-border/50">
                            <button 
                                onClick={() => {
                                    if (customers.length > 0) {
                                        onScanSuccess(customers[0].referralCode || customers[0].id);
                                    } else {
                                        toast.error("No hay clientes en la base de datos para probar.");
                                    }
                                }}
                                className="w-full py-4 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Simular Escaneo (Entorno de Prueba)
                            </button>
                            <p className="text-[9px] text-center text-muted-foreground mt-4 font-bold opacity-60">Uso exclusivo para verificaciones de interfaz sin cámara activa.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="p-2 bg-red-500 rounded-xl text-white">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wider leading-none mb-2">Error de Identificación</p>
                                <p className="text-xs text-red-600/80 dark:text-red-400/80">{error}</p>
                            </div>
                        </div>
                    )}

                    {scannedResult && !error && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="p-2 bg-emerald-500 rounded-xl text-white">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider leading-none mb-2">Último Código Leído</p>
                                <p className="text-xs font-mono text-emerald-600/80 dark:text-emerald-400/80 break-all">{scannedResult}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CUSTOMER IDENTIFICATION MODAL (THE POP-UP) */}
            {showModal && identifiedCustomer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    ></div>
                    
                    {/* Modal Content */}
                    <div className="relative w-full max-w-2xl bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header Image/Pattern */}
                        <div className="h-32 bg-gradient-to-r from-emerald-600 to-emerald-400 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,white,transparent)]"></div>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="absolute -bottom-8 left-8 h-24 w-24 rounded-2xl bg-card border-4 border-card flex items-center justify-center text-4xl font-black text-emerald-500 shadow-xl">
                                {identifiedCustomer.name.charAt(0)}
                            </div>
                        </div>

                        <div className="pt-12 p-8 space-y-8 overflow-y-auto max-h-[75vh]">
                            {/* Profile Info */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-foreground tracking-tight">{identifiedCustomer.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                                            identifiedCustomer.tier === 'Gold' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                            identifiedCustomer.tier === 'Silver' ? 'bg-slate-400/10 text-slate-400 border-slate-400/20' :
                                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        }`}>
                                            {identifiedCustomer.tier}
                                        </div>
                                        <p className="text-xs font-medium text-muted-foreground">{identifiedCustomer.email}</p>
                                    </div>
                                </div>
                                <div className="text-left md:text-right p-4 bg-muted/50 rounded-2xl min-w-[160px] border border-border">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Saldo Disponible</p>
                                    <div className="flex items-baseline md:justify-end gap-1">
                                        <p className="text-3xl font-black text-emerald-500">{identifiedCustomer.loyaltyPoints}</p>
                                        <span className="text-[10px] font-black text-muted-foreground">PTS</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Tabs Section */}
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Add Points Form */}
                                <div className="bg-muted/30 p-6 rounded-[2rem] border border-border/50 relative overflow-hidden group">
                                    <h4 className="font-black flex items-center gap-2 mb-6 text-[10px] uppercase tracking-widest text-emerald-600">
                                        <PlusCircle className="w-4 h-4" />
                                        Carga de Puntos
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1 tracking-widest">Monto a Cargar</label>
                                            <div className="relative mt-1">
                                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <input 
                                                    type="number"
                                                    value={pointsToAdd}
                                                    onChange={(e) => setPointsToAdd(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-2xl font-black text-foreground focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1 tracking-widest">Motivo</label>
                                            <select 
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                className="w-full mt-1 px-4 py-3 bg-background border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                            >
                                                <option value="Venta de Servicio">Venta de Servicio</option>
                                                <option value="Compra de Equipo">Compra de Equipo</option>
                                                <option value="Visita Técnica">Visita Técnica</option>
                                                <option value="Bonificación Especial">Bonificación Especial</option>
                                                <option value="Corrección de Saldo">Corrección de Saldo</option>
                                            </select>
                                        </div>
                                        <button 
                                            onClick={handleAddPoints}
                                            disabled={isProcessing}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest"
                                        >
                                            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : "CARGAR PUNTOS"}
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Redeem */}
                                <div className="bg-muted/30 p-6 rounded-[2rem] border border-border/50 flex flex-col relative overflow-hidden group">
                                    <h4 className="font-black flex items-center gap-2 mb-6 text-[10px] uppercase tracking-widest text-emerald-600">
                                        <Gift className="w-4 h-4" />
                                        Canjes de Premios
                                    </h4>
                                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[240px] pr-2 custom-scrollbar">
                                        {rewards.filter(r => r.pointsCost <= (identifiedCustomer.loyaltyPoints + 100)).length > 0 ? (
                                            rewards.map(reward => (
                                                <div 
                                                    key={reward.id} 
                                                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                                                        identifiedCustomer.loyaltyPoints >= reward.pointsCost 
                                                        ? 'bg-card border-border hover:border-emerald-500/30' 
                                                        : 'bg-background/50 border-transparent opacity-40 grayscale'
                                                    }`}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-black truncate text-foreground">{reward.name}</p>
                                                        <p className="text-[10px] font-black text-emerald-500 mt-0.5">{reward.pointsCost} PTS</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleQuickRedeem(reward)}
                                                        disabled={isProcessing || identifiedCustomer.loyaltyPoints < reward.pointsCost}
                                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black hover:bg-emerald-700 disabled:opacity-0 transition-all uppercase tracking-widest"
                                                    >
                                                        CANJEAR
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-background/50 rounded-2xl border border-dashed border-border">
                                                <Gift className="w-8 h-8 text-muted-foreground/30 mb-2" />
                                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Sin canjes cercanos</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Activity */}
                            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground">
                                <div className="flex items-center gap-2 text-[10px] font-bold">
                                    <History className="w-4 h-4 text-emerald-500" />
                                    <span>Última actividad registrada hoy</span>
                                </div>
                                <button className="text-[9px] font-black uppercase tracking-widest hover:text-primary transition-all border-b border-transparent hover:border-primary pb-0.5">
                                    Ficha de Cliente Completa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scanner-line {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                }
                .animate-scanner-line {
                    animation: scanner-line 3s infinite linear;
                    position: absolute;
                }
            ` }} />
        </div>
    );
}
