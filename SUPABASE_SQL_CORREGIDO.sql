-- =====================================================
-- SQL CORREGIDO PARA SUPABASE - CONTROL DE REUNIONES
-- =====================================================
-- Copia todo este contenido y pégalo en el SQL Editor de Supabase
-- Luego haz clic en "Run" para ejecutar

-- Create tables for Control de Reuniones

-- 1. Meetings table (Reuniones)
CREATE TABLE meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Meeting Stages table (Etapas de reunión)
CREATE TABLE meeting_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0), -- duración en segundos
    order_index INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id, order_index)
);

-- 3. Meeting Sessions table (Sesiones de reunión)
CREATE TABLE meeting_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    current_stage_id UUID REFERENCES meeting_stages(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Stage Progress table (Progreso de etapas)
CREATE TABLE stage_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES meeting_stages(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER DEFAULT 0, -- tiempo en segundos
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meeting_stages_meeting_id ON meeting_stages(meeting_id);
CREATE INDEX idx_meeting_stages_order ON meeting_stages(meeting_id, order_index);
CREATE INDEX idx_meeting_sessions_meeting_id ON meeting_sessions(meeting_id);
CREATE INDEX idx_stage_progress_session_id ON stage_progress(session_id);
CREATE INDEX idx_stage_progress_stage_id ON stage_progress(stage_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_stages_updated_at BEFORE UPDATE ON meeting_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_sessions_updated_at BEFORE UPDATE ON meeting_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stage_progress_updated_at BEFORE UPDATE ON stage_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Meetings policies
CREATE POLICY "Users can view their own meetings" ON meetings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meetings" ON meetings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings" ON meetings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings" ON meetings
    FOR DELETE USING (auth.uid() = user_id);

-- Meeting stages policies
CREATE POLICY "Users can view stages of their meetings" ON meeting_stages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_stages.meeting_id 
            AND meetings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert stages for their meetings" ON meeting_stages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_stages.meeting_id 
            AND meetings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update stages of their meetings" ON meeting_stages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_stages.meeting_id 
            AND meetings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete stages of their meetings" ON meeting_stages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_stages.meeting_id 
            AND meetings.user_id = auth.uid()
        )
    );

-- Meeting sessions policies
CREATE POLICY "Users can view sessions of their meetings" ON meeting_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_sessions.meeting_id 
            AND meetings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sessions for their meetings" ON meeting_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_sessions.meeting_id 
            AND meetings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update sessions of their meetings" ON meeting_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meetings 
            WHERE meetings.id = meeting_sessions.meeting_id 
            AND meetings.user_id = auth.uid()
        )
    );

-- Stage progress policies
CREATE POLICY "Users can view progress of their sessions" ON stage_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meeting_sessions ms
            JOIN meetings m ON ms.meeting_id = m.id
            WHERE ms.id = stage_progress.session_id 
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert progress for their sessions" ON stage_progress
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meeting_sessions ms
            JOIN meetings m ON ms.meeting_id = m.id
            WHERE ms.id = stage_progress.session_id 
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update progress of their sessions" ON stage_progress
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meeting_sessions ms
            JOIN meetings m ON ms.meeting_id = m.id
            WHERE ms.id = stage_progress.session_id 
            AND m.user_id = auth.uid()
        )
    );

-- Create functions for common operations

-- Function to create a new meeting with stages
CREATE OR REPLACE FUNCTION create_meeting_with_stages(
    p_title VARCHAR(255),
    p_description TEXT,
    p_stages JSON
)
RETURNS UUID AS $$
DECLARE
    v_meeting_id UUID;
    v_stage JSON;
    v_order_index INTEGER := 1;
BEGIN
    -- Create meeting
    INSERT INTO meetings (title, description, user_id)
    VALUES (p_title, p_description, auth.uid())
    RETURNING id INTO v_meeting_id;
    
    -- Create stages
    FOR v_stage IN SELECT * FROM json_array_elements(p_stages)
    LOOP
        INSERT INTO meeting_stages (meeting_id, title, duration, order_index)
        VALUES (
            v_meeting_id,
            (v_stage->>'title')::VARCHAR(255),
            (v_stage->>'duration')::INTEGER,
            v_order_index
        );
        v_order_index := v_order_index + 1;
    END LOOP;
    
    RETURN v_meeting_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start a meeting session
CREATE OR REPLACE FUNCTION start_meeting_session(p_meeting_id UUID)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_first_stage_id UUID;
BEGIN
    -- Check if user owns the meeting
    IF NOT EXISTS (
        SELECT 1 FROM meetings 
        WHERE id = p_meeting_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Meeting not found or access denied';
    END IF;
    
    -- Get first stage
    SELECT id INTO v_first_stage_id
    FROM meeting_stages
    WHERE meeting_id = p_meeting_id
    ORDER BY order_index
    LIMIT 1;
    
    -- Create session
    INSERT INTO meeting_sessions (meeting_id, current_stage_id)
    VALUES (p_meeting_id, v_first_stage_id)
    RETURNING id INTO v_session_id;
    
    -- Create first stage progress
    IF v_first_stage_id IS NOT NULL THEN
        INSERT INTO stage_progress (session_id, stage_id)
        VALUES (v_session_id, v_first_stage_id);
    END IF;
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ¡LISTO! Ahora puedes ejecutar este SQL en Supabase
-- =====================================================
