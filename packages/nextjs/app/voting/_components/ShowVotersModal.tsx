"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { base } from "viem/chains";
import { useAccount } from "wagmi";
import { EyeIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type ShowVotersModalProps = {
  contractAddress: `0x${string}`;
};

type VoterRow = { votingAddress: string; voter: string };
type NetworkVotersData = { voters: { items: VoterRow[] } };

async function fetchVoters(votingAddress: string, isBase: boolean) {
  const endpoint = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
  const VotersQuery = isBase
    ? gql`
        query BaseVoters {
          voters: baseVoterss {
            items {
              voter
              votingAddress
            }
          }
        }
      `
    : gql`
        query MainnetVoters {
          voters: mainnetVoterss {
            items {
              voter
              votingAddress
            }
          }
        }
      `;
  const data = await request<NetworkVotersData>(endpoint, VotersQuery);
  const items = data?.voters?.items ?? [];
  return items.filter(row => row.votingAddress?.toLowerCase() === votingAddress.toLowerCase());
}

export const ShowVotersModal = ({ contractAddress }: ShowVotersModalProps) => {
  const { chain } = useAccount();
  const isBase = chain?.id === base.id;
  // Fetch all voters using GraphQL query
  const {
    data: voterData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["voters", contractAddress, chain?.id],
    queryFn: () => fetchVoters(contractAddress, Boolean(isBase)),
    enabled: Boolean(contractAddress && contractAddress.length === 42),
    // light polling so UI picks up new voters soon after indexer writes them
    refetchInterval: 2000,
  });

  // Get unique voter addresses from the data
  const uniqueVoters = useMemo(() => {
    if (!voterData) return [];

    // Get unique addresses from the voter data
    const addresses = Array.from(new Set(voterData.map(row => row.voter)));
    return addresses;
  }, [voterData]);

  // Component to check individual voter status
  const VoterStatus = ({ userAddress }: { userAddress: string }) => {
    const { data: votingData } = useScaffoldReadContract({
      contractName: "Voting",
      functionName: "getVotingData",
      args: [userAddress],
      address: contractAddress,
    });

    const votingDataArray = votingData as unknown as any[];
    const isVoter = votingDataArray?.[3] as boolean;
    const hasRegistered = votingDataArray?.[4] as boolean;

    return (
      <div className="flex items-center justify-between p-3 border border-base-300 rounded-lg">
        <div className="flex-1">
          <Address address={userAddress as `0x${string}`} />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xs opacity-70">Status:</span>
            <span className={`badge badge-sm ${isVoter ? "badge-success" : "badge-error"}`}>
              {isVoter ? "Allowed" : "Revoked"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs opacity-70">Registered:</span>
            <span className={`badge badge-sm ${hasRegistered ? "badge-info" : "badge-ghost"}`}>
              {hasRegistered ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <label htmlFor="show-voters-modal" className="btn btn-outline btn-sm font-normal gap-1">
        <UsersIcon className="h-4 w-4" />
        <span>View Voters ({uniqueVoters.length})</span>
      </label>
      <input type="checkbox" id="show-voters-modal" className="modal-toggle" />
      <label htmlFor="show-voters-modal" className="modal cursor-pointer">
        <label className="modal-box relative max-w-3xl">
          {/* dummy input to capture event onclick on modal box */}
          <input className="h-0 w-0 absolute top-0 left-0" />
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <EyeIcon className="h-5 w-5" />
            All Voters
          </h3>
          <label htmlFor="show-voters-modal" className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
            ✕
          </label>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm opacity-70">
                List of all addresses that have been added as voters for this proposal.
              </p>
              <div className="stats stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Voters</div>
                  <div className="stat-value text-lg">{uniqueVoters.length}</div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-md"></span>
                <span className="ml-2">Loading voters...</span>
              </div>
            ) : error ? (
              <div className="alert alert-error">
                <span>Error loading voters: {error.message}</span>
              </div>
            ) : uniqueVoters.length === 0 ? (
              <div className="text-center py-8 opacity-70">
                <UsersIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No voters have been added yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="text-sm font-medium opacity-80 pb-2 border-b border-base-300">
                  Voter Addresses & Status
                </div>
                {uniqueVoters.map((voterAddress, index) => (
                  <VoterStatus key={`${voterAddress}-${index}`} userAddress={voterAddress} />
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-base-300">
              <div className="text-xs opacity-70">
                • <span className="text-success">Allowed</span>: Can vote in this proposal
                <br />• <span className="text-error">Revoked</span>: Cannot vote (permissions removed)
                <br />• <span className="text-info">Registered</span>: Has submitted their commitment
              </div>
              <label htmlFor="show-voters-modal" className="btn btn-primary btn-sm">
                Close
              </label>
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};
