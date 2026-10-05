// api/admin/action.ts
// Grouped administrative mutations with cryptographically verified server-side session checks,
// strict event scoping, and IDOR target record validation.

import type { IncomingMessage, ServerResponse } from 'http';
import { verifySessionToken, extractBearerToken } from '../_lib/auth.js';
import { getServerSupabase } from '../_lib/supabaseServer.js';

interface ApiRequest extends IncomingMessage {
  body?: any;
}

interface ApiResponse extends ServerResponse {
  status: (statusCode: number) => ApiResponse;
  json: (data: any) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Authenticate bearer token
  const authHeader = (req.headers.authorization as string) || null;
  const tokenStr = extractBearerToken(authHeader);
  if (!tokenStr) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const { valid, payload: session, error: tokenError } = await verifySessionToken(tokenStr);
  if (!valid || !session) {
    return res.status(401).json({ error: tokenError || 'Invalid or expired session token' });
  }

  // 2. Validate input and event scope
  const { action, eventId, payload } = req.body || {};
  if (!action || typeof action !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "action" parameter' });
  }
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "eventId" parameter' });
  }

  // Event Scoping Guard: Coordinator can ONLY operate on their assigned event
  if (session.role !== 'super_admin' && session.eventId !== eventId) {
    console.warn(`[admin/action] Cross-event unauthorized attempt: User ${session.email} (Event: ${session.eventId}) tried to modify Event: ${eventId}`);
    return res.status(403).json({ error: 'Forbidden: You are not authorized to perform actions on this event' });
  }

  const sb = getServerSupabase();

  try {
    switch (action) {
      // ─── 1. DELETE SINGLE LEARNER (with IDOR check) ───
      case 'delete_learner': {
        const learnerId = payload?.learnerId;
        if (!learnerId || typeof learnerId !== 'string') {
          return res.status(400).json({ error: 'Missing learnerId' });
        }

        // IDOR Check: verify learner actually belongs to requested event
        const { data: targetLearner, error: fetchErr } = await sb
          .from('learners')
          .select('id, event_id')
          .eq('id', learnerId)
          .maybeSingle();

        if (fetchErr || !targetLearner) {
          return res.status(404).json({ error: 'Learner record not found' });
        }

        if (targetLearner.event_id !== eventId) {
          return res.status(403).json({ error: 'Forbidden: Target learner does not belong to this event' });
        }

        const { error } = await sb
          .from('learners')
          .delete()
          .eq('id', learnerId)
          .eq('event_id', eventId);

        if (error) {
          console.error('[delete_learner] DB error:', error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ success: true, action, eventId, learnerId });
      }

      // ─── 2. DELETE BATCH LEARNERS (Roster reconciliation with IDOR check) ───
      case 'delete_learners_batch': {
        const learnerIds = payload?.learnerIds;
        if (!Array.isArray(learnerIds) || learnerIds.length === 0) {
          return res.status(400).json({ error: 'Missing or invalid learnerIds array' });
        }

        // IDOR Check: verify ALL target learners belong strictly to this event
        const { data: targets, error: fetchErr } = await sb
          .from('learners')
          .select('id, event_id')
          .in('id', learnerIds);

        if (fetchErr) {
          return res.status(500).json({ error: fetchErr.message });
        }

        const foreignRecord = (targets || []).find(t => t.event_id !== eventId);
        if (foreignRecord) {
          return res.status(403).json({ error: 'Forbidden: One or more target learners do not belong to this event' });
        }

        const validIdsToDelete = (targets || []).map(t => t.id);
        if (validIdsToDelete.length > 0) {
          const { error } = await sb
            .from('learners')
            .delete()
            .in('id', validIdsToDelete)
            .eq('event_id', eventId);

          if (error) {
            console.error('[delete_learners_batch] DB error:', error);
            return res.status(500).json({ error: error.message });
          }
        }

        return res.status(200).json({ success: true, action, eventId, deletedCount: validIdsToDelete.length });
      }

      // ─── 3. DELETE EVENT (Super Admin only) ───
      case 'delete_event': {
        if (session.role !== 'super_admin') {
          return res.status(403).json({ error: 'Only Super Administrators can delete entire events' });
        }

        const { error } = await sb
          .from('college_events')
          .delete()
          .eq('id', eventId);

        if (error) {
          console.error('[delete_event] DB error:', error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ success: true, action, eventId });
      }

      // ─── 4. DELETE AGENDA ITEM (with IDOR check) ───
      case 'delete_agenda': {
        const itemId = payload?.itemId;
        if (!itemId || typeof itemId !== 'string') {
          return res.status(400).json({ error: 'Missing itemId' });
        }

        const { data: targetItem, error: fetchErr } = await sb
          .from('session_agenda')
          .select('id, event_id')
          .eq('id', itemId)
          .maybeSingle();

        if (fetchErr || !targetItem) {
          return res.status(404).json({ error: 'Agenda item not found' });
        }

        if (targetItem.event_id !== eventId) {
          return res.status(403).json({ error: 'Forbidden: Target agenda item does not belong to this event' });
        }

        const { error } = await sb
          .from('session_agenda')
          .delete()
          .eq('id', itemId)
          .eq('event_id', eventId);

        if (error) {
          console.error('[delete_agenda] DB error:', error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ success: true, action, eventId, itemId });
      }

      // ─── 5. DELETE EVENT DAY (with IDOR check) ───
      case 'delete_day': {
        const dayId = payload?.dayId;
        if (!dayId || typeof dayId !== 'string') {
          return res.status(400).json({ error: 'Missing dayId' });
        }

        const { data: targetDay, error: fetchErr } = await sb
          .from('event_days')
          .select('id, event_id')
          .eq('id', dayId)
          .maybeSingle();

        if (fetchErr || !targetDay) {
          return res.status(404).json({ error: 'Event day not found' });
        }

        if (targetDay.event_id !== eventId) {
          return res.status(403).json({ error: 'Forbidden: Target day does not belong to this event' });
        }

        // Cascade delete attendance for this day
        await sb.from('event_day_attendance').delete().eq('day_id', dayId).eq('event_id', eventId);

        const { error } = await sb
          .from('event_days')
          .delete()
          .eq('id', dayId)
          .eq('event_id', eventId);

        if (error) {
          console.error('[delete_day] DB error:', error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ success: true, action, eventId, dayId });
      }

      // ─── 6. RESET TEST RUN (Test Mode purge - strictly test-tagged data only) ───
      case 'reset_test_run': {
        const testRunId = payload?.testRunId;

        // 1. Delete test speaking turns (strictly test turns)
        let turnsQuery = sb.from('speaking_turns').delete().eq('event_id', eventId);
        if (testRunId) {
          turnsQuery = turnsQuery.eq('test_run_id', testRunId);
        } else {
          turnsQuery = turnsQuery.or('is_test.eq.true,called_by.ilike.%[TEST%');
        }
        await turnsQuery;

        // 2. Delete test speaking requests (strictly test requests)
        let reqsQuery = sb.from('speaking_requests').delete().eq('event_id', eventId);
        if (testRunId) {
          reqsQuery = reqsQuery.eq('test_run_id', testRunId);
        } else {
          reqsQuery = reqsQuery.eq('is_test', true);
        }
        await reqsQuery;

        // 3. Purge test scores and recognitions from social_coverage JSONB
        const { data: eventData } = await sb
          .from('college_events')
          .select('social_coverage')
          .eq('id', eventId)
          .maybeSingle();

        if (eventData && eventData.social_coverage) {
          const sc = { ...eventData.social_coverage };
          if (Array.isArray(sc.scores)) {
            sc.scores = sc.scores.filter((s: any) => testRunId ? s.test_run_id !== testRunId : !s.is_test);
          }
          if (Array.isArray(sc.jury_speech_recognitions)) {
            sc.jury_speech_recognitions = sc.jury_speech_recognitions.filter((r: any) => testRunId ? r.test_run_id !== testRunId : !r.is_test);
          }
          await sb
            .from('college_events')
            .update({ social_coverage: sc, updated_at: new Date().toISOString() })
            .eq('id', eventId);
        }

        return res.status(200).json({ success: true, action, eventId, testRunId });
      }

      // ─── 7. QUESTION STATUS (Approve / Reject / Star) ───
      case 'question_status': {
        const { questionId, status } = payload || {};
        if (!questionId || !status || !['Submitted', 'Approved', 'Starred', 'Rejected'].includes(status)) {
          return res.status(400).json({ error: 'Valid questionId and status are required' });
        }

        const { data: eventData, error: evErr } = await sb
          .from('college_events')
          .select('social_coverage')
          .eq('id', eventId)
          .maybeSingle();

        if (evErr || !eventData) {
          return res.status(500).json({ error: 'Event not found' });
        }

        const sc = { ...(eventData.social_coverage || {}) };
        const questions = Array.isArray(sc.proceedings_questions) ? [...sc.proceedings_questions] : [];
        const qIdx = questions.findIndex((q: any) => q.id === questionId);

        if (qIdx === -1) {
          return res.status(404).json({ error: 'Question not found in event proceedings' });
        }

        questions[qIdx] = {
          ...questions[qIdx],
          status,
          updated_at: new Date().toISOString(),
          reviewed_by: session.email,
          reviewed_at: new Date().toISOString()
        };

        sc.proceedings_questions = questions;
        sc.questions = questions;

        const approved = questions.filter((q: any) => q.status === 'Approved' || q.status === 'Starred');
        sc.official_approved_questions = approved;
        const approvedIds = new Set(approved.map((q: any) => q.id));

        if (Array.isArray(sc.question_calling_order)) {
          sc.question_calling_order = sc.question_calling_order.filter((id: string) => approvedIds.has(id));
        }

        const { error: updateErr } = await sb
          .from('college_events')
          .update({ social_coverage: sc, updated_at: new Date().toISOString() })
          .eq('id', eventId);

        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }

        return res.status(200).json({ success: true, action, eventId, questionId, status });
      }

      // ─── 8. QUESTION MINISTRY REASSIGNMENT ───
      case 'question_ministry': {
        const { questionId, ministry } = payload || {};
        if (!questionId || typeof ministry !== 'string') {
          return res.status(400).json({ error: 'Valid questionId and ministry string are required' });
        }

        const { data: eventData, error: evErr } = await sb
          .from('college_events')
          .select('social_coverage')
          .eq('id', eventId)
          .maybeSingle();

        if (evErr || !eventData) {
          return res.status(500).json({ error: 'Event not found' });
        }

        const sc = { ...(eventData.social_coverage || {}) };
        const questions = Array.isArray(sc.proceedings_questions) ? [...sc.proceedings_questions] : [];
        const qIdx = questions.findIndex((q: any) => q.id === questionId);

        if (qIdx === -1) {
          return res.status(404).json({ error: 'Question not found in event proceedings' });
        }

        questions[qIdx] = {
          ...questions[qIdx],
          ministry: ministry.trim(),
          updated_at: new Date().toISOString()
        };

        sc.proceedings_questions = questions;
        sc.questions = questions;

        const { error: updateErr } = await sb
          .from('college_events')
          .update({ social_coverage: sc, updated_at: new Date().toISOString() })
          .eq('id', eventId);

        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }

        return res.status(200).json({ success: true, action, eventId, questionId, ministry });
      }

      default:
        return res.status(400).json({ error: `Unsupported administrative action "${action}"` });
    }
  } catch (err: any) {
    console.error(`[admin/action] Exception during action "${action}":`, err);
    return res.status(500).json({ error: err?.message || 'Server error during administrative mutation' });
  }
}
