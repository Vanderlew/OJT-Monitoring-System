import { supabase } from './supabase'

export type AssignedStudent = {
  assignmentId: number
  studentId: number
  name: string
  email: string | null
  schoolYearLabel: string
}

type StudentNameFields = {
  firstname: string | null
  lastname: string | null
  middle_name: string | null
  suffix?: string | null
}

type RpcAssignedStudentRow = {
  assignment_id: number
  student_id: number
  firstname: string | null
  lastname: string | null
  middle_name: string | null
  suffix: string | null
  personal_email: string | null
  school_year_start: number
  school_year_end: number
}

type StudentProfile = StudentNameFields & {
  id: number
  personal_email: string | null
}

type AssignmentRow = {
  id: number
  student_id: number
  student: StudentProfile | StudentProfile[] | null
  school_years: { start_date: number; end_date: number } | { start_date: number; end_date: number }[] | null
}

function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function formatSchoolYearLabel(startYear: number, endYear: number): string {
  return `${startYear}–${endYear}`
}

export function formatStudentDisplayName(fields: StudentNameFields): string {
  const givenNames = [fields.firstname, fields.middle_name].filter(Boolean).join(' ')
  const familyName = [fields.lastname, fields.suffix].filter(Boolean).join(' ')

  if (familyName && givenNames) return `${familyName}, ${givenNames}`
  if (familyName) return familyName
  if (givenNames) return givenNames
  return 'Unknown student'
}

function mapAssignedStudent(params: {
  assignmentId: number
  studentId: number
  firstname: string | null
  lastname: string | null
  middle_name: string | null
  suffix: string | null
  personal_email: string | null
  schoolYearStart: number | null
  schoolYearEnd: number | null
}): AssignedStudent {
  return {
    assignmentId: params.assignmentId,
    studentId: params.studentId,
    name: formatStudentDisplayName({
      firstname: params.firstname,
      lastname: params.lastname,
      middle_name: params.middle_name,
      suffix: params.suffix,
    }),
    email: params.personal_email?.trim() || null,
    schoolYearLabel:
      params.schoolYearStart != null && params.schoolYearEnd != null
        ? formatSchoolYearLabel(params.schoolYearStart, params.schoolYearEnd)
        : '—',
  }
}

function mapRpcRows(rows: RpcAssignedStudentRow[]): AssignedStudent[] {
  return rows.map((row) =>
    mapAssignedStudent({
      assignmentId: Number(row.assignment_id),
      studentId: Number(row.student_id),
      firstname: row.firstname,
      lastname: row.lastname,
      middle_name: row.middle_name,
      suffix: row.suffix,
      personal_email: row.personal_email,
      schoolYearStart: row.school_year_start,
      schoolYearEnd: row.school_year_end,
    }),
  )
}

async function fetchViaRpc(): Promise<{ students: AssignedStudent[]; error: string | null } | null> {
  const { data, error } = await supabase.rpc('get_coordinator_assigned_students')

  if (error) {
    const message = error.message.toLowerCase()
    if (message.includes('could not find the function')) {
      return null
    }
    return { students: [], error: error.message }
  }

  const rows = Array.isArray(data) ? (data as RpcAssignedStudentRow[]) : []
  return { students: mapRpcRows(rows), error: null }
}

async function fetchViaQuery(
  coordinatorId: number,
): Promise<{ students: AssignedStudent[]; error: string | null }> {
  const { data, error } = await supabase
    .from('student_coordinator_assignments')
    .select(`
      id,
      student_id,
      student:profiles!student_coordinator_assignments_student_id_fkey (
        id,
        firstname,
        lastname,
        middle_name,
        suffix,
        personal_email
      ),
      school_years (
        start_date,
        end_date
      )
    `)
    .eq('coordinator_id', coordinatorId)
    .eq('status', 'active')
    .order('assigned_at', { ascending: false })

  if (error) {
    return { students: [], error: error.message }
  }

  const students = ((data ?? []) as AssignmentRow[]).map((row) => {
    const student = unwrapRelation(row.student)
    const schoolYear = unwrapRelation(row.school_years)

    return mapAssignedStudent({
      assignmentId: row.id,
      studentId: student?.id ?? row.student_id,
      firstname: student?.firstname ?? null,
      lastname: student?.lastname ?? null,
      middle_name: student?.middle_name ?? null,
      suffix: student?.suffix ?? null,
      personal_email: student?.personal_email ?? null,
      schoolYearStart: schoolYear?.start_date ?? null,
      schoolYearEnd: schoolYear?.end_date ?? null,
    })
  })

  return { students, error: null }
}

export async function fetchCoordinatorAssignedStudents(
  coordinatorId: number,
): Promise<{ students: AssignedStudent[]; error: string | null }> {
  const rpcResult = await fetchViaRpc()
  if (rpcResult) {
    return rpcResult
  }

  return fetchViaQuery(coordinatorId)
}
