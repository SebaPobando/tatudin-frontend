# TATUDIN — Frontend Integration Guide

> Documento de referencia para construir el frontend que consume la API de TATUDIN.
> Cubre auth, endpoints, payloads, errores y convenciones. Léelo antes de empezar.

---

## Tabla de contenido

1. [Base URL y entornos](#base-url-y-entornos)
2. [Flujo de autenticación](#flujo-de-autenticación)
3. [Tenant context](#tenant-context)
4. [Convenciones del API](#convenciones-del-api)
5. [Formato de errores](#formato-de-errores)
6. [Endpoints — referencia completa](#endpoints--referencia-completa)
7. [Rate limiting](#rate-limiting)
8. [Pitfalls comunes](#pitfalls-comunes)

---

## Base URL y entornos

| Entorno | Base URL |
|---|---|
| Desarrollo local | `http://127.0.0.1:8000` |
| Producción | TBD (cuando se despliegue) |

Documentación interactiva (con el server arriba):

- Swagger UI: `http://127.0.0.1:8000/api/docs/`
- Redoc: `http://127.0.0.1:8000/api/redoc/`
- Schema OpenAPI: `http://127.0.0.1:8000/api/schema/`

---

## Flujo de autenticación

JWT con rotación + blacklist. **Cuatro pasos** desde abrir la app hasta poder usar endpoints scoped por tenant:

### 1. Login

```http
POST /api/auth/token/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret"
}
```

**Respuesta 200:**

```json
{
  "access":  "eyJhbGc...",
  "refresh": "eyJhbGc...",
  "user": {
    "id": "3f9aa53c-8741-4504-b117-5036bca10a7a",
    "email": "user@example.com",
    "username": "user",
    "first_name": "Ana",
    "last_name": "Pérez",
    "phone": ""
  }
}
```

- `access` dura **15 minutos**.
- `refresh` dura **7 días**.
- Guarda ambos. Recomendación: `access` en memoria (variable JS), `refresh` en httpOnly cookie si tu setup lo permite, o sessionStorage si no.

### 2. Listar tenants del user

```http
GET /api/memberships/
Authorization: Bearer <access>
```

**Respuesta 200:**

```json
[
  {
    "role": "owner",
    "is_active": true,
    "tenant": {
      "id": "b48ed599-04fa-45a4-9d23-c3d3d01836aa",
      "name": "Estudio Scar",
      "slug": "estudio-scar",
      "type": "studio",
      "subscription_plan": "free",
      "timezone": "America/Bogota",
      "is_active": true
    }
  }
]
```

### 3. User selecciona un tenant

Si tiene varios, muestra un selector. Si tiene uno solo, autoseleccionar. Guarda el `tenant.id` en estado global.

### 4. Llamar endpoints scoped con `X-Tenant-ID`

```http
GET /api/agenda/booths/
Authorization: Bearer <access>
X-Tenant-ID: b48ed599-04fa-45a4-9d23-c3d3d01836aa
```

### Renovar el access token

Cuando recibas `401` o **proactivamente antes de los 15 min**:

```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "<refresh actual>"
}
```

**Respuesta 200:**

```json
{ "access": "<nuevo access>", "refresh": "<nuevo refresh>" }
```

> ⚠ El backend tiene `ROTATE_REFRESH_TOKENS=True`: cada vez que renuevas, el refresh viejo se invalida. **Siempre guarda el nuevo refresh** que devuelve este endpoint.

### Logout

```http
POST /api/auth/logout/
Content-Type: application/json

{ "refresh": "<refresh actual>" }
```

**Respuesta 200** (sin body relevante). El backend pone el refresh en la blacklist y ya no se puede usar para renovar.

---

## Tenant context

**Toda request a un endpoint de dominio (agenda, finanzas, eventos, equipo) requiere el header `X-Tenant-ID`** apuntando al UUID del tenant activo. Sin él → `403 Forbidden`.

### Endpoints que NO requieren `X-Tenant-ID`

- `/health/`
- `/api/auth/token/`, `/api/auth/token/refresh/`, `/api/auth/logout/`
- `/api/me/`
- `/api/memberships/`
- `/api/docs/`, `/api/schema/`, `/api/redoc/`

### Endpoints que SÍ lo requieren

Todo lo demás bajo `/api/agenda/`, `/api/finanzas/`, `/api/eventos/`, `/api/tenants/team/`.

---

## Convenciones del API

### IDs

**Todos los IDs son UUIDs**. Nunca enteros. Ejemplo: `"3f9aa53c-8741-4504-b117-5036bca10a7a"`. Trátalos como strings.

### Fechas

ISO 8601 con timezone:

```
2026-05-10T14:00:00Z
2026-05-10T09:00:00-05:00
```

### Dinero

Siempre como **string** para preservar precisión:

```json
{ "amount": "350000.00" }
```

Nunca uses `Number()` directo en frontend — usa una librería como `decimal.js` o trabaja con strings hasta el punto de display.

### Paginación

Listas vienen paginadas con DRF `PageNumberPagination` (25 items por página por defecto):

```json
{
  "count": 47,
  "next": "http://127.0.0.1:8000/api/agenda/appointments/?page=2",
  "previous": null,
  "results": [ /* 25 items */ ]
}
```

Para más por página: `?page_size=100` (no aplica a todos los endpoints).

### TextChoices (estados)

Los enum-like vienen como strings cortos. Ejemplos:

| Campo | Valores |
|---|---|
| `Tenant.type` | `studio`, `independent_artist` |
| `Tenant.subscription_plan` | `free`, `basic`, `pro`, `enterprise` |
| `UserTenant.role` | `owner`, `admin`, `artist`, `guest`, `receptionist` |
| `Appointment.status` | `scheduled`, `confirmed`, `in_progress`, `completed`, `canceled`, `no_show` |
| `Payment.payment_method` | `cash`, `card`, `transfer`, `other` |
| `Payment.status` | `completed`, `refunded` |
| `Event.status` | `draft`, `published`, `in_progress`, `completed`, `canceled` |

---

## Formato de errores

Toda respuesta de error tiene un header `X-Request-ID` para correlación con logs del backend (útil al reportar bugs).

### 400 Bad Request — validación

Errores de campo individuales:

```json
{
  "email": ["Este campo es requerido."],
  "amount": ["Debe ser mayor que 0."]
}
```

Errores no asociados a un campo:

```json
{
  "detail": "Mensaje de error general."
}
```

Errores de service layer (ej. lógica multi-tenant):

```json
{
  "artist_id": "Este artista ya tiene una cita en ese horario."
}
```

### 401 Unauthorized

```json
{ "detail": "Authentication credentials were not provided." }
```

O cuando el token expiró/es inválido:

```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [...]
}
```

### 403 Forbidden — permisos / tenant

```json
{ "detail": "No tienes acceso a este tenant." }
{ "detail": "Se requiere rol Owner o Admin." }
```

### 404 Not Found

```json
{ "detail": "No encontrado." }
```

### 429 Too Many Requests — rate limit

```json
{ "detail": "Request was throttled. Expected available in 47 seconds." }
```

### 500 Internal Server Error

Excepciones no manejadas devuelven JSON limpio (no HTML):

```json
{
  "detail": "Ha ocurrido un error inesperado.",
  "request_id": "a1b2c3d4e5f6"
}
```

El `request_id` también está en el header `X-Request-ID`. **Logéalo y muéstralo al user** ("Si reportas este error, incluye el código `a1b2c3d4e5f6`") — el backend lo tiene correlacionado con Sentry.

---

## Endpoints — referencia completa

### Operaciones / observabilidad

| Método | Endpoint | Auth | Tenant header |
|---|---|---|---|
| `GET` | `/health/` | No | No |

### Autenticación

| Método | Endpoint | Auth | Tenant header | Body |
|---|---|---|---|---|
| `POST` | `/api/auth/token/` | No | No | `{email, password}` |
| `POST` | `/api/auth/token/refresh/` | No | No | `{refresh}` |
| `POST` | `/api/auth/logout/` | No | No | `{refresh}` |

### Usuario actual

| Método | Endpoint | Auth | Tenant header |
|---|---|---|---|
| `GET` | `/api/me/` | Sí | No |
| `GET` | `/api/memberships/` | Sí | No |

### Equipo del tenant *(solo owner/admin)*

| Método | Endpoint | Auth | Tenant header |
|---|---|---|---|
| `GET` | `/api/tenants/team/` | Sí | Sí |
| `POST` | `/api/tenants/team/` | Sí | Sí |
| `DELETE` | `/api/tenants/team/<uuid>/` | Sí | Sí |

**POST `/api/tenants/team/`** body:

```json
{
  "email": "guest@example.com",
  "role": "guest",
  "valid_from": "2026-06-01T00:00:00Z",
  "valid_until": "2026-06-15T23:59:59Z"
}
```

### Agenda — Cabinas

| Método | Endpoint | Auth | Tenant header |
|---|---|---|---|
| `GET` | `/api/agenda/booths/` | Sí | Sí |
| `POST` | `/api/agenda/booths/` | Sí | Sí |
| `GET`/`PATCH`/`DELETE` | `/api/agenda/booths/<uuid>/` | Sí | Sí |

**POST** body:

```json
{ "name": "Cabina 1", "description": "Cabina principal", "is_active": true }
```

### Agenda — Citas

| Método | Endpoint | Auth | Tenant header |
|---|---|---|---|
| `GET` | `/api/agenda/appointments/` | Sí | Sí |
| `POST` | `/api/agenda/appointments/` | Sí | Sí |
| `GET`/`PATCH`/`DELETE` | `/api/agenda/appointments/<uuid>/` | Sí | Sí |

**POST** body:

```json
{
  "artist_id": "3f9aa53c-8741-4504-b117-5036bca10a7a",
  "booth_id": "dd3db7c4-3249-4c2a-8b68-eda5b3edf801",
  "client_name": "Ana Pérez",
  "client_phone": "+57 300 000 0000",
  "start_at": "2026-05-10T14:00:00Z",
  "end_at": "2026-05-10T16:00:00Z",
  "estimated_price": "350000.00",
  "notes": "Manga japonesa, sesión 1 de 3"
}
```

`booth_id` es opcional (puede ser `null`).

**Respuesta de POST** (201):

```json
{
  "id": "3d25cf4b-9aa9-4a0a-9b7e-f99e7699b1f4",
  "artist_id": "3f9aa53c-...",
  "artist_email": "scar@tatudin.com",
  "booth_id": "dd3db7c4-...",
  "booth_name": "Cabina 1",
  "client_name": "Ana Pérez",
  "client_phone": "+57 300 000 0000",
  "start_at": "2026-05-10T14:00:00Z",
  "end_at": "2026-05-10T16:00:00Z",
  "status": "scheduled",
  "notes": "...",
  "estimated_price": "350000.00",
  "created_at": "...",
  "updated_at": "..."
}
```

**Errores comunes:**

- 400 `{"artist_id": "Este artista ya tiene una cita en ese horario."}` — el backend bloquea solapamientos a nivel de DB.
- 400 `{"booth_id": "Esta cabina ya está ocupada en ese horario."}` — idem para cabinas.
- 400 `{"end_at": "end_at debe ser posterior a start_at."}`.
- 400 `{"artist_id": "El artista no pertenece a este tenant."}`.

### Finanzas — Pagos

| Método | Endpoint | Auth | Tenant header |
|---|---|---|---|
| `GET` | `/api/finanzas/payments/` | Sí | Sí |
| `POST` | `/api/finanzas/payments/` | Sí | Sí |
| `GET` | `/api/finanzas/payments/<uuid>/` | Sí | Sí |

> No hay `PATCH` ni `DELETE` — los pagos son inmutables. Para corregir, registrar pago compensatorio (refund — pendiente en post-MVP).

**POST** body — pago con split 70% al artista, 30% al estudio:

```json
{
  "appointment_id": "3d25cf4b-...",
  "payer_name": "Ana Pérez",
  "amount": "350000.00",
  "payment_method": "cash",
  "notes": "Pago de manga japonesa, sesión 1",
  "splits": [
    { "recipient_id": "3f9aa53c-...", "percentage": "70.00" },
    { "recipient_id": null,            "percentage": "30.00" }
  ]
}
```

- `recipient_id: null` → split va al estudio.
- `recipient_id: <user_uuid>` → split va al usuario (debe ser miembro del tenant).
- Los porcentajes **deben sumar 100.00 exactos**.

**Errores comunes:**

- 400 `{"splits": ["Los porcentajes deben sumar exactamente 100.00. Suma actual: 90"]}`.
- 400 `{"splits": "El usuario X no pertenece a este tenant."}`.
- 400 `{"amount": "Debe ser mayor que 0."}`.

### Finanzas — Cuentas

| Método | Endpoint | Auth | Tenant header |
|---|---|---|---|
| `GET` | `/api/finanzas/accounts/` | Sí | Sí |
| `GET` | `/api/finanzas/accounts/<uuid>/` | Sí | Sí |

Solo lectura. Las cuentas se crean automáticamente al registrar el primer pago que las involucra.

### Eventos

| Método | Endpoint | Auth | Tenant header | Permiso especial |
|---|---|---|---|---|
| `GET` | `/api/eventos/events/` | Sí | Sí | Cualquier miembro |
| `POST` | `/api/eventos/events/` | Sí | Sí | Owner o admin |
| `GET` | `/api/eventos/events/<uuid>/` | Sí | Sí | Cualquier miembro |
| `DELETE` | `/api/eventos/events/<uuid>/` | Sí | Sí | Owner o admin |
| `GET` | `/api/eventos/events/<uuid>/artists/` | Sí | Sí | Cualquier miembro |
| `POST` | `/api/eventos/events/<uuid>/assign-artist/` | Sí | Sí | Owner o admin |
| `DELETE` | `/api/eventos/events/<uuid>/artists/<uuid>/` | Sí | Sí | Owner o admin |

**POST `/events/`** body:

```json
{
  "name": "Convención 2026",
  "description": "Convención anual",
  "location": "Bogotá",
  "start_at": "2026-06-01T08:00:00Z",
  "end_at": "2026-06-03T22:00:00Z",
  "status": "published"
}
```

**POST `/events/<uuid>/assign-artist/`** body:

```json
{
  "user_id": "3f9aa53c-...",
  "commission_percentage": "80.00",
  "notes": "Sesión especial del evento"
}
```

`commission_percentage` es opcional (null = usa el default del estudio).

---

## Rate limiting

| Endpoint | Límite | Por |
|---|---|---|
| `POST /api/auth/token/` (login) | 5/min | IP |
| Cualquier endpoint anónimo | 30/min | IP |
| Cualquier endpoint autenticado | 120/min | User |

Cuando se excede → `429 Too Many Requests`. La respuesta incluye un mensaje con cuántos segundos hasta poder reintentar.

**Recomendación frontend:** muestra mensaje claro al user en el formulario de login si pega 429 ("Demasiados intentos, espera N segundos").

---

## Pitfalls comunes

### 1. Olvidar `X-Tenant-ID`

El error `403 "No tienes acceso a este tenant."` es ambiguo — puede ser falta de header O no ser miembro. En el frontend, verifica primero que estés mandando el header correcto antes de asumir un problema de permisos.

### 2. Asumir que `id` es entero

Todos los IDs son UUIDs. Si en TypeScript declaras `id: number`, vas a romper todo. Usa `id: string`.

### 3. Hacer math con `amount` como número

Pierde precisión a partir del segundo decimal. Mantén `amount` como string hasta el último momento de display.

### 4. No guardar el nuevo refresh tras `/token/refresh/`

El refresh rota cada vez. Si guardas el viejo, el siguiente refresh fallará con 401 y vas a forzar al user a login otra vez.

### 5. Refresh reactivo solo on-401

Genera condiciones de carrera con múltiples requests concurrentes. Mejor: refrescar proactivamente cuando falten ~2 minutos al expirar el access. O usa una librería de auth que maneje eso (ej. `axios-auth-refresh`).

### 6. No mostrar `request_id` al user en errores 500

El backend correlaciona request_id con Sentry. Si el user te reporta "se rompió X" sin el request_id, te toca buscar a ciegas. Muéstralo siempre en errores 500: "Si reportas este error incluye el código `xxxxx`".

### 7. CORS sin headers correctos

El backend whitelistea `x-tenant-id` y `x-request-id`. Si tu cliente HTTP lo serializa de forma rara (con mayúsculas no estándar), el preflight puede fallar. Usa exactamente esos nombres en lowercase.

### 8. Asumir que existen endpoints que no listamos arriba

Si lo que necesitas no está en este doc, **pregunta antes de inventar**. Probablemente el backend lo tenga planeado en post-MVP pero aún no implementado:

- Refunds en el ledger
- Reportes financieros
- Modelo `Client` con historial
- Notificaciones
- Sistema de invitaciones con acceptance flow (lo actual requiere que el user ya exista)

---

## Para AI agents que asistan en el frontend

- **Respeta el contrato.** No inventes endpoints. Si algo no está aquí, dilo.
- **No expongas internals.** El backend tiene PKs internos como BigInt — la API no los expone, ni tú deberías intentarlo. Solo UUIDs.
- **No hagas cálculos de dinero en JS native.** Usa `Decimal` o equivalente.
- **Aplica defensive coding sobre `X-Tenant-ID`** — interceptor central que lo añade siempre que haya un tenant activo, con fallback a redirigir al selector si no hay.
- **El backend es la fuente de verdad de validaciones.** No dupliques reglas de negocio (ej. "splits suman 100") en el frontend más allá de UX previa al submit.
