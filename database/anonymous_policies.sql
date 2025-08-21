-- Políticas para permitir acceso anónimo
-- Estas políticas permiten operaciones cuando user_id es NULL (usuario anónimo)

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can insert their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can delete their own meetings" ON meetings;

-- Nuevas políticas para meetings que permiten acceso anónimo
CREATE POLICY "Allow anonymous and authenticated users to view meetings" ON meetings
    FOR SELECT USING (
        user_id IS NULL OR 
        auth.uid() = user_id
    );

CREATE POLICY "Allow anonymous and authenticated users to insert meetings" ON meetings
    FOR INSERT WITH CHECK (
        user_id IS NULL OR 
        auth.uid() = user_id
    );

CREATE POLICY "Allow anonymous and authenticated users to update meetings" ON meetings
    FOR UPDATE USING (
        user_id IS NULL OR 
        auth.uid() = user_id
    );

CREATE POLICY "Allow anonymous and authenticated users to delete meetings" ON meetings
    FOR DELETE USING (
        user_id IS NULL OR 
        auth.uid() = user_id
    );

-- Eliminar políticas existentes para meeting_stages
DROP POLICY IF EXISTS "Users can view stages of their meetings" ON meeting_stages;
DROP POLICY IF EXISTS "Users can insert stages for their meetings" ON meeting_stages;
DROP POLICY IF EXISTS "Users can update stages of their meetings" ON meeting_stages;
DROP POLICY IF EXISTS "Users can delete stages of their meetings" ON meeting_stages;

-- Nuevas políticas para meeting_stages que permiten acceso anónimo
CREATE POLICY "Allow access to stages of anonymous and owned meetings" ON meeting_stages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_stages.meeting_id 
            AND (meetings.user_id IS NULL OR meetings.user_id = auth.uid())
        )
    );

CREATE POLICY "Allow insert stages for anonymous and owned meetings" ON meeting_stages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_stages.meeting_id 
            AND (meetings.user_id IS NULL OR meetings.user_id = auth.uid())
        )
    );

CREATE POLICY "Allow update stages of anonymous and owned meetings" ON meeting_stages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_stages.meeting_id 
            AND (meetings.user_id IS NULL OR meetings.user_id = auth.uid())
        )
    );

CREATE POLICY "Allow delete stages of anonymous and owned meetings" ON meeting_stages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_stages.meeting_id 
            AND (meetings.user_id IS NULL OR meetings.user_id = auth.uid())
        )
    );

-- Eliminar políticas existentes para meeting_sessions
DROP POLICY IF EXISTS "Users can view sessions of their meetings" ON meeting_sessions;
DROP POLICY IF EXISTS "Users can insert sessions for their meetings" ON meeting_sessions;
DROP POLICY IF EXISTS "Users can update sessions of their meetings" ON meeting_sessions;

-- Nuevas políticas para meeting_sessions
CREATE POLICY "Allow access to sessions of anonymous and owned meetings" ON meeting_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_sessions.meeting_id 
            AND (meetings.user_id IS NULL OR meetings.user_id = auth.uid())
        )
    );

CREATE POLICY "Allow insert sessions for anonymous and owned meetings" ON meeting_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_sessions.meeting_id 
            AND (meetings.user_id IS NULL OR meetings.user_id = auth.uid())
        )
    );

CREATE POLICY "Allow update sessions of anonymous and owned meetings" ON meeting_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_sessions.meeting_id 
            AND (meetings.user_id IS NULL OR meetings.user_id = auth.uid())
        )
    );

-- Eliminar políticas existentes para stage_progress
DROP POLICY IF EXISTS "Users can view progress of their sessions" ON stage_progress;
DROP POLICY IF EXISTS "Users can insert progress for their sessions" ON stage_progress;
DROP POLICY IF EXISTS "Users can update progress of their sessions" ON stage_progress;

-- Nuevas políticas para stage_progress
CREATE POLICY "Allow access to progress of anonymous and owned sessions" ON stage_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meeting_sessions ms
            JOIN meetings m ON ms.meeting_id = m.id
            WHERE ms.id = stage_progress.session_id 
            AND (m.user_id IS NULL OR m.user_id = auth.uid())
        )
    );

CREATE POLICY "Allow insert progress for anonymous and owned sessions" ON stage_progress
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meeting_sessions ms
            JOIN meetings m ON ms.meeting_id = m.id
            WHERE ms.id = stage_progress.session_id 
            AND (m.user_id IS NULL OR m.user_id = auth.uid())
        )
    );

CREATE POLICY "Allow update progress of anonymous and owned sessions" ON stage_progress
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meeting_sessions ms
            JOIN meetings m ON ms.meeting_id = m.id
            WHERE ms.id = stage_progress.session_id 
            AND (m.user_id IS NULL OR m.user_id = auth.uid())
        )
    );
