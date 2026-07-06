# TATUDIN — Frontend (Studio OS)

Frontend del SaaS multi-tenant para estudios de tatuaje. Consume la API Django/DRF
(ver `docs/FRONTEND_INTEGRATION.md` y `docs/TATUDIN_Documento_Maestro.docx`).

## Stack

Vite · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · React Router 7 ·
TanStack Query · Zustand · React Hook Form + Zod · Axios · decimal.js · date-fns ·
Vitest + React Testing Library · vite-plugin-pwa

## Setup

```powershell
npm install
copy .env.example .env    # ajustar VITE_API_BASE_URL si aplica
npm run dev
```

## Comandos

| Comando              | Qué hace                                       |
| -------------------- | ---------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo (http://localhost:5173) |
| `npm run build`      | Type-check + build de producción               |
| `npm run lint`       | ESLint                                         |
| `npm run format`     | Prettier sobre todo el proyecto                |
| `npm test`           | Suite de Vitest (una pasada)                   |
| `npm run test:watch` | Vitest en modo watch                           |

## Estructura

```
src/
├── api/                # axios instance + interceptores (token refresh, X-Tenant-ID)
├── stores/             # Zustand: auth, tenant activo
├── lib/                # utils (cn), money (decimal.js), fechas
├── components/
│   ├── ui/             # shadcn/ui
│   └── shared/         # AppShell, BottomNav, Sidebar, StatCard...
├── features/           # una carpeta por app del backend
│   ├── auth/  agenda/  clients/  catalog/  finanzas/  team/
│   ├── forms/  eventos/  integrations/  analytics/  public/
├── routes/             # router, ProtectedRoute, guards por rol
├── types/              # tipos compartidos del API
└── test/               # setup de Vitest
```

## Reglas no negociables (heredadas del backend)

1. IDs son UUIDs → siempre `string`, nunca `number`.
2. Dinero como string + `decimal.js` — nunca aritmética con `Number`.
3. Toda request tenant-scoped lleva `X-Tenant-ID` (lo inyecta el interceptor).
4. Tras `/token/refresh/` guardar SIEMPRE el nuevo refresh (rotación).
5. No inventar endpoints: si no está en los docs, validar contra `/api/schema/`.
6. Mostrar `request_id` al usuario en errores 500.
