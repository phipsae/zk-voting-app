"use client";

import React from "react";

interface LeafEvent {
  args: {
    index?: bigint;
    value?: bigint;
    [key: string]: any;
  };
  blockNumber?: bigint;
  transactionHash?: string;
  logIndex?: number;
}

interface MerkleTreeVisualizationProps {
  leafEvents: LeafEvent[];
  depth: bigint | undefined;
}

const MerkleTreeVisualization: React.FC<MerkleTreeVisualizationProps> = ({ leafEvents }) => {
  const treeDepth = 3; // Fixed depth of 3
  const maxLeaves = 8; // 2^3 = 8

  // Create array of 8 leaves, filling empty slots with "0"
  const leaves = Array(maxLeaves)
    .fill(null)
    .map((_, index) => {
      const event = leafEvents.find(e => Number(e.args.index || 0) === index);
      return event
        ? {
            value: event.args.value?.toString() || "0",
            index: index,
            filled: true,
          }
        : {
            value: "0",
            index: index,
            filled: false,
          };
    });

  return (
    <div className="mt-8 p-6 bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-lg border">
      <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Merkle Tree</h2>
      <div className="text-center mb-8">
        <p className="text-sm text-gray-600">
          Depth: {treeDepth} | Leaves: {leafEvents.length}/{maxLeaves}
        </p>
      </div>

      <div className="flex flex-col items-center space-y-8">
        {/* Root Level */}
        <div className="flex justify-center">
          <div className="w-24 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg flex flex-col items-center justify-center border-2 border-purple-400">
            <div className="text-xs font-bold">ROOT</div>
            <div className="text-[10px] opacity-80">Hash</div>
          </div>
        </div>

        {/* Root to Level 1 Connection */}
        <div className="relative -my-4">
          <svg width="200" height="40" className="mx-auto">
            <line x1="100" y1="5" x2="60" y2="35" stroke="#6366f1" strokeWidth="3" />
            <line x1="100" y1="5" x2="140" y2="35" stroke="#6366f1" strokeWidth="3" />
          </svg>
        </div>

        {/* Level 1 */}
        <div className="flex justify-center space-x-16">
          <div className="w-20 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md flex flex-col items-center justify-center border border-blue-400">
            <div className="text-xs font-bold">L1-0</div>
            <div className="text-[10px] opacity-80">Hash</div>
          </div>
          <div className="w-20 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md flex flex-col items-center justify-center border border-blue-400">
            <div className="text-xs font-bold">L1-1</div>
            <div className="text-[10px] opacity-80">Hash</div>
          </div>
        </div>

        {/* Level 1 to Level 2 Connections */}
        <div className="relative -my-4">
          <svg width="400" height="40" className="mx-auto">
            {/* Left L1 node to its two L2 children */}
            <line x1="120" y1="5" x2="80" y2="35" stroke="#3b82f6" strokeWidth="2" />
            <line x1="120" y1="5" x2="160" y2="35" stroke="#3b82f6" strokeWidth="2" />

            {/* Right L1 node to its two L2 children */}
            <line x1="280" y1="5" x2="240" y2="35" stroke="#3b82f6" strokeWidth="2" />
            <line x1="280" y1="5" x2="320" y2="35" stroke="#3b82f6" strokeWidth="2" />
          </svg>
        </div>

        {/* Level 2 */}
        <div className="flex justify-center space-x-8">
          <div className="w-18 h-12 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg shadow-md flex flex-col items-center justify-center border border-teal-400">
            <div className="text-xs font-bold">L2-0</div>
            <div className="text-[10px] opacity-80">Hash</div>
          </div>
          <div className="w-18 h-12 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg shadow-md flex flex-col items-center justify-center border border-teal-400">
            <div className="text-xs font-bold">L2-1</div>
            <div className="text-[10px] opacity-80">Hash</div>
          </div>
          <div className="w-18 h-12 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg shadow-md flex flex-col items-center justify-center border border-teal-400">
            <div className="text-xs font-bold">L2-2</div>
            <div className="text-[10px] opacity-80">Hash</div>
          </div>
          <div className="w-18 h-12 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg shadow-md flex flex-col items-center justify-center border border-teal-400">
            <div className="text-xs font-bold">L2-3</div>
            <div className="text-[10px] opacity-80">Hash</div>
          </div>
        </div>

        {/* Level 2 to Leaves Connections */}
        <div className="relative -my-4">
          <svg width="600" height="40" className="mx-auto">
            {/* L2-0 to L0, L1 */}
            <line x1="150" y1="5" x2="110" y2="35" stroke="#14b8a6" strokeWidth="2" />
            <line x1="150" y1="5" x2="150" y2="35" stroke="#14b8a6" strokeWidth="2" />

            {/* L2-1 to L2, L3 */}
            <line x1="230" y1="5" x2="190" y2="35" stroke="#14b8a6" strokeWidth="2" />
            <line x1="230" y1="5" x2="230" y2="35" stroke="#14b8a6" strokeWidth="2" />

            {/* L2-2 to L4, L5 */}
            <line x1="370" y1="5" x2="370" y2="35" stroke="#14b8a6" strokeWidth="2" />
            <line x1="370" y1="5" x2="410" y2="35" stroke="#14b8a6" strokeWidth="2" />

            {/* L2-3 to L6, L7 */}
            <line x1="450" y1="5" x2="450" y2="35" stroke="#14b8a6" strokeWidth="2" />
            <line x1="450" y1="5" x2="490" y2="35" stroke="#14b8a6" strokeWidth="2" />
          </svg>
        </div>

        {/* Leaves Level */}
        <div className="flex justify-center space-x-4">
          {leaves.map((leaf, index) => (
            <div
              key={index}
              className={`w-16 h-12 rounded-lg shadow-md flex flex-col items-center justify-center text-xs border-2 transition-all duration-300 ${
                leaf.filled
                  ? "bg-gradient-to-br from-green-400 to-green-500 text-white border-green-300 transform scale-105"
                  : "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 border-gray-400"
              }`}
              title={leaf.filled ? `Leaf ${index}: ${leaf.value}` : `Empty leaf ${index}`}
            >
              <div className="font-bold text-[10px]">L{index}</div>
              <div className="text-[10px] truncate w-full text-center px-1">
                {leaf.filled && leaf.value !== "0"
                  ? leaf.value.length > 6
                    ? leaf.value.slice(0, 4) + "..."
                    : leaf.value
                  : "0"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-500 border border-green-300 rounded"></div>
          <span>Filled Leaf</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-br from-gray-200 to-gray-300 border border-gray-400 rounded"></div>
          <span>Empty Leaf (0)</span>
        </div>
      </div>
    </div>
  );
};

export default MerkleTreeVisualization;
