import React, { useState, useEffect, useMemo } from 'react';
import {
    Table, Button, message, Spin, Modal, List, Typography, Tag, Space, Tabs, Popconfirm,
    DatePicker, Input
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, CheckOutlined, CloseOutlined, InboxOutlined, ReloadOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import {
    ISolicitud,
    ISolicitudCompleta,
    getAllSolicitudes,
    getSolicitudDetallesById,
    aprobarSolicitud,
    rechazarSolicitud
} from '../../lib/api/solicitudes';
import dayjs from 'dayjs'; // ⬅️ 2. IMPORTAR dayjs para manejar fechas
// Asegúrate de tener instalado dayjs: npm install dayjs o yarn add dayjs

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const GestionSolicitudesPage: React.FC = () => {

    // Estados (existentes)
    const [solicitudes, setSolicitudes] = useState<ISolicitud[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

    // Estados del Modal de Detalles (existentes y corregidos)
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [selectedSolicitudDetails, setSelectedSolicitudDetails] = useState<ISolicitudCompleta | null>(null);

    // --- ⬇️ 3. ESTADOS PARA EL MODAL DE APROBACIÓN ⬇️ ---
    const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
    const [solicitudToApprove, setSolicitudToApprove] = useState<ISolicitud | null>(null);
    const [selectedReturnDate, setSelectedReturnDate] = useState<dayjs.Dayjs | null>(dayjs().add(7, 'day')); // Por defecto, 7 días
    const [isApproving, setIsApproving] = useState(false); // Carga para el botón Aprobar

    // Cargar todas las solicitudes (existente)
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        setLoading(true);
        getAllSolicitudes()
            .then(response => {
                setSolicitudes(response.data);
            })
            .catch(() => message.error("No se pudieron cargar las solicitudes."))
            .finally(() => setLoading(false));
    };

    // --- Handlers de Acciones (MODIFICADOS) ---

    // Abre el modal para seleccionar la fecha
    const handleOpenApproveModal = (record: ISolicitud) => {
        setSolicitudToApprove(record);
        setSelectedReturnDate(dayjs().add(7, 'day')); // Restablecer fecha por defecto
        setIsApproveModalVisible(true);
    };

    // Se llama al confirmar el modal de aprobación
    const handleConfirmApprove = async () => {
        if (!solicitudToApprove || !selectedReturnDate) {
            message.error("Error interno: falta solicitud o fecha seleccionada.");
            return;
        }
        if (selectedReturnDate.isBefore(dayjs())) {
             message.error("La fecha de devolución debe ser futura.");
             return;
        }

        setIsApproving(true);
        try {
            // Llama a la API con el ID y la fecha
            await aprobarSolicitud(solicitudToApprove.id, selectedReturnDate.toDate());
            message.success("Solicitud Aprobada. Préstamo creado.");
            setIsApproveModalVisible(false);
            setSolicitudToApprove(null);
            fetchData(); // Recargar datos
        } catch (err: any) {
            let errorMessage = "Error al aprobar la solicitud.";
            if (err.response && err.response.data && err.response.data.message) {
                errorMessage = `Error de la API: ${err.response.data.message}`;
            }
            message.error(errorMessage);
        } finally {
            setIsApproving(false);
        }
    };

    // Cierra el modal de aprobación
    const handleCancelApproveModal = () => {
        setIsApproveModalVisible(false);
        setSolicitudToApprove(null);
    };


    const handleRechazar = async (id: number) => {
         try {
            await rechazarSolicitud(id);
            message.success("Solicitud Rechazada.");
            fetchData(); // Recargar la lista
        } catch (err: any) {
             message.error(err.response?.data?.message || "Error al rechazar.");
        }
    };


    // --- Handlers de Modal de Detalles (Corregidos) ---
    const handleViewDetails = async (solicitudId: number) => {
        setIsDetailModalVisible(true);
        setLoadingDetails(true);
        try {
            const response = await getSolicitudDetallesById(solicitudId);
            setSelectedSolicitudDetails(response.data);
        } catch (error) {
            message.error("Error al cargar los detalles.");
            setIsDetailModalVisible(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalVisible(false);
        setSelectedSolicitudDetails(null);
    };

    // --- Columnas de la Tabla (tipadas y con dataIndex correctos) ---
    const columns: ColumnsType<ISolicitud> = [
       {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 80,
    },
    {
        title: 'Docente',
        dataIndex: 'docenteNombre',
        key: 'docenteNombre',
        render: (nombre: string | undefined, rec) => nombre || `#${rec.docenteId}`,
    },
    {
        title: 'Fecha',
        dataIndex: 'fechaSolicitud',
        key: 'fechaSolicitud',
        render: (fecha: string) => fecha ? dayjs(fecha).format('YYYY-MM-DD') : '-',
    },
    {
        title: 'Estado',
        dataIndex: 'estadoSolicitud',
        key: 'estadoSolicitud',
        render: (estado: string) => {
            const lower = (estado || '').toLowerCase();
            let color: string = 'default';
            if (lower === 'pendiente') color = 'orange';
            else if (lower === 'aprobada' || lower === 'aprobado') color = 'green';
            else if (lower === 'rechazada' || lower === 'rechazado') color = 'red';
            return <Tag color={color}>{estado}</Tag>;
        }
    },
        {
            title: 'Acciones',
            key: 'actions',
            width: 150,
            align: 'center' as 'center',
            render: (_: any, record: ISolicitud) => (
                <Space>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(record.id)} // Llama al modal de detalles
                    />

                    {record.estadoSolicitud.toLowerCase() === 'pendiente' && (
                        <>
                            {/* ⬇️ El botón ahora abre el modal de selección de fecha ⬇️ */}
                            <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => handleOpenApproveModal(record)} // Abre el modal de aprobación
                            />

                            <Popconfirm
                                title="¿Rechazar esta solicitud?"
                                onConfirm={() => handleRechazar(record.id)}
                                okText="Sí, Rechazar"
                                cancelText="No"
                            >
                                <Button type="primary" danger icon={<CloseOutlined />} />
                            </Popconfirm>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    // --- Filtros (búsqueda y rango de fechas) ---
    const filtered = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return solicitudes.filter((s) => {
            const matchesText = term
                ? (s.docenteNombre?.toLowerCase().includes(term) || String(s.id).includes(term))
                : true;
            const matchesDate = dateRange
                ? (() => {
                    if (!s.fechaSolicitud) return false;
                    const d = dayjs(s.fechaSolicitud);
                    if (!d.isValid()) return false;
                    const [start, end] = dateRange;
                    return d.isAfter(start.startOf('day')) && d.isBefore(end.endOf('day')) || d.isSame(start, 'day') || d.isSame(end, 'day');
                })()
                : true;
            return matchesText && matchesDate;
        });
    }, [solicitudes, searchTerm, dateRange]);

    // --- Filtrar datos para las Pestañas ---
    const pendientes = useMemo(
        () => filtered.filter(s => (s.estadoSolicitud || '').toLowerCase() === 'pendiente'),
        [filtered]
    );
    const historial = useMemo(
        () => filtered.filter(s => (s.estadoSolicitud || '').toLowerCase() !== 'pendiente'),
        [filtered]
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                <InboxOutlined className="text-2xl text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Gestión de Solicitudes</h1>
                                <p className="text-xs text-gray-500">Revisa, aprueba o rechaza solicitudes de préstamo</p>
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
                            <div className="px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg">Pendientes: {pendientes.length}</div>
                            <div className="px-3 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg">Total: {filtered.length}</div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            <Input
                                allowClear
                                prefix={<SearchOutlined />}
                                placeholder="Buscar por docente o #ID"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="md:w-72"
                            />
                            <DatePicker.RangePicker
                                value={dateRange as any}
                                onChange={(vals) => setDateRange(vals as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                                allowClear
                                suffixIcon={<CalendarOutlined />}
                                className="w-full md:w-80"
                                format="YYYY-MM-DD"
                            />
                            <Button onClick={() => { setSearchTerm(''); setDateRange(null); }}>Limpiar</Button>
                        </div>
                    </div>

                    {/* Tabs + Tables */}
                    <Tabs defaultActiveKey="1">
                        <TabPane tab={`Pendientes (${pendientes.length})`} key="1">
                            <Spin spinning={loading}>
                                <Table columns={columns} dataSource={pendientes} rowKey="id" />
                            </Spin>
                        </TabPane>
                        <TabPane tab={`Historial (${historial.length})`} key="2">
                            <Spin spinning={loading}>
                                <Table columns={columns} dataSource={historial} rowKey="id" />
                            </Spin>
                        </TabPane>
                    </Tabs>
                </div>
            </div>

            {/* Modal Detalles */}
            <Modal
                title={`Detalles de la Solicitud #${selectedSolicitudDetails?.id}`}
                open={isDetailModalVisible}
                onCancel={handleCloseDetailModal}
                footer={[<Button key="close" onClick={handleCloseDetailModal}>Cerrar</Button>]}
            >
                {loadingDetails ? (
                    <div style={{ textAlign: 'center', padding: '30px' }}><Spin /></div>
                ) : (
                    <>
                        <Text strong>Estado:</Text>
                        <p>{selectedSolicitudDetails?.estadoSolicitud}</p>
                        <List
                            dataSource={selectedSolicitudDetails?.detalles || []}
                            header={<Text strong>Materiales Solicitados</Text>}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={item.nombreMaterial}
                                        description={`Cantidad solicitada: ${item.cantidadSolicitada}`}
                                    />
                                </List.Item>
                            )}
                        />
                    </>
                )}
            </Modal>

            {/* Modal Aprobación con Fecha/Hora */}
            <Modal
                title={`Aprobar Solicitud #${solicitudToApprove?.id}`}
                open={isApproveModalVisible}
                onOk={handleConfirmApprove}
                onCancel={handleCancelApproveModal}
                confirmLoading={isApproving}
                okText="Aprobar Préstamo"
                cancelText="Cancelar"
            >
                <Typography.Paragraph>
                    Por favor, selecciona la fecha y hora de devolución prevista para este préstamo.
                </Typography.Paragraph>
                <DatePicker
                    showTime
                    value={selectedReturnDate}
                    onChange={(date) => setSelectedReturnDate(date)}
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                    style={{ width: '100%' }}
                    placeholder="Selecciona fecha y hora"
                    format="YYYY-MM-DD HH:mm:ss"
                />
            </Modal>
        </div>
    );
};

export default GestionSolicitudesPage;