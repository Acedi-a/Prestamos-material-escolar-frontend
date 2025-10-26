import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // ⬅️ Importamos hooks de Ruteo
import {
  
  getRoles,
  createUsuario,
  createDocente,
  RolDTO,
  UsuarioCreateRequest,
  UsuarioCreateResponse,
  DocenteCreateRequest,

  
  getUsuarioById,
  getDocenteByUsuarioId,
  updateUsuario,
  updateDocente,
  UsuarioUpdateRequest,
  DocenteUpdateRequest,
} from "../../lib/api/docentes"; 


const initialFormData = {
  
  nombreUsuario: "",
  email: "",
  contrasena: "",
  rolId: "", 
  
  nombre: "",
  apellido: "",
  cedulaIdentidad: "",
};

const CrearUsuarioDocentePage: React.FC = () => {
  
  const [formData, setFormData] = useState(initialFormData);
  const [roles, setRoles] = useState<RolDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { usuarioId } = useParams<{ usuarioId: string }>(); 
  const navigate = useNavigate(); 
  const isEditMode = Boolean(usuarioId); 

  
  const [docenteIdToUpdate, setDocenteIdToUpdate] = useState<number | null>(null);


  useEffect(() => {
    const listarRoles = async () => {
      try {
        const response = await getRoles();
        setRoles(response.data);
      } catch (err) {
        console.error("Error al cargar roles: ", err);
        setError("Error al cargar roles. Revise la conexión con la API.");
      }
    };
    listarRoles();
  }, []);

  
  useEffect(() => {
    if (isEditMode && usuarioId) {
      const loadEditData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          
          const [userRes, docenteRes] = await Promise.all([
            getUsuarioById(parseInt(usuarioId)),
            getDocenteByUsuarioId(parseInt(usuarioId))
          ]);

          const userData = userRes.data;
          const docenteData = docenteRes.data;

          
          setFormData({
            nombreUsuario: userData.nombreUsuario,
            email: userData.email,
            rolId: userData.rolId.toString(),
            nombre: docenteData.nombre,
            apellido: docenteData.apellido,
            cedulaIdentidad: docenteData.cedulaIdentidad,
            contrasena: "", 
          });

          
          setDocenteIdToUpdate(docenteData.id);

        } catch (err) {
          setError("Error al cargar los datos del docente para editar.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      loadEditData();
    }
  }, [isEditMode, usuarioId]); 

  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!formData.rolId) {
      setError("Por favor, selecciona un rol.");
      setIsLoading(false);
      return;
    }

    try {
      
      if (isEditMode) {
        
        if (!docenteIdToUpdate) { 
            setError("No se pudo encontrar el ID del docente a actualizar.");
            setIsLoading(false);
            return;
        }

        
        const usuarioUpdateData: UsuarioUpdateRequest = {
          rolId: parseInt(formData.rolId, 10),
          nombreUsuario: formData.nombreUsuario,
          email: formData.email,
        };
        await updateUsuario(parseInt(usuarioId!), usuarioUpdateData);

        
        const docenteUpdateData: DocenteUpdateRequest = {
          usuarioId: parseInt(usuarioId!, 10), 
          nombre: formData.nombre,
          apellido: formData.apellido,
          cedulaIdentidad: formData.cedulaIdentidad,
        };
        await updateDocente(docenteIdToUpdate, docenteUpdateData); 
        
        setSuccess("¡Usuario y Docente actualizados con éxito!");

      } else {
        
        
        
        const usuarioData: UsuarioCreateRequest = {
          rolId: parseInt(formData.rolId, 10),
          nombreUsuario: formData.nombreUsuario,
          email: formData.email,
          contrasena: formData.contrasena,
        };
        const usuarioResponse = await createUsuario(usuarioData);
        const newUsuarioId = usuarioResponse.data.id;

        
        const docenteData: DocenteCreateRequest = {
          usuarioId: newUsuarioId,
          nombre: formData.nombre,
          apellido: formData.apellido,
          cedulaIdentidad: formData.cedulaIdentidad,
        };
        await createDocente(docenteData);

        setSuccess(`¡Usuario y Docente creados con éxito! (Usuario ID: ${newUsuarioId})`);
        setFormData(initialFormData); 
      }

      
      setTimeout(() => {
        navigate("/usuarioslistar");
      }, 1500); 

    } catch (err: any) {
      
      let errorMessage = "Ocurrió un error al guardar.";
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = `Error de la API: ${err.response.data.message}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error(err);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Título dinámico */}
      <h1 className="text-2xl font-bold mb-4 text-center">
        {isEditMode ? "Editar Usuario (Docente)" : "Registrar Nuevo Usuario (Docente)"}
      </h1>

      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded-2xl shadow">
        
        {/* --- Mensajes de estado --- */}
        {error && (
          <div className="p-3 mb-4 bg-red-100 text-red-700 border border-red-300 rounded">
            {error}
          </div>
        )}
        {success && (
            <div className="p-3 mb-4 bg-green-100 text-green-700 border border-green-300 rounded">
            {success}
            </div>
        )}

        {/* --- Campos del Docente --- */}
        <fieldset className="border p-4 rounded mb-4">
          <legend className="font-semibold px-2">Datos Personales (Docente)</legend>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre(s)"
              value={formData.nombre}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              name="apellido"
              placeholder="Apellido(s)"
              value={formData.apellido}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              name="cedulaIdentidad"
              placeholder="Cédula de Identidad"
              value={formData.cedulaIdentidad}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
          </div>
        </fieldset>

        {/* --- Campos del Usuario --- */}
        <fieldset className="border p-4 rounded">
          <legend className="font-semibold px-2">Datos de Acceso (Usuario)</legend>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              name="nombreUsuario"
              placeholder="Nombre de Usuario"
              value={formData.nombreUsuario}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Correo Electrónico"
              value={formData.email}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            
            {/* Ocultar contraseña en modo edición */}
            {!isEditMode && (
              <input
                type="password"
                name="contrasena"
                placeholder="Contraseña"
                value={formData.contrasena}
                onChange={handleChange}
                className="border p-2 rounded"
                required={!isEditMode} // Solo requerido si no estamos editando
              />
            )}
            
            {/* Si estamos editando, mostramos un campo deshabilitado */}
            {isEditMode && (
                 <input
                    type="password"
                    name="contrasena"
                    placeholder="(Contraseña sin cambios)"
                    value="" 
                    onChange={handleChange}
                    className="border p-2 rounded bg-gray-100 cursor-not-allowed"
                    disabled 
              />
            )}

            <select
              name="rolId"
              value={formData.rolId}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            >
              <option value="" disabled>-- Seleccionar Rol --</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombreRol}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {/* --- Botón de Envío --- */}
        <div className="mt-4 text-center">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            disabled={isLoading}
          >
            {/* Texto de botón dinámico */}
            {isLoading ? "Guardando..." : (isEditMode ? "Actualizar" : "Guardar")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CrearUsuarioDocentePage;