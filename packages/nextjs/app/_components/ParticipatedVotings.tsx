"use client";

import { useMemo } from "react";
import Link from "next/link";
import VotingStatus from "./VotingStatus";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { getAddress } from "viem";
import { base } from "viem/chains";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

type VotingItem = {
  voting: `0x${string}`;
  creator: `0x${string}`;
  question: string;
  blockNumber?: bigint;
  transactionHash?: `0x${string}`;
  isOnAllowlist?: boolean;
};

const ParticipatedVotings = () => {
  type VotingEvent = {
    address: `0x${string}`;
    creator: `0x${string}`;
    question: string;
    createdAtBlock: number;
    isOnAllowlist?: boolean;
  };

  const { address, chain } = useAccount();

  type NetworkVotingsData = {
    votings: { items: VotingEvent[] };
  };

  // Function to check if user is on allowlist for a voting
  const checkAllowlistStatus = async (votingAddress: string, userAddress: string) => {
    const network = chain?.id === base.id ? "base" : "mainnet";

    try {
      // Remove trailing slash from base URL to avoid double slashes
      const baseUrl = (process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069").replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/allowlist/${network}/${votingAddress}/${userAddress}`);

      // Check if response is OK and is JSON
      if (!response.ok) {
        console.warn(`Allowlist check failed with status ${response.status} for ${votingAddress}`);
        return false;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn(`Allowlist endpoint returned non-JSON response for ${votingAddress}`);
        return false;
      }

      const data = await response.json();
      console.log("data", data);
      return data.isOnAllowlist || false;
    } catch (error) {
      console.error("Failed to check allowlist status:", error);
      return false;
    }
  };

  const fetchVotings = async () => {
    if (!address) return { votings: { items: [] } };

    const isBase = chain?.id === base.id;
    const VotingsQuery = isBase
      ? gql`
          query BaseVotings {
            votings: baseVotingss {
              items {
                address
                creator
                question
                createdAtBlock
              }
            }
          }
        `
      : gql`
          query MainnetVotings {
            votings: mainnetVotingss {
              items {
                address
                creator
                question
                createdAtBlock
              }
            }
          }
        `;

    const data = await request<NetworkVotingsData>(
      process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069",
      VotingsQuery,
    );

    // Check allowlist status for each voting
    const itemsWithAllowlistStatus = await Promise.all(
      data.votings.items.map(async item => {
        const isOnAllowlist = await checkAllowlistStatus(item.address, address);
        console.log(`Voting ${item.address}: isOnAllowlist=${isOnAllowlist}, creator=${item.creator}`);
        return { ...item, isOnAllowlist };
      }),
    );

    return { votings: { items: itemsWithAllowlistStatus } };
  };

  const { data: votingsData, isError } = useQuery({
    queryKey: ["participated-votings", chain?.id, address],
    queryFn: fetchVotings,
    refetchInterval: 5000,
    enabled: !!address,
  });

  const votings: VotingItem[] = useMemo(() => {
    if (!address || !votingsData) return [];

    const byAddress = new Map<string, VotingItem>();
    const userAddress = getAddress(address);

    // Add items from GraphQL data (Ponder indexer)
    const items = (votingsData as NetworkVotingsData)?.votings?.items ?? [];
    for (const evt of items.filter(Boolean)) {
      const rawVotingAddr = evt.address as `0x${string}` | undefined;
      if (!rawVotingAddr) continue;

      const votingAddr = getAddress(rawVotingAddr) as `0x${string}`;
      const creatorAddr = evt.creator
        ? (getAddress(evt.creator as `0x${string}`) as `0x${string}`)
        : ("0x0000000000000000000000000000000000000000" as `0x${string}`);

      // Only include votings where the user is on the allowlist (including their own votings)
      console.log(
        `Processing voting ${votingAddr}: creator=${creatorAddr}, user=${userAddress}, isOnAllowlist=${evt.isOnAllowlist}`,
      );
      if (evt.isOnAllowlist) {
        console.log(`Adding voting ${votingAddr} to results`);
        const item: VotingItem = {
          voting: votingAddr,
          creator: creatorAddr,
          question: evt.question || "",
          blockNumber: BigInt(evt.createdAtBlock),
          transactionHash: undefined,
          isOnAllowlist: evt.isOnAllowlist,
        };
        byAddress.set(votingAddr, item);
      } else {
        console.log(`Skipping voting ${votingAddr}: isOnAllowlist=${evt.isOnAllowlist}`);
      }
    }

    const result = Array.from(byAddress.values()).sort((a, b) => Number((b.blockNumber || 0n) - (a.blockNumber || 0n)));
    console.log(`Total votings processed: ${items.length}, Final result count: ${result.length}`);
    return result;
  }, [votingsData, address]);

  if (!address) {
    return (
      <div className="w-full">
        <ul className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          <li className="col-span-1 md:col-span-3 bg-base-100 rounded-xl p-6 text-center opacity-70">
            Connect your wallet to see votings you can participate in.
          </li>
        </ul>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full">
        <ul className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          <li className="col-span-1 md:col-span-3 alert alert-error">
            <span>Failed to load votings.</span>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ul className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {votings.length === 0 ? (
          <li className="col-span-1 md:col-span-3 bg-base-100 rounded-xl p-6 text-center opacity-70">
            No votings available for participation yet.
          </li>
        ) : (
          votings.map(v => (
            <li key={v.voting} className="bg-base-100 rounded-xl p-5 border border-base-300 flex flex-col h-full">
              <div className="flex-grow space-y-3">
                <div className="text-lg font-medium break-words line-clamp-2 min-h-[3.5rem]">
                  {v.question || "(no question)"}
                </div>
                <VotingStatus votingAddress={v.voting} />
                <div className="text-sm opacity-70 min-h-[1.75rem] flex items-start">
                  <span className="mr-1">Creator:</span>
                  <Address address={v.creator} size="xs" />
                </div>
                <div className="text-sm opacity-70 min-h-[1.75rem] flex items-start">
                  <span className="mr-1">Voting:</span>
                  <Address address={v.voting} size="xs" />
                </div>
              </div>
              <div className="pt-4">
                <Link href={`/voting/${v.voting}`} className="btn btn-sm btn-primary">
                  View
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ParticipatedVotings;
