import { supabase } from './supabase'

export type SchoolYear = {
  id: number
  start_date: number
  end_date: number
  is_active: boolean
  deleted_at: string | null
}

export type CreateSchoolYearInput = {
  startYear: number
  isActive?: boolean
}

export function getSchoolYearEndYear(startYear: number): number {
  return startYear + 1
}

const schoolYearSelect = `
  id,
  start_date,
  end_date,
  is_active,
  deleted_at
`

export async function fetchSchoolYears(): Promise<{
  schoolYears: SchoolYear[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('school_years')
    .select(schoolYearSelect)
    .is('deleted_at', null)
    .order('start_date', { ascending: false })

  if (error) {
    return { schoolYears: [], error: error.message }
  }

  return { schoolYears: (data ?? []) as SchoolYear[], error: null }
}

export async function createSchoolYear(
  input: CreateSchoolYearInput,
): Promise<{ schoolYear: SchoolYear | null; error: string | null }> {
  const startYear = input.startYear
  const endYear = getSchoolYearEndYear(startYear)
  const isActive = input.isActive ?? true

  if (!Number.isInteger(startYear)) {
    return { schoolYear: null, error: 'Start year must be a whole number.' }
  }

  if (endYear <= startYear) {
    return { schoolYear: null, error: 'End year must be the year after the start year.' }
  }

  const { data, error } = await supabase
    .from('school_years')
    .insert({
      start_date: startYear,
      end_date: endYear,
      is_active: isActive,
    })
    .select(schoolYearSelect)
    .single()

  if (error) {
    return { schoolYear: null, error: error.message }
  }

  return { schoolYear: data as SchoolYear, error: null }
}

export function formatSchoolYearLabel(startYear: number, endYear: number): string {
  return `${startYear}–${endYear}`
}

export function formatSchoolYearValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return String(value)
}

export async function fetchActiveSchoolYear(): Promise<{
  schoolYear: SchoolYear | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('school_years')
    .select(schoolYearSelect)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { schoolYear: null, error: error.message }
  }

  return { schoolYear: (data as SchoolYear | null) ?? null, error: null }
}
