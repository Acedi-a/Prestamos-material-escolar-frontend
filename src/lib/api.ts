import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7282",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    Pragma: "no-cache",
    "Cache-Control": "no-cache",
  },
});

// Interfaces
export interface IMaterial {
  id: number;
  categoriaId: number;
  nombreMaterial: string;
  descripcion?: string;
  cantidadTotal: number;
  cantidadDisponible: number;
  estado: string;
}

export interface ICategoria {
  id: number;
  nombreCategoria: string;
  descripcion?: string;
}

// Material API functions
export const getAllMaterials = () => api.get<IMaterial[]>("/api/Material");
export const getMaterialById = (id: number) => api.get<IMaterial>(`/api/Material/${id}`);
export const createMaterial = (material: Omit<IMaterial, "id" | "cantidadDisponible">) => 
  api.post("/api/Material", {
    categoriaId: material.categoriaId,
    nombre: material.nombreMaterial,
    descripcion: material.descripcion,
    cantidadInicial: material.cantidadTotal,
    estado: material.estado
  });
export const updateMaterialStatus = (id: number, estado: string) => 
  api.put(`/api/Material/${id}/estado`, { estado });
export const getMaterialAvailability = (id: number) => 
  api.get<{ cantidadDisponible: number, estado: string }>(`/api/Material/${id}/disponibilidad`);

// Categoria API functions
export const getAllCategories = () => api.get<ICategoria[]>("/api/Categoria");
export const getCategoryById = (id: number) => api.get<ICategoria>(`/api/Categoria/${id}`);
export const createCategory = (categoria: Omit<ICategoria, "id">) => 
  api.post("/api/Categoria", {
    nombreCategoria: categoria.nombreCategoria,
    descripcion: categoria.descripcion
  });
export const updateCategory = (id: number, categoria: Omit<ICategoria, "id">) => 
  api.put(`/api/Categoria/${id}`, {
    nombreCategoria: categoria.nombreCategoria,
    descripcion: categoria.descripcion
  });
export const deleteCategory = (id: number) => api.delete(`/api/Categoria/${id}`);

export default api;
