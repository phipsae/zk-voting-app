"use client";

import { useMemo, useState } from "react";
import ListVotings from "./_components/ListVotings";
import { NextPage } from "next";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
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
      // Clear the question after successful creation
      setQuestion("");
      setDuration("30");
      setUnit("minutes");
    } catch (error) {
      console.error("Failed to create voting:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text">Privacy Voting</h1>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">
          Launch a secure, zero-knowledge voting session. Participants can vote privately while maintaining full
          transparency.
        </p>
      </div>

      <div className="bg-base-100 rounded-lg border border-base-300 p-6 max-w-lg mx-auto">
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

          <div className="flex justify-center">
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

      <ListVotings />
    </div>
  );
};

export default Home;
