import { Log } from "viem";

interface LeafEvent extends Log {
  args?: Record<string, any>;
}

interface LeafEventsListProps {
  leafEvents: LeafEvent[];
}

export const LeafEventsList = ({ leafEvents }: LeafEventsListProps) => {
  if (!leafEvents || leafEvents.length === 0) return null;

  return (
    <div className="bg-base-100 shadow rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold">Recent leaf insertions</h3>
        <span className="text-xs opacity-70">{leafEvents.length}</span>
      </div>
      <div className="max-h-56 overflow-y-auto rounded-lg border border-base-300">
        {leafEvents.map((event, idx) => {
          const uniqueKey =
            event.logIndex !== undefined && event.transactionHash
              ? `${event.transactionHash}-${event.logIndex}`
              : event.logIndex !== undefined
                ? `logIndex-${event.logIndex}`
                : `idx-${idx}`;
          return (
            <div key={uniqueKey} className="px-3 py-2 border-b border-base-300 last:border-b-0 text-xs">
              {event.args &&
                Object.entries(event.args).map(([key, value]) => (
                  <div key={`${uniqueKey}-${key}`} className="flex items-center gap-2">
                    <span className="opacity-70 min-w-16">{key}:</span>
                    <span className="font-mono break-all">{String(value)}</span>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
