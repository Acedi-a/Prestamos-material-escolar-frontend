import api from "../api";

export interface IPrestamo {
  id: number;
  solicitudId: number;
  fechaPrestamo: string; // ISO
  fechaDevolucionPrevista: string; // ISO
  estadoPrestamo: "Activo" | "Devuelto" | string;
}

export interface RegistrarDevolucionRequest {
  prestamoId: number;
  observaciones: string;
}

export const getAllPrestamos = () => api.get<IPrestamo[]>("/api/Prestamo");
export const getPrestamoById = (id: number) => api.get<IPrestamo>(`/api/Prestamo/${id}`);

export const registrarDevolucion = (payload: RegistrarDevolucionRequest) =>
  api.post("/api/Devolucion", payload);
