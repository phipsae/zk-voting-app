"use client";

import { useMemo, useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface CreateVotingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateVotingModal = ({ isOpen, onClose }: CreateVotingModalProps) => {
  const { writeContractAsync: writeVotingAsync, isMining } = useScaffoldWriteContract({
    contractName: "VotingFactory",
  });

  const [question, setQuestion] = useState("");
  const [duration, setDuration] = useState<string>("30");
  const [unit, setUnit] = useState<"minutes" | "hours" | "days">("minutes");

  const durationInSeconds = useMemo(() => {
    const parsed = parseInt(duration, 10);
    if (isNaN(parsed) || parsed <= 0) return 0n;
    const base = BigInt(parsed);
    switch (unit) {
      case "minutes":
        return base * 60n;
      case "hours":
        return base * 3600n;
      case "days":
        return base * 86400n;
      default:
        return 0n;
    }
  }, [duration, unit]);

  // Format duration for display
  const formatDuration = useMemo(() => {
    const parsed = parseInt(duration, 10);
    if (isNaN(parsed) || parsed <= 0) return null;

    let totalMinutes = parsed;
    if (unit === "hours") totalMinutes *= 60;
    if (unit === "days") totalMinutes *= 1440;

    if (totalMinutes < 60) {
      return `${totalMinutes} minute${totalMinutes !== 1 ? "s" : ""}`;
    } else if (totalMinutes < 1440) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      const days = Math.floor(totalMinutes / 1440);
      const hours = Math.floor((totalMinutes % 1440) / 60);
      return hours > 0 ? `${days}d ${hours}h` : `${days} day${days !== 1 ? "s" : ""}`;
    }
  }, [duration, unit]);

  const handleCreateVoting = async () => {
    try {
      await writeVotingAsync({
        functionName: "createVoting",
        args: [question, durationInSeconds],
        gas: 1100000n,
      });
      setQuestion("");
      setDuration("30");
      setUnit("minutes");
      onClose();
    } catch (error) {
      console.error("Failed to create voting:", error);
    }
  };

  const handleClose = () => {
    setQuestion("");
    setDuration("30");
    setUnit("minutes");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-base-100 rounded-2xl border border-base-300 p-8 max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Create New Voting</h2>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-sm btn-circle btn-ghost hover:btn-error hover:text-error-content transition-colors"
            disabled={isMining}
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold text-base flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Voting Question
              </span>
            </label>
            <input
              type="text"
              className="input input-bordered input-lg w-full focus:input-primary transition-colors"
              placeholder="e.g., Should we implement feature X?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !isMining && question.trim() && durationInSeconds > 0n) {
                  void handleCreateVoting();
                }
              }}
              autoFocus
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold text-base flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Registration Period
              </span>
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                min={1}
                step={1}
                placeholder="30"
                className="input input-bordered input-lg flex-1 focus:input-primary transition-colors"
                value={duration}
                onChange={e => setDuration(e.target.value.replace(/[^0-9]/g, ""))}
              />
              <select
                className="select select-bordered select-lg w-36 focus:select-primary transition-colors"
                value={unit}
                onChange={e => setUnit(e.target.value as typeof unit)}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
            {formatDuration && (
              <label className="label">
                <span className="label-text-alt text-base-content/60">Voters can register for {formatDuration}</span>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="btn btn-ghost btn-lg" onClick={handleClose} disabled={isMining}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-lg min-w-[160px]"
              onClick={handleCreateVoting}
              disabled={isMining || !question.trim() || durationInSeconds <= 0n}
            >
              {isMining ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                <>Create Voting</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVotingModal;
