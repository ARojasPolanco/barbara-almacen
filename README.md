# Barbara Almacen - Sistema de gestión para comercio

Monorepo con la API (Node.js + Express + Sequelize/PostgreSQL) y la web (React + Vite + Tailwind CSS).

## Estructura

```
apps/
  api/   API REST (Express, Sequelize, Zod, JWT)
  web/   Frontend (React, Vite, Tailwind CSS)
```

## Requisitos

- Node.js >= 22
- npm >= 10
- Docker (opcional, para PostgreSQL local)

## Puesta en marcha

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Base de datos local
npm run docker:up

# API + web en paralelo
npm run dev
```

- API: http://localhost:3000/api/v1
- Web: http://localhost:5173

## Scripts

| Script              | Descripción                                      |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Alias de `dev:all`                               |
| `npm run dev:all`   | Levanta API y web en paralelo                    |
| `npm run dev:api`   | Levanta solo la API                              |
| `npm run dev:web`   | Levanta solo la web                              |
| `npm run build`     | Build de producción de la web                    |
| `npm run lint`      | ESLint sobre todo el monorepo                    |
| `npm run format`    | Prettier sobre todo el monorepo                  |
| `npm run seed`      | Crea los usuarios iniciales (vendedor y admin)   |
| `npm run docker:up` | Levanta PostgreSQL local                         |
| `npm run docker:app`| Levanta PostgreSQL + API + web en Docker         |

## Variables de entorno

Cada app tiene su propio `.env.example`. No se versionan archivos `.env`.
Para producción hay ejemplos en `apps/api/.env.production.example` y
`apps/web/.env.production.example`.

## Despliegue

- API: contenedor con `Dockerfile.api` o servicio Node con `npm start -w @price-tracker/api`.
- Web: build estático de Vite (`apps/web/dist`) en Vercel/Netlify/estático.
  `apps/web/vercel.json` incluye el rewrite de SPA.
