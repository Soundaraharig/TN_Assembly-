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

export function findEventBySlug(events: CollegeEvent[], slug?: string, preferredEventId?: string): CollegeEvent | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.toLowerCase().trim();
  
  // 1. Direct ID match
  const matchById = events.find(e => e.id.toLowerCase() === cleanSlug);
  if (matchById) return matchById;

  // 2. Direct slug match
  const matchBySlug = events.find(e => e.slug?.toLowerCase() === cleanSlug);
  if (matchBySlug) return matchBySlug;

  // 3. Computed slug match
  const matchByComputed = events.find(e => getEventSlug(e).toLowerCase() === cleanSlug);
  if (matchByComputed) return matchByComputed;

  // 4. Exact college slug match
  const matchByColSlug = events.find(e => slugify(e.college_name) === cleanSlug);
  if (matchByColSlug) return matchByColSlug;

  // 5. Preferred event match (only if unambiguous or exact identifier)
  if (preferredEventId) {
    const pref = events.find(e => e.id === preferredEventId);
    if (pref) {
      const prefSlug = (pref.slug || '').toLowerCase();
      const prefCompSlug = getEventSlug(pref).toLowerCase();
      if (pref.id.toLowerCase() === cleanSlug || prefSlug === cleanSlug || prefCompSlug === cleanSlug) {
        return pref;
      }
    }
  }

  // 6. Strict prefix or word-boundary fallback (avoiding broad substring false matches)
  return events.find(e => {
    const colSlug = slugify(e.college_name);
    if (!colSlug) return false;
    return cleanSlug.startsWith(colSlug + '-') || colSlug.startsWith(cleanSlug + '-');
  });
}

export function extractEventFromUrl(events: CollegeEvent[], preferredEventId?: string): CollegeEvent | undefined {
  if (typeof window === 'undefined' || !events || events.length === 0) return undefined;
  
  // 1. Query parameter check: ?event=... or ?eventId=... or ?event_id=...
  const searchParams = new URLSearchParams(window.location.search);
  const eventParam = searchParams.get('event') || searchParams.get('eventId') || searchParams.get('event_id');
  if (eventParam) {
    const matched = findEventBySlug(events, eventParam, preferredEventId);
    if (matched) return matched;
  }

  // 2. Path check: /events/:eventSlug/...
  const pathname = window.location.pathname.toLowerCase();
  if (pathname.includes('/events/')) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const eventsIdx = parts.findIndex(p => p.toLowerCase() === 'events');
    if (eventsIdx !== -1 && parts.length > eventsIdx + 1) {
      const slugCandidate = parts[eventsIdx + 1];
      const matched = findEventBySlug(events, slugCandidate, preferredEventId);
      if (matched) return matched;
    }
  }

  return undefined;
}

// Map between route path parameter (:tab) and internal ActiveNavTab
const TAB_PATH_MAP: Record<string, ActiveNavTab> = {
  'overview': 'overview',
  'days-activities': 'days_activities',
  'days_activities': 'days_activities',
  'days': 'days_activities',
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
  'days_activities': 'days-activities',
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
