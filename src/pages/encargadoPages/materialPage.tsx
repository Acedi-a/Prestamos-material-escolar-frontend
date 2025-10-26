import React, { useState, useEffect } from 'react';
import {
  getAllMaterials,
  getAllCategories,
  createMaterial,
  updateMaterialStatus,
  createCategory,
  updateCategory,
  deleteCategory,
  IMaterial,
  ICategoria
} from '../../lib/api';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Space,
  Popconfirm
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

const MaterialPage: React.FC = () => {
  // Estados
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [categories, setCategories] = useState<ICategoria[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para modales
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ICategoria | null>(null);
  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();

  // Cargar datos iniciales
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [materialsRes, categoriesRes] = await Promise.all([
        getAllMaterials(),
        getAllCategories()
      ]);
      setMaterials(materialsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      message.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Handlers para Material
  const handleAddMaterial = () => {
    form.resetFields();
    setMaterialModalVisible(true);
  };

  const handleMaterialSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createMaterial(values);
      message.success('Material creado exitosamente');
      setMaterialModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Error al crear el material');
    }
  };

  const handleStatusUpdate = async (id: number, estado: string) => {
    try {
      await updateMaterialStatus(id, estado);
      message.success('Estado actualizado exitosamente');
      fetchData();
    } catch (error) {
      message.error('Error al actualizar el estado');
    }
  };

  // Handlers para Categoría
  const handleAddCategory = () => {
    categoryForm.resetFields();
    setSelectedCategory(null);
    setCategoryModalVisible(true);
  };

  const handleEditCategory = (category: ICategoria) => {
    setSelectedCategory(category);
    categoryForm.setFieldsValue(category);
    setCategoryModalVisible(true);
  };

  const handleCategorySubmit = async () => {
    try {
      const values = await categoryForm.validateFields();
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, values);
        message.success('Categoría actualizada exitosamente');
      } else {
        await createCategory(values);
        message.success('Categoría creada exitosamente');
      }
      setCategoryModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Error al guardar la categoría');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategory(id);
      message.success('Categoría eliminada exitosamente');
      fetchData();
    } catch (error) {
      message.error('Error al eliminar la categoría');
    }
  };

  // Columnas para la tabla de materiales
  const materialsColumns = [
    {
      title: 'Nombre',
      dataIndex: 'nombreMaterial',
      key: 'nombreMaterial',
    },
    {
      title: 'Categoría',
      dataIndex: 'categoriaId',
      key: 'categoriaId',
      render: (categoriaId: number) => 
        categories.find(c => c.id === categoriaId)?.nombreCategoria || 'N/A',
    },
    {
      title: 'Cantidad Total',
      dataIndex: 'cantidadTotal',
      key: 'cantidadTotal',
    },
    {
      title: 'Disponibles',
      dataIndex: 'cantidadDisponible',
      key: 'cantidadDisponible',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: string, record: IMaterial) => (
        <Select
          value={estado}
          onChange={(value) => handleStatusUpdate(record.id, value)}
          style={{ width: 120 }}
        >
          <Option value="Disponible">Disponible</Option>
          <Option value="No Disponible">No Disponible</Option>
          <Option value="En Mantenimiento">En Mantenimiento</Option>
        </Select>
      ),
    },
  ];

  // Columnas para la tabla de categorías
  const categoriesColumns = [
    {
      title: 'Nombre',
      dataIndex: 'nombreCategoria',
      key: 'nombreCategoria',
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, record: ICategoria) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditCategory(record)}
          />
          <Popconfirm
            title="¿Estás seguro de eliminar esta categoría?"
            onConfirm={() => handleDeleteCategory(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMaterial}>
            Nuevo Material
          </Button>
          <Button onClick={handleAddCategory}>
            Gestionar Categorías
          </Button>
        </Space>
      </div>

      <Table
        columns={materialsColumns}
        dataSource={materials}
        rowKey="id"
        loading={loading}
      />

      {/* Modal para Material */}
      <Modal
        title="Nuevo Material"
        open={materialModalVisible}
        onOk={handleMaterialSubmit}
        onCancel={() => setMaterialModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="nombreMaterial"
            label="Nombre del Material"
            rules={[{ required: true, message: 'Por favor ingrese el nombre' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="categoriaId"
            label="Categoría"
            rules={[{ required: true, message: 'Por favor seleccione una categoría' }]}
          >
            <Select>
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.nombreCategoria}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="descripcion"
            label="Descripción"
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="cantidadTotal"
            label="Cantidad Total"
            rules={[{ required: true, message: 'Por favor ingrese la cantidad' }]}
          >
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item
            name="estado"
            label="Estado"
            initialValue="Disponible"
            rules={[{ required: true, message: 'Por favor seleccione el estado' }]}
          >
            <Select>
              <Option value="Disponible">Disponible</Option>
              <Option value="No Disponible">No Disponible</Option>
              <Option value="En Mantenimiento">En Mantenimiento</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para Categoría */}
      <Modal
        title={selectedCategory ? "Editar Categoría" : "Nueva Categoría"}
        open={categoryModalVisible}
        onOk={handleCategorySubmit}
        onCancel={() => setCategoryModalVisible(false)}
      >
        <Form form={categoryForm} layout="vertical">
          <Form.Item
            name="nombreCategoria"
            label="Nombre de la Categoría"
            rules={[{ required: true, message: 'Por favor ingrese el nombre' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="descripcion"
            label="Descripción"
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
        <Table
          columns={categoriesColumns}
          dataSource={categories}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default MaterialPage;
