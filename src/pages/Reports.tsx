import { useState, useMemo } from 'react';
import { useCustomers } from '../context/CustomerContext';
import { Download, FileText, Filter, TrendingUp, Award, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export function Reports() {
    const { customers } = useCustomers();
    const [dateRange, setDateRange] = useState<'all' | 'thisMonth' | 'lastMonth' | 'last30Days' | 'last45Days' | 'last90Days' | 'custom'>('last30Days');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    // Fechas auxiliares
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const getDaysAgo = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const filterByDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (dateRange === 'thisMonth') return d >= startOfThisMonth;
        if (dateRange === 'lastMonth') return d >= startOfLastMonth && d <= endOfLastMonth;
        if (dateRange === 'last30Days') return d >= getDaysAgo(30);
        if (dateRange === 'last45Days') return d >= getDaysAgo(45);
        if (dateRange === 'last90Days') return d >= getDaysAgo(90);
        if (dateRange === 'custom') {
            if (!customStartDate && !customEndDate) return true;
            const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : new Date('2000-01-01');
            const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date();
            return d >= start && d <= end;
        }
        return true; // all
    };

    const filteredCustomers = customers.filter(c => filterByDate(c.joinDate));

    // Todas las transacciones filtradas
    const filteredTransactions = customers.flatMap(c =>
        c.transactions.filter(t => filterByDate(t.date)).map(t => ({ ...t, customerName: c.name }))
    );

    // Métricas Financieras / Resumen
    const totalPointsAwarded = filteredTransactions.filter(t => t.pointsEarned > 0).reduce((acc, t) => acc + t.pointsEarned, 0);
    const totalPointsRedeemed = filteredTransactions.filter(t => t.pointsEarned < 0).reduce((acc, t) => acc + Math.abs(t.pointsEarned), 0);

    // Valor estimado en moneda local (Ej: 1 punto = $0.1)
    const pointsValueRate = 0.1;
    const estimatedValueAwarded = totalPointsAwarded * pointsValueRate;
    const estimatedValueRedeemed = totalPointsRedeemed * pointsValueRate;

    // Generar sufijo de nombre de archivo legible
    const getExportFileNameSuffix = () => {
        if (dateRange === 'thisMonth') return 'Este_Mes';
        if (dateRange === 'lastMonth') return 'Mes_Pasado';
        if (dateRange === 'last30Days') return 'Ultimos_30_Dias';
        if (dateRange === 'last45Days') return 'Ultimos_45_Dias';
        if (dateRange === 'last90Days') return 'Ultimos_90_Dias';
        if (dateRange === 'custom') return `Personalizado_${customStartDate}_al_${customEndDate}`;
        return 'Historico_Completo';
    };

    // Gráfico de Barras: Altas por Mes (Solo útil si se ve "all", pero lo parametrizamos)
    const signupsByMonth = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredCustomers.forEach(c => {
            const date = new Date(c.joinDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({ date, Clientes: count }));
    }, [filteredCustomers]);

    // Data para Exportación
    const exportToExcel = async () => {
        try {
            const workbook = new ExcelJS.Workbook();

            // --- Sheet 1: Clientes ---
            const wsClientes = workbook.addWorksheet('Resumen Clientes');

            wsClientes.columns = [
                { header: 'ID', key: 'id', width: 36 },
                { header: 'Nombre', key: 'nombre', width: 25 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Teléfono', key: 'telefono', width: 15 },
                { header: 'Puntos Actuales', key: 'puntos', width: 15 },
                { header: 'Nivel', key: 'nivel', width: 12 },
                { header: 'Estado', key: 'estado', width: 10 },
                { header: 'Fecha Registro', key: 'fechaR', width: 15 },
            ];

            // Título Principal (Fila 1)
            wsClientes.spliceRows(1, 0, []); // Asegurarnos de empujar los headers abajo
            wsClientes.mergeCells('A1:H1');
            const titleCell = wsClientes.getCell('A1');
            titleCell.value = 'Resumen de Clientes del Programa de Fidelización';
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800080' } }; // Morado
            titleCell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

            // Encabezados de Tabla (Ahora Fila 2)
            const headerRow = wsClientes.getRow(2);
            headerRow.eachCell((cell: ExcelJS.Cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1E3F' } }; // Azul oscuro/Slate
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            // Datos
            filteredCustomers.forEach((c, index) => {
                const row = wsClientes.addRow({
                    id: c.id,
                    nombre: c.name,
                    email: c.email || 'N/A',
                    telefono: c.phone || 'N/A',
                    puntos: c.loyaltyPoints,
                    nivel: c.tier,
                    estado: c.status,
                    fechaR: new Date(c.joinDate).toLocaleDateString()
                });

                // Alternar colores de filas
                const isEven = index % 2 === 0;
                row.eachCell((cell: ExcelJS.Cell) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    if (!isEven) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; // Gris muy clarito
                    }
                });
            });


            // --- Sheet 2: Transacciones ---
            const wsTransacciones = workbook.addWorksheet('Historial Transacciones');

            wsTransacciones.columns = [
                { header: 'Fecha de operación', key: 'fecha', width: 20 },
                { header: 'Tipo de Transacción', key: 'tipo', width: 25 },
                { header: 'Cliente', key: 'cliente', width: 25 },
                { header: 'Puntos/Monto', key: 'puntos', width: 15 },
                { header: 'Mensaje/Concepto', key: 'desc', width: 40 },
            ];

            // Título Principal
            wsTransacciones.spliceRows(1, 0, []);
            wsTransacciones.mergeCells('A1:E1');
            const titleCell2 = wsTransacciones.getCell('A1');
            titleCell2.value = 'Reporte de Movimientos';
            titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800080' } };
            titleCell2.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
            titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };

            const headerRow2 = wsTransacciones.getRow(2);
            headerRow2.eachCell((cell: ExcelJS.Cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1E3F' } };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            // Datos ordenados
            const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            sortedTransactions.forEach((t, index) => {
                const row = wsTransacciones.addRow({
                    fecha: new Date(t.date).toLocaleString(),
                    tipo: t.pointsEarned > 0 ? 'ACREDITACIÓN' : 'CANJE DE RECOMPENSA',
                    cliente: t.customerName,
                    puntos: t.pointsEarned > 0 ? `+${t.pointsEarned}` : t.pointsEarned,
                    desc: t.description
                });

                // Alternar colores de filas
                const isEven = index % 2 === 0;
                row.eachCell((cell) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    if (!isEven) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
                    }
                });
            });

            const fileNameSuffix = getExportFileNameSuffix();

            // Descargar Archivo ExcelJS
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Reporte_Quantica_${fileNameSuffix}.xlsx`);

            toast.success("Excel con formato institucional exportado correctamente.");
        } catch (e) {
            toast.error("Error al exportar Excel.");
            console.error(e);
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();

            doc.setFontSize(22);
            doc.setTextColor(128, 0, 128); // Morado institucional (#800080)
            doc.text("Reporte Estadístico - Quántica CRM", 14, 22);
            doc.setTextColor(0, 0, 0); // Regresa a negro

            doc.setFontSize(11);

            let dateLabel = 'Todo el tiempo';
            if (dateRange === 'thisMonth') dateLabel = 'Este Mes';
            else if (dateRange === 'lastMonth') dateLabel = 'Mes Pasado';
            else if (dateRange === 'last30Days') dateLabel = 'Últimos 30 Días';
            else if (dateRange === 'last45Days') dateLabel = 'Últimos 45 Días';
            else if (dateRange === 'last90Days') dateLabel = 'Últimos 90 Días';
            else if (dateRange === 'custom') dateLabel = `Del ${customStartDate} al ${customEndDate}`;

            doc.text(`Rango de Fechas: ${dateLabel}`, 14, 30);
            doc.text(`Total Puntos Otorgados: ${totalPointsAwarded} (Est. $${estimatedValueAwarded.toFixed(2)})`, 14, 38);
            doc.text(`Total Puntos Canjeados: ${totalPointsRedeemed} (Est. $${estimatedValueRedeemed.toFixed(2)})`, 14, 46);

            const tableRows = filteredCustomers.map(c => [
                c.name, c.tier, c.loyaltyPoints.toString(), new Date(c.joinDate).toLocaleDateString()
            ]);

            autoTable(doc, {
                startY: 55,
                head: [['Cliente', 'Nivel', 'Puntos', 'Fecha de Registro']],
                body: tableRows,
                headStyles: {
                    fillColor: [30, 30, 63], // Azul oscuro/Slate (#1E1E3F)
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                bodyStyles: {
                    halign: 'center'
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251] // Gris muy clarito (#F9FAFB)
                },
                styles: {
                    cellPadding: 5,
                    fontSize: 10,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.1,
                },
                theme: 'grid'
            });

            const pdfSuffix = getExportFileNameSuffix();
            doc.save(`Reporte_CRM_${pdfSuffix}.pdf`);
            toast.success("PDF exportado correctamente.");
        } catch (e) {
            toast.error("Error al exportar PDF.");
            console.error(e);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reportes de Lealtad</h2>
                    <p className="text-muted-foreground">Analítica detallada y exportación de datos.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={exportToPDF}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <FileText size={18} />
                        Exportar PDF
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="bg-secondary text-secondary-foreground border border-border px-4 py-2 rounded-md flex items-center gap-2 hover:bg-secondary/80 transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        Exportar Excel
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Filter className="text-muted-foreground h-5 w-5" />
                    <span className="font-medium text-sm">Rango de Fecha:</span>
                    <select
                        className="px-3 py-1.5 border rounded-md bg-transparent focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as any)}
                    >
                        <option value="last30Days">Últimos 30 días</option>
                        <option value="last45Days">Últimos 45 días</option>
                        <option value="last90Days">Últimos 90 días</option>
                        <option value="thisMonth">Este Mes</option>
                        <option value="lastMonth">Mes Pasado</option>
                        <option value="all">Todo el Histórico</option>
                        <option value="custom">Personalizado (Fechas exactas)</option>
                    </select>
                </div>

                {dateRange === 'custom' && (
                    <div className="flex items-center gap-2 border-l border-border pl-4 ml-2 animate-in fade-in slide-in-from-left-2">
                        <input
                            type="date"
                            className="text-sm px-2 py-1.5 border rounded bg-transparent"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                        <span className="text-sm text-muted-foreground">hasta</span>
                        <input
                            type="date"
                            className="text-sm px-2 py-1.5 border rounded bg-transparent"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-card p-6 rounded-xl border shadow-sm border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Nuevos Clientes</p>
                            <h3 className="text-3xl font-bold mt-2">{filteredCustomers.length}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Users size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-xl border shadow-sm border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Puntos Otorgados (Pasivo)</p>
                            <h3 className="text-3xl font-bold mt-2">{totalPointsAwarded.toLocaleString()}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Est. Costo: ${estimatedValueAwarded.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-xl border shadow-sm border-l-4 border-l-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Puntos Canjeados</p>
                            <h3 className="text-3xl font-bold mt-2">{totalPointsRedeemed.toLocaleString()}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Est. Valor: ${estimatedValueRedeemed.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Award size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col">
                    <h3 className="font-semibold mb-6">Crecimiento de Clientes</h3>
                    <div className="flex-1 min-h-[300px]">
                        {signupsByMonth.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={signupsByMonth} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="currentColor" vertical={false} />
                                    <XAxis dataKey="date" stroke="currentColor" fontSize={12} opacity={0.6} tickLine={false} axisLine={false} />
                                    <YAxis stroke="currentColor" fontSize={12} opacity={0.6} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                                    />
                                    <Bar dataKey="Clientes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                No hay datos de registro en este rango
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-card p-6 rounded-xl border shadow-sm">
                    <h3 className="font-semibold mb-6">Últimas Transacciones</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {filteredTransactions.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">No hay transacciones en este rango.</p>
                        ) : (
                            filteredTransactions
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .slice(0, 10)
                                .map((t) => (
                                    <div key={t.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium text-sm">{t.customerName}</p>
                                            <p className="text-xs text-muted-foreground">{t.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${t.pointsEarned > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {t.pointsEarned > 0 ? '+' : ''}{t.pointsEarned} pts
                                            </p>
                                            <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
