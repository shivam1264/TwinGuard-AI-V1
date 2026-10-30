const fs = require('fs');
let content = fs.readFileSync('src/simulation/CrowdOptimizer.js', 'utf8');

// Rewrite the entire if-else chain properly
const oldBlock = `        if (floorDiff === 0) {
          // Fire floor - immediate evacuation (1-2s delay)
          delayTimer = 1.0 + Math.random() * 1.0;
 else if (floorDiff === 1) {
          // Adjacent floor - secondary priority (3-6s delay)
          delayTimer = 3.0 + Math.random() * 3.0;
        } else {
          // Other floors - sheltered in place (45-51s delay)
          delayTimer = 45.0 + Math.random() * 6.0;
        }`;

const newBlock = `        if (floorDiff === 0) {
          // Fire floor - immediate evacuation (1-2s delay)
          delayTimer = 1.0 + Math.random() * 1.0;
        } else if (floorDiff === 1) {
          // Adjacent floor - secondary priority (3-6s delay)
          delayTimer = 3.0 + Math.random() * 3.0;
        } else {
          // Other floors - sheltered in place (45-51s delay)
          delayTimer = 45.0 + Math.random() * 6.0;
        }`;

let content = fs.readFileSync('src/simulation/CrowdOptimizer.js', 'utf8');
content = content.replace(oldBlock, newBlock);
fs.writeFileSync('src/simulation/CrowdOptimizer.js', content);
console.log('Fixed');
