import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("get-cid", "Retrieve data CID after purchasing access on Filecoin")
  .addParam("contract", "The address of the FilecoinCIDStore contract")
  .addParam("contentId", "The content ID to retrieve the CID for")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const contractAddr = taskArgs.contract;
    const contentId = parseInt(taskArgs.contentId);

    console.log(`Retrieving CID from Filecoin network: ${hre.network.name}`);
    console.log(`Contract: ${contractAddr}`);
    console.log(`Content ID: ${contentId}`);

    // Get the wallet
    const [signer] = await hre.ethers.getSigners();
    console.log(`Using wallet: ${signer.address}`);

    // Get the contract instance
    const cidStore = await hre.ethers.getContractAt(
      "FilecoinCIDStore",
      contractAddr,
      signer
    );

    try {
      // Check access first
      const hasAccess = await cidStore.hasAccess(contentId, signer.address);

      if (!hasAccess) {
        console.log("❌ Access denied. You need to purchase access first.");
        console.log(
          "💡 Use: bun hardhat purchase-access --contract <address> --content-id <id>"
        );
        return;
      }

      // Get content info
      const contentInfo = await cidStore.getContentInfo(contentId);
      const [
        title,
        description,
        price,
        owner,
        isActive,
        createdAt,
        dealId,
        pieceSize,
        userHasAccess,
      ] = contentInfo;

      console.log(`📄 Content: "${title}"`);
      console.log(`👤 Owner: ${owner}`);

      // Check Filecoin deal status
      if (dealId > 0) {
        try {
          const dealActivated = await cidStore.checkDealActivation(contentId);
          console.log(
            `📊 Filecoin Deal Status: ${
              dealActivated ? "✅ Active" : "⏳ Pending"
            }`
          );
          console.log(`🔗 Deal ID: ${dealId}`);
        } catch (e) {
          console.log(`📊 Deal status: Error checking (${dealId})`);
        }
      } else {
        console.log(`📊 No Filecoin deal created yet`);
      }

      // Get the data CID
      const dataCid = await cidStore.getCID(contentId);

      console.log(`✅ Data CID retrieved successfully from Filecoin FVM!`);
      console.log(`📂 Data CID: ${dataCid}`);
      console.log(`🌐 IPFS URLs:`);
      console.log(`   - https://ipfs.io/ipfs/${dataCid}`);
      console.log(`   - https://gateway.pinata.cloud/ipfs/${dataCid}`);
      console.log(`   - https://cloudflare-ipfs.com/ipfs/${dataCid}`);
    } catch (error) {
      console.error("❌ Error retrieving CID:", error);
      if (error.message && error.message.includes("Purchase required")) {
        console.log("💡 You need to purchase access first!");
        console.log(
          "💡 Use: bun hardhat purchase-access --contract <address> --content-id <id>"
        );
      } else if (error.message && error.message.includes("Access expired")) {
        console.log("💡 Your access has expired. Purchase again to renew!");
        console.log(
          "💡 Use: bun hardhat purchase-access --contract <address> --content-id <id>"
        );
      }
    }
  });
