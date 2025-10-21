// Build standalone tracking script
const fs = require('fs');
const { execSync } = require('child_process');

// Read the TypeScript file
const tsCode = fs.readFileSync('hotellink-analytics.ts', 'utf8');

// Create a standalone version with config embedded
const standaloneCode = `
${tsCode.replace('export interface', 'interface').replace('export function', 'function')}

// Auto-initialize with config
(function() {
  if (typeof window !== 'undefined' && window.HOTELLINK_CONFIG) {
    initAnalytics(window.HOTELLINK_CONFIG);
  }
})();
`;

// Write to temp file
fs.writeFileSync('hotellink-analytics-standalone.ts', standaloneCode);

// Compile with TypeScript (needs: npm install -g typescript)
try {
  execSync('tsc hotellink-analytics-standalone.ts --target es2015 --lib es2015,dom --removeComments');
  console.log('✅ Compiled to hotellink-analytics-standalone.js');
  
  // Clean up
  fs.unlinkSync('hotellink-analytics-standalone.ts');
} catch (error) {
  console.error('❌ TypeScript compilation failed. Install with: npm install -g typescript');
  process.exit(1);
}
