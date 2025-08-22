"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { AddVotersModal } from "~~/app/voting/_components/AddVotersModal";
import { CombinedVoteBurnerPaymaster } from "~~/app/voting/_components/CombinedVoteBurnerPaymaster";
import { CreateCommitment } from "~~/app/voting/_components/CreateCommitment";
import { ShowVotersModal } from "~~/app/voting/_components/ShowVotersModal";
import { VotingStats } from "~~/app/voting/_components/VotingStats";

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

export default function VotingByAddressPage() {
  const params = useParams<{ address: `0x${string}` }>();
  const address = params?.address as `0x${string}` | undefined;

  // Guard: no address in URL yet
  const enabled = Boolean(address && address.length === 42);

  const { data } = useQuery({
    queryKey: ["leavess", address],
    queryFn: () => fetchLeaves(address!),
    enabled,
    // light polling so UI picks up rows soon after indexer writes them
    refetchInterval: 2000,
  });

  // Map GraphQL rows -> viem-like event array your components use
  const leavesEvents = useMemo(
    () =>
      (data ?? []).map((row, i) => ({
        args: {
          index: BigInt(row.index),
          value: BigInt(row.value),
        },
        logIndex: i,
        // I dont understand why this is needed, but it is
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
    <div className="flex items-center justify-center flex-col grow pt-6 w-full">
      <div className="px-4 sm:px-5 w-full max-w-7xl mx-auto">
        {!enabled ? (
          <div className="mt-6 text-sm opacity-70 text-center">No voting address in URL.</div>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-2xl space-y-4 mt-6">
              <div className="flex flex-wrap gap-2 justify-between">
                {address && <AddVotersModal contractAddress={address} />}
                {address && <ShowVotersModal contractAddress={address} />}
              </div>
              <VotingStats contractAddress={address} />
              <CreateCommitment compact leafEvents={leavesEvents} contractAddress={address} />
              <CombinedVoteBurnerPaymaster contractAddress={address} leafEvents={leavesEvents} />
            </div>
            {address && (
              <div className="text-center text-sm opacity-70 mt-4">
                <a className="underline" href={`/voting/${address}/debug`}>
                  Advanced / Debug page
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
