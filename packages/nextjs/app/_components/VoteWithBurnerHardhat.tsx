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
            const contract = new Contract(contractInfo.address, contractInfo.abi, wallet.connect(provider));

            // Call the vote function directly with the burner wallet
            const tx = await contract.setStatement(
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
    </div>
  );
};
