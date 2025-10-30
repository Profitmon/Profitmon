import * as anchor from "@project-serum/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { PokemonBattle } from "@repo/sharedtypes/types"; // Anchor IDL type
import idl from "../idl/pokebattle.json"; // your Anchor IDL JSON

// Configure your Anchor provider
const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
const walletKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.ADMIN_KEYPAIR as string))
);
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(walletKeypair), {
  preflightCommitment: "confirmed",
});
anchor.setProvider(provider);

// Program instance
const programId = new PublicKey(idl.metadata.address);
const program = new anchor.Program<PokemonBattle>(idl as any, programId, provider);

/**
 * Send card metadata to Anchor contract
 */
export const sendToAnchor = async (card: {
  name: string;
  metadata_url: string;
  rarity: string;
  element_type: string;
}) => {
  // Generate PDA for card account
  const [cardPda, bump] = await PublicKey.findProgramAddress(
    [Buffer.from("card"), Buffer.from(card.name)],
    program.programId
  );

  // Call Anchor instruction
  const tx = await program.methods
    .publishCard(
      card.name,
      card.metadata_url,
      card.rarity,
      card.element_type,
    )
    .accounts({
      card: cardPda,
      admin: walletKeypair.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("Card published with tx:", tx);

  return {
    cardPda: cardPda.toBase58(),
    tx,
  };
};
