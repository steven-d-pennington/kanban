import { AlertCircle, AlertTriangle, Info, X, Check } from 'lucide-react';
import type { SystemAlert } from '../../store/monitoringStore';

interface AlertsPanelProps {
  alerts: SystemAlert[];
  onAcknowledge: (alertId: string) => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

const alertStyles = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-500',
    titleColor: 'text-red-800',
    messageColor: 'text-red-700',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    titleColor: 'text-yellow-800',
    messageColor: 'text-yellow-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-800',
    messageColor: 'text-blue-700',
  },
};

export function AlertsPanel({ alerts, onAcknowledge }: AlertsPanelProps) {
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter((a) => a.acknowledged);

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mt-3 font-medium text-gray-900">All Clear</h3>
          <p className="mt-1 text-sm text-gray-500">No alerts or issues to report</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Alerts
          {unacknowledgedAlerts.length > 0 && (
            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {unacknowledgedAlerts.length}
            </span>
          )}
        </h3>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {/* Unacknowledged alerts first */}
        {unacknowledgedAlerts.map((alert) => {
          const style = alertStyles[alert.type];
          const Icon = style.icon;

          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-4 ${style.bg}`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${style.iconColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className={`font-medium ${style.titleColor}`}>{alert.title}</h4>
                    <p className={`mt-0.5 text-sm ${style.messageColor}`}>
                      {alert.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatTimeAgo(alert.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                    title="Acknowledge"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Acknowledged alerts (dimmed) */}
        {acknowledgedAlerts.map((alert) => {
          const style = alertStyles[alert.type];
          const Icon = style.icon;

          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-4 bg-gray-50 opacity-60"
            >
              <Icon className="h-5 w-5 flex-shrink-0 text-gray-400" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-600 line-through">{alert.title}</h4>
                <p className="mt-0.5 text-sm text-gray-500">{alert.message}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {formatTimeAgo(alert.timestamp)} - Acknowledged
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
