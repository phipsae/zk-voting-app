"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { GenerateProof } from "~~/app/voting/_components/GenerateProof";
import { LeafEventsList } from "~~/app/voting/_components/LeafEventsList";
import MerkleTreeData from "~~/app/voting/_components/MerkleTreeData";
import { VoteWithBurnerHardhat } from "~~/app/voting/_components/VoteWithBurnerHardhat";
import { VoteWithBurnerPaymaster } from "~~/app/voting/_components/VoteWithBurnerPaymaster";
import { Address } from "~~/components/scaffold-eth";

type LeafRow = { index: string; value: string };
type LeavesData = { leavess: { items: LeafRow[] } };

const LeavesQuery = gql/* GraphQL */ `
  query Leaves($addr: String!, $limit: Int = 200) {
    leavess(where: { votingAddress: $addr }, orderBy: "indexNum", orderDirection: "desc", limit: $limit) {
      items {
        index
        value
      }
    }
  }
`;

async function fetchLeaves(votingAddress: string, limit = 200) {
  const endpoint = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
  const data = await request<LeavesData>(endpoint, LeavesQuery, {
    addr: votingAddress.toLowerCase(),
    limit,
  });
  return data.leavess.items;
}

export default function VotingDebugPage() {
  const params = useParams<{ address: `0x${string}` }>();
  const address = params?.address as `0x${string}` | undefined;
  const enabled = Boolean(address && address.length === 42);

  const { data } = useQuery({
    queryKey: ["leavess", address],
    queryFn: () => fetchLeaves(address!),
    enabled,
    refetchInterval: 2000,
  });

  const leavesEvents = useMemo(
    () =>
      (data ?? []).map((row, i) => ({
        args: { index: BigInt(row.index), value: BigInt(row.value) },
        logIndex: i,
        blockNumber: 0n,
        blockHash: "0x0" as `0x${string}`,
        transactionHash: "0x0" as `0x${string}`,
        removed: false,
        address: "0x0" as `0x${string}`,
        data: "0x0" as `0x${string}`,
        topics: ["0x0"] as [`0x${string}`, ...`0x${string}`[]],
        transactionIndex: 0,
      })),
    [data],
  );

  return (
    <div className="flex items-start flex-col grow pt-6 w-full">
      <div className="px-4 sm:px-5 w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Voting Debug</h1>
          {address && (
            <a className="underline" href={`/voting/${address}`}>
              Back to vote
            </a>
          )}
        </div>

        {address && (
          <div className="mt-2">
            <Address address={address} />
          </div>
        )}

        {!enabled ? (
          <div className="mt-6 text-sm opacity-70">No voting address in URL.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
            <div className="lg:col-span-5 space-y-4">
              <MerkleTreeData contractAddress={address as `0x${string}`} leafEvents={leavesEvents} />
              <LeafEventsList leafEvents={leavesEvents} />
            </div>

            <div className="lg:col-span-7 space-y-4">
              <GenerateProof leafEvents={leavesEvents} contractAddress={address} />
              <VoteWithBurnerPaymaster contractAddress={address} />
              <VoteWithBurnerHardhat contractAddress={address} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
