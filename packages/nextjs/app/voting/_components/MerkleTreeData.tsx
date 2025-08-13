"use client";

import React from "react";
import { useReadContract } from "wagmi";
import { useSelectedNetwork } from "~~/hooks/scaffold-eth";
import { contracts } from "~~/utils/scaffold-eth/contract";

interface MerkleTreeDataProps {
  contractAddress: `0x${string}`;
  leafEvents?: any[];
}

export const MerkleTreeData: React.FC<MerkleTreeDataProps> = ({ contractAddress, leafEvents }) => {
  const handleCopyRoot = () => {
    const r = (root as bigint | undefined)?.toString();
    if (!r) return;
    navigator.clipboard.writeText(r);
  };

  const selected = useSelectedNetwork();
  const votingAbi = contracts?.[selected.id]?.["Voting"].abi as any;

  const { data: treeData } = useReadContract({
    address: contractAddress,
    abi: votingAbi,
    functionName: "tree",
    args: [],
  });

  const { data: root } = useReadContract({
    address: contractAddress,
    abi: votingAbi,
    functionName: "getRoot",
    args: [],
  });

  const size = ((treeData as readonly [bigint, bigint] | undefined)?.[0] ?? 0n).toString();
  const depth = ((treeData as readonly [bigint, bigint] | undefined)?.[1] ?? 0n).toString();
  const rootStr = (root as bigint | undefined)?.toString();

  return (
    <div className="bg-base-100 shadow rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Merkle tree</h2>
        {Boolean(rootStr) && (
          <button className="btn btn-ghost btn-xs" type="button" onClick={handleCopyRoot}>
            Copy root
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-base-300 p-3 text-center">
          <div className="text-xs opacity-70">Size</div>
          <div className="text-lg font-bold text-primary">{size}</div>
        </div>
        <div className="rounded-lg border border-base-300 p-3 text-center">
          <div className="text-xs opacity-70">Depth</div>
          <div className="text-lg font-bold text-secondary">{depth}</div>
        </div>
        <div className="rounded-lg border border-base-300 p-3 text-center">
          <div className="text-xs opacity-70">Root</div>
          <div className="text-xs break-all text-accent">
            {rootStr ? `${rootStr.slice(0, 10)}...${rootStr.slice(-8)}` : "N/A"}
          </div>
          <button
            className="btn btn-ghost btn-xs mt-1"
            type="button"
            onClick={() => {
              console.log("Leaf Events:", leafEvents);
            }}
          >
            Log events
          </button>
        </div>
      </div>
    </div>
  );
};

export default MerkleTreeData;
