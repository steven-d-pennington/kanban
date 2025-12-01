# Configuration Guide

## Environment Variables

### Frontend Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |

### Agent Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `AGENT_POLL_INTERVAL` | No | Polling interval in ms (default: 10000) |
| `AGENT_CLAIM_TIMEOUT` | No | Claim timeout in minutes (default: 30) |

## Supabase Configuration

### Authentication

Configure auth providers in Supabase Dashboard:
1. Go to Authentication > Providers
2. Enable Email provider
3. Optionally enable OAuth providers (Google, GitHub, etc.)

### Email Templates

Customize email templates in Authentication > Email Templates:
- Confirmation email
- Password reset
- Magic link

### Rate Limiting

Agent rate limits are configured in the database:

```sql
-- View current rate limits
SELECT * FROM agent_rate_limits;

-- Adjust rate limit (default: 100 requests/minute)
-- Modify in the check_agent_rate_limit function
```

### Stale Claim Timeout

Configure stale claim release timeout:

```sql
-- Default is 30 minutes
-- Adjust by calling with different parameter
SELECT release_stale_claims(45); -- 45 minute timeout
```

## Agent Configuration

### Handoff Rules

Configure which agent processes which item types:

```sql
SELECT * FROM handoff_rules;

-- Modify rules as needed
UPDATE handoff_rules
SET is_active = false
WHERE source_type = 'task';
```

Default handoff flow:
```
project_spec → project_manager → prd
feature → project_manager → prd
prd → scrum_master → story
story → developer → implementation
bug → developer → fix
task → developer → completion
```

### Agent Instance Settings

Register agents with custom settings:

```sql
SELECT register_agent_instance(
  'custom-pm-001',
  'project_manager',
  'Custom PM Agent'
);
```

## Performance Tuning

### Database Indexes

Essential indexes are created in migration 003. For additional indexes:

```sql
-- Index for specific query patterns
CREATE INDEX CONCURRENTLY idx_custom
ON work_items(your_column);
```

### Connection Pooling

For high-traffic deployments, configure Supabase connection pooling:
1. Go to Settings > Database
2. Enable connection pooling
3. Use the pooler connection string

### Caching

Frontend uses in-memory caching via Zustand. For additional caching:
- Consider Redis for session caching
- Use CDN for static assets
- Enable Vercel Edge caching

## Security Configuration

### API Key Management

Agent API keys should be:
- Stored securely (environment variables, secrets manager)
- Rotated regularly
- Scoped to minimum required permissions

### Row Level Security

All tables use RLS. Review policies:

```sql
SELECT * FROM pg_policies
WHERE tablename = 'work_items';
```

### CORS Configuration

Configure allowed origins in Supabase:
1. Go to API Settings
2. Add your frontend domains to allowed origins

## Monitoring Configuration

### Log Retention

Configure activity log retention:

```sql
-- Clean up logs older than 90 days (default)
SELECT cleanup_old_activity_logs(90);

-- Schedule as a cron job
SELECT cron.schedule(
  'cleanup-logs',
  '0 3 * * *',  -- Daily at 3 AM
  $$SELECT cleanup_old_activity_logs(90)$$
);
```

### Alerts

Configure alerts via:
- Supabase database webhooks
- External monitoring (Datadog, New Relic)
- Custom notification functions

## Backup Configuration

### Database Backups

Supabase provides automatic backups. For additional backup:

```bash
# Manual backup
pg_dump -h your-db-host -U postgres -d postgres > backup.sql
```

### Recovery

```bash
# Restore from backup
psql -h your-db-host -U postgres -d postgres < backup.sql
```
