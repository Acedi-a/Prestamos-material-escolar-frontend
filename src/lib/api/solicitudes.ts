import api from "../api";

// --- Interfaces para la Lista de Solicitudes ---


export interface ISolicitud {
    id: number;
    docenteId: number;
    docenteNombre?: string; 
    estadoSolicitud: string;
    fechaSolicitud: string; 
}


export interface ISolicitudDetalle {
    id: number;
    materialId: number;
    cantidadSolicitada: number;
    nombreMaterial: string; 
}


export interface ISolicitudCompleta extends ISolicitud {
    detalles: ISolicitudDetalle[];
}


// --- Funciones de API ---


export const getSolicitudesByDocenteId = (docenteId: number) =>
    api.get<ISolicitud[]>(`/api/Solicitud/PorDocente/${docenteId}`);


export const getSolicitudDetallesById = (id: number) =>
    api.get<ISolicitudCompleta>(`/api/Solicitud/${id}`);




export const getAllSolicitudes = () =>
    api.get<ISolicitud[]>("/api/Solicitud");


export const aprobarSolicitud = (solicitudId: number, fechaDevolucionPrevista: Date) => {
  // Convertimos a formato ISO UTC
  const fechaISO = fechaDevolucionPrevista.toISOString();
  // Enviamos { FechaDevolucionPrevista: "..." } (PascalCase y formato ISO)
  return api.post(`/api/Solicitud/${solicitudId}/aprobar`, { FechaDevolucionPrevista: fechaISO });
}


export const rechazarSolicitud = (solicitudId: number) =>
    api.post(`/api/Solicitud/${solicitudId}/rechazar`);