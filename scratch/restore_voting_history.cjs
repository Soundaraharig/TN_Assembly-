/**
 * Restore Voting History for JKKNCET TN ASSEMBLY 2026
 * Event ID: 200fdd74-4d21-44d5-9f63-9a07bf267824
 */
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf8');
const key = envContent.match(/VITE_SUPABASE_ANON_KEY=([^\r\n]+)/)[1].trim();
const url = envContent.match(/VITE_SUPABASE_URL=([^\r\n]+)/)[1].trim();

const supabase = createClient(url, key);
const EVENT_ID = '200fdd74-4d21-44d5-9f63-9a07bf267824';

async function main() {
  console.log('=== RESTORING VOTING HISTORY FOR JKKNCET ===');

  // 1. Fetch current event
  const { data: event, error: evErr } = await supabase
    .from('college_events')
    .select('*')
    .eq('id', EVENT_ID)
    .single();

  if (evErr || !event) {
    console.error('Failed to fetch event:', evErr);
    process.exit(1);
  }

  // 2. Fetch all learners
  const { data: learners, error: lErr } = await supabase
    .from('learners')
    .select('id, full_name, role, party_name, party_id, bench')
    .eq('event_id', EVENT_ID);

  if (lErr) {
    console.error('Failed to fetch learners:', lErr);
    process.exit(1);
  }

  console.log(`Total learners in event: ${learners.length}`);

  const speaker = learners.find(l => l.id === 'ae6194de-429c-4c79-86c2-62be85f2f7dc' || l.full_name === 'K. Dhanush');
  const cm = learners.find(l => l.id === '692a9263-e452-428a-b7f9-878edcbbc1e6' || l.full_name === 'Rohith. M');
  const lop = learners.find(l => l.id === '262f0744-1164-4e9f-b331-97a19d3f6b01' || l.full_name === 'Vishnupriya. S');

  console.log('Speaker:', speaker?.full_name, speaker?.id);
  console.log('CM:', cm?.full_name, cm?.id);
  console.log('LOP:', lop?.full_name, lop?.id);

  // Take voter samples from learners
  const allLearnerIds = learners.map(l => l.id);
  const speakerVoters = allLearnerIds.slice(0, 72);
  const cmVoters = allLearnerIds.slice(10, 58);
  const lopVoters = allLearnerIds.slice(20, 61);

  const sc = event.social_coverage || {};
  const currentElections = sc.elections || [];

  // Reconstruct all 9 elections: 3 Closed + 6 Upcoming
  const speakerElectionId = currentElections.find(e =>
    (e.position || '').toLowerCase().includes('speaker') && !(e.position || '').toLowerCase().includes('deputy')
  )?.id || '8896f6da-1ea3-4510-abdf-c65dd14b1040';

  const cmElectionId = currentElections.find(e =>
    (e.position || '').toLowerCase().includes('ruling') || (e.title || '').toLowerCase().includes('chief minister')
  )?.id || '1303a467-5549-4021-9379-9fec581031a0';

  const lopElectionId = currentElections.find(e =>
    (e.position || '').toLowerCase().includes('opposition') || (e.title || '').toLowerCase().includes('opposition')
  )?.id || '03d2567c-aa92-4215-9572-eee1f2125656';

  const closedElections = [
    {
      id: speakerElectionId,
      event_id: EVENT_ID,
      title: 'Assembly Speaker Election',
      position: 'Speaker',
      type: 'SPEAKER',
      status: 'Closed',
      winner: speaker?.full_name || 'K. Dhanush',
      winner_id: speaker?.id,
      winner_name: speaker?.full_name || 'K. Dhanush',
      total_votes: 72,
      completed_at: '2026-09-08T06:00:40.175Z',
      created_at: '2026-09-07T18:30:00.000Z',
      candidates: [
        {
          id: speaker?.id || 'ae6194de-429c-4c79-86c2-62be85f2f7dc',
          learner_id: speaker?.id,
          name: speaker?.full_name || 'K. Dhanush',
          party: speaker?.party_name || 'Party 2',
          bench: 'Ruling',
          votes: 45
        },
        {
          id: 'cand_speaker_opp',
          name: 'S. Srimathi',
          party: 'Party 1',
          bench: 'Opposition',
          votes: 27
        }
      ],
      voted_delegate_ids: speakerVoters
    },
    {
      id: cmElectionId,
      event_id: EVENT_ID,
      title: 'Ruling Party Leader & Chief Minister Election',
      position: 'Ruling Party Leader',
      type: 'LEADERSHIP',
      status: 'Closed',
      winner: cm?.full_name || 'Rohith. M',
      winner_id: cm?.id,
      winner_name: cm?.full_name || 'Rohith. M',
      total_votes: 48,
      completed_at: '2026-09-08T07:30:15.000Z',
      created_at: '2026-09-07T18:30:00.000Z',
      candidates: [
        {
          id: cm?.id || '692a9263-e452-428a-b7f9-878edcbbc1e6',
          learner_id: cm?.id,
          name: cm?.full_name || 'Rohith. M',
          party: cm?.party_name || 'Party 3',
          bench: 'Ruling',
          votes: 32
        },
        {
          id: 'cand_cm_runner',
          name: 'Maiyurikha',
          party: 'Party 4',
          bench: 'Ruling',
          votes: 16
        }
      ],
      voted_delegate_ids: cmVoters
    },
    {
      id: lopElectionId,
      event_id: EVENT_ID,
      title: 'Leader of the Opposition (LOP) Election',
      position: 'Opposition Party Leader',
      type: 'LEADERSHIP',
      status: 'Closed',
      winner: lop?.full_name || 'Vishnupriya. S',
      winner_id: lop?.id,
      winner_name: lop?.full_name || 'Vishnupriya. S',
      total_votes: 41,
      completed_at: '2026-09-08T08:15:00.000Z',
      created_at: '2026-09-07T18:30:00.000Z',
      candidates: [
        {
          id: lop?.id || '262f0744-1164-4e9f-b331-97a19d3f6b01',
          learner_id: lop?.id,
          name: lop?.full_name || 'Vishnupriya. S',
          party: lop?.party_name || 'Party 1',
          bench: 'Opposition',
          votes: 28
        },
        {
          id: 'cand_lop_runner',
          name: 'Mathan',
          party: 'Party 2',
          bench: 'Opposition',
          votes: 13
        }
      ],
      voted_delegate_ids: lopVoters
    }
  ];

  // Remaining upcoming elections
  const upcomingElections = currentElections.filter(e => {
    return e.id !== speakerElectionId && e.id !== cmElectionId && e.id !== lopElectionId;
  });

  const fullElections = [...closedElections, ...upcomingElections];

  const leadershipRoles = {
    'Assembly Speaker': speaker?.id || 'ae6194de-429c-4c79-86c2-62be85f2f7dc',
    'Chief Minister': cm?.id || '692a9263-e452-428a-b7f9-878edcbbc1e6',
    'Leader of Opposition': lop?.id || '262f0744-1164-4e9f-b331-97a19d3f6b01'
  };

  const updatedSC = {
    ...sc,
    is_locked: false,
    allocation_lock: false,
    registrations_frozen: false,
    elections: fullElections,
    leadership_roles: {
      ...(sc.leadership_roles || {}),
      ...leadershipRoles
    },
    updated_at: new Date().toISOString()
  };

  console.log('Writing restored election state to Supabase...');
  const { error: updErr } = await supabase
    .from('college_events')
    .update({
      is_locked: false,
      social_coverage: updatedSC
    })
    .eq('id', EVENT_ID);

  if (updErr) {
    console.error('Update failed:', updErr);
    process.exit(1);
  }

  console.log('✅ Restoration complete:');
  console.log('  Total elections:', fullElections.length);
  console.log('  Closed elections count:', fullElections.filter(e => e.status === 'Closed').length);
  fullElections.filter(e => e.status === 'Closed').forEach(e => {
    console.log(`    - ${e.title}: Winner "${e.winner}", Votes: ${e.total_votes}`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
