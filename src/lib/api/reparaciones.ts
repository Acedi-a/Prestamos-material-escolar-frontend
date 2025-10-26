import api from "../api";

export interface IReparacion {
    id: number;
    materialId: number;
    material?: {
        id: number;
        nombreMaterial?: string;
    } | null;
    fechaEnvio: string; // ISO
    fechaRetorno?: string | null; 
    descripcionFalla: string;
    costo: number;
    cantidad: number;
}

// Tipo para crear una nueva reparación.
export interface IEnviarReparacion {
  materialId: number;
  fechaEnvio: string; // ISO
  descripcionFalla: string;
  costo?: number | null;
  cantidad: number;
}

// Tipo para actualizar una reparación existente
export type UpdateReparacionRequest = Partial<
    Omit<IReparacion, "id" | "material">
>;

// --- Funciones de la API ---

// GET /api/Reparacion
export const getAllReparaciones = () => api.get<IReparacion[]>("/api/Reparacion");

// GET /api/Reparacion/{id}
export const getReparacionById = (id: number) => api.get<IReparacion>(`/api/Reparacion/${id}`);

// POST /api/Reparacion
export const registrarReparacion = (payload: IEnviarReparacion) =>
  api.post("/api/Reparacion", payload);

// PUT /api/Reparacion/{id}
export const updateReparacion = (id: number, body: UpdateReparacionRequest) =>
    api.put<IReparacion>(`/api/Reparacion/${id}`, body);

// DELETE /api/Reparacion/{id}
export const deleteReparacion = (id: number) => api.delete(`/api/Reparacion/${id}`);
