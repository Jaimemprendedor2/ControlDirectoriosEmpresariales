import { supabase, Meeting, MeetingStage, MeetingSession, StageProgress } from '../lib/supabase';

export class MeetingService {
  // Obtener todos los meetings
  static async getMeetings(): Promise<Meeting[]> {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Obtener un meeting por ID
  static async getMeetingById(id: string): Promise<Meeting | null> {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  // Obtener meeting con sus stages
  static async getMeetingWithStages(meetingId: string): Promise<{ meeting: Meeting; stages: MeetingStage[] }> {
    const meeting = await this.getMeetingById(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }
    
    const stages = await this.getMeetingStages(meetingId);
    return { meeting, stages };
  }

  // Crear un nuevo meeting
  static async createMeeting(meeting: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>): Promise<Meeting> {
    const { data, error } = await supabase
      .from('meetings')
      .insert([meeting])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Actualizar un meeting
  static async updateMeeting(meetingId: string, updates: { title?: string; description?: string }): Promise<Meeting> {
    const { data, error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', meetingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Eliminar un meeting
  static async deleteMeeting(id: string): Promise<void> {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Obtener stages de un meeting
  static async getMeetingStages(meetingId: string): Promise<MeetingStage[]> {
    const { data, error } = await supabase
      .from('meeting_stages')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Crear un nuevo stage
  static async createStage(stage: Omit<MeetingStage, 'id' | 'created_at' | 'updated_at'>): Promise<MeetingStage> {
    const { data, error } = await supabase
      .from('meeting_stages')
      .insert([stage])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Agregar stage (alias para createStage)
  static async addStage(meetingId: string, title: string, duration: number): Promise<MeetingStage> {
    // Obtener el siguiente order_index
    const existingStages = await this.getMeetingStages(meetingId);
    const nextOrderIndex = existingStages.length;

    return this.createStage({
      meeting_id: meetingId,
      title,
      duration,
      order_index: nextOrderIndex,
      is_completed: false
    });
  }

  // Actualizar un stage
  static async updateStage(stageId: string, updates: Partial<Omit<MeetingStage, 'id' | 'meeting_id' | 'created_at' | 'updated_at'>>): Promise<MeetingStage> {
    const { data, error } = await supabase
      .from('meeting_stages')
      .update(updates)
      .eq('id', stageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Actualizar stage con título y duración (método de conveniencia)
  static async updateStageDetails(stageId: string, title: string, duration: number): Promise<MeetingStage> {
    return this.updateStage(stageId, { title, duration });
  }

  // Eliminar un stage
  static async deleteStage(stageId: string): Promise<void> {
    const { error } = await supabase
      .from('meeting_stages')
      .delete()
      .eq('id', stageId);

    if (error) throw error;
  }

  // Crear una nueva sesión
  static async createSession(meetingId: string): Promise<MeetingSession> {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .insert([{ meeting_id: meetingId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Finalizar una sesión
  static async endSession(sessionId: string): Promise<MeetingSession> {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Obtener sesiones de un meeting
  static async getMeetingSessions(meetingId: string): Promise<MeetingSession[]> {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Obtener estadísticas de un meeting
  static async getMeetingStats(meetingId: string): Promise<{
    totalSessions: number;
    totalTime: number;
    averageSessionTime: number;
  }> {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .select('started_at, ended_at')
      .eq('meeting_id', meetingId)
      .not('ended_at', 'is', null)

    if (error) throw error

    const sessions = data || []
    const totalSessions = sessions.length
    let totalTime = 0

    sessions.forEach((session: { started_at: string; ended_at: string }) => {
      const start = new Date(session.started_at)
      const end = new Date(session.ended_at)
      totalTime += (end.getTime() - start.getTime()) / 1000 // Convertir a segundos
    })

    return {
      totalSessions,
      totalTime,
      averageSessionTime: totalSessions > 0 ? totalTime / totalSessions : 0
    }
  }

  // Crear progreso de stage
  static async createStageProgress(progress: Omit<StageProgress, 'id' | 'created_at' | 'updated_at'>): Promise<StageProgress> {
    const { data, error } = await supabase
      .from('stage_progress')
      .insert([progress])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Actualizar progreso de stage
  static async updateStageProgress(progressId: string, updates: Partial<Omit<StageProgress, 'id' | 'created_at' | 'updated_at'>>): Promise<StageProgress> {
    const { data, error } = await supabase
      .from('stage_progress')
      .update(updates)
      .eq('id', progressId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Obtener progreso de stages de una sesión
  static async getSessionStageProgress(sessionId: string): Promise<StageProgress[]> {
    const { data, error } = await supabase
      .from('stage_progress')
      .select('*')
      .eq('session_id', sessionId)
      .order('started_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}