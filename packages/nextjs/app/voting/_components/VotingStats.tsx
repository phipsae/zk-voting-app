import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const VotingStats = ({ contractAddress }: { contractAddress?: `0x${string}` }) => {
  const { data: question } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "question",
    address: contractAddress,
  });

  const { data: yesVotes } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "yesVotes",
    address: contractAddress,
  });

  const { data: noVotes } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "noVotes",
    address: contractAddress,
  });

  const { data: owner } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "owner",
    address: contractAddress,
  });

  const q = (question as string | undefined) || undefined;
  const yes = (yesVotes as bigint | undefined) ?? 0n;
  const no = (noVotes as bigint | undefined) ?? 0n;
  const totalVotes = yes + no;
  const yesPercentage = totalVotes > 0n ? Number((yes * 100n) / totalVotes) : 0;
  const noPercentage = totalVotes > 0n ? Number((no * 100n) / totalVotes) : 0;

  return (
    <div className="bg-base-100 shadow rounded-xl p-4 space-y-3">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{q || "Loading..."}</h2>
        <div className="flex justify-center gap-10">
          <div>
            Voting contract: <Address address={contractAddress} />
          </div>
          <div>
            Owner: <Address address={owner as `0x${string}`} />
          </div>
        </div>
        <span className="text-xs opacity-70">Total Votes: {totalVotes.toString()}</span>
      </div>
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
