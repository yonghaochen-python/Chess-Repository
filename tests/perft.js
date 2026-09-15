// Proves rules.js is correct before anything is built on top of it.
// Run with: node tests/perft.js
import { createInitialPosition, perft } from '../public/rules.js';

const expected = { 1: 20, 2: 400, 3: 8902 };
const start = createInitialPosition();

let allPassed = true;
for (const depthStr of Object.keys(expected)) {
  const depth = Number(depthStr);
  const want = expected[depth];
  const got = perft(start, depth);
  const passed = got === want;
  allPassed = allPassed && passed;
  console.log(`perft(${depth}) = ${got} (expected ${want}) ${passed ? 'PASS' : 'FAIL'}`);
}

if (!allPassed) {
  console.error('perft test FAILED');
  process.exit(1);
}
console.log('All perft checks passed.');
