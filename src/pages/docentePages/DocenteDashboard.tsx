import { Card, Typography, Button, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { ShoppingOutlined, HistoryOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const DocenteDashboard: React.FC = () => {
  const navigate = useNavigate();

  

  return (
    <div style={{ padding: "24px", display: "flex", justifyContent: "center" }}>
      <Card style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <Title level={3}>Bienvenido Docente</Title>
        <Paragraph>
          Selecciona una opción del menú para gestionar tus préstamos o revisar el material
          disponible.
        </Paragraph>
      </Card>
    </div>
  );
};

export default DocenteDashboard;