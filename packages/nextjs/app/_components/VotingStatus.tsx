"use client";

import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type VotingStatusProps = {
  votingAddress: `0x${string}`;
};

const VotingStatus = ({ votingAddress }: VotingStatusProps) => {
  const { data: registrationDeadline } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "i_registrationDeadline",
    address: votingAddress,
  });

  if (!registrationDeadline) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const deadline = Number(registrationDeadline);
  const isOpen = now < deadline;
  const timeLeft = deadline - now;

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return "Closed";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`badge ${isOpen ? "badge-success" : "badge-error"} badge-sm`}>
        {isOpen ? "Registration Open" : "Registration Closed"}
      </div>
      {isOpen && <span className="text-xs opacity-60">{formatTimeLeft(timeLeft)}</span>}
    </div>
  );
};

export default VotingStatus;
