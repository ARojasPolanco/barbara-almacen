import "dotenv/config";
import { Sequelize } from "sequelize";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not defined. Creá apps/api/.env a partir de apps/api/.env.example"
  );
}

export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
  dialectOptions:
    process.env.NODE_ENV === "production"
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
});
