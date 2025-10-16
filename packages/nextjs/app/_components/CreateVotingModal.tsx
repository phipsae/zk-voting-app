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

  const handleCreateVoting = async () => {
    try {
      await writeVotingAsync({
        functionName: "createVoting",
        args: [question, durationInSeconds],
        // Slightly above measured need (1,060,858) to avoid RPC 1,000,000 gas cap during simulation
        gas: 1100000n,
      });
      // Clear the form and close modal after successful creation
      setQuestion("");
      setDuration("30");
      setUnit("minutes");
      onClose();
    } catch (error) {
      console.error("Failed to create voting:", error);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setQuestion("");
    setDuration("30");
    setUnit("minutes");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }} onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-base-100 rounded-lg border border-base-300 p-6 max-w-lg w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Create New Voting</h2>
          <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost" disabled={isMining}>
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Question</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="e.g., Should we build a bridge?"
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

          <div className="w-full grid grid-cols-3 gap-2 items-end">
            <div className="form-control col-span-2">
              <label className="label">
                <span className="label-text font-medium">Registration period</span>
              </label>
              <input
                type="number"
                min={1}
                step={1}
                placeholder="30"
                className="input input-bordered w-full"
                value={duration}
                onChange={e => setDuration(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Unit</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={unit}
                onChange={e => setUnit(e.target.value as typeof unit)}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button className="btn btn-ghost" onClick={handleClose} disabled={isMining}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateVoting}
              disabled={isMining || !question.trim() || durationInSeconds <= 0n}
            >
              {isMining ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                "Create Voting"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVotingModal;
