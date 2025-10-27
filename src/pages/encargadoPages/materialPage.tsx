import React, { useState, useEffect } from 'react';
import { getAllMaterials, createMaterial, updateMaterialStatus, updateMaterial, getMaterialById, getMaterialConteos, IMaterial } from '../../lib/api/materiales';
import { getAllCategories, createCategory, updateCategory, deleteCategory, ICategoria } from '../../lib/api/categoria';
import { registrarReparacion } from '../../lib/api/reparaciones';
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
  Popconfirm,
  DatePicker
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
  const [selectedMaterial, setSelectedMaterial] = useState<IMaterial | null>(null);
  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [repairForm] = Form.useForm();
  const [reparacionModalVisible, setReparacionModalVisible] = useState(false);

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
      // Merge counts (prestados, enReparacion) provided by backend endpoint /api/Material/{id}/conteos
      const baseMaterials = materialsRes.data as IMaterial[];
      const detailed = await Promise.all(baseMaterials.map(async (m) => {
        try {
          const resp = await getMaterialConteos(m.id);
          return { ...m, prestados: resp.data.prestados, enReparacion: resp.data.enReparacion } as IMaterial;
        } catch {
          return m;
        }
      }));
      setMaterials(detailed);
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
    setSelectedMaterial(null);
    setMaterialModalVisible(true);
  };

  const handleEditMaterial = (material: IMaterial) => {
    setSelectedMaterial(material);
    form.setFieldsValue(material);
    setMaterialModalVisible(true);
  };

  // Reparación: abrir modal
  const openReparacionModal = (material: IMaterial) => {
    setSelectedMaterial(material);
    repairForm.resetFields();
    repairForm.setFieldsValue({
      fechaEnvio: null,
      descripcionFalla: '',
      costo: undefined,
      cantidad: material.cantidadDisponible > 0 ? 1 : 0,
    });
    setReparacionModalVisible(true);
  };

  const handleReparacionSubmit = async () => {
    if (!selectedMaterial) return;
    try {
      const values = await repairForm.validateFields();
      const fechaVal: any = values.fechaEnvio;
      const fechaIso = fechaVal && typeof fechaVal.toISOString === 'function'
        ? fechaVal.toISOString()
        : new Date().toISOString();

      const payload = {
        materialId: selectedMaterial.id,
        fechaEnvio: fechaIso,
        descripcionFalla: values.descripcionFalla,
        costo: values.costo ?? null,
        cantidad: values.cantidad,
      };

      await registrarReparacion(payload);
      // Obtener material actualizado (datos) y conteos desde backend
      const [updatedRes, conteosRes] = await Promise.all([
        getMaterialById(selectedMaterial.id),
        getMaterialConteos(selectedMaterial.id),
      ]);
      const updatedMaterial = {
        ...updatedRes.data,
        prestados: conteosRes.data.prestados,
        enReparacion: conteosRes.data.enReparacion,
      } as IMaterial;
      // Actualizar en la lista
      setMaterials(prev => prev.map(m => m.id === selectedMaterial.id ? updatedMaterial : m));
      message.success('Enviado a reparación correctamente');
      setReparacionModalVisible(false);
    } catch (error: any) {
      message.error(error?.message || 'Error al enviar a reparación');
    }
  };

  const handleMaterialSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedMaterial) {
        await updateMaterial(selectedMaterial.id, values);
        // Traer datos completos y conteos
        const [updatedRes, conteosRes] = await Promise.all([
          getMaterialById(selectedMaterial.id),
          getMaterialConteos(selectedMaterial.id),
        ]);
        const updatedMaterial = { ...updatedRes.data, prestados: conteosRes.data.prestados, enReparacion: conteosRes.data.enReparacion } as IMaterial;
        setMaterials(prev => prev.map(m => m.id === selectedMaterial.id ? updatedMaterial : m));
        message.success('Material actualizado exitosamente');
      } else {
        // Al crear, cantidadDisponible = cantidadTotal
        const toSend = { ...values, cantidadDisponible: values.cantidadTotal };
        const res = await createMaterial(toSend);
        const newId = res.data?.id;
        if (newId) {
          const [createdRes, conteosRes] = await Promise.all([
            getMaterialById(newId),
            getMaterialConteos(newId),
          ]);
          const createdMaterial = { ...createdRes.data, prestados: conteosRes.data.prestados, enReparacion: conteosRes.data.enReparacion } as IMaterial;
          setMaterials(prev => [createdMaterial, ...prev]);
        } else {
          await fetchData();
        }
        message.success('Material creado exitosamente');
      }
      setMaterialModalVisible(false);
    } catch (error) {
      message.error(selectedMaterial ? 'Error al actualizar el material' : 'Error al crear el material');
    }
  };

  const handleStatusUpdate = async (id: number, estado: string) => {
    try {
      await updateMaterialStatus(id, estado);
      // Obtener datos y conteos actualizados para refrescar la fila
      const [updatedRes, conteosRes] = await Promise.all([
        getMaterialById(id),
        getMaterialConteos(id),
      ]);
      const updatedMaterial = { ...updatedRes.data, prestados: conteosRes.data.prestados, enReparacion: conteosRes.data.enReparacion } as IMaterial;
      setMaterials(prev => prev.map(m => m.id === id ? updatedMaterial : m));
      message.success('Estado actualizado exitosamente');
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
      title: 'Cantidad Disponible',
      dataIndex: 'cantidadDisponible',
      key: 'cantidadDisponible',
    },
    {
      title: 'Prestados',
      dataIndex: 'prestados',
      key: 'prestados',
      render: (v: number) => v ?? 0,
    },
    {
      title: 'En reparación',
      dataIndex: 'enReparacion',
      key: 'enReparacion',
      render: (v: number) => v ?? 0,
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (_: any, record: IMaterial) => record.descripcion || '-',
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
        </Select>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, record: IMaterial) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditMaterial(record)}
          />
          <Button
            onClick={() => openReparacionModal(record)}
            disabled={!(record.cantidadDisponible > 0)}
          >
            Enviar a reparación
          </Button>
        </Space>
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
        title={selectedMaterial ? "Editar Material" : "Nuevo Material"}
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
          {selectedMaterial && (
            <Form.Item
              name="cantidadDisponible"
              label="Cantidad Disponible"
              rules={[{ required: true, message: 'Por favor ingrese la cantidad disponible' }]}
            >
              <InputNumber min={0} max={form.getFieldValue('cantidadTotal') || undefined} />
            </Form.Item>
          )}
          <Form.Item
            name="estado"
            label="Estado"
            initialValue="Disponible"
            rules={[{ required: true, message: 'Por favor seleccione el estado' }]}
          >
            <Select>
              <Option value="Disponible">Disponible</Option>
              <Option value="No Disponible">No Disponible</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para Reparación */}
      <Modal
        title={selectedMaterial ? `Enviar a reparación - ${selectedMaterial.nombreMaterial}` : 'Enviar a reparación'}
        open={reparacionModalVisible}
        onOk={handleReparacionSubmit}
        onCancel={() => setReparacionModalVisible(false)}
      >
        <Form form={repairForm} layout="vertical">
          <Form.Item
            name="fechaEnvio"
            label="Fecha de envío"
            rules={[{ required: false }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="descripcionFalla"
            label="Descripción de la falla"
            rules={[{ required: true, message: 'Ingrese la descripción de la falla' }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="costo"
            label="Costo (opcional)"
          >
            <InputNumber min={0} style={{ width: '100%' }} step={0.01} />
          </Form.Item>
          <Form.Item
            name="cantidad"
            label="Cantidad a enviar"
            rules={[{ required: true, message: 'Ingrese la cantidad a enviar' }]}
          >
            <InputNumber
              min={1}
              max={selectedMaterial ? selectedMaterial.cantidadDisponible : undefined}
              style={{ width: '100%' }}
            />
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
