"use client";

import { useState } from "react";
import CreateVotingModal from "./_components/CreateVotingModal";
import VotingOverview from "./_components/VotingOverview";
import { NextPage } from "next";

const Home: NextPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text">Privacy Voting</h1>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">
          Launch a secure, zero-knowledge voting session. Participants can vote privately while maintaining full
          transparency.
        </p>
      </div>

      <div className="flex justify-center">
        <button className="btn btn-primary btn-lg gap-2" onClick={() => setIsModalOpen(true)}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Voting
        </button>
      </div>

      <VotingOverview />

      <CreateVotingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Home;
