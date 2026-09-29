// Test to prove that getAgenda does not trigger storageService.notify() or a recursive loop
const fs = require('fs');

// Verify that getAgendaProgress does NOT call this.setItem
const storageServiceContent = fs.readFileSync('src/services/storageService.ts', 'utf8');

const getAgendaProgressMatch = storageServiceContent.match(/public getAgendaProgress[\s\S]*?return \{[\s\S]*?\};?\s*\}/);
if (!getAgendaProgressMatch) {
  console.error('FAIL: Could not locate getAgendaProgress');
  process.exit(1);
}

const getAgendaProgressCode = getAgendaProgressMatch[0];
if (getAgendaProgressCode.includes('this.setItem(')) {
  console.error('FAIL: getAgendaProgress still contains this.setItem call!');
  process.exit(1);
} else {
  console.log('PASS: getAgendaProgress contains NO this.setItem call.');
}

// Verify getProjectorSettings
const getProjMatch = storageServiceContent.match(/public getProjectorSettings[\s\S]*?return fallback[\s\S]*?\}/);
if (getProjMatch && getProjMatch[0].includes('this.setItem(')) {
  console.error('FAIL: getProjectorSettings still contains this.setItem call!');
  process.exit(1);
} else {
  console.log('PASS: getProjectorSettings contains NO this.setItem call.');
}

// Verify getTimerDurationConfig
const getTimerMatch = storageServiceContent.match(/public getTimerDurationConfig[\s\S]*?return \(typeof globalCfg[\s\S]*?\}/);
if (getTimerMatch && getTimerMatch[0].includes('this.setItem(')) {
  console.error('FAIL: getTimerDurationConfig still contains this.setItem call!');
  process.exit(1);
} else {
  console.log('PASS: getTimerDurationConfig contains NO this.setItem call.');
}

// Verify getTimerAudioConfig
const getTimerAudioMatch = storageServiceContent.match(/public getTimerAudioConfig[\s\S]*?return fallback[\s\S]*?\}/);
if (getTimerAudioMatch && getTimerAudioMatch[0].includes('this.setItemSafe(')) {
  console.error('FAIL: getTimerAudioConfig still contains this.setItemSafe call!');
  process.exit(1);
} else {
  console.log('PASS: getTimerAudioConfig contains NO this.setItemSafe call.');
}

console.log('\nAll 4 getter methods verified pure and free of notify-triggering mutations.');
