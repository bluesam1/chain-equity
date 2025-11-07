/**
 * Backend entry point
 */

import { generateCapTable } from './cap-table.js';
import { IssuerService } from './issuer.js';

// Export services
export { generateCapTable, IssuerService };

// Example usage (for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Backend services loaded');
}

