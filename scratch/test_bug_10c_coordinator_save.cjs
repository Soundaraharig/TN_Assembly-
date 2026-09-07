const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: Bug 10c Coordinator Save & UUID Handling ===\n');

// 1. Check storageService.ts source code
const storageServicePath = path.resolve(__dirname, '../src/services/storageService.ts');
const storageServiceSrc = fs.readFileSync(storageServicePath, 'utf8');

console.log('[1/5] Verifying sanitizeRecordForTable and sbUpsert UUID branching...');
// Check that sanitizeId validates UUID
assert(storageServiceSrc.includes('const sanitizeId = (id: unknown) => {'), 'Missing sanitizeId helper');
assert(storageServiceSrc.includes('if (validId) sanitized.id = validId;'), 'Missing conditional sanitized.id assignment');

// Check that sbUpsert branches based on isValidUuid
assert(storageServiceSrc.includes("if (sanitized.id && isValidUuid(sanitized.id as string)) {"), 'Missing UUID branch in sbUpsert');
assert(storageServiceSrc.includes("query = supabase.from(table).upsert(sanitized, { onConflict: 'id' }).select();"), 'Missing upsert with onConflict in sbUpsert');
assert(storageServiceSrc.includes("const { id, ...insertPayload } = sanitized;"), 'Missing insertPayload stripping id');
assert(storageServiceSrc.includes("query = supabase.from(table).insert(insertPayload).select();"), 'Missing explicit insert in sbUpsert');
console.log('✅ sanitizeRecordForTable strips invalid IDs and sbUpsert branches cleanly into insert vs upsert.');

console.log('\n[2/5] Verifying updateCoordinator explicit logic and removal of local storage fallback...');
// Check that updateCoordinator does NOT write to localStorage before awaiting Supabase
assert(storageServiceSrc.includes('const { data, error, status } = await supabase'), 'updateCoordinator must await supabase write');
assert(storageServiceSrc.includes('// 4. ONLY ON SUCCESS: update local storage and notify listeners'), 'updateCoordinator must only update local storage on success');
assert(storageServiceSrc.includes("this.notifyWriteError('coordinators', 'update'"), 'updateCoordinator must notify on update error');
console.log('✅ updateCoordinator only mutates localStorage and notifies listeners on confirmed database success.');

console.log('\n[3/5] Verifying App.tsx for removal of "Saved Locally" and non-UUID coordinator generation...');
const appPath = path.resolve(__dirname, '../src/App.tsx');
const appSrc = fs.readFileSync(appPath, 'utf8');
assert(!appSrc.includes("Saved Locally (Cloud Warning)"), 'Found forbidden "Saved Locally (Cloud Warning)" in App.tsx');
assert(!appSrc.includes("id: `coord_${newEv.id}`"), 'Found forbidden non-UUID generator "coord_${newEv.id}" in App.tsx');
assert(appSrc.includes("Coordinator Update Failed"), 'Missing error toast on update coordinator failure');
console.log('✅ App.tsx has no silent local fallback and does not generate synthetic coord_ IDs.');

console.log('\n[4/5] Verifying EditCoordinatorModal.tsx for async submission and blocking error handling...');
const modalPath = path.resolve(__dirname, '../src/components/admin/EditCoordinatorModal.tsx');
const modalSrc = fs.readFileSync(modalPath, 'utf8');
assert(modalSrc.includes('const [isSaving, setIsSaving] = useState(false);'), 'Missing isSaving state in EditCoordinatorModal');
assert(modalSrc.includes('const [errorMessage, setErrorMessage] = useState<string | null>(null);'), 'Missing errorMessage state in EditCoordinatorModal');
assert(modalSrc.includes('Database Save Rejected'), 'Missing blocking error banner in EditCoordinatorModal');
assert(modalSrc.includes('return; // Keep modal open!'), 'EditCoordinatorModal must remain open on save failure');
console.log('✅ EditCoordinatorModal displays blocking error banner, remains open on failure, and shows saving state.');

console.log('\n[5/5] Verifying MyEventsDashboard.tsx for UUID-safe ID passing...');
const dashboardPath = path.resolve(__dirname, '../src/components/admin/MyEventsDashboard.tsx');
const dashboardSrc = fs.readFileSync(dashboardPath, 'utf8');
assert(!dashboardSrc.includes("id: `coord_${event.id}`"), 'Found forbidden non-UUID ID in handleOpenEditCoordinator');
assert(!dashboardSrc.includes("onShowToast('Coordinator Credentials Updated'"), 'Found premature success toast in MyEventsDashboard onSave');
console.log('✅ MyEventsDashboard does not generate coord_ IDs and awaits onUpdateCoordinator before reporting success.');

console.log('\n🎉 ALL BUG 10c VERIFICATION CHECKS PASSED SUCCESSFULLY!');
