function normalizeNameTokens(name) {
  if (!name) return [];
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function areNamesMatching(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const cleanA = nameA.trim().toLowerCase();
  const cleanB = nameB.trim().toLowerCase();
  if (cleanA === cleanB) return true;

  const tokensA = normalizeNameTokens(nameA);
  const tokensB = normalizeNameTokens(nameB);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  const initialsA = tokensA.filter(t => t.length === 1);
  const initialsB = tokensB.filter(t => t.length === 1);
  // If both have initials and they don't overlap, they are different people
  if (initialsA.length > 0 && initialsB.length > 0) {
    const hasOverlap = initialsA.some(init => initialsB.includes(init));
    if (!hasOverlap) {
      return false;
    }
  }

  // Sorted tokens match (e.g. "K. Dhanush" and "Dhanush K")
  const sortedA = [...tokensA].sort().join(' ');
  const sortedB = [...tokensB].sort().join(' ');
  if (sortedA === sortedB) return true;

  // Single letter initial(s) match
  const mainTokensA = tokensA.filter(t => t.length > 1);
  const mainTokensB = tokensB.filter(t => t.length > 1);
  if (mainTokensA.length > 0 && mainTokensB.length > 0) {
    if (mainTokensA.sort().join(' ') === mainTokensB.sort().join(' ')) {
      return true;
    }
  }

  return false;
}

console.log('K. Dhanush vs Dhanush K:', areNamesMatching('K. Dhanush', 'Dhanush K')); // true
console.log('Rithika. S vs Rithika J:', areNamesMatching('Rithika. S', 'Rithika J')); // false
console.log('Rithika. S vs S. Rithika:', areNamesMatching('Rithika. S', 'S. Rithika')); // true
console.log('Santhiya. S vs Santhiya. K:', areNamesMatching('Santhiya. S', 'Santhiya. K')); // false
console.log('BOOMESH.M vs M. BOOMESH:', areNamesMatching('BOOMESH.M', 'M. BOOMESH')); // true
console.log('Deepica. C vs C. Deepica:', areNamesMatching('Deepica. C', 'C. Deepica')); // true
