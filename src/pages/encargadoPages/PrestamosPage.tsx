import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal, Table, Tag, Typography, message, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getAllPrestamos, IPrestamo, registrarDevolucion } from "../../lib/api/prestamos";

const { Title } = Typography;

const PrestamosPage: React.FC = () => {
  const [data, setData] = useState<IPrestamo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [selected, setSelected] = useState<IPrestamo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getAllPrestamos();
      setData(res.data);
    } catch (err) {
      message.error("Error al cargar préstamos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dateFmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "-");

  const openModal = (row: IPrestamo) => {
    setSelected(row);
    setObservaciones("");
    setModalOpen(true);
  };

  const handleRegistrar = async () => {
    if (!selected) return;
    if (!observaciones.trim()) {
      message.warning("Ingresa observaciones");
      return;
    }
    try {
      setSubmitting(true);
      await registrarDevolucion({ prestamoId: selected.id, observaciones: observaciones.trim() });
      message.success("Devolución registrada");
      setModalOpen(false);
      setSelected(null);
      // Refrescar datos, ya que el backend cambia el estado
      fetchData();
    } catch (e) {
      message.error("No se pudo registrar la devolución");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<IPrestamo> = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Solicitud", dataIndex: "solicitudId", key: "solicitudId", width: 110 },
    { title: "Préstamo", dataIndex: "fechaPrestamo", key: "fechaPrestamo", render: (iso: string) => dateFmt(iso) },
    { title: "Devolución Prev.", dataIndex: "fechaDevolucionPrevista", key: "fechaDevolucionPrevista", render: (iso: string) => dateFmt(iso) },
    { title: "Estado", dataIndex: "estadoPrestamo", key: "estadoPrestamo", render: (v: string) => (
      <Tag color={v === "Activo" ? "blue" : "green"}>{v}</Tag>
    ) },
    {
      title: "Acciones",
      key: "acciones",
      render: (_: any, rec) => (
        rec.estadoPrestamo === "Activo" ? (
          <Button type="primary" onClick={() => openModal(rec)}>Registrar devolución</Button>
        ) : null
      )
    }
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>Préstamos</Title>
      <Table<IPrestamo>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
      />

      <Modal
        title={`Registrar devolución ${selected ? `(#${selected.id})` : ""}`}
        open={modalOpen}
        onCancel={() => { if (!submitting) setModalOpen(false); }}
        onOk={handleRegistrar}
        okText={submitting ? "Registrando..." : "Registrar"}
        okButtonProps={{ loading: submitting }}
      >
        <div className="space-y-2">
          <label className="block text-sm">Observaciones</label>
          <Input.TextArea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={4}
            placeholder="Escribe observaciones de la devolución"
          />
        </div>
      </Modal>
    </div>
  );
};

export default PrestamosPage;
