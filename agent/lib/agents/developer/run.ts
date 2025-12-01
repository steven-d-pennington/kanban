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
