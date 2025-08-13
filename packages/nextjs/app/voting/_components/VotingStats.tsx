import { useReadContract } from "wagmi";
import { useSelectedNetwork } from "~~/hooks/scaffold-eth";
import { contracts } from "~~/utils/scaffold-eth/contract";

export const VotingStats = ({ contractAddress }: { contractAddress?: `0x${string}` }) => {
  const selected = useSelectedNetwork();
  const votingAbi = contracts?.[selected.id]?.["Voting"]?.abi as any;

  const { data: question } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: votingAbi,
    functionName: "question",
    args: [],
  });

  const { data: yesVotes } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: votingAbi,
    functionName: "yesVotes",
    args: [],
  });

  const { data: noVotes } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: votingAbi,
    functionName: "noVotes",
    args: [],
  });

  const q = (question as string | undefined) || undefined;
  const yes = (yesVotes as bigint | undefined) ?? 0n;
  const no = (noVotes as bigint | undefined) ?? 0n;
  const totalVotes = yes + no;
  const yesPercentage = totalVotes > 0n ? Number((yes * 100n) / totalVotes) : 0;
  const noPercentage = totalVotes > 0n ? Number((no * 100n) / totalVotes) : 0;

  return (
    <div className="bg-base-100 shadow rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Proposal</h2>
        <span className="text-xs opacity-70">Total: {totalVotes.toString()}</span>
      </div>
      <div className="text-sm text-center italic truncate">&quot;{q || "Loading..."}&quot;</div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-base-300 p-3">
          <div className="text-xs opacity-70">Yes</div>
          <div className="text-xl font-bold text-success">{yes.toString()}</div>
          <div className="text-xs opacity-70">{yesPercentage.toFixed(1)}%</div>
        </div>
        <div className="rounded-lg border border-base-300 p-3">
          <div className="text-xs opacity-70">No</div>
          <div className="text-xl font-bold text-error">{no.toString()}</div>
          <div className="text-xs opacity-70">{noPercentage.toFixed(1)}%</div>
        </div>
      </div>
      <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
        <div className="bg-success h-2" style={{ width: `${yesPercentage}%` }} />
      </div>
    </div>
  );
};
