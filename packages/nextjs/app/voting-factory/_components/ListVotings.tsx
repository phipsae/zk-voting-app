"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { Address } from "~~/components/scaffold-eth";

// import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

type VotingItem = {
  voting: `0x${string}`;
  creator: `0x${string}`;
  question: string;
  blockNumber?: bigint;
  transactionHash?: `0x${string}`;
};

const ListVotings = () => {
  // const {
  //   data: events,
  //   isLoading,
  //   error,
  // } = useScaffoldEventHistory({
  //   contractName: "VotingFactory",
  //   eventName: "VotingCreated",
  //   watch: true,
  // });

  type VotingEvent = {
    address: `0x${string}`;
    creator: `0x${string}`;
    question: string;
    createdAtBlock: number;
  };

  type VotingsData = { votingss: { items: VotingEvent[] } };

  const fetchVotings = async () => {
    const VotingsQuery = gql`
      query Votings {
        votingss {
          items {
            address
            creator
            question
            createdAtBlock
          }
        }
      }
    `;
    const data = await request<VotingsData>(
      process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069",
      VotingsQuery,
    );
    return data;
  };

  const {
    data: votingsData,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["votings"],
    queryFn: fetchVotings,
  });

  const votings: VotingItem[] = useMemo(() => {
    if (!votingsData) return [];

    const byAddress = new Map<string, VotingItem>();
    for (const evt of votingsData.votingss.items.filter(Boolean)) {
      const votingAddr = evt.address as `0x${string}` | undefined;
      if (!votingAddr) continue;
      const item: VotingItem = {
        voting: votingAddr,
        creator: (evt.creator as `0x${string}`) || ("0x0000000000000000000000000000000000000000" as `0x${string}`),
        question: evt.question || "",
        blockNumber: BigInt(evt.createdAtBlock),
        transactionHash: undefined,
      };
      byAddress.set(votingAddr, item);
    }

    return Array.from(byAddress.values()).sort((a, b) => Number((b.blockNumber || 0n) - (a.blockNumber || 0n)));
  }, [votingsData]);

  if (isError) {
    return (
      <div className="alert alert-error">
        <span>Failed to load votings.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">All votings</h2>
        {isPending && <span className="loading loading-spinner loading-sm" />}
      </div>

      {votings.length === 0 ? (
        <div className="bg-base-100 rounded-xl p-6 text-center opacity-70">No votings created yet.</div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {votings.map(v => (
            <li key={v.voting} className="bg-base-100 rounded-xl p-5 border border-base-300">
              <div className="space-y-3">
                <div className="text-lg font-medium break-words">{v.question || "(no question)"}</div>
                <div className="text-sm opacity-70">
                  <span className="mr-1">Creator:</span>
                  <Address address={v.creator} size="xs" />
                </div>
                <div className="text-sm opacity-70">
                  <span className="mr-1">Voting:</span>
                  <Address address={v.voting} size="xs" />
                </div>
                <div className="pt-2">
                  <Link href={`/voting/${v.voting}`} className="btn btn-sm btn-primary">
                    View contract
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ListVotings;
