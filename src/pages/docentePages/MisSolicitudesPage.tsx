import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, message, Spin, Modal, List, Typography, Tag, Input, DatePicker, Tabs } from 'antd';
import { EyeOutlined, FileSearchOutlined, ReloadOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { getDocenteByUsuarioId, IDocente } from '../../lib/api/materiales'; // Reusamos esta
import { 
    ISolicitud, 
    ISolicitudCompleta, 
    getSolicitudesByDocenteId,
    getSolicitudDetallesById 
} from '../../lib/api/solicitudes'; // ⬅️ Usamos la nueva API

import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const MisSolicitudesPage: React.FC = () => {
    const { user } = useAuth();
    
    // Estados
    const [solicitudes, setSolicitudes] = useState<ISolicitud[]>([]);
    const [docenteId, setDocenteId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
    const [estadoTab, setEstadoTab] = useState<string>('todas');
    
    // Estados del Modal
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState<ISolicitudCompleta | null>(null);

    // 1. Obtener el DocenteId (similar a la página de solicitar)
    useEffect(() => {
        if (user?.usuarioId) {
            getDocenteByUsuarioId(user.usuarioId)
                .then(response => {
                    setDocenteId(response.data.id);
                })
                .catch(() => message.error("Error al identificar al docente."));
        }
    }, [user]);

    // 2. Cargar las solicitudes una vez que tenemos el DocenteId
    useEffect(() => {
        if (docenteId) {
            setLoading(true);
            getSolicitudesByDocenteId(docenteId)
                .then(response => {
                    setSolicitudes(response.data);
                })
                .catch(() => message.error("No se pudieron cargar las solicitudes."))
                .finally(() => setLoading(false));
        }
    }, [docenteId]); // Se ejecuta cuando docenteId cambia

    // 3. Handler para abrir el modal y buscar detalles
    const handleViewDetails = async (solicitudId: number) => {
        setIsModalVisible(true);
        setLoadingDetails(true);
        try {
            const response = await getSolicitudDetallesById(solicitudId);
            setSelectedSolicitud(response.data);
        } catch (error) {
            message.error("Error al cargar los detalles.");
            setIsModalVisible(false); // Cerrar si falla
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedSolicitud(null); // Limpiar datos
    };
    
    // --- Filtros derivados ---
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return solicitudes.filter((s) => {
            const textMatch = term
                ? String(s.id).includes(term)
                  || (s.estadoSolicitud || '').toLowerCase().includes(term)
                : true;
            const dateMatch = range
                ? (() => {
                    if (!s.fechaSolicitud) return false;
                    const d = dayjs(s.fechaSolicitud);
                    if (!d.isValid()) return false;
                    const [start, end] = range;
                    return d.isAfter(start.startOf('day')) && d.isBefore(end.endOf('day')) || d.isSame(start, 'day') || d.isSame(end, 'day');
                })()
                : true;
            const estado = (s.estadoSolicitud || '').toLowerCase();
            const estadoMatch = estadoTab === 'todas'
                ? true
                : estadoTab === 'pendiente'
                    ? estado === 'pendiente'
                    : estadoTab === 'aprobada'
                        ? (estado === 'aprobada' || estado === 'aprobado')
                        : estadoTab === 'rechazada'
                            ? (estado === 'rechazada' || estado === 'rechazado')
                            : true;
            return textMatch && dateMatch && estadoMatch;
        });
    }, [solicitudes, search, range, estadoTab]);

    const counts = useMemo(() => ({
        total: solicitudes.length,
        pendientes: solicitudes.filter(s => (s.estadoSolicitud || '').toLowerCase() === 'pendiente').length,
        aprobadas: solicitudes.filter(s => ['aprobada','aprobado'].includes((s.estadoSolicitud || '').toLowerCase())).length,
        rechazadas: solicitudes.filter(s => ['rechazada','rechazado'].includes((s.estadoSolicitud || '').toLowerCase())).length,
    }), [solicitudes]);

    // --- Columnas de la Tabla ---
    const columns = [
        {
            title: 'ID Solicitud',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Fecha de Solicitud',
            dataIndex: 'fechaSolicitud',
            key: 'fechaSolicitud',
            render: (fecha: string) => new Date(fecha).toLocaleDateString(),
        },
        {
            title: 'Estado',
            dataIndex: 'estadoSolicitud',
            key: 'estadoSolicitud',
            render: (estado: string) => {
                let color = 'geekblue';
                if (estado.toLowerCase() === 'aprobada') color = 'green';
                if (estado.toLowerCase() === 'rechazada') color = 'red';
                if (estado.toLowerCase() === 'pendiente') color = 'orange';
                return <Tag color={color}>{estado.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: any, record: ISolicitud) => (
                <Button 
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetails(record.id)}
                >
                    Ver Detalles
                </Button>
            ),
        },
    ];

    if (loading) {
        return <div style={{padding: '50px', textAlign: 'center'}}><Spin size="large" /></div>
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                <FileSearchOutlined className="text-2xl text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Mis Solicitudes</h1>
                                <p className="text-xs text-gray-500">Consulta y revisa el estado de tus solicitudes</p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                            <Button icon={<ReloadOutlined />} onClick={() => docenteId && getSolicitudesByDocenteId(docenteId).then(r => setSolicitudes(r.data))}>Actualizar</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-sm p-6 md:p-8">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
                        <div className="flex items-center gap-3 text-sm">
                            <span className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">Total: {counts.total}</span>
                            <span className="px-3 py-2 bg-orange-50 text-orange-600 rounded-lg">Pendientes: {counts.pendientes}</span>
                            <span className="px-3 py-2 bg-green-50 text-green-600 rounded-lg">Aprobadas: {counts.aprobadas}</span>
                            <span className="px-3 py-2 bg-red-50 text-red-600 rounded-lg">Rechazadas: {counts.rechazadas}</span>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            <Input
                                allowClear
                                prefix={<SearchOutlined />}
                                placeholder="Buscar por #ID o estado"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="md:w-64"
                            />
                            <DatePicker.RangePicker
                                value={range as any}
                                onChange={(vals) => setRange(vals as [Dayjs, Dayjs] | null)}
                                allowClear
                                suffixIcon={<CalendarOutlined />}
                                className="w-full md:w-80"
                                format="YYYY-MM-DD"
                            />
                            <Button onClick={() => { setSearch(''); setRange(null); }}>Limpiar</Button>
                        </div>
                    </div>

                    {/* Tabs de Estado */}
                    <Tabs activeKey={estadoTab} onChange={setEstadoTab}>
                        <TabPane tab={`Todas (${counts.total})`} key="todas" />
                        <TabPane tab={`Pendientes (${counts.pendientes})`} key="pendiente" />
                        <TabPane tab={`Aprobadas (${counts.aprobadas})`} key="aprobada" />
                        <TabPane tab={`Rechazadas (${counts.rechazadas})`} key="rechazada" />
                    </Tabs>

                    <Table
                        columns={columns}
                        dataSource={filtered}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                    />
                </div>
            </div>

            {/* Modal Detalles */}
            <Modal
                title={`Detalles de la Solicitud #${selectedSolicitud?.id}`}
                open={isModalVisible}
                onCancel={handleCloseModal}
                footer={[
                    <Button key="close" onClick={handleCloseModal}>
                        Cerrar
                    </Button>
                ]}
            >
                {loadingDetails ? (
                    <div style={{textAlign: 'center', padding: '30px'}}><Spin /></div>
                ) : (
                    <List
                        dataSource={selectedSolicitud?.detalles || []}
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
                )}
            </Modal>
        </div>
    );
};

export default MisSolicitudesPage;