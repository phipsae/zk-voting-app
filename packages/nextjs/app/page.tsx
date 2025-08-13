"use client";

import { CreateCommitment } from "./voting/_components/CreateCommitment";
import { GenerateProof } from "./voting/_components/GenerateProof";
import { LeafEventsList } from "./voting/_components/LeafEventsList";
import { VoteChoice } from "./voting/_components/VoteChoice";
import { VoteWithBurnerHardhat } from "./voting/_components/VoteWithBurnerHardhat";
import { VoteWithBurnerPaymaster } from "./voting/_components/VoteWithBurnerPaymaster";
import { VotingStats } from "./voting/_components/VotingStats";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import type { NextPage } from "next";
// import MerkleTreeData from "~~/app/voting/_components/MerkleTreeData";
import { useScaffoldWatchContractEvent } from "~~/hooks/scaffold-eth";

type LeafEvent = {
  index: string;
  value: string;
};

type LeavesData = { leavess: { items: LeafEvent[] } };

const fetchLeaves = async () => {
  const LeavesQuery = gql`
    query Leaves {
      leavess(orderBy: "indexNum", orderDirection: "desc") {
        items {
          index
          value
        }
      }
    }
  `;
  const data = await request<LeavesData>(process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069", LeavesQuery);
  return data;
};

const Home: NextPage = () => {
  const queryClient = useQueryClient();

  // When a new on-chain NewLeaf event is observed, invalidate the Ponder query
  // so the latest indexed data is fetched automatically.
  useScaffoldWatchContractEvent({
    contractName: "Voting",
    eventName: "NewLeaf",
    onLogs: () => {
      queryClient.invalidateQueries({ queryKey: ["leavess"] });
    },
  });

  const { data: leavesData } = useQuery({
    queryKey: ["leavess"],
    queryFn: fetchLeaves,
    // If Ponder indexing lags slightly behind the on-chain event, a short refetch
    // interval helps ensure the UI picks up the new row quickly.
    refetchInterval: 2000,
  });

  // Map GraphQL leaves data into the viem-like event shape expected by LeafEventsList
  const leavesAsEvents: any[] = (leavesData?.leavess?.items ?? []).map((item: any, idx: number) => ({
    args: {
      index: BigInt(item.index),
      value: BigInt(item.value),
    },
    logIndex: idx,
  }));

  // const { data: treeData } = useScaffoldReadContract({
  //   contractName: "Voting",
  //   functionName: "tree",
  // });

  // const { data: root } = useScaffoldReadContract({
  //   contractName: "Voting",
  //   functionName: "getRoot",
  // });

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
              {/* <MerkleTreeData treeData={treeData} root={root as any} leafEvents={leavesAsEvents as any[]} /> */}
              <LeafEventsList leafEvents={leavesAsEvents} />
            </div>
            <div className="lg:col-span-7 space-y-4">
              <CreateCommitment leafEvents={leavesAsEvents || []} />
              <VoteChoice />
              <GenerateProof leafEvents={leavesAsEvents || []} />
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
