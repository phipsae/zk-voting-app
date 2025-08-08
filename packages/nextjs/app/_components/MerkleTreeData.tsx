"use client";

import React from "react";

interface MerkleTreeDataProps {
  treeData?: any;
  root?: bigint | string;
  leafEvents?: any[];
}

export const MerkleTreeData: React.FC<MerkleTreeDataProps> = ({ treeData, root, leafEvents }) => {
  const handleCopyRoot = () => {
    if (!root) return;
    navigator.clipboard.writeText(root.toString());
  };

  return (
    <div className="bg-base-100 shadow rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Merkle tree</h2>
        {root && (
          <button className="btn btn-ghost btn-xs" type="button" onClick={handleCopyRoot}>
            Copy root
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-base-300 p-3 text-center">
          <div className="text-xs opacity-70">Size</div>
          <div className="text-lg font-bold text-primary">{treeData?.[0]?.toString() || "0"}</div>
        </div>
        <div className="rounded-lg border border-base-300 p-3 text-center">
          <div className="text-xs opacity-70">Depth</div>
          <div className="text-lg font-bold text-secondary">{treeData?.[1]?.toString() || "0"}</div>
        </div>
        <div className="rounded-lg border border-base-300 p-3 text-center">
          <div className="text-xs opacity-70">Root</div>
          <div className="text-xs break-all text-accent">
            {root ? `${root.toString().slice(0, 10)}...${root.toString().slice(-8)}` : "N/A"}
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
