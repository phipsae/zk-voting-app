"use client";

import { useState } from "react";
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { EntryPointVersion, entryPoint07Address } from "viem/account-abstraction";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";

// This would come from your environment variables in production
const apiKey = "pim_4m62oHMPzK43c7EUsXmnFa";
const pimlicoUrl = `https://api.pimlico.io/v2/${baseSepolia.id}/rpc?apikey=${apiKey}`;

const pimlicoClient = createPimlicoClient({
  chain: baseSepolia,
  transport: http(pimlicoUrl),
  entryPoint: {
    address: entryPoint07Address,
    version: "0.7" as EntryPointVersion,
  },
});

export const VoteWithBurnerPaymaster = ({ contractAddress }: { contractAddress?: `0x${string}` }) => {
  const [smartAccount, setSmartAccount] = useState<`0x${string}` | null>(null);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const { proofData } = useGlobalState();
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [importJsonError, setImportJsonError] = useState<string>("");

  const { data: contractInfo } = useDeployedContractInfo({ contractName: "Voting" });

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

  const createSmartAccount = async () => {
    try {
      // Create a random private key for the smart account owner
      const privateKey = generatePrivateKey();
      const wallet = privateKeyToAccount(privateKey);

      console.log("wallet", wallet.address);

      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http("https://sepolia.base.org"),
      });

      const account = await toSafeSmartAccount({
        client: publicClient,
        owners: [wallet],
        version: "1.4.1",
      });

      const smartAccountClient = createSmartAccountClient({
        account,
        chain: baseSepolia,
        bundlerTransport: http(pimlicoUrl),
        paymaster: pimlicoClient,
        userOperation: {
          estimateFeesPerGas: async () => {
            return (await pimlicoClient.getUserOperationGasPrice()).fast;
          },
        },
      });

      console.log("pimlicoClient", pimlicoClient);
      console.log(`Smart account address: https://sepolia.basescan.io/address/${account.address}`);
      console.log("smartAccountClient", smartAccountClient);
      console.log("wallet", wallet);

      setSmartAccount(account.address as `0x${string}`);
      return { smartAccountClient };
    } catch (error) {
      console.error("Error creating smart account:", error);
      throw error;
    }
  };

  return (
    <div className="bg-base-100 shadow rounded-xl p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Step 4 — Cast vote (Gasless)</h2>
        <p className="text-sm opacity-70">Send your vote via an ERC-4337 smart account sponsored by a paymaster.</p>
      </div>

      {smartAccount && (
        <div className="flex items-center gap-2">
          <span className="text-sm">Smart Account:</span>
          <Address address={smartAccount} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          className="btn btn-ghost"
          onClick={() => {
            console.log(smartAccount);
          }}
        >
          Console log smart account
        </button>
      </div>

      <button
        className="btn btn-primary"
        disabled={!proofData || txStatus === "pending"}
        onClick={async () => {
          try {
            if (!proofData) {
              console.error("Please generate proof first");
              return;
            }

            setTxStatus("pending");

            // Create or get existing smart account
            const { smartAccountClient } = await createSmartAccount();

            if (!contractInfo && !contractAddress) throw new Error("Contract not found");

            // Encode the vote function call
            const callData = encodeFunctionData({
              abi: (contractInfo?.abi as any) || ([] as any),
              functionName: "vote",
              args: [
                uint8ArrayToHexString(proofData.proof),
                proofData.publicInputs[0], // _root
                proofData.publicInputs[1], // _nullifierHash
                proofData.publicInputs[2], // _vote
                proofData.publicInputs[3], // _depth
              ],
            });

            console.log("callData", callData);
            console.log("smartAccountClient", smartAccountClient);
            console.log("contractInfo address", contractInfo?.address);
            console.log("calling address", smartAccountClient.account.address);

            // Create and send the user operation
            const userOpHash = await smartAccountClient.sendTransaction({
              to: (contractAddress || contractInfo?.address) as `0x${string}`,
              data: callData,
              value: 0n,
            });

            console.log("User operation hash:", userOpHash);

            // Wait for the user operation to be included
            const receipt = await pimlicoClient.waitForUserOperationReceipt({
              hash: userOpHash,
            });

            console.log("Transaction included:", receipt);
            setTxStatus("success");
          } catch (e) {
            console.error("Error voting:", e);
            setTxStatus("error");
          }
        }}
      >
        {txStatus === "pending" ? "Voting..." : "Vote gasless (ERC-4337)"}
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
                const publicInputs = (parsed.publicInputs as any[]).map(v => {
                  if (typeof v === "string" && v.startsWith("0x")) {
                    return v as `0x${string}`;
                  }
                  if (typeof v === "boolean") {
                    return `0x${(v ? 1n : 0n).toString(16).padStart(64, "0")}` as `0x${string}`;
                  }
                  if (typeof v === "number") {
                    return `0x${BigInt(v).toString(16).padStart(64, "0")}` as `0x${string}`;
                  }
                  if (typeof v === "string") {
                    return `0x${BigInt(v).toString(16).padStart(64, "0")}` as `0x${string}`;
                  }
                  throw new Error("Unsupported public input type");
                });
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
