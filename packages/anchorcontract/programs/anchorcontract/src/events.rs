use anchor_lang::prelude::*;

#[event]
pub struct CardPublished {
    pub card_id: u64,
    pub name: String,
}

#[event]
pub struct CardInstanceCreated {
    pub instance_id: u64,
    pub card_id: u64,
    pub owner: Pubkey,
}

#[event]
pub struct EggHatched {
    pub user: Pubkey,
    pub instances: Vec<u64>, // instance IDs
}


#[event]
pub struct BattleEnded {
    pub battle_id: u64,
    pub winner: Pubkey,
    pub reward: u64,
}