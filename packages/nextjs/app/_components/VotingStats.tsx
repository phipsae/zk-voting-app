import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const VotingStats = () => {
  const { data: statement } = useScaffoldReadContract({
    contractName: "IncrementalMerkleTree",
    functionName: "statement",
  });

  const { data: yesVotes } = useScaffoldReadContract({
    contractName: "IncrementalMerkleTree",
    functionName: "yesVotes",
  });

  const { data: noVotes } = useScaffoldReadContract({
    contractName: "IncrementalMerkleTree",
    functionName: "noVotes",
  });

  const totalVotes = (yesVotes || 0n) + (noVotes || 0n);
  const yesPercentage = totalVotes > 0n ? Number(((yesVotes || 0n) * 100n) / totalVotes) : 0;
  const noPercentage = totalVotes > 0n ? Number(((noVotes || 0n) * 100n) / totalVotes) : 0;

  return (
    <div className="flex flex-col items-center gap-4 bg-base-100 shadow-lg rounded-2xl p-6 mt-4">
      <h2 className="text-2xl font-bold">Voting Statistics</h2>
      <div className="text-xl text-center italic">&quot;{statement || "Loading..."}&quot;</div>
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-title">Total Votes</div>
          <div className="stat-value">{totalVotes.toString()}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Yes Votes</div>
          <div className="stat-value text-success">{yesVotes?.toString() || "0"}</div>
          <div className="stat-desc">{yesPercentage.toFixed(1)}% of total votes</div>
        </div>
        <div className="stat">
          <div className="stat-title">No Votes</div>
          <div className="stat-value text-error">{noVotes?.toString() || "0"}</div>
          <div className="stat-desc">{noPercentage.toFixed(1)}% of total votes</div>
        </div>
      </div>
      <div className="w-full bg-base-200 rounded-full h-4">
        <div className="bg-success h-4 rounded-full" style={{ width: `${yesPercentage}%` }} />
      </div>
    </div>
  );
};
