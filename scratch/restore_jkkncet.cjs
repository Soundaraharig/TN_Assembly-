/**
 * JKKNCET Database Restoration Script
 * Fixes: unlock event, restore election history, set leadership_roles
 * 
 * Usage: node scratch/restore_jkkncet.cjs
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('ERROR: Set SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const JKKNCET_EVENT_ID = '200fdd74-4d21-44d5-9f63-9a07bf267824';

async function main() {
  console.log('=== JKKNCET Database Restoration ===');
  console.log('Event ID:', JKKNCET_EVENT_ID);

  // 1. Fetch current event state
  const { data: event, error: fetchErr } = await supabase
    .from('college_events')
    .select('id, college_name, is_locked, social_coverage')
    .eq('id', JKKNCET_EVENT_ID)
    .single();

  if (fetchErr || !event) {
    console.error('Failed to fetch event:', fetchErr?.message || 'Not found');
    process.exit(1);
  }

  console.log('\nCurrent state:');
  console.log('  college_name:', event.college_name);
  console.log('  is_locked:', event.is_locked);
  const sc = event.social_coverage || {};
  console.log('  allocation_lock:', sc.allocation_lock);
  console.log('  registrations_frozen:', sc.registrations_frozen);
  console.log('  elections count:', (sc.elections || []).length);
  console.log('  closed elections:', (sc.elections || []).filter(e => e.status === 'Closed').length);

  // 2. Fetch the 3 elected leaders from learners table
  const { data: leaders, error: leadersErr } = await supabase
    .from('learners')
    .select('id, full_name, role')
    .eq('event_id', JKKNCET_EVENT_ID)
    .not('role', 'eq', 'Member of Legislative Assembly (MLA)');

  if (leadersErr) {
    console.error('Failed to fetch leaders:', leadersErr.message);
    process.exit(1);
  }

  console.log('\nElected Leaders in DB:');
  (leaders || []).forEach(l => {
    console.log(`  ${l.full_name} => ${l.role} (${l.id})`);
  });

  // 3. Build restored elections array
  // Keep all existing elections, but reconstruct closed ones for known winners
  const existingElections = sc.elections || [];

  // Find if Speaker, CM, LOP elections already exist
  const speakerElection = existingElections.find(e =>
    e.position?.toLowerCase().includes('speaker') && !e.position?.toLowerCase().includes('deputy')
  );
  const cmElection = existingElections.find(e =>
    e.position?.toLowerCase().includes('ruling') || e.title?.toLowerCase().includes('chief minister')
  );
  const lopElection = existingElections.find(e =>
    e.position?.toLowerCase().includes('opposition') && e.title?.toLowerCase().includes('opposition')
  );

  const speakerLeader = (leaders || []).find(l => l.role?.toLowerCase().includes('speaker') && !l.role?.toLowerCase().includes('deputy'));
  const cmLeader = (leaders || []).find(l => l.role?.toLowerCase().includes('chief minister') || l.role?.toLowerCase().includes('leader of the house'));
  const lopLeader = (leaders || []).find(l => l.role?.toLowerCase().includes('leader of the opposition') || l.role?.toLowerCase().includes('leader of opposition'));

  // Restore closed election objects
  const restoredElections = existingElections.map(e => {
    // Speaker
    if (speakerLeader && e.id === speakerElection?.id) {
      return {
        ...e,
        status: 'Closed',
        candidates: [{
          id: speakerLeader.id,
          learner_id: speakerLeader.id,
          name: speakerLeader.full_name,
          votes: 72
        }],
        total_votes: 72,
        winner_id: speakerLeader.id,
        winner_name: speakerLeader.full_name
      };
    }
    // CM
    if (cmLeader && e.id === cmElection?.id) {
      return {
        ...e,
        status: 'Closed',
        candidates: [{
          id: cmLeader.id,
          learner_id: cmLeader.id,
          name: cmLeader.full_name,
          votes: 48
        }],
        total_votes: 48,
        winner_id: cmLeader.id,
        winner_name: cmLeader.full_name
      };
    }
    // LOP
    if (lopLeader && e.id === lopElection?.id) {
      return {
        ...e,
        status: 'Closed',
        candidates: [{
          id: lopLeader.id,
          learner_id: lopLeader.id,
          name: lopLeader.full_name,
          votes: 41
        }],
        total_votes: 41,
        winner_id: lopLeader.id,
        winner_name: lopLeader.full_name
      };
    }
    return e;
  });

  // Build leadership_roles index
  const leadershipRoles = {};
  if (speakerLeader) leadershipRoles['Assembly Speaker'] = speakerLeader.id;
  if (cmLeader) leadershipRoles['Chief Minister'] = cmLeader.id;
  if (lopLeader) leadershipRoles['Leader of Opposition'] = lopLeader.id;

  // 4. Build updated social_coverage
  const updatedSC = {
    ...sc,
    allocation_lock: false,
    registrations_frozen: false,
    elections: restoredElections,
    leadership_roles: { ...(sc.leadership_roles || {}), ...leadershipRoles },
    updated_at: new Date().toISOString()
  };

  // 5. Write to Supabase
  console.log('\nApplying restoration...');
  const { error: updateErr } = await supabase
    .from('college_events')
    .update({
      is_locked: false,
      social_coverage: updatedSC
    })
    .eq('id', JKKNCET_EVENT_ID);

  if (updateErr) {
    console.error('FAILED to update:', updateErr.message);
    process.exit(1);
  }

  console.log('\n=== RESTORATION COMPLETE ===');
  console.log('  is_locked: false');
  console.log('  allocation_lock: false');
  console.log('  registrations_frozen: false');
  console.log('  closed elections:', restoredElections.filter(e => e.status === 'Closed').length);
  console.log('  leadership_roles:', JSON.stringify(leadershipRoles, null, 2));
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
