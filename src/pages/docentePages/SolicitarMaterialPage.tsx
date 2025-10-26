import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  InputNumber, 
  message, 
  Card, 
  List, 
  Typography, 
  Empty,
  Spin
} from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { 
  getAllMaterials, 
  getDocenteByUsuarioId, 
  createSolicitud,
  IMaterial,
  ISolicitudItem,
  ISolicitudRequest
} from '../../lib/api/materiales'; // ⬅️ Usamos tu archivo API actualizado

const { Title } = Typography;

// Interface para el item del carrito (local)
interface ICartItem {
  materialId: number;
  nombreMaterial: string;
  cantidad: number;
  disponible: number; // Guardamos el disponible para validación
}

const SolicitarMaterialPage: React.FC = () => {
  const { user } = useAuth(); // 1. Obtener usuario logeado
  
  // --- Estados ---
  const [docenteId, setDocenteId] = useState<number | null>(null);
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para el envío
  
  // El "Carrito" de la solicitud
  const [cart, setCart] = useState<Map<number, ICartItem>>(new Map());

  // --- Carga de Datos ---
  useEffect(() => {
    if (!user?.usuarioId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        // 2. Buscar el 'docenteId' y los materiales en paralelo
        const [docenteRes, materialsRes] = await Promise.all([
          getDocenteByUsuarioId(user.usuarioId),
          getAllMaterials()
        ]);
        
        setDocenteId(docenteRes.data.id); // 3. Guardar el ID del Docente

        // 4. Filtrar materiales (solo mostrar los disponibles)
        const availableMaterials = materialsRes.data.filter(
          m => m.estado.toLowerCase() === 'disponible' && m.cantidadDisponible > 0
        );
        setMaterials(availableMaterials);

      } catch (error) {
        message.error("Error al cargar los datos del docente o materiales.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  // --- Lógica del Carrito ---

  const handleAddToCart = (material: IMaterial) => {
    if (cart.has(material.id)) {
      message.info("Este material ya está en tu solicitud.");
      return;
    }
    
    const newItem: ICartItem = {
      materialId: material.id,
      nombreMaterial: material.nombreMaterial,
      cantidad: 1, // Por defecto 1
      disponible: material.cantidadDisponible
    };

    const newCart = new Map(cart);
    newCart.set(material.id, newItem);
    setCart(newCart);
  };

  const handleUpdateCartQuantity = (materialId: number, cantidad: number | null) => {
    const item = cart.get(materialId);
    if (!item || cantidad === null) return;

    // Validación de stock (con la corrección de tu backend)
    if (cantidad > item.disponible) {
      message.error(`Stock insuficiente. Máximo: ${item.disponible}`);
      item.cantidad = item.disponible; // Setea al máximo
    } else {
      item.cantidad = cantidad;
    }
    
    const newCart = new Map(cart);
    setCart(newCart);
  };

  const handleRemoveFromCart = (materialId: number) => {
    const newCart = new Map(cart);
    newCart.delete(materialId);
    setCart(newCart);
  };

  // --- Lógica de Envío ---

  const handleSubmitSolicitud = async () => {
    if (cart.size === 0) {
      message.warning("No has añadido ningún material a la solicitud.");
      return;
    }
    if (!docenteId) {
      message.error("No se pudo identificar al docente. Recarga la página.");
      return;
    }

    setIsSubmitting(true);
    
    // 1. Validar que ninguna cantidad sea 0
    for (const item of cart.values()) {
      if (item.cantidad <= 0) {
        message.error(`La cantidad para '${item.nombreMaterial}' debe ser mayor a 0.`);
        setIsSubmitting(false);
        return;
      }
    }

    // 2. Transformar el carrito al DTO que espera el backend
    const itemsDTO: ISolicitudItem[] = Array.from(cart.values()).map(item => ({
      materialId: item.materialId,
      cantidad: item.cantidad
    }));

    const payload: ISolicitudRequest = {
      docenteId: docenteId,
      items: itemsDTO
    };
    
    // 3. Enviar a la API
    try {
      await createSolicitud(payload);
      message.success("Solicitud enviada exitosamente. Estado: Pendiente.");
      setCart(new Map()); // Limpiar carrito
      // (Opcional: recargar materiales para actualizar stock disponible)
      // loadData(); 
    } catch (err: any) {
      let errorMessage = "Error al enviar la solicitud.";
      if (err.response && err.response.data && err.response.data.message) {
        // Mensaje de error de tu backend (ej. "Stock insuficiente...")
        errorMessage = `Error de la API: ${err.response.data.message}`;
      }
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Columnas de la Tabla de Materiales ---
  const columns = [
    {
      title: 'Material',
      dataIndex: 'nombreMaterial',
      key: 'nombreMaterial',
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
    },
    {
      title: 'Disponibles',
      dataIndex: 'cantidadDisponible',
      key: 'cantidadDisponible',
      align: 'center' as 'center',
    },
    {
      title: 'Acción',
      key: 'action',
      align: 'center' as 'center',
      render: (_: any, record: IMaterial) => (
        <Button 
          type="primary" 
          onClick={() => handleAddToCart(record)}
          disabled={cart.has(record.id)} // Deshabilitar si ya está en el carrito
        >
          Añadir
        </Button>
      ),
    },
  ];

  if (loading) {
     return <div style={{padding: '50px', textAlign: 'center'}}><Spin size="large" /></div>
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Solicitud de Materiales</Title>
      
      <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Columna Izquierda: Materiales Disponibles */}
        <Card title="Materiales Disponibles" style={{ flex: 2, minWidth: '400px' }}>
          <Table
            columns={columns}
            dataSource={materials}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </Card>

        {/* Columna Derecha: Carrito de Solicitud */}
        <Card title="Mi Solicitud" style={{ flex: 1, minWidth: '300px' }}>
          {cart.size === 0 ? (
            <Empty description="Añade materiales desde la tabla." />
          ) : (
            <>
              <List
                dataSource={Array.from(cart.values())}
                itemLayout="horizontal"
                renderItem={(item: ICartItem) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleRemoveFromCart(item.materialId)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      title={item.nombreMaterial}
                      description={`Disponibles: ${item.disponible}`}
                    />
                    <InputNumber
                      min={1}
                      max={item.disponible}
                      value={item.cantidad}
                      onChange={(value) => handleUpdateCartQuantity(item.materialId, value)}
                      style={{ width: '60px' }}
                    />
                  </List.Item>
                )}
              />
              <Button
                type="primary"
                block
                icon={<ShoppingCartOutlined />}
                style={{ marginTop: '16px' }}
                onClick={handleSubmitSolicitud}
                loading={isSubmitting} // Usar el estado de envío
              >
                Enviar Solicitud
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SolicitarMaterialPage;