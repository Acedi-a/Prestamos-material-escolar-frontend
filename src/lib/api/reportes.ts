import api from "../api";
import type { IPrestamo } from "./prestamos";
import type { IDevolucion } from "./devoluciones";

export interface ReportePrestamosDevoluciones {
  prestamos: IPrestamo[];
  devoluciones: IDevolucion[];
}

export interface ReporteParams {
  desde: string; // ISO
  hasta: string; // ISO
  usuarioId: number;
}

export const getReportePrestamosYDevoluciones = ({ desde, hasta, usuarioId }: ReporteParams) =>
  api.get<ReportePrestamosDevoluciones>("/api/Reporte/prestamos-y-devoluciones", {
    params: { desde, hasta, usuarioId },
  });
