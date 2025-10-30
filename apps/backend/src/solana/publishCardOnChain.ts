import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { Program, AnchorProvider, web3, BN } from "@project-serum/anchor";
import { Card } from "@repo/sharedtypes/types";
import idl from "./card_program.json"; // your Anchor program IDL

const SOLANA_RPC = "https://api.devnet.solana.com"; // devnet RPC
const PROGRAM_ID = new PublicKey("YourProgramIdHere"); // Anchor program ID

// Admin wallet that will send the tx
const ADMIN_KEYPAIR = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.ADMIN_SECRET_KEY!))
);

export const publishCardOnChain = async (card: Card): Promise<string> => {
  // 1️⃣ Setup connection and provider
  const connection = new Connection(SOLANA_RPC, "confirmed");
  const provider = new AnchorProvider(connection, new web3.Account(ADMIN_KEYPAIR), {
    preflightCommitment: "confirmed",
  });

  const program = new Program(idl as any, PROGRAM_ID, provider);

  // 2️⃣ Generate PDA (Program Derived Address) for this card
  const [cardPda] = await PublicKey.findProgramAddress(
    [Buffer.from("card"), Buffer.from(card.name)], // seed = "card" + card name
    PROGRAM_ID
  );

  // 3️⃣ Send transaction to publish card
  const tx = await program.methods
    .publishCard(
      card.name,
      card.elementType,
      card.currentHp,
      card.metdataUrl,
      card.elementType,
      card.rarity // depends on IDL
    )
    .accounts({
      cardAccount: cardPda,
      authority: provider.wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();

  console.log("Card published on-chain:", card.name, "tx:", tx);
  return tx;
};
