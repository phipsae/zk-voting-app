"use client";

import { useEffect, useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
// @ts-ignore
import { Noir } from "@noir-lang/noir_js";
import { LeanIMT } from "@zk-kit/lean-imt";
import { ethers } from "ethers";
import { poseidon1, poseidon2 } from "poseidon-lite";
import { usePublicClient, useWatchContractEvent } from "wagmi";
import { useScaffoldReadContract, useSelectedNetwork } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { notification } from "~~/utils/scaffold-eth";
import { contracts } from "~~/utils/scaffold-eth/contract";

interface CreateCommitmentProps {
  contractAddress?: `0x${string}`;
  leafEvents?: any[];
}

export const GenerateProof = ({ contractAddress, leafEvents = [] }: CreateCommitmentProps) => {
  const [, setCircuitData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { commitmentData, setProofData, proofData, voteChoice } = useGlobalState();
  const [proofJsonText, setProofJsonText] = useState<string>("");
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [importJsonError, setImportJsonError] = useState<string>("");

  // Optional user-provided overrides for commitment data
  const [nullifierInput, setNullifierInput] = useState<string>("");
  const [secretInput, setSecretInput] = useState<string>("");
  const [indexInput, setIndexInput] = useState<string>("");
  const [jsonInput, setJsonInput] = useState<string>("");
  const [jsonError, setJsonError] = useState<string>("");

  const selected = useSelectedNetwork();
  const votingAbi = contracts?.[selected.id]?.["Voting"].abi as any;

  const publicClient = usePublicClient({ chainId: selected.id });

  // TODO: get events
  const [leavesAsEvents, setLeavesAsEvents] = useState<any[]>([]);

  const mergeAndDedupeEvents = (previous: any[], next: any[]) => {
    const seen = new Set<string>();
    const merged = [...previous, ...next];
    const deduped = merged.filter(e => {
      const key =
        e?.transactionHash && e?.logIndex !== undefined
          ? `${e.transactionHash}-${e.logIndex}`
          : `logIndex-${e?.logIndex}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // Sort by args.index descending (most recent/highest index first)
    deduped.sort((a, b) => {
      const ai = a?.args?.index as bigint | undefined;
      const bi = b?.args?.index as bigint | undefined;
      if (ai === undefined || bi === undefined) return 0;
      if (ai === bi) return 0;
      return ai < bi ? 1 : -1;
    });
    return deduped;
  };

  useEffect(() => {
    const loadInitial = async () => {
      if (!publicClient || !contractAddress) return;
      const event = (votingAbi as any).find((x: any) => x.type === "event" && x.name === "NewLeaf");
      const logs = await publicClient.getLogs({ address: contractAddress, event, fromBlock: 0n });
      const mapped = logs.map(l => ({
        args: { index: BigInt((l as any).args.index), value: BigInt((l as any).args.value) },
        logIndex: Number((l as any).logIndex ?? 0),
        transactionHash: (l as any).transactionHash,
      }));
      setLeavesAsEvents(prev => mergeAndDedupeEvents(prev, mapped));
    };
    void loadInitial();
  }, [publicClient, contractAddress, votingAbi]);

  useWatchContractEvent({
    address: contractAddress,
    abi: votingAbi,
    eventName: "NewLeaf",
    onLogs: logs => {
      const mapped = logs.map(l => ({
        args: { index: BigInt((l as any).args.index), value: BigInt((l as any).args.value) },
        logIndex: Number((l as any).logIndex ?? 0),
        transactionHash: (l as any).transactionHash,
      }));
      setLeavesAsEvents(prev => mergeAndDedupeEvents(prev, mapped));
    },
  });

  const { data: treeData } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "tree",
    address: contractAddress,
  });

  const { data: root } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getRoot",
    address: contractAddress,
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

      // Determine effective values: prefer user input, else fall back to stored commitmentData
      const effectiveNullifier = (nullifierInput?.trim() || commitmentData?.nullifier)?.trim();
      const effectiveSecret = (secretInput?.trim() || commitmentData?.secret)?.trim();
      const effectiveIndex = indexInput?.trim() !== "" ? Number(indexInput) : commitmentData?.index;

      if (voteChoice === null) {
        throw new Error("Please select your vote (Yes/No) first");
      }

      if (!leafEvents || leafEvents.length === 0) {
        throw new Error("There are no commitments in the tree yet. Please insert a commitment first.");
      }

      if (!effectiveNullifier || !effectiveSecret || effectiveIndex === undefined) {
        throw new Error(
          "Missing commitment inputs. Paste your saved data or ensure you have generated & inserted a commitment.",
        );
      }

      const generatedProof = await generateProof(
        root as bigint,
        voteChoice,
        Number((treeData as readonly [bigint, bigint] | undefined)?.[1] ?? 0),
        effectiveNullifier,
        effectiveSecret,
        effectiveIndex as number,
        leavesAsEvents as any,
        data,
      );
      setProofData({
        proof: generatedProof.proof,
        publicInputs: generatedProof.publicInputs,
      });
      // Build exportable JSON after setting state
      const exportable = buildExportableProofJSON(generatedProof.proof, generatedProof.publicInputs);
      setProofJsonText(JSON.stringify(exportable, null, 2));
    } catch (error) {
      console.error("Error in getCircuitDataAndGenerateProof:", error);
      notification.error((error as Error).message || "Failed to generate proof");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-base-100 shadow rounded-xl p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Step 3 — Generate ZK proof</h2>
        <p className="text-sm opacity-70">
          Prove membership in the Merkle tree and your vote without revealing identity.
        </p>
      </div>
      <button onClick={() => console.log(leavesAsEvents)}>Log leavesAsEvents</button>
      <button onClick={() => console.log(treeData)}>Log treeData</button>
      {/* <MerkleTreeData treeData={treeData} root={root as any} leafEvents={leafEvents as any[]} /> */}
      <div className="flex flex-col gap-4">
        <div className="space-y-2 p-4 rounded-lg border border-base-300">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Optional: Paste or enter commitment inputs</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => {
                setNullifierInput("");
                setSecretInput("");
                setIndexInput("");
                setJsonInput("");
                setJsonError("");
              }}
            >
              Clear
            </button>
          </div>

          <textarea
            className="textarea textarea-bordered textarea-xs w-full text-xs font-mono"
            rows={3}
            placeholder='Paste JSON like: {"nullifier":"0x...","secret":"0x...","index":0}'
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setJsonError("");
                try {
                  const parsed = JSON.parse(jsonInput || "{}");
                  if (parsed.nullifier) setNullifierInput(String(parsed.nullifier));
                  if (parsed.secret) setSecretInput(String(parsed.secret));
                  if (parsed.index !== undefined && parsed.index !== null) setIndexInput(String(parsed.index));
                } catch {
                  setJsonError("Invalid JSON format");
                }
              }}
            >
              Load from JSON
            </button>
            {jsonError && <span className="text-error text-sm">{jsonError}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              className="input input-bordered input-xs font-mono"
              placeholder={commitmentData?.nullifier || "nullifier (bytes32)"}
              value={nullifierInput}
              onChange={e => setNullifierInput(e.target.value)}
            />
            <input
              type="text"
              className="input input-bordered input-xs font-mono"
              placeholder={commitmentData?.secret || "secret (bytes32)"}
              value={secretInput}
              onChange={e => setSecretInput(e.target.value)}
            />
            <input
              type="number"
              className="input input-bordered input-xs"
              placeholder={
                commitmentData?.index !== undefined ? String(commitmentData?.index) : "index (leaf position)"
              }
              value={indexInput}
              onChange={e => setIndexInput(e.target.value)}
              min={0}
            />
          </div>
          <div className="text-xs opacity-70">If left empty, stored commitment values will be used.</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={getCircuitDataAndGenerateProof}
            disabled={isLoading}
          >
            {isLoading ? "Generating proof..." : "Generate proof"}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              console.log("Generated Proof:", proofData?.proof);
              console.log("Public Inputs:", proofData?.publicInputs[2].toString());
            }}
          >
            Console log proof
          </button>
        </div>

        {/* Export / Import Proof JSON */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Export Proof JSON</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => {
                  if (proofData) {
                    const exportable = buildExportableProofJSON(proofData.proof, proofData.publicInputs);
                    const text = JSON.stringify(exportable, null, 2);
                    setProofJsonText(text);
                    navigator.clipboard
                      .writeText(text)
                      .then(() => notification.success("Proof JSON copied to clipboard"))
                      .catch(() => notification.error("Failed to copy. You can copy manually."));
                  } else {
                    notification.error("No proof found. Generate a proof first.");
                  }
                }}
              >
                Copy JSON
              </button>
            </div>
            <textarea
              className="textarea textarea-bordered textarea-xs w-full text-xs font-mono"
              rows={4}
              placeholder="Generated proof JSON will appear here after you generate a proof."
              value={proofJsonText}
              onChange={e => setProofJsonText(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Import Proof JSON</span>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => {
                  setImportJsonText("");
                  setImportJsonError("");
                }}
              >
                Clear
              </button>
            </div>
            <textarea
              className="textarea textarea-bordered textarea-xs w-full text-xs font-mono"
              rows={4}
              placeholder='Paste JSON like: {"schema":"zk-voting-proof@1","proofHex":"0x...","publicInputs":["0x..", "0x..", true, 3]}'
              value={importJsonText}
              onChange={e => setImportJsonText(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setImportJsonError("");
                  try {
                    const parsed = JSON.parse(importJsonText || "{}");
                    if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON");
                    if (!parsed.proofHex || !parsed.publicInputs) throw new Error("Missing fields in JSON");
                    const proofBytes = hexToUint8Array(parsed.proofHex as string);
                    const publicInputsHex = normalizePublicInputsToHex32(parsed.publicInputs as any[]);
                    setProofData({ proof: proofBytes, publicInputs: publicInputsHex });
                    notification.success("Proof loaded into app state");
                  } catch (err) {
                    setImportJsonError((err as Error).message || "Invalid proof JSON");
                  }
                }}
              >
                Load Proof JSON
              </button>
              {importJsonError && <span className="text-error text-sm">{importJsonError}</span>}
            </div>
          </div>
        </div>
      </div>
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
  const lengthDiff = 16 - sibs.length;
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

// Helpers
const uint8ArrayToHexString = (buffer: Uint8Array): `0x${string}` => {
  const hex: string[] = [];
  buffer.forEach(i => {
    let h = i.toString(16);
    if (h.length % 2) h = "0" + h;
    hex.push(h);
  });
  return `0x${hex.join("")}`;
};

const hexToUint8Array = (hexString: string): Uint8Array => {
  const normalized = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  if (normalized.length % 2 !== 0) throw new Error("Invalid hex length");
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
};

const toBytes32Hex = (value: any): `0x${string}` => {
  // If already a 0x-prefixed hex, normalize padding
  if (typeof value === "string" && value.startsWith("0x")) {
    const hex = value.slice(2);
    if (hex.length > 64) throw new Error("Hex value too long for bytes32");
    return `0x${hex.padStart(64, "0")}`;
  }
  if (typeof value === "boolean") {
    return `0x${(value ? 1n : 0n).toString(16).padStart(64, "0")}`;
  }
  if (typeof value === "bigint") {
    return `0x${value.toString(16).padStart(64, "0")}`;
  }
  if (typeof value === "number") {
    return `0x${BigInt(value).toString(16).padStart(64, "0")}`;
  }
  if (typeof value === "string") {
    // decimal string
    const asBig = BigInt(value);
    return `0x${asBig.toString(16).padStart(64, "0")}`;
  }
  throw new Error("Unsupported public input type");
};

const normalizePublicInputsToHex32 = (inputs: any[]): `0x${string}`[] => {
  return inputs.map(toBytes32Hex);
};

const buildExportableProofJSON = (proof: Uint8Array, publicInputs: any[]) => {
  const inputsHex = normalizePublicInputsToHex32(publicInputs);
  return {
    schema: "zk-voting-proof@1",
    proofHex: uint8ArrayToHexString(proof),
    publicInputs: inputsHex,
  };
};
