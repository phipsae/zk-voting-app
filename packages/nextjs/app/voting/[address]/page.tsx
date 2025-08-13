"use client";

import { useMemo } from "react";
import { notFound, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { LeafEventsList } from "~~/app/_components/LeafEventsList";
import MerkleTreeData from "~~/app/_components/MerkleTreeData";
import { VotingStats } from "~~/app/_components/VotingStats";
import { CreateCommitment } from "~~/app/voting/_components/CreateCommitment";
import { GenerateProof } from "~~/app/voting/_components/GenerateProof";
import { VoteWithBurnerHardhat } from "~~/app/voting/_components/VoteWithBurnerHardhat";
import { VoteWithBurnerPaymaster } from "~~/app/voting/_components/VoteWithBurnerPaymaster";
import { useSelectedNetwork } from "~~/hooks/scaffold-eth";
import { contracts } from "~~/utils/scaffold-eth/contract";

type LeafEvent = {
  index: string;
  value: string;
};

export default function VotingByAddressPage() {
  const params = useParams<{ address: `0x${string}` }>();
  const address = params?.address as `0x${string}` | undefined;
  const selected = useSelectedNetwork();
  const publicClient = usePublicClient({ chainId: selected.id });

  const votingAbi = contracts?.[selected.id]?.["Voting"].abi as any;

  const { data: leavesData } = useQuery({
    queryKey: ["leaves", address],
    queryFn: async () => {
      if (!publicClient) return [] as LeafEvent[];
      const logs = await publicClient.getLogs({
        address,
        event: (votingAbi as any).find((x: any) => x.type === "event" && x.name === "NewLeaf"),
        fromBlock: 0n,
      });
      return logs.map(l => ({ index: String((l as any).args.index), value: String((l as any).args.value) }));
    },
    refetchInterval: 2000,
  });

  const leavesAsEvents: any[] = useMemo(
    () =>
      (leavesData || []).map((item: any, idx: number) => ({
        args: { index: BigInt(item.index), value: BigInt(item.value) },
        logIndex: idx,
      })),
    [leavesData],
  );

  const { data: question } = useQuery({
    queryKey: ["question", address],
    queryFn: async () =>
      (await publicClient?.readContract({
        address: address as `0x${string}`,
        abi: votingAbi,
        functionName: "question",
        args: [],
      })) as string,
    enabled: Boolean(publicClient && votingAbi && address),
    refetchInterval: 5000,
  });

  const { data: yesVotes } = useQuery({
    queryKey: ["yesVotes", address],
    queryFn: async () =>
      (await publicClient?.readContract({
        address: address as `0x${string}`,
        abi: votingAbi,
        functionName: "yesVotes",
        args: [],
      })) as bigint,
    enabled: Boolean(publicClient && votingAbi && address),
    refetchInterval: 2000,
  });

  const { data: noVotes } = useQuery({
    queryKey: ["noVotes", address],
    queryFn: async () =>
      (await publicClient?.readContract({
        address: address as `0x${string}`,
        abi: votingAbi,
        functionName: "noVotes",
        args: [],
      })) as bigint,
    enabled: Boolean(publicClient && votingAbi && address),
    refetchInterval: 2000,
  });

  const { data: treeData } = useQuery({
    queryKey: ["tree", address],
    queryFn: async () =>
      (await publicClient?.readContract({
        address: address as `0x${string}`,
        abi: votingAbi,
        functionName: "tree",
        args: [],
      })) as [bigint, bigint],
    enabled: Boolean(publicClient && votingAbi && address),
    refetchInterval: 5000,
  });

  const { data: root } = useQuery({
    queryKey: ["root", address],
    queryFn: async () =>
      (await publicClient?.readContract({
        address: address as `0x${string}`,
        abi: votingAbi,
        functionName: "getRoot",
        args: [],
      })) as bigint,
    enabled: Boolean(publicClient && votingAbi && address),
    refetchInterval: 5000,
  });

  if (!address) return notFound();

  return (
    <div className="flex items-start flex-col grow pt-6 w-full">
      <div className="px-4 sm:px-5 w-full max-w-7xl mx-auto">
        <h1 className="text-center">
          <span className="block text-3xl font-bold tracking-tight">Voting</span>
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
          <div className="lg:col-span-5 space-y-4">
            <VotingStats contractAddress={address} question={question} yesVotes={yesVotes} noVotes={noVotes} />
            <MerkleTreeData treeData={treeData as any} root={root as any} leafEvents={leavesAsEvents as any[]} />
            <LeafEventsList leafEvents={leavesAsEvents} />
          </div>
          <div className="lg:col-span-7 space-y-4">
            <CreateCommitment leafEvents={leavesAsEvents || []} contractAddress={address} />
            <GenerateProof leafEvents={leavesAsEvents || []} contractAddress={address} />
            <VoteWithBurnerPaymaster contractAddress={address} />
            <VoteWithBurnerHardhat contractAddress={address} />
          </div>
        </div>
      </div>
    </div>
  );
}
