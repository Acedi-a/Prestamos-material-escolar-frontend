import api from "../api";



export interface ISolicitud {
    id: number;
    docenteId: number;
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



export const getSolicitudesByDocenteId = (docenteId: number) =>
    api.get<ISolicitud[]>(`/api/Solicitud/PorDocente/${docenteId}`);


export const getSolicitudDetallesById = (id: number) =>
    api.get<ISolicitudCompleta>(`/api/Solicitud/${id}`);