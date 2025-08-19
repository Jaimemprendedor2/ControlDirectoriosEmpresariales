# Configuración de Supabase para Control de Reuniones

## 🚀 Pasos para configurar Supabase

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota tu **Project URL** y **anon public key**

### 2. Configurar variables de entorno

1. Copia el archivo `env.example` a `.env`:
   ```bash
   cp env.example .env
   ```

2. Edita el archivo `.env` y reemplaza los valores:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

### 3. Configurar la base de datos

1. Ve al **SQL Editor** en tu dashboard de Supabase
2. Copia y pega el contenido del archivo `database/schema.sql`
3. Ejecuta el script completo

### 4. Configurar autenticación (opcional)

Si quieres usar autenticación de usuarios:

1. Ve a **Authentication > Settings** en Supabase
2. Configura los proveedores que desees (Google, GitHub, etc.)
3. Configura las URLs de redirección para tu dominio

## 📊 Estructura de la Base de Datos

### Tablas principales:

1. **meetings** - Reuniones
   - `id` (UUID, Primary Key)
   - `title` (VARCHAR) - Título de la reunión
   - `description` (TEXT) - Descripción opcional
   - `user_id` (UUID) - ID del usuario propietario
   - `is_active` (BOOLEAN) - Si la reunión está activa
   - `created_at`, `updated_at` (TIMESTAMP)

2. **meeting_stages** - Etapas de cada reunión
   - `id` (UUID, Primary Key)
   - `meeting_id` (UUID, Foreign Key) - Referencia a meetings
   - `title` (VARCHAR) - Título de la etapa
   - `duration` (INTEGER) - Duración en segundos
   - `order_index` (INTEGER) - Orden de las etapas
   - `is_completed` (BOOLEAN) - Si la etapa está completada

3. **meeting_sessions** - Sesiones de reunión
   - `id` (UUID, Primary Key)
   - `meeting_id` (UUID, Foreign Key) - Referencia a meetings
   - `started_at` (TIMESTAMP) - Cuándo comenzó la sesión
   - `ended_at` (TIMESTAMP) - Cuándo terminó (opcional)
   - `current_stage_id` (UUID) - Etapa actual
   - `is_active` (BOOLEAN) - Si la sesión está activa

4. **stage_progress** - Progreso de cada etapa
   - `id` (UUID, Primary Key)
   - `session_id` (UUID, Foreign Key) - Referencia a meeting_sessions
   - `stage_id` (UUID, Foreign Key) - Referencia a meeting_stages
   - `started_at` (TIMESTAMP) - Cuándo comenzó la etapa
   - `ended_at` (TIMESTAMP) - Cuándo terminó (opcional)
   - `time_spent` (INTEGER) - Tiempo gastado en segundos
   - `is_completed` (BOOLEAN) - Si la etapa está completada

## 🔐 Seguridad

### Row Level Security (RLS)
- Todas las tablas tienen RLS habilitado
- Los usuarios solo pueden ver/modificar sus propias reuniones
- Las políticas están configuradas automáticamente

### Funciones de base de datos
- `create_meeting_with_stages()` - Crear reunión con etapas
- `start_meeting_session()` - Iniciar sesión de reunión

## 🛠️ Uso en la aplicación

### Importar el servicio:
```typescript
import { MeetingService } from './services/meetingService'
```

### Ejemplos de uso:

```typescript
// Crear una reunión
const meeting = await MeetingService.createMeeting('Mi Reunión', 'Descripción')

// Crear reunión con etapas
const meetingId = await MeetingService.createMeetingWithStages(
  'Reunión de Equipo',
  'Reunión semanal',
  [
    { title: 'Introducción', duration: 300 }, // 5 minutos
    { title: 'Discusión', duration: 1800 },   // 30 minutos
    { title: 'Cierre', duration: 600 }        // 10 minutos
  ]
)

// Obtener reuniones del usuario
const meetings = await MeetingService.getMeetings()

// Iniciar sesión
const sessionId = await MeetingService.startMeetingSession(meetingId)
```

## 🔧 Troubleshooting

### Error: "Missing Supabase environment variables"
- Verifica que el archivo `.env` existe
- Asegúrate de que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están configuradas

### Error: "Meeting not found or access denied"
- Verifica que el usuario está autenticado
- Asegúrate de que la reunión pertenece al usuario actual

### Error: "RLS policy violation"
- Verifica que las políticas RLS están configuradas correctamente
- Asegúrate de que el usuario está autenticado

## 📝 Notas importantes

1. **Variables de entorno**: Nunca subas el archivo `.env` a Git
2. **Autenticación**: La aplicación requiere autenticación para funcionar
3. **Backup**: Configura backups automáticos en Supabase
4. **Monitoreo**: Usa el dashboard de Supabase para monitorear el uso

## 🚀 Despliegue

Para desplegar en producción:

1. Configura las variables de entorno en tu plataforma de hosting
2. Asegúrate de que las URLs de redirección estén configuradas en Supabase
3. Configura el dominio en la configuración de autenticación de Supabase
