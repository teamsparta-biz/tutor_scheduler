import type { Instructor } from '../types'

export const isTechTutor = (inst: Instructor) => inst.specialty === 'Technical Tutor'
