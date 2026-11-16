import "dotenv/config";
import { sequelize } from "./config/database.js";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("Base de datos conectada");
    await sequelize.sync({ alter: true });
    console.log("Modelos sincronizados");
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}/api/v1`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
