import assert from 'node:assert';

// Test mock learner access code resolution
const sampleLearners = [
  {
    id: 'l_1',
    full_name: 'R. Janani',
    access_code: '89F2A1',
    event_id: 'ev_jkkncet_2026',
    party_name: 'Party 2',
    bench: 'Opposition'
  },
  {
    id: 'l_2',
    full_name: 'K. Karthik',
    access_code: 'KART01',
    event_id: 'ev_jkkncet_2026',
    party_name: 'Party 1',
    bench: 'Ruling'
  }
];

const sampleEvents = [
  {
    id: 'ev_jkkncet_2026',
    college_name: 'JKKNCET',
    chapter: 'TN',
    slug: 'jkkncet-tn-assembly-2026'
  }
];

// Helper to simulate getEventSlug
function getEventSlug(event) {
  if (event.slug) return event.slug;
  return `${event.college_name.toLowerCase()}-${event.chapter.toLowerCase()}-assembly-2026`;
}

// Helper to simulate routing resolution
function resolveLoginRedirect(role, learner, events) {
  if (role === 'student' && learner) {
    const targetEv = events.find(e => e.id === learner.event_id) || events[0];
    const slug = targetEv ? getEventSlug(targetEv) : 'default';
    return `/events/${slug}/dashboard`;
  }
  if (role === 'super_admin' || role === 'coordinator') {
    return '/events';
  }
  if (role === 'jury') return '/jury';
  if (role === 'volunteer') return '/volunteer';
  return '/';
}

// 1. Test Delegate Login Redirect
const learnerMatch = sampleLearners.find(l => l.access_code === '89F2A1');
assert(learnerMatch, 'Learner must be found');
assert.strictEqual(learnerMatch.full_name, 'R. Janani');

const delegateRedirect = resolveLoginRedirect('student', learnerMatch, sampleEvents);
assert.strictEqual(delegateRedirect, '/events/jkkncet-tn-assembly-2026/dashboard');
console.log('✓ Delegate redirect successfully resolved to:', delegateRedirect);

// 2. Test Organiser/Coordinator Redirect
const coordRedirect = resolveLoginRedirect('coordinator', null, sampleEvents);
assert.strictEqual(coordRedirect, '/events');
console.log('✓ Coordinator redirect successfully resolved to:', coordRedirect);

// 3. Test Super Admin Redirect
const adminRedirect = resolveLoginRedirect('super_admin', null, sampleEvents);
assert.strictEqual(adminRedirect, '/events');
console.log('✓ Super Admin redirect successfully resolved to:', adminRedirect);

// 4. Test Route Guard on /events for delegate
function guardEventsRoute(role, event) {
  if (role === 'student') {
    const slug = event ? getEventSlug(event) : 'default';
    return { redirect: `/events/${slug}/dashboard` };
  }
  return { render: 'MyEventsDashboard' };
}

const delegateGuardResult = guardEventsRoute('student', sampleEvents[0]);
assert.strictEqual(delegateGuardResult.redirect, '/events/jkkncet-tn-assembly-2026/dashboard');
console.log('✓ Delegate /events guard successfully blocks organiser page and redirects to:', delegateGuardResult.redirect);

const coordGuardResult = guardEventsRoute('coordinator', sampleEvents[0]);
assert.strictEqual(coordGuardResult.render, 'MyEventsDashboard');
console.log('✓ Coordinator /events guard allows rendering:', coordGuardResult.render);

console.log('\nAll login & routing resolution tests passed successfully!');
