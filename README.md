# 🛠️ Admin Panel — Noah Tech & Trazzo

Panel de administración web desarrollado con **Next.js 14**, **TypeScript**, **Tailwind CSS** y **Supabase**. Permite gestionar clientes, usuarios, solicitudes de demo, seguimiento Kanban y estadísticas en tiempo real para las unidades de negocio **Noah Tech** y **Trazzo**.

---

## 🚀 Tecnologías

| Tecnología | Uso |
|---|---|
| Next.js 14 (App Router) | Framework principal |
| TypeScript | Tipado estático |
| Tailwind CSS | Estilos |
| Supabase | Base de datos y autenticación |
| Vercel | Despliegue |

---

## 📁 Estructura del proyecto

```
admin-panel/
├── app/
│   ├── globals.css          # Estilos globales (modo claro)
│   ├── layout.tsx           # Layout raíz
│   ├── page.tsx             # Redirección a /login
│   ├── login/
│   │   └── page.tsx         # Página de inicio de sesión
│   └── dashboard/
│       └── page.tsx         # Panel principal (todos los módulos)
├── lib/
│   └── supabase.ts          # Cliente Supabase + tipos
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🗄️ Base de datos (Supabase)

### Tablas utilizadas

| Tabla | Descripción |
|---|---|
| `user` | Usuarios del panel de administración |
| `noahtech` | Registros de clientes de Noah Tech |
| `demo_requests` | Solicitudes de demo de Trazzo |
| `kanban` | Tarjetas del tablero Kanban |
| `logs` | Historial de acciones y errores |

### Esquema de la tabla `user`
```sql
id          int8 PRIMARY KEY
created_at  timestamptz
name        varchar
email       varchar
telefono    numeric
dni         numeric
password    varchar
activo      boolean DEFAULT true
```

### Esquema de la tabla `noahtech`
```sql
id          int8 PRIMARY KEY
created_at  timestamptz
nombre      varchar
correo      varchar
telefono    numeric
servicio    varchar
comentario  text
```

### Esquema de la tabla `demo_requests`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at  timestamptz
nombre      text
colegio     text
email       text
telefono    text
estudiantes text
mensaje     text
atendido    boolean DEFAULT false
```

### Esquema de la tabla `kanban`
```sql
id                    bigserial PRIMARY KEY
created_at            timestamptz
cliente_nombre        varchar
cliente_telefono      numeric
servicio              varchar
origen                varchar
origen_id             bigint
estado                varchar DEFAULT 'por_hacer'
admin_nombre          varchar
moved_to_progreso_at  timestamptz
moved_to_hecho_at     timestamptz
```

### Esquema de la tabla `logs`
```sql
id           bigserial PRIMARY KEY
created_at   timestamptz
tipo         varchar
accion       varchar
descripcion  text
admin_nombre varchar
modulo       varchar
resultado    varchar
```

---

## 📦 Instalación local

### 1. Clona el repositorio

```bash
git clone https://github.com/TU_USUARIO/admin-panel.git
cd admin-panel
```

### 2. Instala las dependencias

```bash
npm install
```

### 3. Corre el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🔐 Autenticación

El login consulta directamente la tabla `user` de Supabase. No usa Supabase Auth — la verificación de credenciales se hace en el cliente comparando email y password. Los usuarios con `activo = false` son bloqueados al intentar iniciar sesión.

> ⚠️ **Nota de seguridad:** Las contraseñas están en texto plano. Para producción se recomienda implementar hashing con `bcrypt`.

---

## 🧩 Módulos del panel

### 🖥️ Noah Tech
Lista todos los registros de la tabla `noahtech` con opciones de eliminar (con confirmación).

### 🎨 Trazzo
Muestra las solicitudes de demo de la tabla `demo_requests`. Incluye estado **Atendido / Pendiente** y opción de eliminar.

### 📊 Estadísticas
- KPIs: total de registros, servicio más contratado, usuarios del panel, usuarios activos
- Ranking de servicios más contratados (Noah Tech + Trazzo combinados)
- Comparativa por módulo

### 👥 Agregar Usuarios
CRUD completo sobre la tabla `user`:
- Crear nuevos usuarios con validación de formulario
- Editar datos existentes
- Bloquear / desbloquear usuarios
- Eliminar usuarios con confirmación

### 📋 Kanban
Tablero de seguimiento de clientes con 3 columnas:
- **Por hacer** — clientes sincronizados automáticamente desde `noahtech` y `demo_requests`
- **En progreso** — incluye hora de avance y nombre del admin
- **Hecho** — incluye hora de completado

### 📝 Logs
Historial completo de actividad del panel:
- Registra: inicio de sesión, eliminaciones, bloqueos, creación/edición de usuarios, movimientos Kanban y errores
- Filtros por tipo: Todos / Acciones / Errores
- Muestra los últimos 200 eventos

---

## ☁️ Despliegue en Vercel

1. Sube el proyecto a GitHub
2. Entra a [vercel.com](https://vercel.com) → **Add New Project**
3. Importa el repositorio
4. Vercel detecta Next.js automáticamente
5. Clic en **Deploy**

Cada `git push` a la rama `main` redespliega automáticamente.

---

## 🔧 Configuración de Supabase (RLS)

Para que el panel funcione correctamente, desactiva RLS en todas las tablas del proyecto:

```sql
ALTER TABLE "user"          DISABLE ROW LEVEL SECURITY;
ALTER TABLE "noahtech"      DISABLE ROW LEVEL SECURITY;
ALTER TABLE "demo_requests" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "kanban"        DISABLE ROW LEVEL SECURITY;
ALTER TABLE "logs"          DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "kanban" TO anon;
GRANT ALL ON TABLE "kanban" TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE kanban_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE kanban_id_seq TO authenticated;

GRANT ALL ON TABLE "logs" TO anon;
GRANT ALL ON TABLE "logs" TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE logs_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE logs_id_seq TO authenticated;
```

---

## 👤 Autor

Desarrollado por **Juan Carlos Portocarrero**  
Noah Tech & Trazzo © 2026
