"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

type VotingItem = {
  voting: `0x${string}`;
  creator: `0x${string}`;
  question: string;
  blockNumber?: bigint;
  transactionHash?: `0x${string}`;
};

const ListVotings = () => {
  const {
    data: events,
    isLoading,
    error,
  } = useScaffoldEventHistory({
    contractName: "VotingFactory",
    eventName: "VotingCreated",
    watch: true,
  });

  const votings: VotingItem[] = useMemo(() => {
    if (!events) return [];

    const byAddress = new Map<string, VotingItem>();
    for (const evt of events.filter(Boolean) as any[]) {
      const args = (evt as any)?.args as any;
      if (!args) continue;
      const votingAddr = args.voting as `0x${string}` | undefined;
      const creatorAddr = args.creator as `0x${string}` | undefined;
      const question = args.question as string | undefined;
      if (!votingAddr) continue;
      const item: VotingItem = {
        voting: votingAddr,
        creator: creatorAddr || ("0x0000000000000000000000000000000000000000" as `0x${string}`),
        question: question || "",
        blockNumber: (evt as any).blockNumber,
        transactionHash: (evt as any).transactionHash,
      };
      const prev = byAddress.get(votingAddr);
      if (!prev || (item.blockNumber || 0n) > (prev.blockNumber || 0n)) {
        byAddress.set(votingAddr, item);
      }
    }

    return Array.from(byAddress.values()).sort((a, b) => Number((b.blockNumber || 0n) - (a.blockNumber || 0n)));
  }, [events]);

  if (error) {
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
        {isLoading && <span className="loading loading-spinner loading-sm" />}
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
