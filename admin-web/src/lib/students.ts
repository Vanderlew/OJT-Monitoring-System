import { supabase } from './supabase'
import { formatSchoolYearLabel } from './schoolYears'

export const STUDENTS_PAGE_SIZE = 20

export type StudentFilter = 'all' | 'enrolled' | 'pending'

export type StudentListItem = {
  id: number
  firstname: string | null
  lastname: string | null
  middle_name: string | null
  suffix: string | null
  personal_email: string | null
  status: string | null
  created_at: string | null
  enrollmentStatus: 'enrolled' | 'pending'
  coordinatorName: string | null
  schoolYearLabel: string | null
}

const studentListSelect = `
  id,
  firstname,
  lastname,
  middle_name,
  suffix,
  personal_email,
  status,
  created_at
`

let cachedStudentRoleId: number | null = null

async function getStudentRoleId(): Promise<{ id: number | null; error: string | null }> {
  if (cachedStudentRoleId != null) {
    return { id: cachedStudentRoleId, error: null }
  }

  const { data, error } = await supabase
    .from('roles')
    .select('id')
    .ilike('name', 'student')
    .maybeSingle()

  if (error) {
    return { id: null, error: error.message }
  }

  if (!data) {
    return { id: null, error: 'Student role not found. Run supabase/seed/roles.sql in Supabase.' }
  }

  cachedStudentRoleId = Number(data.id)
  return { id: cachedStudentRoleId, error: null }
}

async function fetchActiveAssignedStudentIds(): Promise<{ ids: number[]; error: string | null }> {
  const { data, error } = await supabase
    .from('student_coordinator_assignments')
    .select('student_id')
    .eq('status', 'active')

  if (error) {
    return { ids: [], error: error.message }
  }

  const ids = [...new Set((data ?? []).map((row) => Number(row.student_id)))]
  return { ids, error: null }
}

type AssignmentRow = {
  student_id: number
  coordinator: { firstname: string | null; lastname: string | null } | { firstname: string | null; lastname: string | null }[] | null
  school_years: { start_date: number; end_date: number } | { start_date: number; end_date: number }[] | null
}

