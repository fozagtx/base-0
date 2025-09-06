import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("purchase-access", "Purchase access to content stored on Filecoin")
  .addParam("contract", "The address of the FilecoinCIDStore contract")
  .addParam("contentId", "The content ID to purchase access to")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const contractAddr = taskArgs.contract;
    const contentId = parseInt(taskArgs.contentId);

    console.log(`Purchasing access on Filecoin network: ${hre.network.name}`);
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
      // Get content info first
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
      console.log(`📝 Description: "${description}"`);
      console.log(`💰 Price: ${hre.ethers.formatEther(price)} FIL`);
      console.log(`👤 Owner: ${owner}`);
      console.log(`📦 Piece Size: ${pieceSize} bytes`);
      console.log(`🔗 Deal ID: ${dealId > 0 ? dealId : "No deal yet"}`);
      console.log(`🔐 Current Access: ${userHasAccess ? "Yes" : "No"}`);

      if (userHasAccess) {
        console.log("✅ You already have access to this content!");
        return;
      }

      if (owner.toLowerCase() === signer.address.toLowerCase()) {
        console.log("✅ You own this content!");
        return;
      }

      if (!isActive) {
        console.log("❌ Content is not active for purchase");
        return;
      }

      // Check if deal is activated (optional info)
      try {
        const dealActivated = await cidStore.checkDealActivation(contentId);
        console.log(
          `📊 Filecoin Deal Status: ${
            dealActivated ? "Active" : "Pending/None"
          }`
        );
      } catch (e) {
        console.log(
          `📊 Deal status check failed (content may not have deal yet)`
        );
      }

      // Get platform fee
      const platformFeePercentage = await cidStore.platform_fee_percentage();
      const platformFee = (price * BigInt(platformFeePercentage)) / BigInt(100);
      const totalCost = price + platformFee;

      console.log(
        `🏪 Platform fee: ${hre.ethers.formatEther(
          platformFee
        )} FIL (${platformFeePercentage}%)`
      );
      console.log(`💸 Total cost: ${hre.ethers.formatEther(totalCost)} FIL`);

      // Purchase access
      const tx = await cidStore.purchaseAccess(contentId, {
        value: price, // Contract will calculate platform fee internally
      });

      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Access purchased successfully on Filecoin FVM!`);
      console.log(`📝 Transaction confirmed in block: ${receipt?.blockNumber}`);
      console.log(`⏰ Access valid for 365 days from now`);
    } catch (error) {
      console.error("❌ Error purchasing access:", error);
    }
  });
