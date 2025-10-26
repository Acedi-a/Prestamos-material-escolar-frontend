import api from "../api";

export interface IMaterial {
	id: number;
	categoriaId: number;
	nombreMaterial: string;
	descripcion?: string;
	cantidadTotal: number;
	cantidadDisponible: number;
	estado: string;
}

export const getAllMaterials = () => api.get<IMaterial[]>("/api/Material");
export const getMaterialById = (id: number) => api.get<IMaterial>(`/api/Material/${id}`);
export const createMaterial = (material: Omit<IMaterial, "id" | "cantidadDisponible">) =>
	api.post("/api/Material", {
		categoriaId: material.categoriaId,
		nombre: material.nombreMaterial,
		descripcion: material.descripcion,
		cantidadInicial: material.cantidadTotal,
		estado: material.estado,
	});
export const updateMaterialStatus = (id: number, estado: string) =>
	api.put(`/api/Material/${id}/estado`, { estado });
export const getMaterialAvailability = (id: number) =>
	api.get<{ cantidadDisponible: number; estado: string }>(`/api/Material/${id}/disponibilidad`);
