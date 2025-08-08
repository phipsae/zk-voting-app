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
    <div className="card bg-base-200 shadow-xl p-6 mb-6">
      <h2 className="card-title text-xl mb-4">Merkle Tree Data</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 rounded-box p-4">
          <div className="stat-title">Size</div>
          <div className="stat-value text-primary">{treeData?.[0]?.toString() || "0"}</div>
        </div>
        <div className="stat bg-base-100 rounded-box p-4">
          <div className="stat-title">Depth</div>
          <div className="stat-value text-secondary">{treeData?.[1]?.toString() || "0"}</div>
        </div>
        <div className="stat bg-base-100 rounded-box p-4">
          <div className="stat-title">Root</div>
          <div className="stat-value text-accent break-all text-sm">
            {root ? `${root.toString().slice(0, 10)}...${root.toString().slice(-8)}` : "Not available"}
          </div>
          <button
            className="btn btn-secondary mt-2"
            type="button"
            onClick={() => {
              console.log("Leaf Events:", leafEvents);
            }}
          >
            Console Log Events
          </button>
          {root && (
            <div className="stat-desc mt-1 cursor-pointer hover:text-accent" onClick={handleCopyRoot}>
              Click to copy full root
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerkleTreeData;
