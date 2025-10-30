use anchor_lang::prelude::*;
use crate::accounts::*;
use crate::events::*;
use crate::errors::*;
use crate::constants::ADMIN_PUBKEY;

#[derive(Accounts)]
pub struct PublishCard<'info> {
    #[account(init, payer = admin, space = 8 + 8 + 4 + 256 + 4 + 64 + 4 + 64 + 32 + 4 + 1024)] 
    // extra 1024 bytes for skills JSON
    pub card: Account<'info, PokemonCard>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<PublishCard>,
    name: String,
    metadata_url: String,
    rarity: String,
    element_type: String
) -> Result<()> {
    // ✅ Admin check
    require!(
        ctx.accounts.admin.key().to_string() == ADMIN_PUBKEY,
        ErrorCode::Unauthorized
    );

    let card = &mut ctx.accounts.card;
    card.id = Clock::get()?.unix_timestamp as u64; // unique id
    card.name = name;
    card.metadata_url = metadata_url;
    card.rarity = rarity;
    card.element_type = element_type;
    card.creator = ctx.accounts.admin.key();

    emit!(CardPublished { card_id: card.id, name: card.name.clone() });
    Ok(())
}
