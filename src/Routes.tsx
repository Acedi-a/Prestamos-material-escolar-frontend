import { Navigate, Route, Routes } from "react-router-dom";
import MaterialPage from "./pages/encargadoPages/materialPage";
import LoginPage from "./pages/LoginPage";
import DocenteDashboard from "./pages/docentePages/DocenteDashboard";
import { useAuth } from "./context/AuthContext";
import CrearUsuarioDocentePage from "./pages/encargadoPages/DocenteCrearPage";

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

    // Docente: sus rutas
    if (role === "docente") {
        return (
            <Routes>
                <Route path="/docente" element={<DocenteDashboard />} />
                <Route path="*" element={<Navigate to="/docente" replace />} />
            </Routes>
        );
    }

    // Encargado/Admin por defecto
    return (
        <Routes>
            <Route path="/materiales" element={<MaterialPage />} />
            <Route path="/docentecrear" element={<CrearUsuarioDocentePage />} />
            <Route path="*" element={<Navigate to="/materiales" replace />} />
  
        </Routes>
    );
};

export const Rutas = AppRoutes;