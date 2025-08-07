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
    <div className="mt-4 p-4 bg-base-200 rounded-lg">
      <h3 className="text-lg font-bold mb-2">Leaf Events:</h3>
      {leafEvents.map((event, idx) => {
        // Compose a unique key using logIndex and transactionHash if available, else fallback to idx
        const uniqueKey =
          event.logIndex !== undefined && event.transactionHash
            ? `${event.transactionHash}-${event.logIndex}`
            : event.logIndex !== undefined
              ? `logIndex-${event.logIndex}`
              : `idx-${idx}`;
        return (
          <div key={uniqueKey} className="mb-2 p-2 bg-base-100 rounded">
            {event.args &&
              Object.entries(event.args).map(([key, value]) => (
                <p key={`${uniqueKey}-${key}`}>
                  <strong>{key}:</strong> {String(value)}
                </p>
              ))}
          </div>
        );
      })}
    </div>
  );
};
