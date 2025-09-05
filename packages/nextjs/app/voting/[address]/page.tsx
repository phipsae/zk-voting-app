"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { base } from "viem/chains";
import { useAccount } from "wagmi";
import { AddVotersModal } from "~~/app/voting/_components/AddVotersModal";
import { CombinedVoteBurnerPaymaster } from "~~/app/voting/_components/CombinedVoteBurnerPaymaster";
import { CreateCommitment } from "~~/app/voting/_components/CreateCommitment";
import { LogLocalStorage } from "~~/app/voting/_components/LogLocalStorage";
import { ShowVotersModal } from "~~/app/voting/_components/ShowVotersModal";
import { VotingStats } from "~~/app/voting/_components/VotingStats";

interface LeavesData {
  leaves: {
    items: {
      votingAddress: string;
      index: string;
      value: string;
    }[];
  };
}

async function fetchLeaves(votingAddress: string, isBase: boolean, limit = 200) {
  const endpoint = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
  const LeavesQuery = isBase
    ? gql/* GraphQL */ `
        query BaseLeaves($addr: String!, $limit: Int = 200) {
          leaves: baseLeavess(
            where: { votingAddress: $addr }
            orderBy: "indexNum"
            orderDirection: "desc"
            limit: $limit
          ) {
            items {
              votingAddress
              index
              value
            }
          }
        }
      `
    : gql/* GraphQL */ `
        query MainnetLeaves($addr: String!, $limit: Int = 200) {
          leaves: mainnetLeavess(
            where: { votingAddress: $addr }
            orderBy: "indexNum"
            orderDirection: "desc"
            limit: $limit
          ) {
            items {
              votingAddress
              index
              value
            }
          }
        }
      `;
  const data = await request<LeavesData>(endpoint, LeavesQuery, {
    addr: votingAddress.toLowerCase(),
    limit,
  });
  return data.leaves.items;
}

export default function VotingByAddressPage() {
  const params = useParams<{ address: `0x${string}` }>();
  const address = params?.address as `0x${string}` | undefined;
  const { chain } = useAccount();
  const isBase = chain?.id === base.id;

  // Guard: no address in URL yet
  const enabled = Boolean(address && address.length === 42);

  const { data } = useQuery({
    queryKey: ["leavess", address, chain?.id],
    queryFn: () => fetchLeaves(address!, Boolean(isBase)),
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
                <div className="flex items-center gap-2">
                  {address && <ShowVotersModal contractAddress={address} />}
                </div>
              </div>
              <VotingStats contractAddress={address} />
              <CreateCommitment compact leafEvents={leavesEvents} contractAddress={address} />
              <CombinedVoteBurnerPaymaster contractAddress={address} leafEvents={leavesEvents} />
              {address && <LogLocalStorage contractAddress={address} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
