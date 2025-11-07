/**
 * Backend entry point
 */

import { generateCapTable, exportCapTableToCSV, exportCapTableToJSON } from './cap-table.js';
import type { CapTable, CapTableHolder } from './cap-table.js';
import { IssuerService } from './issuer.js';

// Export services
export { generateCapTable, exportCapTableToCSV, exportCapTableToJSON, IssuerService };
export type { CapTable, CapTableHolder };

// Example usage (for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Backend services loaded');
}

