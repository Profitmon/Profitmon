import { Request, Response } from "express";
import { publishCardService } from "../services/cardService";
import { prisma } from "@repo/db/client"; // your database client
import { sendToAnchor } from "../services/anchorService"; // function to call Anchor program
import { create } from "ipfs-http-client"; // IPFS client

const ipfs = create({ url: "https://ipfs.infura.io:5001/api/v0" }); // or another IPFS provider

export const publishCard = async (req: Request, res: Response) => {
  try {
    const { card } = req.body;
    if (!card) return res.status(400).json({ success: false, message: "Card required" });

    const { path: imageHash } = await ipfs.add(card.image); // card.image = buffer or base64
    const imageUrl = `https://ipfs.io/ipfs/${imageHash}`;

    // 1️⃣ Save metadata to IPFS
    const metadata = {
      name: card.name,
      image_url: imageUrl,
      rarity: card.rarity,
      elementType: card.element_type,
      skills: card.skills,
    };
    const { path: ipfsHash } = await ipfs.add(JSON.stringify(metadata));
    const metadataUrl = `https://ipfs.io/ipfs/${ipfsHash}`;

    // 2️⃣ Save metadata URL in DB
    const dbRecord = await prisma.card.create({
      data: {
        name: card.name,
        rarity: card.rarity,
        elementType: card.element_type,
        metadata_url: metadataUrl, // save IPFS link
      },
    });

    // 3️⃣ Call Anchor contract to publish the card
    const onChainCard = await sendToAnchor({
      name: card.name,
      metadata_url: metadataUrl,
      rarity: card.rarity,
      element_type: card.element_type,
    });

    // 4️⃣ Return response
    return res.json({ success: true, card: { ...onChainCard, metadata_url: metadataUrl } });
  } catch (err: any) {
    console.error("publishCard error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
