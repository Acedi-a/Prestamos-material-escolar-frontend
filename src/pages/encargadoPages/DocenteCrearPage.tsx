import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRoles,
  createUsuario,
  createDocente,
  RolDTO,
  UsuarioCreateRequest,
  DocenteCreateRequest,
  getUsuarioById,
  getDocenteByUsuarioId,
  updateUsuario,
  updateDocente,
  UsuarioUpdateRequest,
  DocenteUpdateRequest,
} from "../../lib/api/docentes";
import {
  UserAddOutlined,
  TeamOutlined,
  IdcardOutlined,
  MailOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Alert, Breadcrumb, Steps } from "antd";

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
              getUsuarioById(parseInt(usuarioId, 10)),
              getDocenteByUsuarioId(parseInt(usuarioId, 10)),
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

    const stepsItems = useMemo(
      () => [
        {
          title: "Datos personales",
          description: "Información del docente",
          icon: <IdcardOutlined />,
        },
        {
          title: "Acceso del usuario",
          description: "Credenciales de la plataforma",
          icon: <UserOutlined />,
        },
        {
          title: isEditMode ? "Actualizar" : "Registrar",
          description: isEditMode ? "Revisión final" : "Crear nuevo usuario",
          icon: <SafetyCertificateOutlined />,
        },
      ],
      [isEditMode]
    );

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
          await updateUsuario(parseInt(usuarioId!, 10), usuarioUpdateData);

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
        if (err.response?.data?.message) {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <UserAddOutlined className="text-2xl text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {isEditMode ? "Actualizar Usuario" : "Registrar Usuario"}
                  </h1>
                  <p className="text-xs text-gray-500">Gestiona credenciales y datos personales en un mismo flujo</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <Breadcrumb
                  items={[
                    { title: "Panel", href: "/materiales" },
                    { title: "Usuarios", href: "/usuarioslistar" },
                    { title: isEditMode ? "Editar docente" : "Nuevo docente" },
                  ]}
                />
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                >
                  <ArrowLeftOutlined className="mr-1" /> Regresar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-sm p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Flujo de registro</h2>
                <p className="text-sm text-gray-500">Completa la información en dos pasos; luego confirma para {isEditMode ? "actualizar" : "crear"} la cuenta.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg flex items-center gap-2">
                  <TeamOutlined /> {isEditMode ? "Modo edición" : "Nuevo registro"}
                </div>
                {success && (
                  <div className="px-3 py-2 bg-green-50 text-green-600 text-sm font-medium rounded-lg flex items-center gap-2">
                    <CheckCircleOutlined /> Guardado recientemente
                  </div>
                )}
              </div>
            </div>

            <Steps items={stepsItems} current={success ? 2 : 1} size="small" className="mb-8" />

            <form onSubmit={handleSubmit} className="space-y-6">
              {(error || success) && (
                <Alert
                  type={error ? "error" : "success"}
                  message={error || success || ""}
                  showIcon
                  className="rounded-xl"
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                      <IdcardOutlined className="text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Datos del usuario</h3>
                      <p className="text-sm text-gray-500">Información personal para identificar al docente</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre completo</label>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          placeholder="Nombre(s)"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        <input
                          type="text"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleChange}
                          placeholder="Apellido(s)"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Cédula de identidad</label>
                      <div className="relative">
                        <IdcardOutlined className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          name="cedulaIdentidad"
                          value={formData.cedulaIdentidad}
                          onChange={handleChange}
                          placeholder="Ej: 12345678"
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Rol asignado</label>
                      <div className="relative">
                        <SafetyCertificateOutlined className="absolute left-3 top-3 text-gray-400" />
                        <select
                          name="rolId"
                          value={formData.rolId}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="" disabled>Selecciona un rol</option>
                          {roles.map((rol) => (
                            <option key={rol.id} value={rol.id}>
                              {rol.nombreRol}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                      <MailOutlined className="text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Credenciales de acceso</h3>
                      <p className="text-sm text-gray-500">Correo y nombre de usuario para ingresar a la plataforma</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Correo electrónico</label>
                      <div className="relative">
                        <MailOutlined className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="docente@colegio.edu"
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre de usuario</label>
                      <div className="relative">
                        <UserOutlined className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          name="nombreUsuario"
                          value={formData.nombreUsuario}
                          onChange={handleChange}
                          placeholder="usuario.docente"
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    {!isEditMode ? (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Contraseña temporal</label>
                        <input
                          type="password"
                          name="contrasena"
                          value={formData.contrasena}
                          onChange={handleChange}
                          placeholder="Genera una contraseña provisional"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        <p className="text-xs text-gray-400 mt-1">Se recomienda actualizarla en el primer inicio de sesión.</p>
                      </div>
                    ) : (
                      <div className="p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500">
                        La contraseña actual permanecerá igual. Puedes realizar un restablecimiento desde "Usuarios" si es necesario.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-dashed border-gray-200">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <TeamOutlined className="text-base" />
                  {isEditMode
                    ? "Al actualizar, se notificará el cambio en la lista de usuarios."
                    : "Una vez creado, encontrarás al usuario en la sección Usuarios."}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/usuarioslistar")}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
                  >
                    {isLoading ? "Guardando..." : isEditMode ? "Actualizar docente" : "Crear docente"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  export default CrearUsuarioDocentePage;