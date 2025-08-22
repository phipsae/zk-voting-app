"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { VoteChoice } from "../_components/VoteChoice";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { AddVotersModal } from "~~/app/voting/_components/AddVotersModal";
import { CombinedVoteBurnerPaymaster } from "~~/app/voting/_components/CombinedVoteBurnerPaymaster";
import { CreateCommitment } from "~~/app/voting/_components/CreateCommitment";
import { VotingStats } from "~~/app/voting/_components/VotingStats";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

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

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["leavess", address],
    queryFn: () => fetchLeaves(address!),
    enabled,
    // light polling so UI picks up rows soon after indexer writes them
    refetchInterval: 2000,
  });

  const { data: question } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "question",
    address: address,
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
    <div className="flex items-start flex-col grow pt-6 w-full">
      <div className="px-4 sm:px-5 w-full max-w-7xl mx-auto">
        <h1 className="text-center">
          {question && <span className="block text-3xl font-bold tracking-tight">{question}</span>}
          {address && (
            <div className="flex justify-center">
              <Address address={address} />
            </div>
          )}
        </h1>

        {!enabled ? (
          <div className="mt-6 text-sm opacity-70">No voting address in URL.</div>
        ) : (
          <>
            <div className="mt-3 flex items-center justify-between text-sm opacity-70">
              <div className="flex items-center gap-3">
                {isLoading ? "Loading…" : isFetching ? "Refreshing…" : "Up to date"}
                <button className="underline" onClick={() => refetch()}>
                  Refresh now
                </button>
              </div>
              {address && (
                <a className="underline" href={`/voting/${address}/debug`}>
                  Advanced / Debug page
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
              <div className="lg:col-span-5 space-y-4">
                <VotingStats contractAddress={address} />
                {address && <AddVotersModal contractAddress={address} />}
              </div>

              <div className="lg:col-span-7 space-y-4">
                <CreateCommitment compact leafEvents={leavesEvents} contractAddress={address} />
                <VoteChoice />
                <CombinedVoteBurnerPaymaster contractAddress={address} leafEvents={leavesEvents} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
