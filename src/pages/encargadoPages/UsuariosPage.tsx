import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { Table, Button, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; 


const API_URL = "https://localhost:7282/api"; 


interface IUsuario {
  id: number;
  rolId: number;
  nombreUsuario: string;
  email: string;
}

interface IRol {
  id: number;
  nombreRol: string;
}


const UsuariosPage: React.FC = () => {
  
  const navigate = useNavigate(); 

  
  const [usuarios, setUsuarios] = useState<IUsuario[]>([]);
  const [roles, setRoles] = useState<IRol[]>([]);
  const [loading, setLoading] = useState(false);
  
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usuariosRes, rolesRes] = await Promise.all([
        axios.get<IUsuario[]>(`${API_URL}/Usuario`),
        axios.get<IRol[]>(`${API_URL}/Rol`)
      ]);
      setUsuarios(usuariosRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      message.error('Error al cargar los datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

 

  const handleAdd = () => {
    
    navigate('/docentecrear'); 
  };

  const handleEdit = (record: IUsuario) => {
    
    navigate(`/docentecrear/usuario/${record.id}`); 
  };

 

  const handleDelete = async (id: number) => {
    try {
      
      await axios.delete(`${API_URL}/Usuario/${id}`);
      message.success('Usuario eliminado exitosamente');
      fetchData(); // Recargar la tabla
    } catch (error) {
      message.error('Error al eliminar el usuario. Es posible que tenga un docente asociado.');
    }
  };

  // --- Columnas de la Tabla ---

  const columns = [
    {
      title: 'Nombre de Usuario',
      dataIndex: 'nombreUsuario',
      key: 'nombreUsuario',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Rol',
      dataIndex: 'rolId',
      key: 'rolId',
      render: (rolId: number) => 
        roles.find(r => r.id === rolId)?.nombreRol || 'N/A',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, record: IUsuario) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)} 
          />
          {/* <Popconfirm
            title="¿Estás seguro de eliminar este usuario?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>*/}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAdd} // ⬅️ Modificado
        style={{ marginBottom: '16px' }}
      >
        Nuevo Usuario
      </Button>

      <Table
        columns={columns}
        dataSource={usuarios}
        rowKey="id"
        loading={loading}
      />
    </div>
  );
};

export default UsuariosPage;