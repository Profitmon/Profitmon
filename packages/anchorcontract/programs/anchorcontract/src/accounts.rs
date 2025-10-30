use anchor_lang::prelude::*;

#[account]
pub struct UserAccount {
    pub wallet: Pubkey,
    // store CardInstance PDA pubkeys so instances are individually verifiable on-chain
    pub cards_owned: Vec<Pubkey>,
    // battle record PDAs
    pub battles: Vec<Pubkey>,
}

#[account]
pub struct PokemonCard {
    pub id: u64,
    pub name: String,
    pub metadata_url: String,
    pub rarity: String,
    pub element_type: String,
    pub creator: Pubkey,
}

#[account]
pub struct CardInstance {
    pub instance_id: u64,       // unique per copy
    pub card_id: u64,           // reference to base Pokémon card
    pub metadata_url: String,   // metadata for this instance
    pub owner: Pubkey,          // user's wallet
    pub acquired_at: i64,       // timestamp
}

impl CardInstance {
    pub const LEN: usize = 8 + 8 + 4 + 256 + 32 + 8; // rough space for serialization
}

#[account]
pub struct BattleRecord {
    pub id: u64,
    pub player1: Pubkey,
    pub player2: Pubkey,
    pub winner: Option<Pubkey>,
    pub stake: u64,
    pub platform_fee: u64,
    pub winner_amount: u64,
    pub start_time: i64,
    pub end_time: Option<i64>,
    pub status: String, // active | completed
    pub result_note: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Skill {
    pub name: String,
    pub skill_type: String, // attack | defense | heal
    pub power: u16,
}