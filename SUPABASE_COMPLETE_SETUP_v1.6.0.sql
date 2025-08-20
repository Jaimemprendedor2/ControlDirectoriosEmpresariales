-- Configuración completa de Supabase para v1.6.0
-- Crear tabla stages con todos los campos necesarios

-- Habilitar RLS (Row Level Security)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla stages
CREATE TABLE IF NOT EXISTS stages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    duration INTEGER NOT NULL DEFAULT 30,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    alert_color VARCHAR(7) DEFAULT '#FF0000',
    alert_seconds INTEGER DEFAULT 15,
    colors JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en la tabla
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_stages_user_id ON stages(user_id);
CREATE INDEX IF NOT EXISTS idx_stages_order_index ON stages(order_index);
CREATE INDEX IF NOT EXISTS idx_stages_is_completed ON stages(is_completed);
CREATE INDEX IF NOT EXISTS idx_stages_alert_seconds ON stages(alert_seconds);
CREATE INDEX IF NOT EXISTS idx_stages_alert_color ON stages(alert_color);
CREATE INDEX IF NOT EXISTS idx_stages_created_at ON stages(created_at);

-- Políticas de RLS (Row Level Security)
-- Política para SELECT
CREATE POLICY "Users can view their own stages" ON stages
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Política para INSERT
CREATE POLICY "Users can insert their own stages" ON stages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Política para UPDATE
CREATE POLICY "Users can update their own stages" ON stages
    FOR UPDATE USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id
    );

-- Política para DELETE
CREATE POLICY "Users can delete their own stages" ON stages
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Función para validar el formato de color hexadecimal
CREATE OR REPLACE FUNCTION validate_hex_color(color_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validar formato hexadecimal (#RRGGBB)
    RETURN color_value ~ '^#[0-9A-Fa-f]{6}$';
END;
$$ LANGUAGE plpgsql;

-- Función para validar datos de la etapa
CREATE OR REPLACE FUNCTION validate_stage_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar alert_seconds
    IF NEW.alert_seconds < 1 OR NEW.alert_seconds > 300 THEN
        RAISE EXCEPTION 'alert_seconds debe estar entre 1 y 300';
    END IF;
    
    -- Validar alert_color
    IF NOT validate_hex_color(NEW.alert_color) THEN
        RAISE EXCEPTION 'alert_color debe ser un color hexadecimal válido (ej: #FF0000)';
    END IF;
    
    -- Validar duration
    IF NEW.duration < 30 THEN
        RAISE EXCEPTION 'duration debe ser al menos 30 segundos';
    END IF;
    
    -- Validar title
    IF NEW.title IS NULL OR LENGTH(TRIM(NEW.title)) = 0 THEN
        RAISE EXCEPTION 'title no puede estar vacío';
    END IF;
    
    -- Actualizar updated_at
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validación
CREATE TRIGGER validate_stage_data_trigger
    BEFORE INSERT OR UPDATE ON stages
    FOR EACH ROW
    EXECUTE FUNCTION validate_stage_data();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_stages_updated_at
    BEFORE UPDATE ON stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentar la tabla y campos
COMMENT ON TABLE stages IS 'Tabla para almacenar las etapas de los directorios empresariales';
COMMENT ON COLUMN stages.id IS 'Identificador único de la etapa';
COMMENT ON COLUMN stages.user_id IS 'ID del usuario propietario de la etapa';
COMMENT ON COLUMN stages.title IS 'Título de la etapa';
COMMENT ON COLUMN stages.description IS 'Descripción opcional de la etapa';
COMMENT ON COLUMN stages.duration IS 'Duración de la etapa en segundos';
COMMENT ON COLUMN stages.order_index IS 'Orden de la etapa en el directorio';
COMMENT ON COLUMN stages.is_completed IS 'Indica si la etapa está completada';
COMMENT ON COLUMN stages.alert_color IS 'Color de alerta en formato hexadecimal (ej: #FF0000)';
COMMENT ON COLUMN stages.alert_seconds IS 'Segundos antes del final para activar la alerta (1-300)';
COMMENT ON COLUMN stages.colors IS 'Array JSON con configuraciones de colores por tiempo';
COMMENT ON COLUMN stages.created_at IS 'Fecha de creación de la etapa';
COMMENT ON COLUMN stages.updated_at IS 'Fecha de última actualización de la etapa';

-- Verificar que la tabla se creó correctamente
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'stages' 
ORDER BY ordinal_position;

-- Mostrar las políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'stages';
