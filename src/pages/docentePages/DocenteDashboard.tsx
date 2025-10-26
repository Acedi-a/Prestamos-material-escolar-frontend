import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

const DocenteDashboard: React.FC = () => {
  return (
    <div style={{ padding: "24px", display: "flex", justifyContent: "center" }}>
      <Card style={{ maxWidth: 480, width: "100%" }}>
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
