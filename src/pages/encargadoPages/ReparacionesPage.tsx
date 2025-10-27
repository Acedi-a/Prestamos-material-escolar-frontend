import React, { useEffect, useMemo, useState } from "react";
import { Button, Table, Tag, Typography, message, Tabs, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { completarReparacion, getAllReparaciones, IReparacion } from "../../lib/api/reparaciones";
import { ToolOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { TabPane } = Tabs;

const ReparacionesPage: React.FC = () => {
	const [data, setData] = useState<IReparacion[]>([]);
	const [loading, setLoading] = useState(false);
	const [completing, setCompleting] = useState<Set<number>>(new Set());
	const [searchTerm, setSearchTerm] = useState("");

	const fetchData = async () => {
		try {
			setLoading(true);
			const res = await getAllReparaciones();
			setData(res.data);
		} catch (err) {
			message.error("Error al cargar reparaciones");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const currency = useMemo(() =>
		new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }),
	[]);

	const dateFmt = (iso?: string | null) =>
		iso ? new Date(iso).toLocaleString() : "-";

	const handleCompletar = async (rep: IReparacion) => {
		const nowIso = new Date().toISOString();
		try {
			setCompleting((prev) => new Set(prev).add(rep.id));
			await completarReparacion({ reparacionId: rep.id, fechaRetorno: nowIso });
			// Actualizar estado localmente para evitar refetch completo
			setData((prev) => prev.map((r) => r.id === rep.id ? { ...r, fechaRetorno: nowIso } : r));
			message.success("Reparación completada");
		} catch (e) {
			message.error("No se pudo completar la reparación");
		} finally {
			setCompleting((prev) => { const n = new Set(prev); n.delete(rep.id); return n; });
		}
	};

	const columns: ColumnsType<IReparacion> = [
		{
			title: "ID",
			dataIndex: "id",
			key: "id",
			width: 80,
		},
		{
			title: "Material",
			dataIndex: "material",
			key: "material",
			render: (_: any, rec) => rec.material?.nombreMaterial || `#${rec.materialId}`,
		},
		{
			title: "Falla",
			dataIndex: "descripcionFalla",
			key: "descripcionFalla",
		},
		{
			title: "Cant.",
			dataIndex: "cantidad",
			key: "cantidad",
			width: 90,
		},
		{
			title: "Costo",
			dataIndex: "costo",
			key: "costo",
			render: (v: number) => currency.format(v ?? 0),
		},
		{
			title: "Envío",
			dataIndex: "fechaEnvio",
			key: "fechaEnvio",
			render: (iso: string) => dateFmt(iso),
		},
		{
			title: "Retorno",
			dataIndex: "fechaRetorno",
			key: "fechaRetorno",
			render: (iso?: string | null) => (
				iso ? <Tag color="green">{dateFmt(iso)}</Tag> : <Tag color="orange">En reparación</Tag>
			),
		},
		{
			title: "Acciones",
			key: "acciones",
			render: (_: any, rec) => (
				rec.fechaRetorno ? null : (
					<Button
						type="primary"
						icon={<ToolOutlined />}
						onClick={() => handleCompletar(rec)}
						loading={completing.has(rec.id)}
					>
						Completar
					</Button>
				)
			),
		},
	];

	// Filtrado por búsqueda (material nombre o id)
	const filtered = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		if (!term) return data;
		return data.filter((r) =>
			(r.material?.nombreMaterial || "").toLowerCase().includes(term) || String(r.id).includes(term)
		);
	}, [data, searchTerm]);

	// División por estado
	const enReparacion = useMemo(() => filtered.filter(r => !r.fechaRetorno), [filtered]);
	const historial = useMemo(() => filtered.filter(r => !!r.fechaRetorno), [filtered]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
			{/* Header */}
			<div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-30">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center space-x-3">
							<div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
								<ToolOutlined className="text-2xl text-white" />
							</div>
							<div>
								<h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Reparaciones</h1>
								<p className="text-xs text-gray-500">Controla envíos y retornos de materiales en reparación</p>
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
					{/* Toolbar */}
					<div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
						<div className="flex items-center gap-3">
							<div className="px-3 py-2 bg-orange-50 text-orange-600 text-sm font-medium rounded-lg">En reparación: {enReparacion.length}</div>
							<div className="px-3 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg">Total: {filtered.length}</div>
						</div>
						<div className="flex gap-3 w-full md:w-auto">
							<Input
								allowClear
								prefix={<SearchOutlined />}
								placeholder="Buscar por material o #ID"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="md:w-72"
							/>
							<Button onClick={() => setSearchTerm("")}>Limpiar</Button>
						</div>
					</div>

					<Tabs defaultActiveKey="1">
						<TabPane tab={`En reparación (${enReparacion.length})`} key="1">
							<Table<IReparacion>
								rowKey="id"
								columns={columns}
								dataSource={enReparacion}
								loading={loading}
							/>
						</TabPane>
						<TabPane tab={`Historial (${historial.length})`} key="2">
							<Table<IReparacion>
								rowKey="id"
								columns={columns}
								dataSource={historial}
								loading={loading}
							/>
						</TabPane>
					</Tabs>
				</div>
			</div>
		</div>
	);
};

export default ReparacionesPage;
