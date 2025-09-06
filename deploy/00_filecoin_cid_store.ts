import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

/**
 * Deploys the FilecoinCIDStore contract for payment-gated CID access on Filecoin FVM
 */
const deployFilecoinCIDStore: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const [deployerSigner] = await hre.ethers.getSigners();
  const deployer = await deployerSigner.getAddress();

  const { deploy } = hre.deployments;

  console.log(`🚀 Deploying FilecoinCIDStore to ${hre.network.name}...`);
  console.log(`📝 Using deployer: ${deployer}`);

  const FilecoinCIDStore = await deploy("FilecoinCIDStore", {
    from: deployer,
    args: [], // No constructor arguments needed
    log: true,
    autoMine: true,
    waitConfirmations: hre.network.name === "hardhat" ? 1 : 3,
  });

  console.log("✅ FilecoinCIDStore deployed at:", FilecoinCIDStore.address);
  console.log("📋 Contract features:");
  console.log("   - Store content with Filecoin piece CIDs");
  console.log("   - Payment-gated access with MetaMask");
  console.log("   - Integration with Filecoin storage deals");
  console.log("   - Deal status verification");
  console.log("   - 365-day access per purchase");
  console.log("   - 5% platform fee");

  // Save contract address for frontend integration
  const contractAddresses = {
    FilecoinCIDStore: FilecoinCIDStore.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer,
    deployedAt: new Date().toISOString(),
  };

  // Write to frontend config
  const frontendDir = path.join(__dirname, "../frontend/src/contracts");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  const configPath = path.join(
    frontendDir,
    `${hre.network.name}-addresses.json`
  );
  fs.writeFileSync(configPath, JSON.stringify(contractAddresses, null, 2));

  console.log(`📄 Contract addresses saved to: ${configPath}`);

  // Update .env.example with contract address
  const envExample = path.join(__dirname, "../.env.example");
  let envContent = "";

  if (fs.existsSync(envExample)) {
    envContent = fs.readFileSync(envExample, "utf8");
  }

  const envVarName =
    hre.network.name === "calibration"
      ? "NEXT_PUBLIC_CALIBRATION_CID_STORE_ADDRESS"
      : "NEXT_PUBLIC_FILECOIN_CID_STORE_ADDRESS";

  const newEnvLine = `${envVarName}=${FilecoinCIDStore.address}`;

  if (envContent.includes(envVarName)) {
    envContent = envContent.replace(new RegExp(`${envVarName}=.*`), newEnvLine);
  } else {
    envContent += `\n${newEnvLine}`;
  }

  fs.writeFileSync(envExample, envContent);
  console.log(`📝 Updated .env.example with contract address`);

  const FilecoinCIDStoreAddress = FilecoinCIDStore.address;

  // Network-specific post-deployment info
  if (hre.network.name === "calibration") {
    console.log("\n🧪 CALIBRATION TESTNET DEPLOYMENT");
    console.log(
      "🌐 Explorer:",
      `https://calibration.filfox.info/en/address/${FilecoinCIDStoreAddress}`
    );
    console.log("💰 Get test FIL:", "https://faucet.calibnet.chainsafe-fil.io");
    console.log(
      "🔗 Add to MetaMask:",
      "https://chainlist.org/?search=filecoin"
    );
  } else if (hre.network.name === "filecoin") {
    console.log("\n🌍 FILECOIN MAINNET DEPLOYMENT");
    console.log(
      "🌐 Explorer:",
      `https://filfox.info/en/address/${FilecoinCIDStoreAddress}`
    );
    console.log("⚠️  This is REAL FIL - be careful!");
  }

  // Frontend integration instructions
  console.log("\n📱 FRONTEND INTEGRATION:");
  console.log("1. Copy the contract address to your .env file:");
  console.log(`   ${envVarName}=${FilecoinCIDStoreAddress}`);
  console.log("2. Import the hook in your React component:");
  console.log(
    `   import { useFilecoinCIDStore } from './hooks/useFilecoinCIDStore';`
  );
  console.log("3. Use in component:");
  console.log(
    `   const { connectWallet, storeContent, purchaseAccess } = useFilecoinCIDStore('${hre.network.name}');`
  );

  // Contract interaction examples
  console.log("\n🛠  CONTRACT INTERACTION EXAMPLES:");
  console.log("Store content:");
  console.log(
    `   bun hardhat store-cid --contract ${FilecoinCIDStoreAddress} --piece-cid <PIECE_CID> --data-cid <DATA_CID> --price 0.01 --title "My Content" --description "Premium content" --piece-size 1048576 --network ${hre.network.name}`
  );

  console.log("\nPurchase access:");
  console.log(
    `   bun hardhat purchase-access --contract ${FilecoinCIDStoreAddress} --content-id 1 --network ${hre.network.name}`
  );

  console.log("\nGet CID:");
  console.log(
    `   bun hardhat get-cid --contract ${FilecoinCIDStoreAddress} --content-id 1 --network ${hre.network.name}`
  );

  return true; // Ensures deployment is marked as successful
};

export default deployFilecoinCIDStore;

deployFilecoinCIDStore.tags = ["FilecoinCIDStore"];
