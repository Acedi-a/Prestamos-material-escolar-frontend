import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  CrownOutlined,
  MailOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_URL = "https://localhost:7282/api";

interface IUsuario {
  id: number;
  rolId: number;
  nombreUsuario: string;
  email: string;
}

interface IRol {
  id: number;
  nombreRol: string;
}

const UsuariosPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [usuarios, setUsuarios] = useState<IUsuario[]>([]);
  const [roles, setRoles] = useState<IRol[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Map de roles para búsquedas/render
  const rolesMap = useMemo(() => {
    const map = new Map<number, string>();
    roles.forEach((r) => map.set(r.id, r.nombreRol));
    return map;
  }, [roles]);

  const fetchData = useCallback(async () => {
    if (!user?.usuarioId) return;

    try {
      setLoading(true);

      const [usuariosRes, rolesRes] = await Promise.all([
        axios.get<IUsuario[]>(`${API_URL}/Usuario`),

        axios.get<IRol[]>(`${API_URL}/Rol`),
      ]);

      const currentUserId = user.usuarioId;

      // Excluir al usuario actual

      const filtered = (usuariosRes.data || []).filter(
        (u) => u.id !== currentUserId,
      );

      setUsuarios(filtered);

      setRoles(rolesRes.data || []);
    } catch (err) {
      console.error("Error al cargar los datos de usuarios/roles", err);

      window.alert("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, [user?.usuarioId]);

  useEffect(() => {
    if (user?.usuarioId) {
      fetchData();
    }
  }, [fetchData, user?.usuarioId]);

  const handleAdd = () => {
    navigate("/docentecrear");
  };

  const handleEdit = (record: IUsuario) => {
    navigate(`/docentecrear/usuario/${record.id}`);
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm("¿Estás seguro de eliminar este usuario?");
    if (!ok) return;
    try {
      await axios.delete(`${API_URL}/Usuario/${id}`);
      window.alert("Usuario eliminado exitosamente");
      fetchData();
    } catch (err) {
      console.error("Error al eliminar el usuario", err);
      window.alert(
        "Error al eliminar el usuario. Es posible que tenga un docente asociado.",
      );
    }
  };

  // Helpers de estadísticas
  const totalUsuarios = usuarios.length;
  const totalRoles = roles.length;
  const rolesEnUso = useMemo(
    () => new Set(usuarios.map((u) => u.rolId)).size,
    [usuarios],
  );

  const { topRoleName, topRoleCount } = useMemo(() => {
    const counts = new Map<number, number>();
    usuarios.forEach((u) => {
      counts.set(u.rolId, (counts.get(u.rolId) || 0) + 1);
    });
    let maxCount = 0;
    let topId: number | null = null;
    counts.forEach((count, id) => {
      if (count > maxCount) {
        maxCount = count;
        topId = id;
      }
    });
    const name = topId != null ? rolesMap.get(topId) || "N/A" : "N/A";
    return { topRoleName: name, topRoleCount: maxCount };
  }, [usuarios, rolesMap]);

  // Filtro de búsqueda
  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return usuarios;
    return usuarios.filter((u) => {
      const rolName = rolesMap.get(u.rolId) || "";
      return (
        u.nombreUsuario?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        rolName.toLowerCase().includes(term)
      );
    });
  }, [usuarios, searchTerm, rolesMap]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <TeamOutlined className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gestión de Usuarios
                </h1>
                <p className="text-xs text-gray-500">
                  Administra usuarios y sus roles
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <SearchOutlined className="absolute left-3 top-2.5 text-lg text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalUsuarios}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <TeamOutlined className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Roles Disponibles</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {totalRoles}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <CrownOutlined className="text-2xl text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Roles en Uso</p>
                <p className="text-2xl font-bold text-purple-600">
                  {rolesEnUso}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <CrownOutlined className="text-2xl text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rol más común</p>
                <p className="text-sm font-medium text-gray-900">
                  {topRoleName}
                </p>
                <p className="text-xs text-gray-500">{topRoleCount} usuarios</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <MailOutlined className="text-2xl text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <PlusOutlined className="text-lg mr-2" />
            Nuevo Usuario
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center">
                        <ReloadOutlined className="text-2xl text-blue-500 animate-spin" />
                        <span className="ml-3 text-gray-500">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {u.nombreUsuario}
                        </div>
                        <div className="text-xs text-gray-500">ID: {u.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {rolesMap.get(u.rolId) || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(u)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Editar"
                          >
                            <EditOutlined className="text-lg" />
                          </button>
                          {/*
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Eliminar"
                          >
                            <DeleteOutlined className="text-lg" />
                          </button>
                          */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsuariosPage;
function useCallback<T extends (...args: any[]) => any>(
  fn: T,
  deps: React.DependencyList,
): T {
  // Delegar a React.useCallback para obtener la semántica esperada
  return React.useCallback(fn, deps) as T;
}
