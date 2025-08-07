"use client";

import { useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
// @ts-ignore
import { Noir } from "@noir-lang/noir_js";
import { LeanIMT } from "@zk-kit/lean-imt";
import { ethers } from "ethers";
import { poseidon1, poseidon2 } from "poseidon-lite";
import { LeafEventsList } from "~~/app/_components/LeafEventsList";
import { useScaffoldEventHistory, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";

export const GenerateProof = () => {
  const [, setCircuitData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { commitmentData, setProofData, proofData, voteChoice } = useGlobalState();

  // const generateBurnerWallet = () => {
  //   const wallet = ethers.Wallet.createRandom();
  //   setBurnerWallet(wallet);
  //   return wallet;
  // };
  // const [statementText, setStatementText] = useState("I have proven knowledge of my secret commitment!");

  // const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract({
  //   contractName: "IncrementalMerkleTree",
  // });

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

  const getCircuitDataAndGenerateProof = async () => {
    setIsLoading(true);
    try {
      // First fetch circuit data
      const response = await fetch("/api/circuit");
      if (!response.ok) {
        throw new Error("Failed to fetch circuit data");
      }
      const data = await response.json();
      setCircuitData(data);
      console.log("Circuit data:", data);

      // Then generate proof with the fetched circuit data
      if (!commitmentData || commitmentData.index === undefined) {
        throw new Error("Please generate and insert a commitment first");
      }

      if (voteChoice === null) {
        throw new Error("Please select your vote (Yes/No) first");
      }

      const generatedProof = await generateProof(
        root as bigint,
        voteChoice,
        Number(treeData?.[1] || 0),
        commitmentData.nullifier,
        commitmentData.secret,
        commitmentData.index,
        leafEvents as any,
        data,
      );
      setProofData({
        proof: generatedProof.proof,
        publicInputs: generatedProof.publicInputs,
      });
    } catch (error) {
      console.error("Error in getCircuitDataAndGenerateProof:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
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
            {root && (
              <div
                className="stat-desc mt-1 cursor-pointer hover:text-accent"
                onClick={() => navigator.clipboard.writeText(root.toString())}
              >
                Click to copy full root
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" className="btn btn-primary" onClick={getCircuitDataAndGenerateProof} disabled={isLoading}>
          {isLoading ? "Generating Proof..." : "Generate Proof"}
        </button>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            console.log("Generated Proof:", proofData?.proof);
            console.log("Public Inputs:", proofData?.publicInputs[2].toString());
          }}
        >
          Console Log Proof
        </button>
        <h2 className="card-title text-xl mb-4">Vote with DIFFERENT Address</h2>
        {/* <button
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
          Vote
        </button> */}
      </div>
      <LeafEventsList leafEvents={leafEvents || []} />
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
