import 'dotenv/config';
import { agentClient } from './supabase';

// Set environment variables just in case
process.env.AGENT_TYPE = 'project_manager';
process.env.AGENT_INSTANCE_ID = 'debug-viewer';

async function viewErrors() {
    console.log('--- Fetching Recent Agent Errors ---');

    const { data: activities, error } = await agentClient
        .from('agent_activity')
        .select('*')
        .eq('status', 'error')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Failed to fetch activity:', error);
        return;
    }

    if (!activities || activities.length === 0) {
        console.log('No recent errors found.');
        return;
    }

    console.log(`Found ${activities.length} errors:`);
    activities.forEach((act, i) => {
        console.log(`\n[${i + 1}] Action: ${act.action} | Agent: ${act.agent_type}`);
        console.log(`    Time: ${new Date(act.created_at).toLocaleString()}`);
        console.log(`    Message: ${act.error_message}`);
        // console.log(`    Details:`, JSON.stringify(act.details, null, 2));
    });
}

viewErrors().catch(console.error);
