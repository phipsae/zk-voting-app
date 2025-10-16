"use client";

import { useState } from "react";
import CreateVotingModal from "./_components/CreateVotingModal";
import VotingOverview from "./_components/VotingOverview";
import { NextPage } from "next";

const Home: NextPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-base-200">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1 space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Privacy Voting
              </h1>
              <p className="text-xl opacity-70 max-w-2xl">
                Create privatevoting sessions with registration periods. Participants register, vote privately, and
                maintain full transparency.
              </p>
            </div>
            <div className="flex-shrink-0">
              <button className="btn btn-primary btn-lg gap-2 shadow-lg" onClick={() => setIsModalOpen(true)}>
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <VotingOverview />
      </div>

      <CreateVotingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Home;
