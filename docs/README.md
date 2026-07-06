# TATUDIN — Backend

> SaaS multi-tenant para estudios de tatuaje y artistas independientes.
> Backend construido en **Django 5 + Django REST Framework + PostgreSQL**.

[![CI](https://github.com/SebaPobando/tatudin-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/SebaPobando/tatudin-backend/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/django-5.1-green.svg)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.15-red.svg)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/postgres-15+-blue.svg)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/tests-55_passing-success.svg)](#tests)
[![License](https://img.shields.io/badge/license-Proprietary-lightgrey.svg)](#licencia)

---

## Tabla de contenido

- [Sobre TATUDIN](#sobre-tatudin)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Configuración del entorno](#configuración-del-entorno)
- [Variables de entorno](#variables-de-entorno)
- [Comandos útiles](#comandos-útiles)
- [Endpoints de la API](#endpoints-de-la-api)
- [Tests](#tests)
- [Observabilidad](#observabilidad)
- [Convenciones de desarrollo](#convenciones-de-desarrollo)
- [Roadmap del MVP](#roadmap-del-mvp)
- [Licencia](#licencia)

---

## Sobre TATUDIN

**TATUDIN** es un SaaS multi-tenant para resolver la operación diaria de estudios de tatuaje y artistas independientes. El producto unifica en una sola plataforma:

- **Agenda** — gestión de citas con prevención de solapamientos por artista y por cabina, garantizada a nivel de base de datos.
- **Finanzas** — registro de ingresos con distribución de porcentajes entre estudio y artistas/guests, ledger centralizado e inmutable, transacciones atómicas.
- **Guests** — invitación de artistas a estudios con vigencia temporal (un mismo usuario puede ser dueño de un estudio y guest en otro al mismo tiempo).
- **Eventos** — convenciones, sesiones especiales y jornadas extendidas con asignación de artistas y comisiones específicas.

El sistema está diseñado desde el día uno para correr en producción como un SaaS escalable, con aislamiento estricto de datos por tenant y trazabilidad financiera completa.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Lenguaje | Python 3.11+ |
| Framework web | Django 5.1 |
| API | Django REST Framework 3.15 |
| Base de datos | PostgreSQL 15+ con extensión `btree_gist` |
| Autenticación | JWT (SimpleJWT) con rotación + blacklist de refresh tokens |
| Rate limiting | DRF throttles (Anon/User/Scoped) |
| Documentación API | drf-spectacular (OpenAPI 3) |
| Observabilidad | Sentry + python-json-logger (structured logging) |
| Configuración | django-environ |
| Testing | pytest + pytest-django + factory-boy |
| CI/CD | GitHub Actions |
| Servidor de producción | Gunicorn + Whitenoise |

---

## Arquitectura

El backend cumple un conjunto de **reglas inquebrantables** definidas en [`ARQUITECTURA_BACKEND.md`](./TATUDIN%20-%20Backend%20(Django%20REST%20API)/ARQUITECTURA_BACKEND.md.docx). En resumen:

### 1. Multi-tenancy (CORE)

- **`Tenant` unificado** para Estudios y Artistas Independientes.
- **`UserTenant` intermedio** soporta multi-pertenencia con roles distintos por tenant y vigencia temporal (`valid_from`, `valid_until`) para guests.
- **Active Tenant Context** — toda request lleva `X-Tenant-ID` en el header. El middleware `ActiveTenantMiddleware` lo resuelve a un `Tenant`. Los permisos `IsTenantMember`, `IsTenantOwnerOrAdmin`, `IsTenantOwner` validan pertenencia activa.
- **Aislamiento estricto** — el backend nunca confía en filtros del frontend. El tenant se inyecta en cada QuerySet.

### 2. Modelado de datos seguro

- **UUIDs públicos** — todo modelo expone un `public_id` UUID. El PK interno (BigInt) nunca sale por la API.
- **Soft delete** — borrados marcan `is_deleted = True` + `deleted_at`. Manager por defecto excluye los borrados; `all_objects` los incluye para auditoría.
- **Dinero con `DecimalField`** — nunca floats. Todo movimiento financiero pasa por un Ledger centralizado con soporte de splits (estudio ↔ artista/guest).
- **Estados de dominio con `TextChoices`** — sin strings mágicos.
- **`CheckConstraint`** sobre invariantes de negocio (consistencia tipo/user en cuentas, rangos válidos de comisiones, etc.).

### 3. Concurrencia y consistencia

- **Exclusion Constraints en PostgreSQL** sobre rangos temporales (`tstzrange` + operador `&&`) impiden citas solapadas por artista y por cabina **a nivel de base de datos**. Imposible bypass desde código.
- **Transacciones atómicas** — toda modificación de saldo dentro de `transaction.atomic()`.
- **`F()` expressions** para incrementos de saldo sin race conditions concurrentes.
- **Capa de servicios** — la lógica compleja vive fuera de las vistas, en `apps/<app>/services/`. Captura `IntegrityError` y lo traduce a errores 400 legibles para el cliente.

### 4. Seguridad y observabilidad

- **JWT con rotación** — Access corto (15 min) + Refresh (7 días) con blacklist tras rotación y endpoint de logout.
- **Rate limiting** — login limitado a 5/min por IP (anti brute-force); 30/min para anónimos y 120/min para autenticados como baseline anti-DDoS.
- **Permisos granulares** — clases `BasePermission` por rol y por tenant.
- **Custom exception handler** — todas las respuestas de error llevan header `X-Request-ID` para correlación con logs; las excepciones no manejadas devuelven JSON 500 limpio en vez de HTML.
- **Sentry integrado** (opt-in vía `SENTRY_DSN`) con filtrado de PII y headers sensibles antes de enviar.
- **Logging estructurado** JSON en producción (parseable por Datadog/Loki/CloudWatch); legible en dev.
- **Settings separados** — `base.py`, `dev.py`, `prod.py`. Endurecimiento HTTPS automático en producción.
- **Tests automatizados** — 55 tests cubriendo flujos críticos. CI corre en cada push y bloquea merges si fallan.

---

## Estructura del proyecto

```
tatudin-backend/
├── apps/                       # Apps de dominio
│   ├── core/                   # BaseModel + custom exception handler + health
│   │   ├── exceptions.py       # custom_exception_handler con X-Request-ID
│   │   ├── views.py            # health endpoint
│   │   └── migrations/
│   │       └── 0001_initial.py # Habilita extensión btree_gist
│   ├── users/                  # User custom (login por email)
│   ├── tenants/                # Tenant + UserTenant + middleware + permisos
│   │   ├── middleware.py       # ActiveTenantMiddleware (X-Tenant-ID)
│   │   ├── permissions.py      # IsTenantMember, IsTenantOwnerOrAdmin, IsTenantOwner
│   │   └── services/
│   │       └── membership.py
│   ├── agenda/                 # Booth + Appointment con Exclusion Constraints
│   │   └── services/
│   │       └── appointment.py
│   ├── finanzas/               # Account, Payment, PaymentSplit, LedgerEntry
│   │   └── services/
│   │       └── payment.py
│   └── eventos/                # Event + EventArtist
│       └── services/
│           └── event.py
│
├── config/                     # Configuración del proyecto Django
│   ├── settings/
│   │   ├── base.py             # Compartida (Sentry, CORS, DRF, JWT, logging)
│   │   ├── dev.py              # DEBUG, debug_toolbar, logging verboso
│   │   └── prod.py             # HTTPS, HSTS, Whitenoise, JSON logging
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
│
├── requirements/
│   ├── base.txt                # Django, DRF, psycopg, simplejwt, sentry-sdk, etc.
│   ├── dev.txt                 # + pytest, factory-boy, debug-toolbar
│   └── prod.txt                # + gunicorn, whitenoise
│
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions: pytest en cada push/PR
│
├── TATUDIN - Backend (Django REST API)/   # Documentos maestros
│   ├── ARQUITECTURA_BACKEND.md.docx
│   ├── analisis y plan de accion .pdf
│   └── Rupta MAESTRO FINAL.pdf
│
├── conftest.py                 # Fixtures globales de pytest
├── pytest.ini                  # Configuración de pytest
├── .env                        # Variables de entorno (NO commitear)
├── .env.example                # Plantilla de variables
├── .gitignore
├── manage.py
└── README.md
```

Cada app sigue la misma estructura interna: `models.py`, `serializers.py`, `views.py`, `urls.py`, `services/`, `tests/` (con `factories.py`, `test_models.py`, `test_api.py`).

---

## Requisitos previos

- **Python 3.11+** — [python.org](https://www.python.org/downloads/)
- **PostgreSQL 15+** con extensión `btree_gist` disponible — [postgresql.org](https://www.postgresql.org/download/windows/)
- **Git** — [git-scm.com](https://git-scm.com/download/win)

Verifica desde PowerShell:

```powershell
python --version
psql --version
git --version
```

---

## Configuración del entorno

### 1. Clonar el repositorio

```powershell
git clone https://github.com/SebaPobando/tatudin-backend.git
cd tatudin-backend
```

### 2. Crear y activar el entorno virtual

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

> Si PowerShell te bloquea con error de execution policy:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### 3. Instalar dependencias

```powershell
python -m pip install --upgrade pip
pip install -r requirements\dev.txt
```

### 4. Configurar PostgreSQL

```powershell
psql -U postgres
```

```sql
CREATE USER tatudin_user WITH PASSWORD 'tu_password';
CREATE DATABASE tatudin_dev OWNER tatudin_user;
ALTER USER tatudin_user CREATEDB;
\q
```

> La extensión `btree_gist` se instala automáticamente vía la migración `core.0001_initial` (es trusted desde Postgres 13+, no requiere SUPERUSER).

### 5. Configurar variables de entorno

```powershell
copy .env.example .env
```

Edita `.env` con tus valores. Ver sección [Variables de entorno](#variables-de-entorno).

### 6. Aplicar migraciones y crear superuser

```powershell
python manage.py migrate
python manage.py createsuperuser
```

### 7. Levantar el servidor

```powershell
python manage.py runserver
```

API disponible en `http://127.0.0.1:8000/`.

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DJANGO_SETTINGS_MODULE` | Módulo de settings activo | `config.settings.dev` |
| `SECRET_KEY` | Clave secreta de Django (≥32 chars; generar con `get_random_secret_key()` para prod) | `django-insecure-...` |
| `DEBUG` | Activar modo debug | `True` (dev) / `False` (prod) |
| `ALLOWED_HOSTS` | Hosts permitidos, separados por coma | `localhost,127.0.0.1` |
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgres://user:pass@localhost:5432/tatudin_dev` |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos para CORS, separados por coma | `http://localhost:3000,http://localhost:5173` |
| `SENTRY_DSN` | DSN de Sentry. Vacío = desactivado | `https://abc@xxxxx.ingest.sentry.io/12345` |
| `SENTRY_ENVIRONMENT` | Etiqueta del entorno en Sentry | `development` / `staging` / `production` |
| `SENTRY_TRACES_SAMPLE_RATE` | % de transacciones para performance monitoring | `0.0` (off) / `0.1` (10%) |

> ⚠ **Nunca commitees `.env`**. El archivo `.env.example` es la plantilla pública.

---

## Comandos útiles

### Migraciones

```powershell
python manage.py makemigrations <app>          # generar migración
python manage.py migrate                        # aplicar
python manage.py showmigrations                 # ver estado
python manage.py check --deploy                 # checks pre-producción
```

### Shell interactivo

```powershell
python manage.py shell                          # IPython si está instalado
```

### Tests

```powershell
pytest -v                                       # toda la suite
pytest apps/agenda/                             # solo una app
pytest -k "overlap"                             # filtrar por nombre
pytest --tb=short                               # tracebacks compactos
```

### Documentación de la API

Con el server arriba:

- **Schema OpenAPI:** `http://127.0.0.1:8000/api/schema/`
- **Swagger UI:** `http://127.0.0.1:8000/api/docs/`
- **Redoc:** `http://127.0.0.1:8000/api/redoc/`

---

## Endpoints de la API

> Todos los endpoints (excepto `/health/`, `/api/auth/...` y `/api/docs/`) requieren `Authorization: Bearer <access_token>`. Los endpoints scoped por tenant requieren además `X-Tenant-ID: <tenant_uuid>`.
>
> Toda respuesta de error incluye un header `X-Request-ID` para correlación con logs.

### Operaciones / observabilidad

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health/` | Health check público. 200 si DB responde, 503 si no. Sin auth, sin throttle. |
| `GET` | `/api/docs/` | Swagger UI. |
| `GET` | `/api/schema/` | Schema OpenAPI en JSON/YAML. |
| `GET` | `/api/redoc/` | Documentación alternativa con Redoc. |

### Autenticación

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/token/` | Login con email + password. Retorna `access`, `refresh`, `user`. **Limitado a 5/min por IP.** |
| `POST` | `/api/auth/token/refresh/` | Renueva el access token usando el refresh. |
| `POST` | `/api/auth/logout/` | Invalida un refresh token (blacklist). |

### Usuario actual

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/me/` | Datos del user autenticado. |
| `GET` | `/api/memberships/` | Tenants donde el user logueado tiene membresía activa. |

### Equipo del tenant *(owner/admin)*

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/tenants/team/` | Listar miembros del tenant activo. |
| `POST` | `/api/tenants/team/` | Invitar usuario existente como guest con vigencia temporal. |
| `DELETE` | `/api/tenants/team/<uuid>/` | Revocar membresía (soft, preserva auditoría). |

### Agenda

| Método | Endpoint | Descripción |
|---|---|---|
| `GET`/`POST` | `/api/agenda/booths/` | CRUD de cabinas. |
| `GET`/`PATCH`/`DELETE` | `/api/agenda/booths/<uuid>/` | Detalle/editar/borrar cabina. |
| `GET`/`POST` | `/api/agenda/appointments/` | CRUD de citas. POST aplica Exclusion Constraint. |
| `GET`/`PATCH`/`DELETE` | `/api/agenda/appointments/<uuid>/` | Detalle/editar/borrar cita. |

### Finanzas

| Método | Endpoint | Descripción |
|---|---|---|
| `GET`/`POST` | `/api/finanzas/payments/` | Listar / registrar pago con splits. Atómico. |
| `GET` | `/api/finanzas/payments/<uuid>/` | Detalle de pago + sus splits. |
| `GET` | `/api/finanzas/accounts/` | Cuentas del tenant (studio_revenue + user_payable). |
| `GET` | `/api/finanzas/accounts/<uuid>/` | Detalle de cuenta con saldo. |

### Eventos

| Método | Endpoint | Descripción |
|---|---|---|
| `GET`/`POST` | `/api/eventos/events/` | CRUD de eventos. |
| `GET`/`DELETE` | `/api/eventos/events/<uuid>/` | Detalle/borrar evento. |
| `GET` | `/api/eventos/events/<uuid>/artists/` | Artistas asignados al evento. |
| `POST` | `/api/eventos/events/<uuid>/assign-artist/` | Asignar artista con comisión opcional. |
| `DELETE` | `/api/eventos/events/<uuid>/artists/<uuid>/` | Remover asignación. |

---

## Tests

55 tests automatizados cubriendo:

| Área | Tests |
|---|---|
| Auth | Login, /me, manejo de tokens inválidos, no expone PK interno |
| Logout | Blacklist de refresh tokens — token invalidado no puede renovar |
| Rate limiting | 6º intento de login bloqueado con 429 |
| Tenant isolation | Sin header → 403, header con tenant ajeno → 403, UUID inválido → 403 |
| Memberships temporales | Membresías expiradas/futuras rechazadas |
| Team management | Invitar, validaciones, revocar, no auto-revocar, permisos por rol |
| Agenda | CRUD aislado, Exclusion Constraint vía API, validaciones temporales |
| Finanzas | Pagos atómicos, balances correctos, splits suman 100, residuo al último |
| Eventos | CRUD, asignación de artistas, validación cross-tenant, permisos |
| Health | Endpoint público, no requiere auth, reporta estado de DB |
| Exception handler | 500s limpios, X-Request-ID, degradación sin Sentry |

```powershell
pytest -v
```

CI corre la misma suite en cada `push` y cada PR. Branch protection en `main` bloquea merges con tests rojos.

---

## Observabilidad

### Sentry

Si configuras `SENTRY_DSN`, todos los errores no manejados se envían a Sentry con:

- Tag `request_id` para correlacionar con logs y reportes de soporte.
- Tag `environment` (dev/staging/prod).
- Headers `Authorization` y `X-Tenant-ID` filtrados antes de enviar.
- `send_default_pii=False` — nunca se envían emails ni IPs sin opt-in explícito.

Para activar performance monitoring (10% de las requests, opcional):

```env
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Logging estructurado

En producción, los logs salen como JSON parseable por agregadores (Datadog, Loki, CloudWatch):

```json
{"asctime": "2026-05-04 18:23:11", "name": "django.request", "levelname": "ERROR", "module": "exceptions", "message": "Unhandled exception in BoothViewSet (request_id=a1b2c3d4)"}
```

En dev se usa formato legible para humanos.

### Health check

`GET /health/` responde `200 OK` con `{"status": "ok", "checks": {"database": "ok"}}` o `503` si la DB es inalcanzable. Diseñado para load balancers, Kubernetes liveness/readiness probes y monitoreo externo (UptimeRobot, etc.).

---

## Convenciones de desarrollo

### Workflow de Pull Requests

`main` está protegida — los pushes directos están bloqueados. El flujo es:

```powershell
git switch -c feat/nombre-de-la-feature
# ... hacer cambios y commitear ...
git push -u origin feat/nombre-de-la-feature
# Abrir PR en GitHub, esperar CI verde, mergear
git switch main && git pull
git branch -d feat/nombre-de-la-feature
```

### Commits

[Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `refactor:` cambio interno sin alterar comportamiento
- `test:` añadir o ajustar tests
- `docs:` solo documentación
- `chore:` mantenimiento, dependencias
- `ci:` cambios en pipelines

### Branches

- `main` — código estable, deployable. Protegida.
- `feat/<scope>` — features nuevas.
- `fix/<scope>` — correcciones.
- `chore/<scope>` — mantenimiento.

### Reglas no negociables

1. **Nunca exponer PKs internos** en la API. Usar `public_id` (UUID).
2. **Nunca confiar en filtros del frontend**. El tenant se inyecta en el QuerySet.
3. **Nunca usar `float` para dinero**. Solo `DecimalField`.
4. **Nunca commitear `.env`** ni secretos.
5. **Nunca borrar registros físicamente** sin un mantenimiento explícito. Soft delete primero.
6. **Toda modificación de saldo** dentro de `transaction.atomic()` con `F()` para incrementos.
7. **Lógica compleja en services**, no en views.
8. **`__init__.py` de apps Django, vacíos** — no imports de conveniencia (rompen el orden de carga).
9. **Tests obligatorios** para toda feature que toque dominio crítico (auth, tenant, dinero, constraints).
10. **No mergear con CI rojo** — branch protection no lo permite, pero respetar la regla incluso con bypass.

---

## Roadmap del MVP

### Fase 1 — Fundación ✅
- [x] Setup del proyecto (settings separados, requirements, env)
- [x] App `core` con `BaseModel` (UUID + soft delete + timestamps)
- [x] User custom con login por email
- [x] App `tenants` con `Tenant` + `UserTenant`

### Fase 2 — Auth y Tenant Context ✅
- [x] `ActiveTenantMiddleware` con validación de `X-Tenant-ID`
- [x] Permission classes (`IsTenantMember`, `IsTenantOwner`, `IsTenantOwnerOrAdmin`)
- [x] Endpoints JWT con rotación
- [x] `/api/me/` y `/api/memberships/`

### Fase 3 — Agenda ✅
- [x] Modelos `Booth` + `Appointment` con `period: tstzrange`
- [x] Exclusion Constraints (artista y cabina)
- [x] Service layer traduce `IntegrityError` → `ValidationError` legible
- [x] CRUD tenant-scoped

### Fase 4 — Finanzas ✅
- [x] Modelos `Account`, `Payment`, `PaymentSplit`, `LedgerEntry`
- [x] CheckConstraints de consistencia tipo/user
- [x] Service `register_payment` atómico con `F()` expressions
- [x] Splits con residuo al último para suma exacta

### Fase 5 — Guests ✅
- [x] Membresías temporales con `valid_from` / `valid_until`
- [x] `IsTenantMember` respeta vigencia
- [x] Endpoints `/api/tenants/team/` para invitar y revocar
- [x] Auditoría con `invited_by`

### Fase 6 — Eventos ✅
- [x] Modelo `Event` (convenciones, sesiones especiales)
- [x] `EventArtist` con comisión específica del evento
- [x] FKs opcionales en `Appointment` y `Payment` apuntando a evento
- [x] Endpoints CRUD + asignación de artistas

### Tests automatizados ✅
- [x] pytest + pytest-django configurado
- [x] factory-boy para fixtures
- [x] 55 tests cubriendo flujos críticos

### Endurecimiento prod ✅
- [x] CI/CD con GitHub Actions (workflow en `.github/workflows/ci.yml`)
- [x] Branch protection en `main` requiere CI verde + PR
- [x] Logout con blacklist real de refresh token
- [x] Rate limiting (5/min en login, 30/min anónimos, 120/min autenticados)
- [x] Custom exception handler con `X-Request-ID` y JSON 500 limpio
- [x] Health check endpoint en `/health/`
- [x] Sentry integrado (opt-in vía `SENTRY_DSN`)
- [x] Logging estructurado JSON en producción
- [x] CORS endurecido con whitelist explícita de headers (`x-tenant-id`, `x-request-id`)

### Futuro post-MVP
- [ ] Refunds y entradas compensatorias en el Ledger
- [ ] Eventos de dominio (`appointment_created`, `payment_registered`) y handlers
- [ ] Reportes financieros por evento, artista, periodo
- [ ] Sistema de invitaciones con email + token + acceptance flow
- [ ] Modelo `Client` con historial de citas
- [ ] Integración con pasarela de pagos
- [ ] Notificaciones (push / email / SMS)
- [ ] Cache Redis para throttling multi-worker en producción

---

## Licencia

Proyecto propietario. Todos los derechos reservados.
Para uso comercial, contactar al equipo de TATUDIN.
