"use client";

// import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { VoteChoice } from "../_components/VoteChoice";
// import { usePublicClient } from "wagmi";
import { CreateCommitment } from "~~/app/voting/_components/CreateCommitment";
import { GenerateProof } from "~~/app/voting/_components/GenerateProof";
import { LeafEventsList } from "~~/app/voting/_components/LeafEventsList";
import MerkleTreeData from "~~/app/voting/_components/MerkleTreeData";
import { VoteWithBurnerHardhat } from "~~/app/voting/_components/VoteWithBurnerHardhat";
import { VoteWithBurnerPaymaster } from "~~/app/voting/_components/VoteWithBurnerPaymaster";
import { VotingStats } from "~~/app/voting/_components/VotingStats";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

// import { contracts } from "~~/utils/scaffold-eth/contract";

// type LeafEvent = {
//   index: string;
//   value: string;
// };

export default function VotingByAddressPage() {
  const params = useParams<{ address: `0x${string}` }>();
  const address = params?.address as `0x${string}` | undefined;
  // const selected = useSelectedNetwork();
  // const publicClient = usePublicClient({ chainId: selected.id });

  // const votingAbi = contracts?.[selected.id]?.["Voting"].abi as any;

  // No indexer: load historical logs once, then live-watch new events to append
  // const [leavesAsEvents, setLeavesAsEvents] = useState<any[]>([]);

  const leavesEvents = useScaffoldEventHistory({
    contractName: "Voting",
    eventName: "NewLeaf",
    address: address,
    fromBlock: 0n,
    watch: true,
    enabled: true,
  });

  // const mergeAndDedupeEvents = (previous: any[], next: any[]) => {
  //   const seen = new Set<string>();
  //   const merged = [...previous, ...next];
  //   const deduped = merged.filter(e => {
  //     const key =
  //       e?.transactionHash && e?.logIndex !== undefined
  //         ? `${e.transactionHash}-${e.logIndex}`
  //         : `logIndex-${e?.logIndex}`;
  //     if (seen.has(key)) return false;
  //     seen.add(key);
  //     return true;
  //   });
  //   // Sort by args.index descending (most recent/highest index first)
  //   deduped.sort((a, b) => {
  //     const ai = a?.args?.index as bigint | undefined;
  //     const bi = b?.args?.index as bigint | undefined;
  //     if (ai === undefined || bi === undefined) return 0;
  //     if (ai === bi) return 0;
  //     return ai < bi ? 1 : -1;
  //   });
  //   return deduped;
  // };

  // useEffect(() => {
  //   const loadInitial = async () => {
  //     if (!publicClient || !address) return;
  //     const event = (votingAbi as any).find((x: any) => x.type === "event" && x.name === "NewLeaf");
  //     const logs = await publicClient.getLogs({ address, event, fromBlock: 0n });
  //     const mapped = logs.map(l => ({
  //       args: { index: BigInt((l as any).args.index), value: BigInt((l as any).args.value) },
  //       logIndex: Number((l as any).logIndex ?? 0),
  //       transactionHash: (l as any).transactionHash,
  //     }));
  //     setLeavesAsEvents(prev => mergeAndDedupeEvents(prev, mapped));
  //   };
  //   void loadInitial();
  // }, [publicClient, address, votingAbi]);

  // useWatchContractEvent({
  //   address: address,
  //   abi: votingAbi,
  //   eventName: "NewLeaf",
  //   onLogs: logs => {
  //     const mapped = logs.map(l => ({
  //       args: { index: BigInt((l as any).args.index), value: BigInt((l as any).args.value) },
  //       logIndex: Number((l as any).logIndex ?? 0),
  //       transactionHash: (l as any).transactionHash,
  //     }));
  //     setLeavesAsEvents(prev => mergeAndDedupeEvents(prev, mapped));
  //   },
  // });

  //   //    TODO: exchange with graphql for indexer
  //   const { data: leavesData } = useQuery({
  //     queryKey: ["leaves", address],
  //     queryFn: async () => {
  //       if (!publicClient) return [] as LeafEvent[];
  //       const logs = await publicClient.getLogs({
  //         address,
  //         event: (votingAbi as any).find((x: any) => x.type === "event" && x.name === "NewLeaf"),
  //         fromBlock: 0n,
  //       });
  //       return logs.map(l => ({ index: String((l as any).args.index), value: String((l as any).args.value) }));
  //     },
  //     refetchInterval: 2000,
  //   });

  //   const leavesAsEvents: any[] = useMemo(
  //     () =>
  //       (leavesData || []).map((item: any, idx: number) => ({
  //         args: { index: BigInt(item.index), value: BigInt(item.value) },
  //         logIndex: idx,
  //       })),
  //     [leavesData],
  //   );

  if (!address) return notFound();

  return (
    <div className="flex items-start flex-col grow pt-6 w-full">
      <button onClick={() => console.log(leavesEvents)}>Log leavesEvents</button>
      <div className="px-4 sm:px-5 w-full max-w-7xl mx-auto">
        <h1 className="text-center">
          <span className="block text-3xl font-bold tracking-tight">Voting</span>
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
          <div className="lg:col-span-5 space-y-4">
            <VotingStats contractAddress={address} />
            <MerkleTreeData contractAddress={address} leafEvents={leavesEvents.data || []} />
            <LeafEventsList leafEvents={leavesEvents.data || []} />
          </div>
          <div className="lg:col-span-7 space-y-4">
            <CreateCommitment leafEvents={leavesEvents.data || []} contractAddress={address} />
            <VoteChoice />
            <GenerateProof leafEvents={leavesEvents.data || []} contractAddress={address} />
            <VoteWithBurnerPaymaster contractAddress={address} />
            <VoteWithBurnerHardhat contractAddress={address} />
          </div>
        </div>
      </div>
    </div>
  );
}
