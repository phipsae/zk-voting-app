"use client";

import { useState } from "react";
import ListVotings from "./_components/ListVotings";
import { NextPage } from "next";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { writeContractAsync: writeVotingAsync, isMining } = useScaffoldWriteContract({
    contractName: "VotingFactory",
  });

  const [question, setQuestion] = useState("");
  const handleCreateVoting = async () => {
    try {
      await writeVotingAsync({
        functionName: "createVoting",
        args: [question, 30n],
      });
      // Clear the question after successful creation
      setQuestion("");
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
                if (e.key === "Enter" && !isMining && question.trim()) {
                  void handleCreateVoting();
                }
              }}
              autoFocus
            />
          </div>

          <div className="flex justify-center">
            <button className="btn btn-primary" onClick={handleCreateVoting} disabled={isMining || !question.trim()}>
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
