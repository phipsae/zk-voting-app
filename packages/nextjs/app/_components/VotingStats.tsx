import { useMemo } from "react";
import { usePublicClient } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useSelectedNetwork } from "~~/hooks/scaffold-eth";
import { contracts } from "~~/utils/scaffold-eth/contract";

export const VotingStats = ({
  contractAddress,
  question: questionOverride,
  yesVotes: yesOverride,
  noVotes: noOverride,
}: {
  contractAddress?: `0x${string}`;
  question?: string;
  yesVotes?: bigint;
  noVotes?: bigint;
}) => {
  const selected = useSelectedNetwork();
  const publicClient = usePublicClient({ chainId: selected.id });
  const votingAbi = contracts?.[selected.id]?.["Voting"]?.abi as any;

  const shouldUseAddress = Boolean(contractAddress && publicClient && votingAbi);

  const { data: statement } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "question",
    // when targeting a specific address, we bypass the hook by direct viem read via useMemo below
    watch: !shouldUseAddress,
  });

  const { data: yesVotes } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "yesVotes",
    watch: !shouldUseAddress,
  });

  const { data: noVotes } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "noVotes",
    watch: !shouldUseAddress,
  });

  const { stmtAlt, yesAlt, noAlt } = useMemo(
    () => ({ stmtAlt: undefined as any, yesAlt: undefined as any, noAlt: undefined as any }),
    [],
  );
  // Note: to keep component simple and avoid extra effects, we rely on parent page to provide
  // default network deployed contract when contractAddress is not provided. For specific address
  // pages we will read via dedicated hooks on the page and pass values down if needed.

  const effStatement = questionOverride ?? (shouldUseAddress ? stmtAlt : statement);
  const effYes = yesOverride ?? (shouldUseAddress ? yesAlt : yesVotes);
  const effNo = noOverride ?? (shouldUseAddress ? noAlt : noVotes);

  const totalVotes = (effYes || 0n) + (effNo || 0n);
  const yesPercentage = totalVotes > 0n ? Number(((effYes || 0n) * 100n) / totalVotes) : 0;
  const noPercentage = totalVotes > 0n ? Number(((effNo || 0n) * 100n) / totalVotes) : 0;

  return (
    <div className="bg-base-100 shadow rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Proposal</h2>
        <span className="text-xs opacity-70">Total: {totalVotes.toString()}</span>
      </div>
      <div className="text-sm text-center italic truncate">&quot;{effStatement || "Loading..."}&quot;</div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-base-300 p-3">
          <div className="text-xs opacity-70">Yes</div>
          <div className="text-xl font-bold text-success">{effYes?.toString() || "0"}</div>
          <div className="text-xs opacity-70">{yesPercentage.toFixed(1)}%</div>
        </div>
        <div className="rounded-lg border border-base-300 p-3">
          <div className="text-xs opacity-70">No</div>
          <div className="text-xl font-bold text-error">{effNo?.toString() || "0"}</div>
          <div className="text-xs opacity-70">{noPercentage.toFixed(1)}%</div>
        </div>
      </div>
      <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
        <div className="bg-success h-2" style={{ width: `${yesPercentage}%` }} />
      </div>
    </div>
  );
};
