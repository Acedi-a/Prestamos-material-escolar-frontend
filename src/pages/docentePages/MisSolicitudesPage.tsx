import React, { useState, useEffect } from 'react';
import { Table, Button, message, Spin, Modal, List, Typography, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { getDocenteByUsuarioId, IDocente } from '../../lib/api/materiales'; // Reusamos esta
import { 
    ISolicitud, 
    ISolicitudCompleta, 
    getSolicitudesByDocenteId,
    getSolicitudDetallesById 
} from '../../lib/api/solicitudes'; // ⬅️ Usamos la nueva API

const { Title, Text } = Typography;

const MisSolicitudesPage: React.FC = () => {
    const { user } = useAuth();
    
    // Estados
    const [solicitudes, setSolicitudes] = useState<ISolicitud[]>([]);
    const [docenteId, setDocenteId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    
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
        <div style={{ padding: '24px' }}>
            <Title level={2}>Mis Solicitudes</Title>
            
            <Table
                columns={columns}
                dataSource={solicitudes}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />

            {/* --- Modal para ver Detalles --- */}
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