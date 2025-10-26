import api from "../api";

export interface IReparacion {
	id: number;
	materialId: number;
	material?: {
		id: number;
		nombreMaterial?: string;
	} | null;
	fechaEnvio: string; // ISO
	fechaRetorno?: string | null; // ISO o null si no retornó
	descripcionFalla: string;
	costo: number;
	cantidad: number;
}

export type CreateReparacionRequest = Omit<IReparacion, "id" | "material" | "fechaRetorno"> & {
	fechaRetorno?: string | null;
};

export type UpdateReparacionRequest = Partial<
	Omit<IReparacion, "id" | "material">
>;

// GET /api/Reparacion
export const getAllReparaciones = () => api.get<IReparacion[]>("/api/Reparacion");

// GET /api/Reparacion/{id}
export const getReparacionById = (id: number) => api.get<IReparacion>(`/api/Reparacion/${id}`);

// POST /api/Reparacion
export const createReparacion = (body: CreateReparacionRequest) =>
	api.post<IReparacion>("/api/Reparacion", body);

// PUT /api/Reparacion/{id}
export const updateReparacion = (id: number, body: UpdateReparacionRequest) =>
	api.put<IReparacion>(`/api/Reparacion/${id}`, body);

// DELETE /api/Reparacion/{id}
export const deleteReparacion = (id: number) => api.delete(`/api/Reparacion/${id}`);
