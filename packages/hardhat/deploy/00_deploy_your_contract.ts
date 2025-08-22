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

  // const leanIMT = await deploy("LeanIMT", {
  //   from: deployer,
  //   log: true,
  //   autoMine: true,
  //   libraries: {
  //     // LeanIMT: leanIMT.address,
  //     PoseidonT3: poseidon3.address,
  //   },
  // });

  // console.log("leanIMT deployed to:", leanIMT.address);

  const leanIMTAddress = "0xcF4ac52079F69C93904e2A4a379cAd1F0C8dA0A9";
  // const honkVerifierAddress = "0x57275b39250dB7cf77F98Afb532fE3eA421a43B3";
  const verifier = "0x57275b39250dB7cf77F98Afb532fE3eA421a43B3";

  await deploy("VotingFactory", {
    from: deployer,
    args: [verifier],
    log: true,
    autoMine: true,
    libraries: {
      LeanIMT: leanIMTAddress,
    },
  });

  // const leanIMT = "0x0000000000000000000000000000000000000000";

  // await deploy("Voting", {
  //   from: deployer,
  //   // Contract constructor arguments
  //   args: [verifier, "Should we build a new bridge?"],
  //   log: true,
  //   // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
  //   // automatically mining the contract deployment transaction. There is no effect on live networks.
  //   autoMine: true,
  //   libraries: {
  //     LeanIMT: leanIMT,
  //     // PoseidonT3: poseidon3.address,
  //     // PoseidonT2: poseidon2.address,
  //   },
  // });
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployYourContract.tags = ["Voting"];
