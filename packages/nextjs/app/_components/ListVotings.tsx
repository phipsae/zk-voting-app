"use client";

import { useMemo } from "react";
import Link from "next/link";
import VotingStatus from "./VotingStatus";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { getAddress } from "viem";
import { base } from "viem/chains";
import { Address } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

type VotingItem = {
  voting: `0x${string}`;
  creator: `0x${string}`;
  question: string;
  blockNumber?: bigint;
  transactionHash?: `0x${string}`;
};

const ListVotings = () => {
  type VotingEvent = {
    address: `0x${string}`;
    creator: `0x${string}`;
    question: string;
    createdAtBlock: number;
  };

  const { targetNetwork } = useTargetNetwork();

  type NetworkVotingsData = {
    votings: { items: VotingEvent[] };
  };

  const fetchVotings = async () => {
    const isBase = targetNetwork.id === base.id;
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
    return data;
  };

  const { data: votingsData, isError } = useQuery({
    queryKey: ["votings", targetNetwork.id],
    queryFn: fetchVotings,
    refetchInterval: 5000, // Refetch every 5 seconds as fallback
  });

  const votings: VotingItem[] = useMemo(() => {
    const byAddress = new Map<string, VotingItem>();

    // Add items from GraphQL data (Ponder indexer)
    if (votingsData) {
      const items = (votingsData as NetworkVotingsData)?.votings?.items ?? [];
      for (const evt of items.filter(Boolean)) {
        const rawVotingAddr = evt.address as `0x${string}` | undefined;
        if (!rawVotingAddr) continue;
        const votingAddr = getAddress(rawVotingAddr) as `0x${string}`;
        const creatorAddr = evt.creator
          ? (getAddress(evt.creator as `0x${string}`) as `0x${string}`)
          : ("0x0000000000000000000000000000000000000000" as `0x${string}`);

        const item: VotingItem = {
          voting: votingAddr,
          creator: creatorAddr,
          question: evt.question || "",
          blockNumber: BigInt(evt.createdAtBlock),
          transactionHash: undefined,
        };
        byAddress.set(votingAddr, item);
      }
    }

    return Array.from(byAddress.values()).sort((a, b) => Number((b.blockNumber || 0n) - (a.blockNumber || 0n)));
  }, [votingsData]);

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
            No votings created yet.
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

export default ListVotings;
