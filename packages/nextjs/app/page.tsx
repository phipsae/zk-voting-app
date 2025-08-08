"use client";

import { CreateCommitment } from "./_components/CreateCommitment";
import { GenerateProof } from "./_components/GenerateProof";
import { LeafEventsList } from "./_components/LeafEventsList";
import { VoteChoice } from "./_components/VoteChoice";
import { VoteWithBurnerHardhat } from "./_components/VoteWithBurnerHardhat";
import { VoteWithBurnerPaymaster } from "./_components/VoteWithBurnerPaymaster";
import { VotingStats } from "./_components/VotingStats";
import { BLOCK_NUMBER } from "./_components/constants";
import type { NextPage } from "next";
import MerkleTreeData from "~~/app/_components/MerkleTreeData";
import { useScaffoldEventHistory, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { data: leafEvents } = useScaffoldEventHistory({
    contractName: "IncrementalMerkleTree",
    eventName: "NewLeaf",
    fromBlock: BLOCK_NUMBER,
    watch: true,
    enabled: true,
  });

  const { data: treeData } = useScaffoldReadContract({
    contractName: "IncrementalMerkleTree",
    functionName: "tree",
  });

  const { data: root } = useScaffoldReadContract({
    contractName: "IncrementalMerkleTree",
    functionName: "getRoot",
  });

  return (
    <>
      <div className="flex items-start flex-col grow pt-6 w-full">
        <div className="px-4 sm:px-5 w-full max-w-7xl mx-auto">
          <h1 className="text-center">
            <span className="block text-3xl font-bold tracking-tight">Anonymous voting</span>
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
            <div className="lg:col-span-5 space-y-4">
              <VotingStats />
              <MerkleTreeData treeData={treeData} root={root as any} leafEvents={leafEvents as any[]} />
              <LeafEventsList leafEvents={leafEvents || []} />
            </div>
            <div className="lg:col-span-7 space-y-4">
              <CreateCommitment leafEvents={leafEvents || []} />
              <VoteChoice />
              <GenerateProof leafEvents={leafEvents || []} />
              <VoteWithBurnerPaymaster />
              <VoteWithBurnerHardhat />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
