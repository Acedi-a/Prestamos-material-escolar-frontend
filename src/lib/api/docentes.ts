import api from "../api";

// Interfaces de dominio
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

// API functions
export const getRoles = () => api.get<RolDTO[]>("/api/Rol");

export const createUsuario = (payload: UsuarioCreateRequest) =>
	api.post<UsuarioCreateResponse>("/api/Usuario", payload);

export const createDocente = (payload: DocenteCreateRequest) =>
	api.post<void>("/api/Docente", payload);
