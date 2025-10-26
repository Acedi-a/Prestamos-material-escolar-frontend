import { Card, Typography, Button, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { ShoppingOutlined, HistoryOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const DocenteDashboard: React.FC = () => {
  const navigate = useNavigate();

  const goToSolicitar = () => {
    navigate("/docente/solicitar"); 
  };
  const goToMisSolicitudes = () => {
    navigate("/docente/solicitudes");
  };

  return (
    <div style={{ padding: "24px", display: "flex", justifyContent: "center" }}>
      <Card style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <Title level={3}>Bienvenido Docente</Title>
        <Paragraph>
          Selecciona una opción del menú para gestionar tus préstamos o revisar el material
          disponible.
        </Paragraph>
        <Space direction="vertical" style={{ width: "100%", marginTop: "16px" }}>
          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            size="large"
            onClick={goToSolicitar}
          >
            Solicitar Materiales
          </Button>
          <Button
            type="default" 
            icon={<HistoryOutlined />}
            size="large"
            onClick={goToMisSolicitudes}
          >
            Ver Mis Solicitudes
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default DocenteDashboard;