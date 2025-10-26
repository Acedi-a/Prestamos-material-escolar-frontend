import api from "../api";

// Contrato exacto esperado por el backend
export interface ILoginRequest {
	nombreUsuarioOrEmail: string;
	password: string;
}

export interface ILoginResponse {
	usuarioId: number;
	rolId: number;
	nombreRol: string;
	nombreUsuario: string;
	email: string;
	token: string;
}

export const authenticateUser = (credentials: ILoginRequest) =>
	api.post<ILoginResponse>("/api/Auth/login", credentials);
