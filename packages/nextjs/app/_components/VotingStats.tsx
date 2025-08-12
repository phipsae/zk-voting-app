import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const VotingStats = () => {
  const { data: statement } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "question",
  });

  const { data: yesVotes } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "yesVotes",
  });

  const { data: noVotes } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "noVotes",
  });

  const totalVotes = (yesVotes || 0n) + (noVotes || 0n);
  const yesPercentage = totalVotes > 0n ? Number(((yesVotes || 0n) * 100n) / totalVotes) : 0;
  const noPercentage = totalVotes > 0n ? Number(((noVotes || 0n) * 100n) / totalVotes) : 0;

  return (
    <div className="bg-base-100 shadow rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Proposal</h2>
        <span className="text-xs opacity-70">Total: {totalVotes.toString()}</span>
      </div>
      <div className="text-sm text-center italic truncate">&quot;{statement || "Loading..."}&quot;</div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-base-300 p-3">
          <div className="text-xs opacity-70">Yes</div>
          <div className="text-xl font-bold text-success">{yesVotes?.toString() || "0"}</div>
          <div className="text-xs opacity-70">{yesPercentage.toFixed(1)}%</div>
        </div>
        <div className="rounded-lg border border-base-300 p-3">
          <div className="text-xs opacity-70">No</div>
          <div className="text-xl font-bold text-error">{noVotes?.toString() || "0"}</div>
          <div className="text-xs opacity-70">{noPercentage.toFixed(1)}%</div>
        </div>
      </div>
      <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
        <div className="bg-success h-2" style={{ width: `${yesPercentage}%` }} />
      </div>
    </div>
  );
};
