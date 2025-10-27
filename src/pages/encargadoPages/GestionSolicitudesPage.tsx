import React, { useState, useEffect } from 'react';
import {
    Table, Button, message, Spin, Modal, List, Typography, Tag, Space, Tabs, Popconfirm,
    DatePicker // ⬅️ 1. IMPORTAR DatePicker
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
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

    // --- Filtrar datos para las Pestañas (existente) ---
    const pendientes = solicitudes.filter(s => s.estadoSolicitud.toLowerCase() === 'pendiente');
    const historial = solicitudes.filter(s => s.estadoSolicitud.toLowerCase() !== 'pendiente');

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>Gestión de Solicitudes</Title>

            <Tabs defaultActiveKey="1">
              <TabPane tab={`Pendientes (${pendientes.length})`} key="1">
                    <Spin spinning={loading}>
                        <Table
                            columns={columns}
                            dataSource={pendientes}
                            rowKey="id"
                        />
                    </Spin>
                </TabPane>
                <TabPane tab={`Historial (${historial.length})`} key="2">
                     <Spin spinning={loading}>
                        <Table
                            columns={columns}
                            dataSource={historial}
                            rowKey="id"
                        />
                    </Spin>
                </TabPane>
            </Tabs>

            {/* --- Modal para ver Detalles (Corregido) --- */}
            <Modal
                title={`Detalles de la Solicitud #${selectedSolicitudDetails?.id}`}
                open={isDetailModalVisible}
                onCancel={handleCloseDetailModal}
                footer={[ <Button key="close" onClick={handleCloseDetailModal}>Cerrar</Button> ]}
            >
             {loadingDetails ? (
                    <div style={{textAlign: 'center', padding: '30px'}}><Spin /></div>
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

            {/* --- ⬇️ 4. MODAL PARA FECHA DE APROBACIÓN ⬇️ --- */}
            <Modal
                title={`Aprobar Solicitud #${solicitudToApprove?.id}`}
                open={isApproveModalVisible}
                onOk={handleConfirmApprove} // Llama a la lógica de aprobación
                onCancel={handleCancelApproveModal}
                confirmLoading={isApproving} // Muestra carga en el botón OK
                okText="Aprobar Préstamo"
                cancelText="Cancelar"
            >
                <Typography.Paragraph>
                    Por favor, selecciona la fecha y hora de devolución prevista para este préstamo.
                </Typography.Paragraph>
                <DatePicker
                    showTime // Permitir seleccionar hora
                    value={selectedReturnDate}
                    onChange={(date) => setSelectedReturnDate(date)}
                    disabledDate={(current) => {
                        // No se pueden seleccionar días anteriores al inicio de hoy
                        return current && current < dayjs().startOf('day');
                    }}
                    style={{ width: '100%' }}
                    placeholder="Selecciona fecha y hora"
                    format="YYYY-MM-DD HH:mm:ss" // Formato para incluir hora
                />
            </Modal>
        </div>
    );
};

export default GestionSolicitudesPage;