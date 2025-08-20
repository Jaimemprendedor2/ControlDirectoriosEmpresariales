-- Actualización de Supabase para v1.6.0
-- Agregar nuevos campos a la tabla stages

-- Agregar columna description
ALTER TABLE stages 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Agregar columna alert_color
ALTER TABLE stages 
ADD COLUMN IF NOT EXISTS alert_color VARCHAR(7) DEFAULT '#FF0000';

-- Agregar columna alert_seconds
ALTER TABLE stages 
ADD COLUMN IF NOT EXISTS alert_seconds INTEGER DEFAULT 15;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_stages_alert_seconds ON stages(alert_seconds);
CREATE INDEX IF NOT EXISTS idx_stages_alert_color ON stages(alert_color);

-- Actualizar RLS (Row Level Security) para los nuevos campos
-- Asegurar que los usuarios solo puedan ver/editar sus propios directorios

-- Política para SELECT
DROP POLICY IF EXISTS "Users can view their own stages" ON stages;
CREATE POLICY "Users can view their own stages" ON stages
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Política para INSERT
DROP POLICY IF EXISTS "Users can insert their own stages" ON stages;
CREATE POLICY "Users can insert their own stages" ON stages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Política para UPDATE
DROP POLICY IF EXISTS "Users can update their own stages" ON stages;
CREATE POLICY "Users can update their own stages" ON stages
    FOR UPDATE USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id
    );

-- Política para DELETE
DROP POLICY IF EXISTS "Users can delete their own stages" ON stages;
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

-- Trigger para validar alert_color antes de insertar/actualizar
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validación
DROP TRIGGER IF EXISTS validate_stage_data_trigger ON stages;
CREATE TRIGGER validate_stage_data_trigger
    BEFORE INSERT OR UPDATE ON stages
    FOR EACH ROW
    EXECUTE FUNCTION validate_stage_data();

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN stages.description IS 'Descripción opcional de la etapa';
COMMENT ON COLUMN stages.alert_color IS 'Color de alerta en formato hexadecimal (ej: #FF0000)';
COMMENT ON COLUMN stages.alert_seconds IS 'Segundos antes del final para activar la alerta (1-300)';

-- Verificar que los cambios se aplicaron correctamente
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'stages' 
ORDER BY ordinal_position;
