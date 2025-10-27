import React, { useEffect, useMemo, useState } from "react";
import { Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getAllMovimientos, IMovimiento } from "../../lib/api/movimientos";

const { Title } = Typography;

const MovimientosPage: React.FC = () => {
	const [data, setData] = useState<IMovimiento[]>([]);
	const [loading, setLoading] = useState(false);

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
			render: (tipo: string) => <Tag color="blue">{tipo}</Tag>,
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
		<div>
			<Title level={3} style={{ marginBottom: 16 }}>Movimientos</Title>
			<Table<IMovimiento>
				rowKey="id"
				columns={columns}
				dataSource={data}
				loading={loading}
			/>
		</div>
	);
};

export default MovimientosPage;
