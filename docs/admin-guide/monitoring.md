# System Monitoring

## Built-in Monitoring Dashboard

Access the monitoring dashboard from the navigation menu:
- Click "Monitoring" in the header
- View real-time agent status
- Monitor activity and alerts

### Dashboard Components

#### Summary Cards
- **Active Agents**: Number of online agents
- **Processing**: Agents currently working
- **Tasks Today**: Completed tasks count
- **Errors Today**: Error count (red if > 0)

#### Agent Cards
Each agent shows:
- Status (Idle, Processing, Error, Offline)
- Current task (if processing)
- Success rate percentage
- Average processing time
- Tasks completed today
- Error count

#### Activity Timeline
Real-time feed of:
- Claims and releases
- Processing updates
- Completions
- Errors and failures

#### Alerts Panel
- Error alerts (task failures)
- Warning alerts (long-running tasks)
- Acknowledgment controls

## Database Views for Monitoring

### Agent Performance Metrics

```sql
SELECT * FROM agent_performance_metrics;
```

Returns:
- agent_id
- agent_type
- display_name
- status
- tasks_today
- tasks_week
- tasks_total
- success_rate
- avg_duration_ms
- errors_today

### Work Item Bottlenecks

```sql
SELECT * FROM work_item_bottlenecks;
```

Returns items stuck in a status for > 24 hours:
- id, title
- status
- hours_in_status
- assigned_to/assigned_agent
- project info

### Activity Feed

```sql
SELECT * FROM agent_activity_feed
ORDER BY created_at DESC
LIMIT 100;
```

## Key Metrics to Monitor

### Agent Health

| Metric | Warning | Critical |
|--------|---------|----------|
| Success Rate | < 90% | < 70% |
| Avg Processing Time | > 5 min | > 15 min |
| Errors Today | > 3 | > 10 |
| Last Seen | > 5 min | > 10 min |

### System Health

| Metric | Warning | Critical |
|--------|---------|----------|
| Items in Progress | > 10 | > 20 |
| Stale Claims | > 3 | > 10 |
| Bottleneck Items | > 5 | > 15 |

## Setting Up Alerts

### Database Triggers

Create a trigger for error alerts:

```sql
CREATE OR REPLACE FUNCTION notify_on_error()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'error' THEN
    PERFORM pg_notify('agent_error', json_build_object(
      'agent', NEW.agent_instance_id,
      'work_item', NEW.work_item_id,
      'error', NEW.error_message
    )::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_error_trigger
AFTER INSERT ON agent_activity
FOR EACH ROW EXECUTE FUNCTION notify_on_error();
```

### Webhook Integration

Configure Supabase webhooks to send to:
- Slack
- Discord
- PagerDuty
- Custom endpoints

### External Monitoring

Integrate with:
- **Datadog**: APM and logs
- **New Relic**: Performance monitoring
- **Sentry**: Error tracking
- **Prometheus/Grafana**: Metrics

## Log Analysis

### Activity Log Queries

```sql
-- Errors in last 24 hours
SELECT * FROM agent_activity
WHERE status = 'error'
AND created_at > NOW() - INTERVAL '24 hours';

-- Average processing time by agent
SELECT
  agent_type,
  AVG(duration_ms) as avg_duration,
  COUNT(*) as total_tasks
FROM agent_activity
WHERE duration_ms IS NOT NULL
GROUP BY agent_type;

-- Success rate by day
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate
FROM agent_activity
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

### Exporting Logs

From the monitoring dashboard:
1. Click "Export" dropdown
2. Select CSV or JSON format
3. Download the file

Or via SQL:

```sql
COPY (SELECT * FROM agent_activity_feed)
TO '/tmp/activity_export.csv'
WITH CSV HEADER;
```

## Troubleshooting with Logs

### Agent Not Picking Up Items

Check registration:
```sql
SELECT * FROM agent_instances
WHERE agent_type = 'project_manager';
```

Check for errors:
```sql
SELECT * FROM agent_activity
WHERE agent_type = 'project_manager'
AND status = 'error'
ORDER BY created_at DESC
LIMIT 10;
```

### Stale Claims

Find stale claims:
```sql
SELECT * FROM agent_claimed_items
WHERE claimed_minutes_ago > 30;
```

Force release:
```sql
SELECT force_release_work_item(
  'work-item-uuid',
  'manual_admin_release'
);
```

### Performance Issues

Check slow queries:
```sql
SELECT * FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```
