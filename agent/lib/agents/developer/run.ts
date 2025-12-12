import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';

// Set required environment variables for this specific agent type
process.env.AGENT_TYPE = 'developer';
if (!process.env.AGENT_INSTANCE_ID) {
  process.env.AGENT_INSTANCE_ID = `dev-${uuidv4().substring(0, 8)}`;
}

/**
 * Developer Agent Runner
 *
 * Entry point for running the Developer Agent.
 *
 * Environment variables:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_KEY: Service role key
 * - AGENT_TYPE: Must be 'developer'
 * - AGENT_INSTANCE_ID: Unique instance identifier
 * - ANTHROPIC_API_KEY: Anthropic API key for AI generation
 * - GITHUB_TOKEN: GitHub personal access token (optional)
 * - GITHUB_OWNER: GitHub repository owner (optional)
 * - GITHUB_REPO: GitHub repository name (optional)
 * - REPO_CLONE_PATH: Path to clone repositories (optional)
 * - POLL_INTERVAL: Poll interval in ms (default: 30000)
 */

import { DeveloperAgent } from './index';

async function main() {
  const agent = new DeveloperAgent();

  // Setup graceful shutdown
  agent.setupShutdownHandlers();

  console.log('Developer Agent starting...');
  console.log(`Instance ID: ${process.env.AGENT_INSTANCE_ID}`);

  if (process.env.GITHUB_TOKEN) {
    console.log('GitHub integration: enabled');
    const verification = await agent.verifyGitHubAccess();
    if (verification.success) {
      console.log(`GitHub check passed: ${verification.message}`);
    } else {
      console.warn(`GitHub check failed: ${verification.message}`);
      // Only warn, don't exit, as file generation can still work
    }
  } else {
    console.log('GitHub integration: disabled (no GITHUB_TOKEN)');
  }

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
