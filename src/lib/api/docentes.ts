import api from "../api";

// --- Interfaces de Dominio (Existentes) ---
export interface RolDTO {
    id: number;
    nombreRol: string;
}

export interface UsuarioCreateRequest {
    rolId: number;
    nombreUsuario: string;
    email: string;
    contrasena: string;
}

export interface UsuarioCreateResponse {
    id: number;
}

export interface DocenteCreateRequest {
    usuarioId: number;
    nombre: string;
    apellido: string;
    cedulaIdentidad: string;
}

// --- NUEVAS Interfaces para Edición ---

/**
 * Representa la respuesta de: GET /api/Usuario/{id}
 */
export interface UsuarioDTO {
  id: number;
  rolId: number;
  nombreUsuario: string;
  email: string;
}

/**
 * Representa la respuesta de: GET /api/Docente/PorUsuario/{usuarioId}
 */
export interface DocenteDTO {
  id: number; // ⬅️ ID del Docente (para el PUT)
  nombre: string;
  apellido: string;
  cedulaIdentidad: string;
  usuarioId: number;
}

/**
 * Representa el 'body' para: PUT /api/Usuario/{id}
 */
export interface UsuarioUpdateRequest {
  rolId: number;
  nombreUsuario: string;
  email: string;
}

/**
 * Representa el 'body' para: PUT /api/Docente/{id}
 */
export interface DocenteUpdateRequest {
  usuarioId: number;
  nombre: string;
  apellido: string;
  cedulaIdentidad: string;
}


// --- Funciones de API (Existentes) ---

export const getRoles = () => api.get<RolDTO[]>("/api/Rol");

export const createUsuario = (payload: UsuarioCreateRequest) =>
    api.post<UsuarioCreateResponse>("/api/Usuario", payload);

export const createDocente = (payload: DocenteCreateRequest) =>
    api.post<void>("/api/Docente", payload);

    
// --- NUEVAS Funciones de API para Edición ---

/**
 * GET: /api/Usuario/{id}
 */
export const getUsuarioById = (id: number) => {
  return api.get<UsuarioDTO>(`/api/Usuario/${id}`);
};

/**
 * GET: /api/Docente/PorUsuario/{usuarioId}
 * (Usa el endpoint que creamos en el backend)
 */
export const getDocenteByUsuarioId = (usuarioId: number) => {
  return api.get<DocenteDTO>(`/api/Docente/PorUsuario/${usuarioId}`);
};

/**
 * PUT: /api/Usuario/{id}
 */
export const updateUsuario = (id: number, payload: UsuarioUpdateRequest) => {
  return api.put<void>(`/api/Usuario/${id}`, payload);
};

/**
 * PUT: /api/Docente/{docenteId}
 * (OJO: El ID aquí es el 'docenteId', no el 'usuarioId')
 */
export const updateDocente = (docenteId: number, payload: DocenteUpdateRequest) => {
  return api.put<void>(`/api/Docente/${docenteId}`, payload);
};