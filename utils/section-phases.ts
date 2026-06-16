import { Section } from '@/data/mock-data'

export type SectionPhaseId = 'text' | 'video' | 'questions'
export type SectionPhaseKind = 'reading' | 'video' | 'exercise'

export interface SectionPhaseItem {
  id: SectionPhaseId
  kind: SectionPhaseKind
  title: string
}

export function getSectionPhaseItems(section: Section): SectionPhaseItem[] {
  const items: SectionPhaseItem[] = []

  if (section.textPages && section.textPages.length > 0) {
    items.push({
      id: 'text',
      kind: 'reading',
      title: getReadingTitle(section),
    })
  }

  if (section.videoUrl) {
    items.push({
      id: 'video',
      kind: 'video',
      title: getVideoTitle(section),
    })
  }

  if (hasQuestions(section)) {
    items.push({
      id: 'questions',
      kind: 'exercise',
      title: getExerciseTitle(section),
    })
  }

  return items
}

export function hasQuestions(section: Section): boolean {
  return (
    (section.questions?.length ?? 0) +
      (section.videoPauseQuestions?.length ?? 0) >
    0
  )
}

export function getInitialSectionPhase(section: Section): SectionPhaseId {
  const items = getSectionPhaseItems(section)
  return items[0]?.id ?? 'questions'
}

export function getSectionDescription(section: Section): string {
  const firstTextPage = section.textPages?.[0]?.trim()
  if (firstTextPage) {
    return `${firstTextPage.slice(0, 110)}${firstTextPage.length > 110 ? '…' : ''}`
  }
  return ''
}

function getReadingTitle(section: Section): string {
  const activityTitle = section.activities?.find(
    (activity) => activity.type === 'text_reading'
  )?.title

  return activityTitle || 'Leitura'
}

function getVideoTitle(section: Section): string {
  const activityTitle = section.activities?.find(
    (activity) => activity.type === 'video_pause'
  )?.title

  return activityTitle || 'Vídeo'
}

function getExerciseTitle(section: Section): string {
  const activityTitle = section.activities?.find(
    (activity) =>
      activity.type === 'multiple_choice' ||
      activity.type === 'true_false' ||
      activity.type === 'image_association'
  )?.title

  return activityTitle || 'Exercício'
}
