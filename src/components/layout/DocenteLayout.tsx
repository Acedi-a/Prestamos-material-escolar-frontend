import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
    HomeOutlined, 
    LogoutOutlined, 
    UserOutlined, 
    MenuFoldOutlined, 
    MenuUnfoldOutlined,
    ShoppingOutlined, // Importado
    HistoryOutlined  // Importado
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { useMemo, useState } from "react";

type NavItem = { key: string; label: string; icon?: React.ReactNode };

const DocenteLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Añadimos los nuevos items de navegación
  const nav: NavItem[] = [
    { key: "/docente/solicitar", label: "Solicitar Material", icon: <ShoppingOutlined /> }, 
    { key: "/docente/solicitudes", label: "Mis Solicitudes", icon: <HistoryOutlined /> }, 
  ];

  // Lógica para resaltar el menú activo (considerando subrutas)
  const selectedKeys = (() => {
    let match = nav.find((i) => location.pathname === i.key); // Busca match exacto
    if (!match) {
        // Si no hay match exacto, busca el que "empieza con" más largo
        const matchingItems = nav.filter((i) => location.pathname.startsWith(i.key) && i.key !== "/");
        if (matchingItems.length > 0) {
            // Ordena por longitud de key descendente y toma el primero
            match = matchingItems.sort((a, b) => b.key.length - a.key.length)[0];
        }
    }
    // Si aún no hay match (ej. ruta no encontrada), selecciona "Inicio" por defecto si estamos en /docente/*
    if (!match && location.pathname.startsWith('/docente')) {
        match = nav.find(i => i.key === '/docente');
    }
    return match ? [match.key] : [];
  })();


  const initials = useMemo(() => {
    const name = user?.nombreUsuario || user?.email || "U";
    const parts = name.trim().split(" ").filter(Boolean);
    const first = parts[0]?.[0] || name[0];
    const second = parts.length > 1 ? parts[1][0] : "";
    return (first + second).toUpperCase();
  }, [user?.nombreUsuario, user?.email]);

  const roleLabel = useMemo(() => (user?.nombreRol ? user.nombreRol : "Usuario"), [user?.nombreRol]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div
        className={`flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-56"
        }`}
        style={{
          background: "linear-gradient(180deg, #001529 0%, #002140 35%, #0a2a5e 100%)",
        }}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-2.5 p-4 overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold shadow-[0_2px_8px_rgba(82,196,26,0.35)] flex-shrink-0">
            DC
          </div>
          {!collapsed && (
            <span className="text-white font-semibold tracking-tight transition-opacity duration-300">
              Panel Docente
            </span>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-2">
          {nav.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-all duration-200 rounded-lg ${
                selectedKeys.includes(item.key)
                  ? "bg-blue-600 text-white shadow-lg transform scale-[1.02]"
                  : "text-gray-300 hover:bg-blue-700 hover:text-white hover:transform hover:translate-x-1"
              }`}
            >
              <span className={`text-lg transition-all duration-300 ${collapsed ? 'mx-auto' : ''}`}>{item.icon}</span>
              {!collapsed && (
                <span className="transition-all duration-300">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/15">
          {/* User Section */}
          <div className="p-3">
            {collapsed ? (
              <div className="space-y-2">
                <div className="flex justify-center" title={user?.nombreUsuario || user?.email}>
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 transition-transform duration-200 hover:scale-110">
                    <UserOutlined />
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-2 px-1 rounded transition-all duration-200 font-medium hover:shadow-lg active:scale-95"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 bg-white/6 p-2.5 rounded-xl transition-all duration-200 hover:bg-white/10">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold transition-transform duration-200 hover:scale-110">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-white font-semibold truncate transition-all duration-300"
                      title={user?.nombreUsuario || user?.email}
                    >
                      {user?.nombreUsuario || user?.email}
                    </div>
                    <div className="text-slate-300 text-xs transition-all duration-300">{roleLabel}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 hover:shadow-lg active:scale-95"
                >
                  <LogoutOutlined />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

          {/* Toggle Button */}
          <div className="p-3 pt-0">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 group"
            >
              <div className="flex items-center gap-2">
                {collapsed ? (
                  <MenuUnfoldOutlined className="text-lg transition-transform duration-300 group-hover:rotate-12" />
                ) : (
                  <>
                    <MenuFoldOutlined className="text-lg transition-transform duration-300 group-hover:-rotate-12" />
                    <span className="text-sm font-medium">Contraer</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300">
        {/* Header */}
        <header className="bg-white px-4 py-4 shadow-sm">
          <h5 className="text-lg font-medium m-0">Panel Docente</h5>
        </header>

        {/* Content */}
        <main className="flex-1 p-4">
          <div className="bg-white p-4 min-h-[360px] rounded-lg shadow-sm transition-all duration-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocenteLayout;