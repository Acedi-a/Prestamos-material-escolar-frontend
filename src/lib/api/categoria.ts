import api from "../api";

export interface ICategoria {
	id: number;
	nombreCategoria: string;
	descripcion?: string;
}

export const getAllCategories = () => api.get<ICategoria[]>("/api/Categoria");
export const getCategoryById = (id: number) => api.get<ICategoria>(`/api/Categoria/${id}`);
export const createCategory = (categoria: Omit<ICategoria, "id">) =>
	api.post("/api/Categoria", {
		nombreCategoria: categoria.nombreCategoria,
		descripcion: categoria.descripcion,
	});
export const updateCategory = (id: number, categoria: Omit<ICategoria, "id">) =>
	api.put(`/api/Categoria/${id}`, {
		nombreCategoria: categoria.nombreCategoria,
		descripcion: categoria.descripcion,
	});
export const deleteCategory = (id: number) => api.delete(`/api/Categoria/${id}`);
