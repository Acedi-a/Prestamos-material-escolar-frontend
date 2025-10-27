import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal, Table, Tag, Typography, message, Input, Tabs, Card, Space, DatePicker, Divider } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getAllPrestamos, IPrestamo, registrarDevolucion } from "../../lib/api/prestamos";
import { getAllDevoluciones, IDevolucion } from "../../lib/api/devoluciones";
import { getReportePrestamosYDevoluciones, ReportePrestamosDevoluciones } from "../../lib/api/reportes";
import dayjs, { Dayjs } from "dayjs";
import { useAuth } from "../../context/AuthContext";
import { BookOutlined, ReloadOutlined, SearchOutlined, FileTextOutlined } from "@ant-design/icons";

const { Title } = Typography;

const PrestamosPage: React.FC = () => {
  const [data, setData] = useState<IPrestamo[]>([]);
  const [loading, setLoading] = useState(false);
  const [devoluciones, setDevoluciones] = useState<IDevolucion[]>([]);
  const [loadingDevol, setLoadingDevol] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("prestamos");
  const [devolSearch, setDevolSearch] = useState<string>("");
  const [filterPrestamoId, setFilterPrestamoId] = useState<number | null>(null);
  const [prestamoSearch, setPrestamoSearch] = useState<string>("");
  const { user } = useAuth();

  // Reporte
  const [reportOpen, setReportOpen] = useState(false);
  const [reportRange, setReportRange] = useState<[Dayjs, Dayjs] | null>([dayjs().subtract(30, "day"), dayjs()]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reporte, setReporte] = useState<ReportePrestamosDevoluciones | null>(null);
  const [reportTab, setReportTab] = useState<string>("prestamos");
  const [modalOpen, setModalOpen] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [selected, setSelected] = useState<IPrestamo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPrestamos = async () => {
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

  const fetchDevoluciones = async () => {
    try {
      setLoadingDevol(true);
      const res = await getAllDevoluciones();
      setDevoluciones(res.data);
    } catch (err) {
      message.error("Error al cargar devoluciones");
    } finally {
      setLoadingDevol(false);
    }
  };

  useEffect(() => {
    fetchPrestamos();
    fetchDevoluciones();
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
      fetchPrestamos();
      fetchDevoluciones();
    } catch (e) {
      message.error("No se pudo registrar la devolución");
    } finally {
      setSubmitting(false);
    }
  };

  const verDevoluciones = (prestamoId: number) => {
    setFilterPrestamoId(prestamoId);
    setActiveTab("devoluciones");
  };

  // Columnas principales
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
        <Space>
          {rec.estadoPrestamo === "Activo" && (
            <Button type="primary" onClick={() => openModal(rec)}>Registrar devolución</Button>
          )}
          <Button type="link" onClick={() => verDevoluciones(rec.id)}>Ver devoluciones</Button>
        </Space>
      )
    }
  ];

  const devolucionesColumns: ColumnsType<IDevolucion> = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Préstamo", dataIndex: "prestamoId", key: "prestamoId", width: 110, render: (v: number) => `#${v}` },
    { title: "Fecha devolución", dataIndex: "fechaDevolucion", key: "fechaDevolucion", render: (iso: string) => dateFmt(iso) },
    { title: "Observaciones", dataIndex: "observaciones", key: "observaciones" },
  ];

  // Métricas resumen
  const prestamosActivos = useMemo(() => data.filter(d => d.estadoPrestamo === "Activo").length, [data]);
  const prestamosDevueltos = useMemo(() => data.filter(d => d.estadoPrestamo !== "Activo").length, [data]);
  const devolucionesCount = useMemo(() => devoluciones.length, [devoluciones]);

  // Filtro de devoluciones
  const filteredDevoluciones = useMemo(() => {
    let list = devoluciones;
    if (filterPrestamoId != null) {
      list = list.filter(d => d.prestamoId === filterPrestamoId);
    }
    if (devolSearch.trim()) {
      const s = devolSearch.toLowerCase();
      list = list.filter(d => d.observaciones.toLowerCase().includes(s) || String(d.prestamoId).includes(s));
    }
    return list;
  }, [devoluciones, filterPrestamoId, devolSearch]);

  // Helpers de exportación
  const fmtFileDate = (d: Dayjs) => d.format("YYYY-MM-DD_HH-mm");
  const download = (content: Blob, filename: string) => {
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const toCSV = (rows: any[], headers: string[], pick: (r: any) => (string | number | null | undefined)[]) => {
    const escape = (v: any) => {
      if (v == null) return "";
      const s = String(v);
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push(pick(r).map(escape).join(","));
    }
    return lines.join("\n");
  };

  // Filtro de préstamos (búsqueda)
  const filteredPrestamos = useMemo(() => {
    const s = prestamoSearch.trim().toLowerCase();
    if (!s) return data;
    return data.filter(p =>
      String(p.id).includes(s) ||
      String(p.solicitudId).includes(s) ||
      (p.estadoPrestamo || "").toLowerCase().includes(s)
    );
  }, [data, prestamoSearch]);

  const exportReportCSV = () => {
    if (!reporte || !reportRange) return;
    const [d, h] = reportRange;
    const label = `${fmtFileDate(d)}_a_${fmtFileDate(h)}`;

    // Prestamos CSV
    const csvP = toCSV(
      reporte.prestamos,
      ["ID", "Solicitud", "FechaPrestamo", "FechaDevolucionPrevista", "Estado"],
      (r: IPrestamo) => [
        r.id,
        r.solicitudId,
        dateFmt(r.fechaPrestamo),
        dateFmt(r.fechaDevolucionPrevista),
        r.estadoPrestamo,
      ]
    );
    download(new Blob([csvP], { type: "text/csv;charset=utf-8" }), `prestamos_${label}.csv`);

    // Devoluciones CSV
    const csvD = toCSV(
      reporte.devoluciones,
      ["ID", "PrestamoId", "FechaDevolucion", "Observaciones"],
      (r: IDevolucion) => [r.id, r.prestamoId, dateFmt(r.fechaDevolucion), r.observaciones]
    );
    download(new Blob([csvD], { type: "text/csv;charset=utf-8" }), `devoluciones_${label}.csv`);
  };

  const exportReportPDF = () => {
    if (!reporte || !reportRange) return;
    const [d, h] = reportRange;
    const rangeText = `${d.format("YYYY-MM-DD HH:mm")} a ${h.format("YYYY-MM-DD HH:mm")}`;
    const userText = `${user?.nombreUsuario || user?.email || ""} (ID: ${user?.usuarioId ?? "-"})`;

    const style = `
      <style>
        body { font-family: Arial, Helvetica, sans-serif; padding: 24px; }
        h1 { font-size: 20px; margin: 0 0 12px; }
        .muted { color: #666; font-size: 12px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 12px 0 16px; }
        .card { border: 1px solid #eee; border-radius: 8px; padding: 12px; }
        .card .label { font-size: 12px; color: #666; }
        .card .value { font-size: 18px; font-weight: 600; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
        th { background: #f6f6f6; text-align: left; }
        .section { margin-top: 18px; }
      </style>
    `;
    const tablePrestamos = `
      <div class="section">
        <h2>Préstamos</h2>
        <table>
          <thead>
            <tr><th>ID</th><th>Solicitud</th><th>Préstamo</th><th>Dev. Prev.</th><th>Estado</th></tr>
          </thead>
          <tbody>
            ${reporte.prestamos.map(p => `
              <tr>
                <td>${p.id}</td>
                <td>${p.solicitudId}</td>
                <td>${dateFmt(p.fechaPrestamo)}</td>
                <td>${dateFmt(p.fechaDevolucionPrevista)}</td>
                <td>${p.estadoPrestamo}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
    const tableDevoluciones = `
      <div class="section">
        <h2>Devoluciones</h2>
        <table>
          <thead>
            <tr><th>ID</th><th>Préstamo</th><th>Fecha devolución</th><th>Observaciones</th></tr>
          </thead>
          <tbody>
            ${reporte.devoluciones.map(dv => `
              <tr>
                <td>${dv.id}</td>
                <td>#${dv.prestamoId}</td>
                <td>${dateFmt(dv.fechaDevolucion)}</td>
                <td>${(dv.observaciones || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const html = `
      <!doctype html><html><head><meta charset="utf-8" />${style}</head>
      <body>
        <h1>Reporte de Préstamos y Devoluciones</h1>
        <div class="muted">Rango: ${rangeText}</div>
        <div class="muted">Usuario: ${userText}</div>
        <div class="grid">
          <div class="card"><div class="label">Préstamos en rango</div><div class="value">${reporte.prestamos.length}</div></div>
          <div class="card"><div class="label">Devoluciones en rango</div><div class="value">${reporte.devoluciones.length}</div></div>
          <div class="card"><div class="label">Generado</div><div class="value">${new Date().toLocaleString()}</div></div>
        </div>
        ${tablePrestamos}
        ${tableDevoluciones}
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
      </body></html>
    `;

    const w = window.open("", "_blank");
    if (!w) {
      message.warning("Permite las ventanas emergentes para exportar el PDF");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <BookOutlined className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Préstamos y Devoluciones</h1>
                <p className="text-xs text-gray-500">Gestiona préstamos activos, devoluciones y reportes</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Button icon={<ReloadOutlined />} onClick={() => { fetchPrestamos(); fetchDevoluciones(); }}>Actualizar</Button>
              <Button icon={<FileTextOutlined />} onClick={() => setReportOpen(true)}>Reporte</Button>
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
              <div className="text-sm text-gray-500">Préstamos activos</div>
              <div className="text-2xl font-semibold">{prestamosActivos}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Préstamos devueltos</div>
              <div className="text-2xl font-semibold">{prestamosDevueltos}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Total devoluciones</div>
              <div className="text-2xl font-semibold">{devolucionesCount}</div>
            </Card>
          </div>

          {/* Toolbar dependiendo de la pestaña */}
          {activeTab === "prestamos" && (
            <div className="flex items-center gap-3 mb-4">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Buscar préstamo por #ID, #solicitud o estado"
                value={prestamoSearch}
                onChange={(e) => setPrestamoSearch(e.target.value)}
                className="md:w-96"
              />
              {(prestamoSearch) && (
                <Button onClick={() => setPrestamoSearch("")}>Limpiar</Button>
              )}
            </div>
          )}

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "prestamos",
                label: `Préstamos (${filteredPrestamos.length})`,
                children: (
                  <Table<IPrestamo>
                    rowKey="id"
                    columns={columns}
                    dataSource={filteredPrestamos}
                    loading={loading}
                  />
                ),
              },
              {
                key: "devoluciones",
                label: `Devoluciones (${filteredDevoluciones.length})`,
                children: (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Input.Search
                        allowClear
                        placeholder="Buscar por observación o #préstamo"
                        onSearch={setDevolSearch}
                        onChange={(e) => setDevolSearch(e.target.value)}
                        value={devolSearch}
                        style={{ maxWidth: 360 }}
                      />
                      {(filterPrestamoId != null || devolSearch) && (
                        <Button onClick={() => { setFilterPrestamoId(null); setDevolSearch(""); }}>
                          Limpiar filtros
                        </Button>
                      )}
                      {filterPrestamoId != null && (
                        <Tag color="blue">Filtrado por préstamo #{filterPrestamoId}</Tag>
                      )}
                    </div>
                    <Table<IDevolucion>
                      rowKey="id"
                      columns={devolucionesColumns}
                      dataSource={filteredDevoluciones}
                      loading={loadingDevol}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* Modales */}
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

      {/* Reporte Modal */}
      <Modal
        open={reportOpen}
        title="Reporte de Préstamos y Devoluciones"
        onCancel={() => { if (!reportLoading) { setReportOpen(false); setReporte(null); } }}
        footer={null}
        width={900}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <div className="text-sm mb-1">Rango de fechas</div>
              <DatePicker.RangePicker
                showTime
                value={reportRange as any}
                onChange={(val) => setReportRange(val as [Dayjs, Dayjs] | null)}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <div className="text-sm mb-1">Usuario</div>
              <Input value={`${user?.nombreUsuario || user?.email || ""} (ID: ${user?.usuarioId ?? "-"})`} disabled />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="primary"
              loading={reportLoading}
              onClick={async () => {
                if (!reportRange || !user?.usuarioId) {
                  message.warning("Selecciona un rango y asegúrate de tener usuario válido");
                  return;
                }
                const [d, h] = reportRange;
                try {
                  setReportLoading(true);
                  const res = await getReportePrestamosYDevoluciones({
                    desde: d.toISOString(),
                    hasta: h.toISOString(),
                    usuarioId: user.usuarioId,
                  });
                  setReporte(res.data);
                  message.success("Reporte generado");
                } catch (e) {
                  message.error("No se pudo generar el reporte");
                } finally {
                  setReportLoading(false);
                }
              }}
            >
              Generar reporte
            </Button>
            {reporte && (
              <>
                <Button onClick={() => setReporte(null)} disabled={reportLoading}>Limpiar</Button>
                <Button onClick={() => exportReportCSV()} disabled={reportLoading}>Exportar CSV</Button>
                <Button onClick={() => exportReportPDF()} disabled={reportLoading}>Exportar PDF</Button>
              </>
            )}
          </div>

          {reporte && (
            <div>
              <Divider style={{ margin: "12px 0" }} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <Card>
                  <div className="text-sm text-gray-500">Préstamos en rango</div>
                  <div className="text-2xl font-semibold">{reporte.prestamos.length}</div>
                </Card>
                <Card>
                  <div className="text-sm text-gray-500">Devoluciones en rango</div>
                  <div className="text-2xl font-semibold">{reporte.devoluciones.length}</div>
                </Card>
                <Card>
                  <div className="text-sm text-gray-500">Usuario</div>
                  <div className="text-base font-medium">{user?.nombreUsuario || user?.email}</div>
                </Card>
              </div>

              <Tabs
                activeKey={reportTab}
                onChange={setReportTab}
                items={[
                  {
                    key: "prestamos",
                    label: "Préstamos",
                    children: (
                      <Table
                        size="small"
                        rowKey="id"
                        columns={[
                          { title: "ID", dataIndex: "id" },
                          { title: "Solicitud", dataIndex: "solicitudId" },
                          { title: "Préstamo", dataIndex: "fechaPrestamo", render: (iso: string) => dateFmt(iso) },
                          { title: "Dev. Prev.", dataIndex: "fechaDevolucionPrevista", render: (iso: string) => dateFmt(iso) },
                          { title: "Estado", dataIndex: "estadoPrestamo", render: (v: string) => <Tag color={v === "Activo" ? "blue" : "green"}>{v}</Tag> },
                        ]}
                        dataSource={reporte.prestamos}
                        pagination={{ pageSize: 5 }}
                      />
                    ),
                  },
                  {
                    key: "devoluciones",
                    label: "Devoluciones",
                    children: (
                      <Table
                        size="small"
                        rowKey="id"
                        columns={[
                          { title: "ID", dataIndex: "id" },
                          { title: "Préstamo", dataIndex: "prestamoId", render: (v: number) => `#${v}` },
                          { title: "Fecha devolución", dataIndex: "fechaDevolucion", render: (iso: string) => dateFmt(iso) },
                          { title: "Observaciones", dataIndex: "observaciones" },
                        ]}
                        dataSource={reporte.devoluciones}
                        pagination={{ pageSize: 5 }}
                      />
                    ),
                  },
                ]}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PrestamosPage;
