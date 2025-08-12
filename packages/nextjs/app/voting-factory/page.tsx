"use client";

import { useState } from "react";
import ListVotings from "./_components/ListVotings";
import { NextPage } from "next";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const VotingFactory: NextPage = () => {
  const { writeContractAsync: writeVotingAsync, isMining } = useScaffoldWriteContract({
    contractName: "VotingFactory",
  });

  const [question, setQuestion] = useState("");
  const handleCreateVoting = async () => {
    await writeVotingAsync({
      functionName: "createVoting",
      args: [question],
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create a new voting</h1>
        <p className="opacity-70">Enter the question that participants will vote on.</p>
      </div>

      <div className="bg-base-100 rounded-xl shadow p-6 space-y-4">
        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Question</span>
          </div>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g., Which feature should we ship next?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !isMining) {
                void handleCreateVoting();
              }
            }}
            autoFocus
          />
        </label>

        <button className="btn btn-primary" onClick={handleCreateVoting} disabled={isMining}>
          {isMining ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Creating…
            </>
          ) : (
            "Create voting"
          )}
        </button>
      </div>

      <ListVotings />
    </div>
  );
};

export default VotingFactory;