function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function normalizeStudentListItem(row: Record<string, unknown>): Omit<StudentListItem, 'enrollmentStatus' | 'coordinatorName' | 'schoolYearLabel'> {
  return {
    id: row.id as number,
    firstname: (row.firstname as string | null) ?? null,
    lastname: (row.lastname as string | null) ?? null,
    middle_name: (row.middle_name as string | null) ?? null,
    suffix: (row.suffix as string | null) ?? null,
    personal_email: (row.personal_email as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
  }
}

function coordinatorDisplayName(
  coordinator: { firstname: string | null; lastname: string | null } | null,
): string | null {
  if (!coordinator) return null
  const parts = [coordinator.firstname, coordinator.lastname].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : null
}

async function attachActiveAssignments(
  students: Omit<StudentListItem, 'enrollmentStatus' | 'coordinatorName' | 'schoolYearLabel'>[],
  assignedIds: Set<number>,
): Promise<StudentListItem[]> {
  if (students.length === 0) {
    return []
  }

  const studentIds = students.map((student) => student.id)
  const assignmentByStudent = new Map<
    number,
    { coordinatorName: string | null; schoolYearLabel: string | null }
  >()

  const { data, error } = await supabase
    .from('student_coordinator_assignments')
    .select(`
      student_id,
      coordinator:profiles!student_coordinator_assignments_coordinator_id_fkey (
        firstname,
        lastname
      ),
      school_years (
        start_date,
        end_date
      )
    `)
    .in('student_id', studentIds)
    .eq('status', 'active')
    .order('assigned_at', { ascending: false })

  if (!error && data) {
    for (const row of data as AssignmentRow[]) {
      const studentId = Number(row.student_id)
      if (assignmentByStudent.has(studentId)) continue

      const schoolYear = unwrapRelation(row.school_years)
      assignmentByStudent.set(studentId, {
        coordinatorName: coordinatorDisplayName(unwrapRelation(row.coordinator)),
        schoolYearLabel: schoolYear
          ? formatSchoolYearLabel(schoolYear.start_date, schoolYear.end_date)
          : null,
      })
    }
  }

  return students.map((student) => {
    const assignment = assignmentByStudent.get(student.id)
    const isEnrolled = assignedIds.has(student.id)

    return {
      ...student,
      enrollmentStatus: isEnrolled ? 'enrolled' : 'pending',
      coordinatorName: assignment?.coordinatorName ?? null,
      schoolYearLabel: assignment?.schoolYearLabel ?? null,
    }
  })
}

export function studentListDisplayName(student: StudentListItem): string {
  const parts = [student.firstname, student.middle_name, student.lastname, student.suffix].filter(Boolean)
  return parts.join(' ') || '—'
}

export async function fetchStudents(
  page: number,
  filter: StudentFilter,
): Promise<{ students: StudentListItem[]; total: number; error: string | null }> {
  const { id: studentRoleId, error: roleError } = await getStudentRoleId()
  if (roleError || studentRoleId == null) {
    return { students: [], total: 0, error: roleError ?? 'Student role not found.' }
  }

  const { ids: assignedIds, error: assignedError } = await fetchActiveAssignedStudentIds()
  if (assignedError) {
    return { students: [], total: 0, error: assignedError }
  }

  const assignedSet = new Set(assignedIds)

  if (filter === 'enrolled' && assignedIds.length === 0) {
    return { students: [], total: 0, error: null }
  }

  const from = (page - 1) * STUDENTS_PAGE_SIZE
  const to = from + STUDENTS_PAGE_SIZE - 1

  let query = supabase
    .from('profiles')
    .select(studentListSelect, { count: 'exact' })
    .is('deleted_at', null)
    .eq('role_id', studentRoleId)
    .order('created_at', { ascending: false })

  if (filter === 'enrolled') {
    query = query.in('id', assignedIds)
  } else if (filter === 'pending' && assignedIds.length > 0) {
    query = query.not('id', 'in', `(${assignedIds.join(',')})`)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    return { students: [], total: 0, error: error.message }
  }

  const baseStudents = (data ?? []).map((row) =>
    normalizeStudentListItem(row as Record<string, unknown>),
  )
  const students = await attachActiveAssignments(baseStudents, assignedSet)

  return {
    students,
    total: count ?? 0,
    error: null,
  }
}

export type CoordinatorOption = {
  id: number
  firstname: string | null
  lastname: string | null
  personal_email: string | null
}

let cachedCoordinatorRoleId: number | null = null

async function getCoordinatorRoleId(): Promise<{ id: number | null; error: string | null }> {
  if (cachedCoordinatorRoleId != null) {
    return { id: cachedCoordinatorRoleId, error: null }
  }

  const { data, error } = await supabase
    .from('roles')
    .select('id')
    .ilike('name', 'coordinator')
    .maybeSingle()

  if (error) {
    return { id: null, error: error.message }
  }

  if (!data) {
    return { id: null, error: 'Coordinator role not found. Run supabase/seed/roles.sql in Supabase.' }
  }

  cachedCoordinatorRoleId = Number(data.id)
  return { id: cachedCoordinatorRoleId, error: null }
}

export function coordinatorOptionLabel(coordinator: CoordinatorOption): string {
  const parts = [coordinator.firstname, coordinator.lastname].filter(Boolean)
  const name = parts.join(' ') || 'Unnamed coordinator'
  return coordinator.personal_email ? `${name} (${coordinator.personal_email})` : name
}

export async function fetchCoordinators(): Promise<{
  coordinators: CoordinatorOption[]
  error: string | null
}> {
  const { id: coordinatorRoleId, error: roleError } = await getCoordinatorRoleId()
  if (roleError || coordinatorRoleId == null) {
    return { coordinators: [], error: roleError ?? 'Coordinator role not found.' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, firstname, lastname, personal_email')
    .eq('role_id', coordinatorRoleId)
    .is('deleted_at', null)
    .order('lastname', { ascending: true })
    .order('firstname', { ascending: true })

  if (error) {
    return { coordinators: [], error: error.message }
  }

  return { coordinators: (data ?? []) as CoordinatorOption[], error: null }
}

function mapAssignRpcError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('forbidden') || lower.includes('administrators only')) {
    return 'Your account is not recognized as admin.'
  }
  if (lower.includes('could not find the function')) {
    return 'Assignment function not found. Run supabase/seed/student-coordinator-assignments.sql in Supabase.'
  }
  return message
}

export async function assignStudentCoordinator(params: {
  studentId: number
  coordinatorId: number
  schoolYearId: number
}): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('assign_student_coordinator', {
    p_student_id: params.studentId,
    p_coordinator_id: params.coordinatorId,
    p_school_year_id: params.schoolYearId,
  })

  if (error) {
    return { error: mapAssignRpcError(error.message) }
  }

  return { error: null }
}
