import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';

// Set required environment variables for this specific agent type
process.env.AGENT_TYPE = 'scrum_master';
if (!process.env.AGENT_INSTANCE_ID) {
  process.env.AGENT_INSTANCE_ID = `sm-${uuidv4().substring(0, 8)}`;
}

/**
 * Scrum Master Agent Runner
 *
 * Entry point for running the Scrum Master Agent.
 *
 * Environment variables:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_KEY: Service role key
 * - AGENT_TYPE: Must be 'scrum_master'
 * - AGENT_INSTANCE_ID: Unique instance identifier
 * - ANTHROPIC_API_KEY: Anthropic API key for AI generation
 * - POLL_INTERVAL: Poll interval in ms (default: 30000)
 */

import { ScrumMasterAgent } from './index';

async function main() {
  const agent = new ScrumMasterAgent();

  // Setup graceful shutdown
  agent.setupShutdownHandlers();

  console.log('Scrum Master Agent starting...');
  console.log(`Instance ID: ${process.env.AGENT_INSTANCE_ID}`);

  const pollInterval = parseInt(process.env.POLL_INTERVAL || '30000', 10);

  await agent.startPolling({
    interval: pollInterval,
    maxConcurrent: 1,
  });
}

main().catch((error) => {
  console.error('Agent failed:', error);
  process.exit(1);
});
