import api from "../api";

export interface IEnviarReparacion {
  materialId: number;
  fechaEnvio: string; // ISO
  descripcionFalla: string;
  costo?: number | null;
  cantidad: number;
}

export const registrarReparacion = (payload: IEnviarReparacion) =>
  api.post("/api/Reparacion", payload);

export default registrarReparacion;
