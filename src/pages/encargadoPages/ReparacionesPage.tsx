import React, { useEffect, useMemo, useState } from "react";
import { Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getAllReparaciones, IReparacion } from "../../lib/api/reparaciones";

const { Title } = Typography;

const ReparacionesPage: React.FC = () => {
	const [data, setData] = useState<IReparacion[]>([]);
	const [loading, setLoading] = useState(false);

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
	];

	return (
		<div>
			<Title level={3} style={{ marginBottom: 16 }}>Reparaciones</Title>
			<Table<IReparacion>
				rowKey="id"
				columns={columns}
				dataSource={data}
				loading={loading}
			/>
		</div>
	);
};

export default ReparacionesPage;
