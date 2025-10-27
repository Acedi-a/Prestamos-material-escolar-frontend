import api from "../api";

export interface IDevolucion {
  id: number;
  prestamoId: number;
  fechaDevolucion: string; // ISO
  observaciones: string;
}

export const getAllDevoluciones = () => api.get<IDevolucion[]>("/api/Devolucion");
