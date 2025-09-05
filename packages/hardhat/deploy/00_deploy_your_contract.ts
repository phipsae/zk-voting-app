import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
// import { Contract } from "ethers";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // const verifier = await deploy("HonkVerifier", {
  //   from: deployer,
  //   log: true,
  //   autoMine: true,
  // });

  // console.log("Verifier deployed to:", verifier.address);

  // const poseidon3 = await deploy("PoseidonT3", {
  //   from: deployer,
  //   log: true,
  //   autoMine: true,
  // });

  // console.log("poseidon3 deployed to:", poseidon3.address);

  // const poseidon3AddressMainnet = "0xaE8413714De50a2F0c139C3310c9d31136a5b050";

  // const leanIMT = await deploy("LeanIMT", {
  //   from: deployer,
  //   log: true,
  //   autoMine: true,
  //   libraries: {
  //     // LeanIMT: leanIMT.address,
  //     PoseidonT3: poseidon3AddressMainnet,
  //   },
  // });

  // console.log("leanIMT deployed to:", leanIMT.address);

  ////////////////////
  /// baseSepolia//////
  ////////////////////

  // const leanIMTAddress = "0xcF4ac52079F69C93904e2A4a379cAd1F0C8dA0A9";
  // const verifier = "0x57275b39250dB7cf77F98Afb532fE3eA421a43B3";

  //   await deploy("VotingFactory", {
  //     from: deployer,
  //     args: [verifier],
  //     log: true,
  //     autoMine: true,
  //     libraries: {
  //       LeanIMT: leanIMTAddress,
  //     },
  //   });

  //   await deploy("Voting", {
  //     from: deployer,
  //     // Contract constructor arguments
  //     args: [verifier, "Should we build a new bridge?", 0],
  //     log: true,
  //     // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
  //     // automatically mining the contract deployment transaction. There is no effect on live networks.
  //     autoMine: true,
  //     libraries: {
  //       LeanIMT: leanIMTAddress,
  //       // PoseidonT3: poseidon3.address,
  //       // PoseidonT2: poseidon2.address,
  //     },
  //   });
  // };

  ////////////////////////////////
  /// Sepolia//////////////////////
  ////////////////////////////////

  //   const leanIMTAddressSepolia = "0x763A0DEc250CcD8964C634d5fCA2Fc36Ed672e2e";
  //   const verifierSepolia = "0x70655B28C46c8f21f5e300C189C16046C2F014Fc";

  //   await deploy("VotingFactory", {
  //     from: deployer,
  //     args: [verifierSepolia],
  //     log: true,
  //     autoMine: true,
  //     libraries: {
  //       LeanIMT: leanIMTAddressSepolia,
  //     },
  //   });

  //   await deploy("Voting", {
  //     from: deployer,
  //     // Contract constructor arguments
  //     args: [verifierSepolia, "Should we build a new bridge?", 0],
  //     log: true,
  //     // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
  //     // automatically mining the contract deployment transaction. There is no effect on live networks.
  //     autoMine: true,
  //     libraries: {
  //       LeanIMT: leanIMTAddressSepolia,
  //       // PoseidonT3: poseidon3.address,
  //       // PoseidonT2: poseidon2.address,
  //     },
  //   });
  // };

  ////////////////////////////////
  /// Mainnet//////////////////////
  ////////////////////////////////

  const verifierMainnet = "0x9b54cF6B445729e408769c91Ba392c33c0971E36";
  const leanIMTAddressMainnet = "0x45B70D06E5334E4F7b11Fcc9Be75c3E0eE11FA72";

  await deploy("VotingFactory", {
    from: deployer,
    args: [verifierMainnet],
    log: true,
    autoMine: true,
    libraries: {
      LeanIMT: leanIMTAddressMainnet,
    },
  });

  // await deploy("Voting", {
  //   from: deployer,
  //   // Contract constructor arguments
  //   args: [verifierMainnet, "Should we build a new bridge?", 0],
  //   log: true,
  //   // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
  //   // automatically mining the contract deployment transaction. There is no effect on live networks.
  //   autoMine: true,
  //   libraries: {
  //     LeanIMT: leanIMTAddressMainnet,
  //     // PoseidonT3: poseidon3.address,
  //     // PoseidonT2: poseidon2.address,
  //   },
  // });
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployYourContract.tags = ["Voting"];
