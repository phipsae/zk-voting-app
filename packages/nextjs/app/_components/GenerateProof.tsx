"use client";

import { useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
// @ts-ignore
import { Noir } from "@noir-lang/noir_js";
import { LeanIMT } from "@zk-kit/lean-imt";
import { ethers } from "ethers";
import { poseidon1, poseidon2 } from "poseidon-lite";
import { useScaffoldEventHistory, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const GenerateProof = () => {
  const [circuitData, setCircuitData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [proof, setProof] = useState<any>(null);
  const [publicInputs, setPublicInputs] = useState<any>(null);
  // const [statementText, setStatementText] = useState("I have proven knowledge of my secret commitment!");

  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract({
    contractName: "IncrementalMerkleTree",
  });

  const { data: treeData } = useScaffoldReadContract({
    contractName: "IncrementalMerkleTree",
    functionName: "tree",
  });

  const { data: root } = useScaffoldReadContract({
    contractName: "IncrementalMerkleTree",
    functionName: "getRoot",
  });

  const { data: leafEvents } = useScaffoldEventHistory({
    contractName: "IncrementalMerkleTree",
    eventName: "NewLeaf",
    fromBlock: 0n,
    watch: true,
    enabled: true,
  });

  const getCircuitData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/circuit");
      if (!response.ok) {
        throw new Error("Failed to fetch circuit data");
      }
      const data = await response.json();
      setCircuitData(data);
      console.log("Circuit data:", data);
    } catch (error) {
      console.error("Error fetching circuit data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      Tree data: Size: {treeData?.[0]} Depth: {treeData?.[1]} Root: {root}
      <button type="button" className="btn btn-primary" onClick={getCircuitData} disabled={isLoading}>
        {isLoading ? "Loading..." : "Get circuit abi"}
      </button>
      {leafEvents && leafEvents.length > 0 && (
        <div className="mt-4 p-4 bg-base-200 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Leaf Events:</h3>
          {leafEvents.map((event, idx) => {
            // Compose a unique key using logIndex and transactionHash if available, else fallback to idx
            const uniqueKey =
              event.logIndex !== undefined && event.transactionHash
                ? `${event.transactionHash}-${event.logIndex}`
                : event.logIndex !== undefined
                  ? `logIndex-${event.logIndex}`
                  : `idx-${idx}`;
            return (
              <div key={uniqueKey} className="mb-2 p-2 bg-base-100 rounded">
                {event.args &&
                  Object.entries(event.args).map(([key, value]) => (
                    <p key={`${uniqueKey}-${key}`}>
                      <strong>{key}:</strong> {String(value)}
                    </p>
                  ))}
              </div>
            );
          })}
        </div>
      )}
      <button
        type="button"
        className="btn btn-primary"
        onClick={async () => {
          const generatedProof = await generateProof(
            root as bigint,
            true as boolean,
            Number(treeData?.[1] || 0),
            "0x0be399217d884d56853b17fa27dcee7e26de7efc72f786fbbc56557bf0ef4028", // private input
            "0x0b2f4df4b37f3b3fc7ef099117a40208bc331f9be1fe99c8af173355212b3225", // private input
            2, // private input - index where proof should be done
            leafEvents as any, // all the leaves to create tree
            circuitData,
          );
          setProof(generatedProof.proof);
          setPublicInputs(generatedProof.publicInputs);
        }}
      >
        Generate proof
      </button>
      <button
        className="btn btn-accent mt-4"
        type="button"
        onClick={() => {
          console.log("Generated Proof:", proof);
          console.log("Public Inputs:", publicInputs[2].toString());
        }}
      >
        Console Log Proof
      </button>
      <button
        className="btn btn-primary"
        disabled={!proof || !publicInputs}
        onClick={async () => {
          try {
            if (!proof || !publicInputs) {
              console.error("Please generate proof first");
              return;
            }

            await writeYourContractAsync({
              functionName: "setStatement",
              args: [
                uint8ArrayToHexString(proof as Uint8Array),
                publicInputs[0], // _root
                publicInputs[1], // _nullifierHash
                publicInputs[2], // _vote
                publicInputs[3], // _depth
              ],
            });
          } catch (e) {
            console.error("Error setting statement:", e);
          }
        }}
      >
        Set Statement
      </button>
    </div>
  );
};

const generateProof = async (
  _root: bigint,
  _vote: boolean,
  _depth: number,
  _nullifier: string,
  _secret: string,
  _index: number,
  _leaves: any[],
  _circuitData: any,
) => {
  // Initialize Barretenberg
  // const bb = await Barretenberg.new();

  const nullifierHash = poseidon1([BigInt(_nullifier)]);

  const calculatedTree = new LeanIMT((a: bigint, b: bigint) => poseidon2([a, b]));
  const leaves = _leaves.map(event => {
    return event?.args.value;
  });

  const leavesReversed = leaves.reverse();

  calculatedTree.insertMany(leavesReversed as bigint[]);

  const calculatedProof = calculatedTree.generateProof(_index);
  const sibs = calculatedProof.siblings.map(sib => {
    return sib.toString();
  });

  const proofIndex = calculatedProof.index;

  // Pad siblings array to match circuit expectation (4 elements)
  const lengthDiff = 4 - sibs.length;
  for (let i = 0; i < lengthDiff; i++) {
    sibs.push("0");
  }

  try {
    const noir = new Noir(_circuitData);
    const honk = new UltraHonkBackend(_circuitData.bytecode, { threads: 1 });

    const input = {
      // Public inputs
      root: _root.toString(),
      nullifier_hash: nullifierHash.toString(),
      vote: _vote, // Pass boolean directly, not as string
      depth: _depth.toString(), // Use actual siblings needed instead of tree depth
      // // private inputs
      nullifier: BigInt(_nullifier).toString(), // Convert hex to decimal string
      secret: BigInt(_secret).toString(), // Convert hex to decimal string
      index: proofIndex.toString(),
      siblings: sibs,
    };
    console.log("input", input);
    const { witness } = await noir.execute(input);
    console.log("witness", witness);
    const originalLog = console.log; // Save original
    // Override to silence all logs
    console.log = () => {};
    const { proof, publicInputs } = await honk.generateProof(witness, {
      keccak: true,
    });
    // Restore original console.log
    console.log = originalLog;
    console.log("proof", proof);
    console.log("publicInputs", publicInputs);
    const result = ethers.AbiCoder.defaultAbiCoder().encode(["bytes", "bytes32[]"], [proof, publicInputs]);
    console.log("result", result);
    return { proof, publicInputs };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

function uint8ArrayToHexString(buffer: Uint8Array): `0x${string}` {
  const hex: string[] = [];

  buffer.forEach(function (i) {
    let h = i.toString(16);
    if (h.length % 2) {
      h = "0" + h;
    }
    hex.push(h);
  });

  return `0x${hex.join("")}`;
}
