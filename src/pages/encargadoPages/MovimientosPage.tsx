import React, { useEffect, useMemo, useState } from "react";
import { Table, Tag, Typography, message, Input, DatePicker, Button, Card } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getAllMovimientos, IMovimiento } from "../../lib/api/movimientos";
import { SwapOutlined, ReloadOutlined, SearchOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

const { Title } = Typography;

const MovimientosPage: React.FC = () => {
	const [data, setData] = useState<IMovimiento[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);

	const fetchData = async () => {
		try {
			setLoading(true);
			const res = await getAllMovimientos();
			setData(res.data);
		} catch (err) {
			message.error("Error al cargar movimientos");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const dateFmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "-");

	// Filtros
	const filtered = useMemo(() => {
		const s = search.trim().toLowerCase();
		return data.filter((m) => {
			const textMatch = s
				? (m.materialNombre || "").toLowerCase().includes(s)
				  || String(m.id).includes(s)
				  || (m.tipoMovimiento || "").toLowerCase().includes(s)
				  || (m.prestamoId ? String(m.prestamoId).includes(s) : false)
				: true;
			const dateMatch = range
				? (() => {
					if (!m.fechaMovimiento) return false;
					const d = dayjs(m.fechaMovimiento);
					if (!d.isValid()) return false;
					const [start, end] = range;
					return d.isAfter(start.startOf('day')) && d.isBefore(end.endOf('day')) || d.isSame(start, 'day') || d.isSame(end, 'day');
				})()
				: true;
			return textMatch && dateMatch;
		});
	}, [data, search, range]);

	// Métricas
	const total = filtered.length;
	const entradas = useMemo(() => filtered.filter(m => (m.tipoMovimiento || '').toLowerCase() === 'entrada').length, [filtered]);
	const salidas = useMemo(() => filtered.filter(m => (m.tipoMovimiento || '').toLowerCase() === 'salida').length, [filtered]);

	const columns: ColumnsType<IMovimiento> = [
		{
			title: "ID",
			dataIndex: "id",
			key: "id",
			width: 80,
		},
		{
			title: "Material",
			key: "material",
			render: (_: any, rec) => rec.materialNombre || `#${rec.materialId}`,
		},
		{
			title: "Tipo",
			dataIndex: "tipoMovimiento",
			key: "tipoMovimiento",
			render: (tipo: string) => {
				const t = (tipo || '').toLowerCase();
				const color = t === 'entrada' ? 'green' : t === 'salida' ? 'volcano' : 'blue';
				return <Tag color={color}>{tipo}</Tag>;
			},
		},
		{
			title: "Fecha",
			dataIndex: "fechaMovimiento",
			key: "fechaMovimiento",
			render: (iso: string) => dateFmt(iso),
		},
		{
			title: "Cantidad",
			dataIndex: "cantidad",
			key: "cantidad",
			width: 100,
		},
		{
			title: "Préstamo",
			dataIndex: "prestamoId",
			key: "prestamoId",
			render: (v?: number | null) => (v ? `#${v}` : "-")
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
			{/* Header */}
			<div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-30">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center space-x-3">
							<div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
								<SwapOutlined className="text-2xl text-white" />
							</div>
							<div>
								<h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Movimientos</h1>
								<p className="text-xs text-gray-500">Entradas y salidas de materiales</p>
							</div>
						</div>
						<div className="hidden md:flex items-center gap-2">
							<Button icon={<ReloadOutlined />} onClick={fetchData}>Actualizar</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-sm p-6 md:p-8">
					{/* Resumen */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
						<Card>
							<div className="text-sm text-gray-500">Entradas</div>
							<div className="text-2xl font-semibold">{entradas}</div>
						</Card>
						<Card>
							<div className="text-sm text-gray-500">Salidas</div>
							<div className="text-2xl font-semibold">{salidas}</div>
						</Card>
						<Card>
							<div className="text-sm text-gray-500">Total</div>
							<div className="text-2xl font-semibold">{total}</div>
						</Card>
					</div>

					{/* Toolbar */}
					<div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
						<div className="flex items-center gap-3">
							<div className="px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg">Registros: {total}</div>
						</div>
						<div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
							<Input
								allowClear
								prefix={<SearchOutlined />}
								placeholder="Buscar por material, tipo o #ID"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="md:w-80"
							/>
							<DatePicker.RangePicker
								value={range as any}
								onChange={(vals) => setRange(vals as [Dayjs, Dayjs] | null)}
								allowClear
								suffixIcon={<CalendarOutlined />}
								className="w-full md:w-80"
								format="YYYY-MM-DD"
							/>
							<Button onClick={() => { setSearch(""); setRange(null); }}>Limpiar</Button>
						</div>
					</div>

					<Table<IMovimiento>
						rowKey="id"
						columns={columns}
						dataSource={filtered}
						loading={loading}
					/>
				</div>
			</div>
		</div>
	);
};

export default MovimientosPage;
