import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";
import EncargadoLayout from "./components/layout/EncargadoLayout";
import DocenteLayout from "./components/layout/DocenteLayout";
import MaterialPage from "./pages/encargadoPages/materialPage";
import CrearUsuarioDocentePage from "./pages/encargadoPages/DocenteCrearPage";
import DocenteDashboard from "./pages/docentePages/DocenteDashboard";
import UsuariosPage from "./pages/encargadoPages/UsuariosPage";

export const AppRoutes = () => {
    const { isAuthenticated, user, isReady } = useAuth();
    const role = (user?.nombreRol || "").trim().toLowerCase();

    if (!isReady) {
        // Evitar redirecciones antes de hidratar el estado de auth desde localStorage
        return null;
    }

    // No autenticado: solo login
    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    // Docente: sus rutas con layout y mapeo dinámico
    if (role === "docente") {
        return (
            <Routes>
                <Route element={<DocenteLayout />}>
                    <Route path="/docente" element={<DocenteDashboard />} />
                </Route>
                <Route path="*" element={<Navigate to="/docente" replace />} />
            </Routes>
        );
    }

    // Encargado/Admin por defecto con layout y mapeo dinámico
    return (
        <Routes>
            <Route element={<EncargadoLayout />}>
                <Route path="/materiales" element={<MaterialPage />} />
                <Route path="/docentecrear" element={<CrearUsuarioDocentePage />} />
                <Route path="/usuarioslistar" element={<UsuariosPage />} />
                <Route path="/docentecrear/usuario/:usuarioId" element={<CrearUsuarioDocentePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/materiales" replace />} />
        </Routes>
    );
};

export const Rutas = AppRoutes;