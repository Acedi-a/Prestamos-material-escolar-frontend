import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, Typography, message, Checkbox } from "antd";
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { authenticateUser, ILoginRequest } from "../lib/api/auth";
import { useAuth } from "../context/AuthContext";

const { Paragraph } = Typography;

const LoginPage: React.FC = () => {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { login } = useAuth();

			const handleFinish = async (values: { identifier: string; password: string; remember?: boolean }) => {
		setLoading(true);
		try {
					const identifier = values.identifier.trim();
					// Recordar usuario si corresponde
					if (values.remember) {
						localStorage.setItem('rememberIdentifier', identifier);
					} else {
						localStorage.removeItem('rememberIdentifier');
					}
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
		<div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-900">
			{/* Background image con gradiente natural fijo */}
			<div 
				className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
				style={{ backgroundImage: `url(/src/assets/bg.jpg)` }}
			/>
			
			{/* Gradiente natural coherente */}
			<div 
				className="absolute inset-0 opacity-60"
				style={{
					background: 'linear-gradient(135deg, rgba(135, 206, 235, 0.4) 0%, rgba(144, 238, 144, 0.3) 50%, rgba(173, 216, 230, 0.4) 100%)'
				}}
			/>

			<style>{`
				@keyframes cardSlideIn {
					0% { transform: translateY(20px); opacity: 0; }
					100% { transform: translateY(0); opacity: 1; }
				}
			`}</style>

			{/* Contenedor principal con animación sutil */}
			<div 
				className="relative z-10 w-full max-w-md"
				style={{ animation: 'cardSlideIn 0.8s ease-out' }}
			>
				{/* Card blanco sólido */}
				<div 
					className="relative p-8 rounded-2xl bg-white border border-gray-200"
					style={{
						boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
					}}
				>
					{/* Logo simple */}
					<div className="flex justify-center mb-6">
						<div 
							className="p-4 rounded-full bg-gray-100 border border-gray-300"
							style={{
								boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
							}}
						>
							<LoginOutlined className="text-4xl text-slate-700" />
						</div>
					</div>

					{/* Título estático */}
					<div className="text-center mb-8">
						<h1 className="text-3xl font-semibold mb-2 text-slate-800">
							Bienvenido
						</h1>
						<div className="h-px w-16 mx-auto bg-gray-300 mb-3" />
						<p className="text-slate-600 text-sm">Ingresa tus credenciales para continuar</p>
					</div>

					{/* Formulario con colores naturales */}
					<Form
						layout="vertical"
						onFinish={handleFinish}
						requiredMark={false}
						initialValues={{
							identifier: localStorage.getItem('rememberIdentifier') || '',
							remember: !!localStorage.getItem('rememberIdentifier'),
						}}
					>
						<Form.Item
							label={<span className="text-slate-700 font-medium">Usuario o Email</span>}
							name="identifier"
							rules={[{ required: true, message: "Campo requerido" }]}
						>
							<Input
								prefix={<UserOutlined className="text-slate-500" />}
								placeholder="usuario@ejemplo.com"
								autoComplete="username"
								size="large"
								style={{
									borderRadius: '0.75rem',
									background: 'white',
									border: '1px solid rgba(0, 0, 0, 0.1)',
									color: '#374151',
									transition: 'all 0.3s ease'
								}}
							/>
						</Form.Item>

						<Form.Item
							label={<span className="text-slate-700 font-medium">Contraseña</span>}
							name="password"
							rules={[{ required: true, message: "Campo requerido" }]}
						>
							<Input.Password
								prefix={<LockOutlined className="text-slate-500" />}
								placeholder="••••••••"
								autoComplete="current-password"
								size="large"
								style={{
									borderRadius: '0.75rem',
									background: 'white',
									border: '1px solid rgba(0, 0, 0, 0.1)',
									color: '#374151',
									transition: 'all 0.3s ease'
								}}
							/>
						</Form.Item>

						<div className="flex items-center justify-between mb-6">
							<Form.Item name="remember" valuePropName="checked" noStyle>
								<Checkbox className="text-slate-600">Recordarme</Checkbox>
							</Form.Item>
							
						</div>

						<Button
							type="primary"
							htmlType="submit"
							block
							size="large"
							loading={loading}
							disabled={loading}
							className="h-12 text-base font-medium"
							style={{
								borderRadius: '0.75rem',
								background: 'linear-gradient(135deg, #4a90e2 0%, #5cb85c 100%)',
								border: 'none',
								boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)',
								transition: 'all 0.3s ease',
								color: 'white'
							}}
						>
							<LoginOutlined className="mr-2" />
							Iniciar Sesión
						</Button>
					</Form>

					{/* Footer */}
					<div className="mt-6 text-center">
						<p className="text-slate-500 text-xs">
							Sistema de Gestión de Préstamos • v2.1
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
