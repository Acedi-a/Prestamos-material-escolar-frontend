import api from "../api";

export interface IMovimiento {
	id: number;
	materialId: number;
	tipoMovimiento: string;
	fechaMovimiento: string; // ISO
	cantidad: number;
	prestamoId?: number | null;
	materialNombre?: string;
}

export const getAllMovimientos = () => api.get<IMovimiento[]>("/api/Movimiento");
export const getMovimientoById = (id: number) => api.get<IMovimiento>(`/api/Movimiento/${id}`);

