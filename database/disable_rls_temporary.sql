-- Solución temporal: Deshabilitar RLS para permitir operaciones anónimas
-- ⚠️ ADVERTENCIA: Esto deshabilita la seguridad temporalmente
-- Solo usar para desarrollo/testing

-- Deshabilitar RLS en todas las tablas
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE stage_progress DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('meetings', 'meeting_stages', 'meeting_sessions', 'stage_progress');
