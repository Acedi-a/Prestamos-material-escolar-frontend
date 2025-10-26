import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { authenticateUser, ILoginRequest } from "../lib/api/auth";
import { useAuth } from "../context/AuthContext";

const { Title, Paragraph } = Typography;

const LoginPage: React.FC = () => {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { login } = useAuth();

			const handleFinish = async (values: { identifier: string; password: string }) => {
		setLoading(true);
		try {
					const identifier = values.identifier.trim();
					const payload: ILoginRequest = {
						nombreUsuarioOrEmail: identifier,
						password: values.password,
					};

					const { data } = await authenticateUser(payload);
			login(data);

			const roleName = data.nombreRol?.trim().toLowerCase() ?? "";
			const target = roleName === "encargado" || roleName === "admin" ? "/materiales" : "/docente";

			navigate(target, { replace: true });
			message.success(`Bienvenido ${data.nombreUsuario}`);
		} catch (error) {
			message.error("No se pudo iniciar sesión. Verifica tus credenciales.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				background: "#f5f5f5",
				padding: "16px",
			}}
		>
			<Card style={{ maxWidth: 400, width: "100%" }}>
				<Title level={3} style={{ textAlign: "center" }}>
					Sistema de Préstamos
				</Title>
				<Paragraph style={{ textAlign: "center", marginBottom: 24 }}>
					Ingresa tus credenciales para continuar.
				</Paragraph>
						<Form layout="vertical" onFinish={handleFinish} requiredMark={false}>
								<Form.Item
									label="Usuario o correo"
									name="identifier"
									rules={[{ required: true, message: "Ingresa tu usuario o correo" }]}
								>
									<Input placeholder="usuario o usuario@ejemplo.com" autoComplete="username" />
								</Form.Item>

					<Form.Item
						label="Contraseña"
						name="password"
						rules={[{ required: true, message: "Ingresa tu contraseña" }]}
					>
						<Input.Password placeholder="••••••" autoComplete="current-password" />
					</Form.Item>

					<Button
						type="primary"
						htmlType="submit"
						block
						loading={loading}
						disabled={loading}
					>
						Iniciar sesión
					</Button>
				</Form>
			</Card>
		</div>
	);
};

export default LoginPage;
