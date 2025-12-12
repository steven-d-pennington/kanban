
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Move log to MCP root (dist/../debug.log)
const LOG_FILE = path.resolve(__dirname, '../debug.log');
function log(msg: string) {
    try {
        fs.appendFileSync(LOG_FILE, `[DB] ${msg}\n`);
    } catch (e) {
        // ignore logging errors
    }
}

log(`Loading db.ts...`);
log(`CWD: ${process.cwd()}`);
log(`__dirname: ${__dirname}`);

const envPath = path.resolve(__dirname, '../.env');
log(`Loading env from: ${envPath}`);

try {
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const parsed: Record<string, string> = {};
        content.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                let identifier = match[1];
                let val = match[2] || '';
                // Remove surrounding quotes if present
                if (val.length >= 2 && (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'"))) {
                    val = val.substring(1, val.length - 1);
                }
                parsed[identifier] = val;
                // Update process.env if not already set
                if (!process.env[identifier]) {
                    process.env[identifier] = val;
                }
            }
        });
        log(`Manual Env Load Success: Keys found: ${Object.keys(parsed).join(', ')}`);
    } else {
        log('Manual Env Load: File not found');
    }
} catch (err: any) {
    log(`Manual Env Load Error: ${err.message}`);
}

// Check what actually landed in process.env
log(`Env Check: URL=${!!process.env.SUPABASE_URL}`);
log(`Env Check: KEY=${!!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY)}`);

const supabaseUrl = process.env.SUPABASE_URL;
// Add support for the key name actually found in the .env file
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    log('FATAL: Missing Environment Variables');
    log(`URL Present: ${!!supabaseUrl}`);
    log(`Key Present: ${!!supabaseKey}`);
    log(`Attempted .env path: ${envPath}`);
    console.error("MCP Server Error: Missing Supabase Env Vars. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in claude_desktop_config.json");
}

let client;
try {
    if (!supabaseUrl) throw new Error('Missing URL');
    client = createClient(supabaseUrl, supabaseKey || 'placeholder');
} catch (e) {
    // Create a dummy proxy that throws on any usage
    client = new Proxy({}, {
        get: () => () => { throw new Error("Supabase not configured. Set SUPABASE_URL in config."); }
    });
}

// @ts-ignore
export const supabase = client as any;
