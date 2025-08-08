"use client";

import { useState } from "react";
import { Contract, HDNodeWallet, JsonRpcProvider, Wallet, parseEther } from "ethers";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";

export const VoteWithBurnerHardhat = () => {
  const [burnerWallet, setBurnerWallet] = useState<HDNodeWallet | null>(null);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const { proofData } = useGlobalState();

  const { data: contractInfo } = useDeployedContractInfo({ contractName: "IncrementalMerkleTree" });

  const generateBurnerWallet = () => {
    const wallet = Wallet.createRandom();
    setBurnerWallet(wallet);
    return wallet;
  };

  const uint8ArrayToHexString = (buffer: Uint8Array): `0x${string}` => {
    const hex: string[] = [];
    buffer.forEach(function (i) {
      let h = i.toString(16);
      if (h.length % 2) {
        h = "0" + h;
      }
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
      const asBig = BigInt(value);
      return `0x${asBig.toString(16).padStart(64, "0")}`;
    }
    throw new Error("Unsupported public input type");
  };

  const normalizePublicInputsToHex32 = (inputs: any[]): `0x${string}`[] => inputs.map(toBytes32Hex);

  const [importJsonText, setImportJsonText] = useState<string>("");
  const [importJsonError, setImportJsonError] = useState<string>("");

  return (
    <div className="flex flex-col gap-4 p-4 bg-base-200 rounded-lg">
      <h2 className="card-title text-xl">Vote with Burner Wallet</h2>

      {burnerWallet && (
        <div className="flex items-center gap-2">
          <span className="text-sm">Burner Wallet:</span>
          <Address address={burnerWallet.address} />
        </div>
      )}

      <button
        className="btn btn-primary"
        // disabled={!proofData || txStatus === "pending"}
        onClick={async () => {
          try {
            if (!proofData) {
              console.error("Please generate proof first");
              return;
            }

            setTxStatus("pending");

            const wallet = burnerWallet || generateBurnerWallet();
            const provider = new JsonRpcProvider("http://localhost:8545");

            const balance = await provider.getBalance(wallet.address);

            if (balance < parseEther("0.01")) {
              const signer = await provider.getSigner();
              // Send some ETH to the burner wallet for gas
              await signer.sendTransaction({
                to: wallet.address,
                value: parseEther("0.01") - balance, // Only send what's needed
              });
            }

            if (!contractInfo) throw new Error("Contract not found");

            // Create contract instance with burner wallet
            const contract = new Contract(contractInfo.address, contractInfo.abi as any, wallet.connect(provider));

            // Call the vote function directly with the burner wallet
            const tx = await contract.vote(
              uint8ArrayToHexString(proofData.proof),
              proofData.publicInputs[0], // _root
              proofData.publicInputs[1], // _nullifierHash
              proofData.publicInputs[2], // _vote
              proofData.publicInputs[3], // _depth
            );

            await tx.wait();

            setTxStatus("success");
          } catch (e) {
            console.error("Error voting:", e);
            setTxStatus("error");
          }
        }}
      >
        {txStatus === "pending" ? "Voting..." : "Vote with Burner Wallet"}
      </button>

      {txStatus === "success" && (
        <div className="alert alert-success">
          <span>Vote successfully cast!</span>
        </div>
      )}

      {txStatus === "error" && (
        <div className="alert alert-error">
          <span>Error casting vote. Please try again.</span>
        </div>
      )}

      {/* Import Proof JSON */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Import Proof JSON</span>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
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
          rows={3}
          placeholder='Paste JSON like: {"schema":"zk-voting-proof@1","proofHex":"0x...","publicInputs":["0x..", "0x..", true, 3]}'
          value={importJsonText}
          onChange={e => setImportJsonText(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setImportJsonError("");
              try {
                const parsed = JSON.parse(importJsonText || "{}");
                if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON");
                if (!parsed.proofHex || !parsed.publicInputs) throw new Error("Missing fields in JSON");
                const proofBytes = hexToUint8Array(parsed.proofHex as string);
                const publicInputs = normalizePublicInputsToHex32(parsed.publicInputs as any[]);
                useGlobalState.getState().setProofData({ proof: proofBytes, publicInputs });
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
  );
};
