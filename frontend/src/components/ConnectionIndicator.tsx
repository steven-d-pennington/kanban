import { Wifi, WifiOff, Loader2, Monitor } from 'lucide-react';
import { useConnectionStatus, type ConnectionStatus } from '../hooks/useConnectionStatus';

const statusConfig: Record<
  ConnectionStatus,
  { icon: typeof Wifi; color: string; bgColor: string; label: string }
> = {
  connected: {
    icon: Wifi,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Connected',
  },
  connecting: {
    icon: Loader2,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Connecting...',
  },
  disconnected: {
    icon: WifiOff,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Disconnected',
  },
  demo: {
    icon: Monitor,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Demo Mode',
  },
};

export function ConnectionIndicator() {
  const status = useConnectionStatus();
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor}`}
      title={config.label}
    >
      <Icon
        className={`w-3.5 h-3.5 ${config.color} ${status === 'connecting' ? 'animate-spin' : ''}`}
      />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}
