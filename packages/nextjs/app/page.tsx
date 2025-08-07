"use client";

import { CreateCommitment } from "./_components/CreateCommitment";
import { GenerateProof } from "./_components/GenerateProof";
import { VoteChoice } from "./_components/VoteChoice";
import { VoteWithBurnerHardhat } from "./_components/VoteWithBurnerHardhat";
import { VotingStats } from "./_components/VotingStats";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">Anoymous voting</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <VotingStats />
          <VoteChoice />
          <CreateCommitment />
          <GenerateProof />
          <VoteWithBurnerHardhat />
        </div>
      </div>
    </>
  );
};

export default Home;
