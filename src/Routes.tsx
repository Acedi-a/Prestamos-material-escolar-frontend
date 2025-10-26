import { Navigate, Route, Routes } from "react-router-dom";
import MaterialPage from "./pages/encargadoPages/materialPage";
import LoginPage from "./pages/LoginPage";
import DocenteDashboard from "./pages/docentePages/DocenteDashboard";
import { useAuth } from "./context/AuthContext";

export const AppRoutes = () => {
    const { isAuthenticated, user } = useAuth();
    const role = (user?.nombreRol || "").trim().toLowerCase();

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
                <Route path="/" element={<Navigate to="/docente" replace />} />
                <Route path="/docente" element={<DocenteDashboard />} />
                <Route path="/login" element={<Navigate to="/docente" replace />} />
                <Route path="*" element={<Navigate to="/docente" replace />} />
            </Routes>
        );
    }

    // Encargado/Admin por defecto
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/materiales" replace />} />
            <Route path="/materiales" element={<MaterialPage />} />
            <Route path="/login" element={<Navigate to="/materiales" replace />} />
            <Route path="*" element={<Navigate to="/materiales" replace />} />
        </Routes>
    );
};

export const Rutas = AppRoutes;