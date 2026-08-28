# Birdcam

Photobooth digital para eventos. Captura fotos con marco, genera QR de descarga, e imprime automáticamente en impresora térmica.

## Arquitectura

Monorepo con [Turborepo](https://turbo.build/) y [pnpm](https://pnpm.io/):

```
apps/
  booth/          → App de escritorio (Tauri v2 + React + Vite)
  admin/          → Panel de administración (Next.js 15)
  gallery-web/    → Galería pública de fotos (Next.js 15)
  landing/        → Página de marketing (Next.js 15)
services/
  api/            → API REST (NestJS + Prisma + PostgreSQL)
  worker/         → Cola de procesamiento (BullMQ + Redis)
packages/
  ui/             → Componentes React compartidos
  types/          → Tipos TypeScript compartidos
  config/         → Configuración ESLint, Prettier, TypeScript
```

## Requisitos

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) (para infra local: PostgreSQL, Redis, MinIO)
- [Rust](https://www.rust-lang.org/) (solo para compilar la app de escritorio)
- [Tauri CLI](https://tauri.app/) (solo para la app de escritorio)

## Variables de entorno

Copia `.env.example` y renómbralo a `.env`:

```bash
cp .env.example .env
```

Edita `.env` con tus valores. Ver `.env.example` para la lista completa de variables necesarias.

## Desarrollo local

### 1. Levantar infraestructura

```bash
docker compose up -d
```

Esto arranca PostgreSQL, Redis y MinIO.

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar base de datos

```bash
cd services/api
npx prisma migrate deploy
npx prisma db seed
```

### 4. Arrancar todos los servicios

```bash
pnpm dev
```

Esto arranca:
- API: `http://localhost:4000`
- Admin: `http://localhost:3001`
- Gallery: `http://localhost:3002`
- Landing: `http://localhost:3003`
- Booth (Vite): `http://localhost:5173`

### 5. App de escritorio (opcional)

```bash
cd apps/booth
pnpm tauri dev
```

## Usuarios de prueba

Después de ejecutar `npx prisma db seed`:

| Email | Password | Plan |
|---|---|---|
| `free@test.com` | `password123` | Free |
| `pro@test.com` | `password123` | Pro |
| `lifetime@test.com` | `password123` | Lifetime |

## Despliegue a producción

### Railway (API + bases de datos)

1. Conectar repositorio a Railway
2. Agregar plugin PostgreSQL y Redis
3. Configurar variables de entorno en Railway (no en el código)
4. El deploy automático ejecuta `prisma migrate deploy` antes de iniciar

### App de escritorio

```bash
cd apps/booth
pnpm tauri build
```

Genera instaladores `.exe` y `.msi` en `apps/booth/src-tauri/target/release/bundle/`.

## Estructura de datos

- **Booth** → se conecta a un **Event** (puede haber varias cabinas por evento)
- **Photo** → foto capturada, con URL original y procesada
- **Template** → plantilla de marco con coordenadas de slots
- **Organization** → multi-tenant, con plan (basic/pro/business)
- **License** → clave de licencia para activar la app de escritorio

## Licencia

Propietario. No distribuir sin autorización.
