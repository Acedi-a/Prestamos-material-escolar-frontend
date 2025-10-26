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

/// --- ================================== ---
// ---      NUEVO CÓDIGO AÑADIDO      ---
// --- ================================== ---

// --- Nuevas Interfaces para Solicitudes ---

/**
 * Representa la respuesta de: GET /api/Docente/PorUsuario/{id}
 * (La necesitamos para obtener el 'docenteId' a partir del 'usuarioId')
 */
export interface IDocente {
  id: number;
  usuarioId: number;
  nombre: string;
  apellido: string;
  cedulaIdentidad: string;
}

/**
 * Representa el 'body' para: POST /api/Solicitud
 * (Coincide con tu 'SolicitarReq' del backend)
 */
export interface ISolicitudRequest {
  docenteId: number;
  items: ISolicitudItem[];
}

export interface ISolicitudItem {
  materialId: number;
  cantidad: number;
}

// --- Nuevas Funciones de API para Solicitudes ---

/**
 * GET: /api/Docente/PorUsuario/{usuarioId}
 * Obtiene el perfil de Docente usando el ID del Usuario logeado.
 */
export const getDocenteByUsuarioId = (usuarioId: number) =>
  api.get<IDocente>(`/api/Docente/PorUsuario/${usuarioId}`);

/**
 * POST: /api/Solicitud
 * Envía la solicitud de materiales.
 */
export const createSolicitud = (payload: ISolicitudRequest) =>
  api.post<number>("/api/Solicitud", payload); // Esperamos que devuelva el ID