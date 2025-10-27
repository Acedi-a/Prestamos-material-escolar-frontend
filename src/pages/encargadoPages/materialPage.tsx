import React, { useState, useEffect } from 'react';
import { getAllMaterials, createMaterial, updateMaterialStatus, updateMaterial, getMaterialById, getMaterialConteos, IMaterial } from '../../lib/api/materiales';
import { getAllCategories, createCategory, updateCategory, deleteCategory, ICategoria } from '../../lib/api/categoria';
import { registrarReparacion } from '../../lib/api/reparaciones';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ToolOutlined,
  CloseOutlined,
  CheckOutlined,
  SearchOutlined,
  AppstoreOutlined,
  TagsOutlined,
  InboxOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const MaterialPage: React.FC = () => {
  // Estados
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [categories, setCategories] = useState<ICategoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para modales
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ICategoria | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<IMaterial | null>(null);
  const [reparacionModalVisible, setReparacionModalVisible] = useState(false);
  
  // Estados de formulario
  const [formData, setFormData] = useState<any>({});
  const [categoryFormData, setCategoryFormData] = useState<any>({});
  const [repairFormData, setRepairFormData] = useState<any>({});

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
      console.error('Error al cargar los datos', error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers para Material
  const handleAddMaterial = () => {
    setFormData({});
    setSelectedMaterial(null);
    setMaterialModalVisible(true);
  };

  const handleEditMaterial = (material: IMaterial) => {
    setSelectedMaterial(material);
    setFormData(material);
    setMaterialModalVisible(true);
  };

  const openReparacionModal = (material: IMaterial) => {
    setSelectedMaterial(material);
    setRepairFormData({
      fechaEnvio: '',
      descripcionFalla: '',
      costo: '',
      cantidad: material.cantidadDisponible > 0 ? 1 : 0,
    });
    setReparacionModalVisible(true);
  };

  const handleReparacionSubmit = async () => {
    if (!selectedMaterial) return;
    try {
      const payload = {
        materialId: selectedMaterial.id,
        fechaEnvio: repairFormData.fechaEnvio || new Date().toISOString(),
        descripcionFalla: repairFormData.descripcionFalla,
        costo: repairFormData.costo ? parseFloat(repairFormData.costo) : null,
        cantidad: parseInt(repairFormData.cantidad),
      };

      await registrarReparacion(payload);
      const [updatedRes, conteosRes] = await Promise.all([
        getMaterialById(selectedMaterial.id),
        getMaterialConteos(selectedMaterial.id),
      ]);
      const updatedMaterial = {
        ...updatedRes.data,
        prestados: conteosRes.data.prestados,
        enReparacion: conteosRes.data.enReparacion,
      } as IMaterial;
      setMaterials(prev => prev.map(m => m.id === selectedMaterial.id ? updatedMaterial : m));
      setReparacionModalVisible(false);
    } catch (error: any) {
      console.error('Error al enviar a reparación', error);
    }
  };

  const handleMaterialSubmit = async () => {
    try {
      if (selectedMaterial) {
        await updateMaterial(selectedMaterial.id, formData);
        const [updatedRes, conteosRes] = await Promise.all([
          getMaterialById(selectedMaterial.id),
          getMaterialConteos(selectedMaterial.id),
        ]);
        const updatedMaterial = { ...updatedRes.data, prestados: conteosRes.data.prestados, enReparacion: conteosRes.data.enReparacion } as IMaterial;
        setMaterials(prev => prev.map(m => m.id === selectedMaterial.id ? updatedMaterial : m));
      } else {
        const toSend = { ...formData, cantidadDisponible: formData.cantidadTotal };
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
      }
      setMaterialModalVisible(false);
    } catch (error) {
      console.error('Error al guardar material', error);
    }
  };

  const handleStatusUpdate = async (id: number, estado: string) => {
    try {
      await updateMaterialStatus(id, estado);
      const [updatedRes, conteosRes] = await Promise.all([
        getMaterialById(id),
        getMaterialConteos(id),
      ]);
      const updatedMaterial = { ...updatedRes.data, prestados: conteosRes.data.prestados, enReparacion: conteosRes.data.enReparacion } as IMaterial;
      setMaterials(prev => prev.map(m => m.id === id ? updatedMaterial : m));
    } catch (error) {
      console.error('Error al actualizar estado', error);
    }
  };

  // Handlers para Categoría
  const handleAddCategory = () => {
    setCategoryFormData({});
    setSelectedCategory(null);
    setCategoryModalVisible(true);
  };

  const handleEditCategory = (category: ICategoria) => {
    setSelectedCategory(category);
    setCategoryFormData(category);
    setCategoryModalVisible(true);
  };

  const handleCategorySubmit = async () => {
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, categoryFormData);
      } else {
        await createCategory(categoryFormData);
      }
      setCategoryModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Error al guardar categoría', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategory(id);
      fetchData();
    } catch (error) {
      console.error('Error al eliminar categoría', error);
    }
  };

  // Filtrar materiales
  const filteredMaterials = materials.filter(material =>
    material.nombreMaterial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <AppstoreOutlined className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gestión de Materiales
                </h1>
                <p className="text-xs text-gray-500">Administra tu inventario de forma eficiente</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar materiales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <SearchOutlined className="absolute left-3 top-2.5 text-lg text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Materiales</p>
                <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <InboxOutlined className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">
                  {materials.reduce((acc, m) => acc + m.cantidadDisponible, 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckOutlined className="text-2xl text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Prestados</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {materials.reduce((acc, m) => acc + (m.prestados || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <ReloadOutlined className="text-2xl text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En Reparación</p>
                <p className="text-2xl font-bold text-red-600">
                  {materials.reduce((acc, m) => acc + (m.enReparacion || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <ToolOutlined className="text-2xl text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleAddMaterial}
            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <PlusOutlined className="text-lg mr-2" />
            Nuevo Material
          </button>
          <button
            onClick={handleAddCategory}
            className="inline-flex items-center px-4 py-2.5 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
          >
            <TagsOutlined className="text-lg mr-2" />
            Gestionar Categorías
          </button>
        </div>

        {/* Materials Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inventario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center">
                        <ReloadOutlined className="text-2xl text-blue-500 animate-spin" />
                        <span className="ml-3 text-gray-500">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron materiales
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((material) => (
                    <tr key={material.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {material.nombreMaterial}
                          </div>
                          <div className="text-sm text-gray-500">
                            {material.descripcion || 'Sin descripción'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {categories.find(c => c.id === material.categoriaId)?.nombreCategoria || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-4 text-sm">
                          <div>
                            <span className="text-gray-500">Total:</span>
                            <span className="ml-1 font-medium text-gray-900">{material.cantidadTotal}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Disp:</span>
                            <span className="ml-1 font-medium text-green-600">{material.cantidadDisponible}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Prest:</span>
                            <span className="ml-1 font-medium text-yellow-600">{material.prestados || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Rep:</span>
                            <span className="ml-1 font-medium text-red-600">{material.enReparacion || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={material.estado}
                          onChange={(e) => handleStatusUpdate(material.id, e.target.value)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg border-0 focus:ring-2 focus:ring-offset-2 transition-all duration-200 cursor-pointer ${
                            material.estado === 'Disponible'
                              ? 'bg-green-100 text-green-800 focus:ring-green-500'
                              : 'bg-red-100 text-red-800 focus:ring-red-500'
                          }`}
                        >
                          <option value="Disponible">Disponible</option>
                          <option value="No Disponible">No Disponible</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditMaterial(material)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          >
                            <EditOutlined className="text-lg" />
                          </button>
                          <button
                            onClick={() => openReparacionModal(material)}
                            disabled={!(material.cantidadDisponible > 0)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ToolOutlined className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Material Modal - Corregido */}
      {materialModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop sin click handler */}
          <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-white px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedMaterial ? "Editar Material" : "Nuevo Material"}
                </h3>
                <button
                  onClick={() => setMaterialModalVisible(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <CloseOutlined className="text-xl text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Material
                  </label>
                  <input
                    type="text"
                    value={formData.nombreMaterial || ''}
                    onChange={(e) => setFormData({ ...formData, nombreMaterial: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.categoriaId || ''}
                    onChange={(e) => setFormData({ ...formData, categoriaId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.nombreCategoria}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion || ''}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad Total
                    </label>
                    <input
                      type="number"
                      value={formData.cantidadTotal || ''}
                      onChange={(e) => setFormData({ ...formData, cantidadTotal: parseInt(e.target.value) })}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  {selectedMaterial && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad Disponible
                      </label>
                      <input
                        type="number"
                        value={formData.cantidadDisponible || ''}
                        onChange={(e) => setFormData({ ...formData, cantidadDisponible: parseInt(e.target.value) })}
                        min="0"
                        max={formData.cantidadTotal || undefined}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.estado || 'Disponible'}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="No Disponible">No Disponible</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
              <button
                onClick={() => setMaterialModalVisible(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleMaterialSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {selectedMaterial ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repair Modal - Corregido */}
      {reparacionModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop sin click handler */}
          <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-white px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Enviar a Reparación - {selectedMaterial?.nombreMaterial}
                </h3>
                <button
                  onClick={() => setReparacionModalVisible(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <CloseOutlined className="text-xl text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de envío
                  </label>
                  <input
                    type="datetime-local"
                    value={repairFormData.fechaEnvio || ''}
                    onChange={(e) => setRepairFormData({ ...repairFormData, fechaEnvio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción de la falla
                  </label>
                  <textarea
                    value={repairFormData.descripcionFalla || ''}
                    onChange={(e) => setRepairFormData({ ...repairFormData, descripcionFalla: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo (opcional)
                  </label>
                  <input
                    type="number"
                    value={repairFormData.costo || ''}
                    onChange={(e) => setRepairFormData({ ...repairFormData, costo: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad a enviar
                  </label>
                  <input
                    type="number"
                    value={repairFormData.cantidad || ''}
                    onChange={(e) => setRepairFormData({ ...repairFormData, cantidad: parseInt(e.target.value) })}
                    min="1"
                    max={selectedMaterial?.cantidadDisponible || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
              <button
                onClick={() => setReparacionModalVisible(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleReparacionSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-lg hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Enviar a Reparación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal - Corregido */}
      {categoryModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop sin click handler */}
          <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-white px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCategory ? "Editar Categoría" : "Nueva Categoría"}
                </h3>
                <button
                  onClick={() => setCategoryModalVisible(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <CloseOutlined className="text-xl text-gray-400" />
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Categoría
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.nombreCategoria || ''}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, nombreCategoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={categoryFormData.descripcion || ''}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, descripcion: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Categorías Existentes</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{category.nombreCategoria}</p>
                        <p className="text-xs text-gray-500">{category.descripcion || 'Sin descripción'}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        >
                          <EditOutlined className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <DeleteOutlined className="text-lg" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
              <button
                onClick={() => setCategoryModalVisible(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleCategorySubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                {selectedCategory ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialPage;