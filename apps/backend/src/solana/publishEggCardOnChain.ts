import * as anchor from "@project-serum/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { Pokebattle } from "../../target/types/pokebattle";
import { uploadMetadataCopy } from "../utils/uploadMetadataCopy"; // <-- utility for IPFS upload
import IDL from "../../target/idl/pokebattle.json";

const ADMIN_PUBKEY = new PublicKey("YOUR_ADMIN_PUBKEY_HERE");
const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID_HERE");

export async function publishEggCardOnChain(data: {
  wallet: string;
  eggId: string;
  cardIds: (string | undefined)[];
  metadataUrl: string[];
  ts: number;
  userPayload : string;
  adminPayload : string;
  adminSignature: string;
  userSignature: string;
}) {
  const connection = new Connection("https://api.devnet.solana.com");
  const provider = new anchor.AnchorProvider(connection, window.solana, {
    preflightCommitment: "processed",
  });
  anchor.setProvider(provider);

  const program = new anchor.Program<Pokebattle>(
    IDL as Pokebattle,
    PROGRAM_ID,
    provider
  );

  try {
    // ✅ Step 1: Make a copy of each card's metadata for the instance
    const instanceMetadataUrls: string[] = [];

    for (const url of data.metadataUrl) {
      const response = await fetch(url);
      const baseMetadata = await response.json();

      // ✅ Create a copy for the instance
      const instanceMetadata = {
        cardMetadataurl : url, // link to base card metadata
        skills: baseMetadata.skills.map((s: any) => ({ ...s })), // copy skills for manipulation
      };

      // ✅ Upload instance metadata to IPFS
      const newMetadataUrl = await uploadMetadataCopy(instanceMetadata);
      instanceMetadataUrls.push(newMetadataUrl);
    }

    // ✅ Step 2: Send new metadata URLs to Solana
    const tx = await program.methods
    .hatchEgg(
      new PublicKey(data.wallet), // user
      data.cardIds,               // card_ids
      data.eggId,                 // egg_id
      instanceMetadataUrls,       // metadata_urls
      data.userSignature,         // user_signature
      data.adminSignature,        // admin_signature
      data.userPayload,           // user_payload
      data.adminPayload           // admin_payload
    )
    .accounts({
      admin: new PublicKey(ADMIN_PUBKEY),
      systemProgram: SystemProgram.programId,
    })
    .rpc();  

    return {
      success: true,
      tx,
      metadataUrls: instanceMetadataUrls,
    };
  } catch (err: any) {
    console.error("on-chain mint error", err);
    return { success: false, error: err.message };
  }
}
