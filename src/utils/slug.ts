import type { CollegeEvent } from '../types';
import type { ActiveNavTab } from '../components/common/Sidebar';

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-');     // Replace multiple - with single -
}

export function getEventSlug(event: CollegeEvent): string {
  if (event.slug) return event.slug;
  const collegeSlug = slugify(event.college_name || 'assembly');
  const chapterSlug = slugify(event.chapter || 'tn');
  // Example: jkkncet-tn-assembly-2026 or fallback
  const base = `${collegeSlug}-${chapterSlug}-2026`;
  return base || event.id;
}

export function findEventBySlug(events: CollegeEvent[], slug?: string): CollegeEvent | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.toLowerCase().trim();
  
  // 1. Direct slug match
  const matchBySlug = events.find(e => e.slug?.toLowerCase() === cleanSlug);
  if (matchBySlug) return matchBySlug;

  // 2. Direct ID match
  const matchById = events.find(e => e.id.toLowerCase() === cleanSlug);
  if (matchById) return matchById;

  // 3. Computed slug match
  const matchByComputed = events.find(e => getEventSlug(e).toLowerCase() === cleanSlug);
  if (matchByComputed) return matchByComputed;

  // 4. Fuzzy fallback match (e.g. college name contained in slug)
  return events.find(e => {
    const colSlug = slugify(e.college_name);
    return colSlug && cleanSlug.includes(colSlug);
  });
}

// Map between route path parameter (:tab) and internal ActiveNavTab
const TAB_PATH_MAP: Record<string, ActiveNavTab> = {
  'overview': 'overview',
  'team': 'team',
  'agenda': 'agenda',
  'participants': 'participants',
  'nominations': 'nominations',
  'committees': 'committees',
  'parties': 'parties',
  'allocation': 'allocation',
  'cabinet': 'cabinet',
  'jury': 'jury',
  'volunteers': 'volunteers',
  'control': 'control',
  'projector': 'projector',
  'elections': 'elections',
  'proceedings': 'proceedings',
  'score-grid': 'scoregrid',
  'scoregrid': 'scoregrid',
  'awards': 'awards',
  'feedback': 'feedback',
  'report': 'report',
  'chat': 'chat',
  'media': 'media',
  'chapter-awards': 'chapterawards',
  'chapterawards': 'chapterawards',
  'checklist': 'checklist',
  'questionnaire': 'questionnaire'
};

const PATH_TAB_MAP: Record<ActiveNavTab, string> = {
  'overview': 'overview',
  'team': 'team',
  'agenda': 'agenda',
  'participants': 'participants',
  'nominations': 'nominations',
  'committees': 'committees',
  'parties': 'parties',
  'allocation': 'allocation',
  'cabinet': 'cabinet',
  'jury': 'jury',
  'volunteers': 'volunteers',
  'control': 'control',
  'projector': 'projector',
  'elections': 'elections',
  'proceedings': 'proceedings',
  'scoregrid': 'score-grid',
  'awards': 'awards',
  'feedback': 'feedback',
  'report': 'report',
  'chat': 'chat',
  'media': 'media',
  'chapterawards': 'chapter-awards',
  'checklist': 'checklist',
  'questionnaire': 'questionnaire',
  'events_dashboard': 'events'
};

export function pathToTab(path?: string): ActiveNavTab {
  if (!path) return 'overview';
  const cleanPath = path.toLowerCase().trim();
  return TAB_PATH_MAP[cleanPath] || 'overview';
}

export function tabToPath(tab: ActiveNavTab): string {
  return PATH_TAB_MAP[tab] || tab;
}
