import { storageService } from '../src/services/storageService.js';

console.log("=== Starting Question Hour Toggle & Student Flow Test ===");

const testSlug = 'jkkncet-tn-assembly-2026-tamil-nadu-2026';

// 1. Check Initial Event Deadline
const initialDeadline = storageService.getEventDeadline(testSlug);
console.log("Initial Deadline:", initialDeadline);

// 2. Toggle Status to CLOSED
console.log("\nToggling Question Submissions to CLOSED...");
const closedDeadline = storageService.updateEventDeadlineStatus(testSlug, false);
console.log("Closed Deadline Status:", closedDeadline.status, "is_open:", closedDeadline.is_open);

if (closedDeadline.is_open !== false || closedDeadline.status !== 'CLOSED') {
  console.error("FAIL: Status did not update to CLOSED");
  process.exit(1);
}

// 3. Toggle Status to OPEN
console.log("\nToggling Question Submissions to OPEN...");
const openDeadline = storageService.updateEventDeadlineStatus(testSlug, true);
console.log("Open Deadline Status:", openDeadline.status, "is_open:", openDeadline.is_open);

if (openDeadline.is_open !== true || openDeadline.status !== 'OPEN') {
  console.error("FAIL: Status did not update to OPEN");
  process.exit(1);
}

// 4. Test Student Question Submission
console.log("\nSubmitting Test Question from Student...");
const testQuestion = storageService.addProceedingsQuestion({
  event_slug: testSlug,
  event_id: testSlug,
  student_id: 'test-student-101',
  student_name: 'Test Delegate MLA',
  bench: 'Ruling',
  constituency: 'Coimbatore South',
  ministry: 'Ministry of Education',
  question_type: 'Starred',
  question_text: 'What measures are being taken for STEM education infrastructure in government schools?',
  status: 'Submitted'
});

console.log("Submitted Question ID:", testQuestion.id);

// 5. Verify Question is Retrieved by Admin Dashboard
const questionsInAdmin = storageService.getProceedingsQuestions(testSlug);
const foundInAdmin = questionsInAdmin.find(q => q.id === testQuestion.id);

console.log("Found in Admin Queue:", foundInAdmin ? "YES" : "NO");
if (!foundInAdmin) {
  console.error("FAIL: Submitted question not found in Admin queue!");
  process.exit(1);
}

// 6. Test Admin Status Update (Approve Question)
console.log("\nUpdating Question Status to Approved by Admin...");
const updatedQ = storageService.updateProceedingsQuestionStatus(testQuestion.id, 'Approved');
console.log("Updated Question Status:", updatedQ?.status);

if (updatedQ?.status !== 'Approved') {
  console.error("FAIL: Question status update failed!");
  process.exit(1);
}

// Cleanup test question
storageService.deleteProceedingsQuestion(testQuestion.id);
console.log("Cleaned up test question.");

console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
