import { supabase, Meeting, MeetingStage, MeetingSession, StageProgress } from '../lib/supabase'

export class MeetingService {
  // Crear una nueva reunión
  static async createMeeting(title: string, description?: string): Promise<Meeting> {
    const { data, error } = await supabase
      .from('meetings')
      .insert({
        title,
        description,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Crear una reunión con etapas
  static async createMeetingWithStages(
    title: string, 
    description: string, 
    stages: Array<{ title: string; duration: number }>
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('create_meeting_with_stages', {
        p_title: title,
        p_description: description,
        p_stages: JSON.stringify(stages)
      })

    if (error) throw error
    return data
  }

  // Obtener todas las reuniones del usuario
  static async getMeetings(): Promise<Meeting[]> {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Obtener una reunión específica con sus etapas
  static async getMeetingWithStages(meetingId: string): Promise<{
    meeting: Meeting;
    stages: MeetingStage[];
  }> {
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single()

    if (meetingError) throw meetingError

    const { data: stages, error: stagesError } = await supabase
      .from('meeting_stages')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('order_index')

    if (stagesError) throw stagesError

    return {
      meeting,
      stages: stages || []
    }
  }

  // Agregar una etapa a una reunión
  static async addStage(
    meetingId: string, 
    title: string, 
    duration: number
  ): Promise<MeetingStage> {
    // Obtener el siguiente order_index
    const { data: lastStage } = await supabase
      .from('meeting_stages')
      .select('order_index')
      .eq('meeting_id', meetingId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (lastStage?.order_index || 0) + 1

    const { data, error } = await supabase
      .from('meeting_stages')
      .insert({
        meeting_id: meetingId,
        title,
        duration,
        order_index: nextOrder
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Iniciar una sesión de reunión
  static async startMeetingSession(meetingId: string): Promise<string> {
    const { data, error } = await supabase
      .rpc('start_meeting_session', {
        p_meeting_id: meetingId
      })

    if (error) throw error
    return data
  }

  // Obtener la sesión activa de una reunión
  static async getActiveSession(meetingId: string): Promise<MeetingSession | null> {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data
  }

  // Actualizar el progreso de una etapa
  static async updateStageProgress(
    sessionId: string,
    stageId: string,
    timeSpent: number,
    isCompleted: boolean = false
  ): Promise<StageProgress> {
    const { data, error } = await supabase
      .from('stage_progress')
      .upsert({
        session_id: sessionId,
        stage_id: stageId,
        time_spent: timeSpent,
        is_completed: isCompleted,
        ended_at: isCompleted ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Finalizar una sesión de reunión
  static async endMeetingSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('meeting_sessions')
      .update({
        ended_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', sessionId)

    if (error) throw error
  }

  // Obtener estadísticas de una reunión
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

    sessions.forEach(session => {
      const start = new Date(session.started_at)
      const end = new Date(session.ended_at!)
      totalTime += (end.getTime() - start.getTime()) / 1000 // Convertir a segundos
    })

    return {
      totalSessions,
      totalTime,
      averageSessionTime: totalSessions > 0 ? totalTime / totalSessions : 0
    }
  }

  // Eliminar una reunión
  static async deleteMeeting(meetingId: string): Promise<void> {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', meetingId)

    if (error) throw error
  }
}
