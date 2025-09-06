import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import CID from "cids";

task("store-cid", "Store content with Filecoin piece CID and data CID")
  .addParam("contract", "The address of the FilecoinCIDStore contract")
  .addParam("pieceCid", "The Filecoin piece CID (commP)")
  .addParam("dataCid", "The original data CID")
  .addParam("price", "The price in FIL for accessing this content")
  .addParam("title", "The content title")
  .addParam("description", "The content description")
  .addParam("pieceSize", "The piece size in bytes")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const contractAddr = taskArgs.contract;
    const pieceCid = taskArgs.pieceCid;
    const dataCid = taskArgs.dataCid;
    const priceInFil = taskArgs.price;
    const title = taskArgs.title;
    const description = taskArgs.description;
    const pieceSize = taskArgs.pieceSize;

    console.log(`Storing content on Filecoin network: ${hre.network.name}`);
    console.log(`Contract: ${contractAddr}`);
    console.log(`Piece CID: ${pieceCid}`);
    console.log(`Data CID: ${dataCid}`);
    console.log(`Price: ${priceInFil} FIL`);
    console.log(`Title: ${title}`);

    // Get the wallet
    const [signer] = await hre.ethers.getSigners();
    console.log(`Using wallet: ${signer.address}`);

    // Get the contract instance
    const cidStore = await hre.ethers.getContractAt(
      "FilecoinCIDStore",
      contractAddr,
      signer
    );

    // Convert piece CID to bytes
    const cid = new CID(pieceCid);
    const cidHex = "0x" + cid.toString("base16").substring(1);

    // Convert price to wei (attoFIL)
    const priceInWei = hre.ethers.parseEther(priceInFil.toString());

    try {
      // Store the content
      const tx = await cidStore.storeContent(
        cidHex,
        dataCid,
        priceInWei,
        title,
        description,
        pieceSize
      );
      const receipt = await tx.wait();

      console.log(`✅ Content stored successfully on Filecoin FVM!`);
      console.log(`Transaction hash: ${tx.hash}`);

      // Get the content ID from the event
      if (receipt && receipt.logs.length > 0) {
        const contentId = receipt.logs[0].topics[1];
        console.log(`📝 Content ID: ${parseInt(contentId, 16)}`);
      }
    } catch (error) {
      console.error("❌ Error storing content:", error);
    }
  });
