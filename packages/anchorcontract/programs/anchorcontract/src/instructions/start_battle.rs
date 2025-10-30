use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct StartBattle<'info> {
    /// Player one initiates the battle
    #[account(mut)]
    pub player_one: Signer<'info>,

    /// Player two participates
    #[account(mut)]
    pub player_two: Signer<'info>,

    /// Escrow PDA to hold both players' stakes
    #[account(
        mut,
        seeds = [b"escrow", player_one.key().as_ref(), player_two.key().as_ref()],
        bump
    )]
    pub escrow_account: SystemAccount<'info>,

    /// Pokémon instances of both players
    #[account(
        mut,
        seeds = [b"pokemon_instance", player_one.key().as_ref(), player_one_pokemon.id.to_le_bytes().as_ref()],
        bump = player_one_pokemon.bump
    )]
    pub player_one_pokemon: Account<'info, PokemonInstance>,

    #[account(
        mut,
        seeds = [b"pokemon_instance", player_two.key().as_ref(), player_two_pokemon.id.to_le_bytes().as_ref()],
        bump = player_two_pokemon.bump
    )]
    pub player_two_pokemon: Account<'info, PokemonInstance>,

    /// Battle account to store info
    #[account(
        init,
        payer = player_one,
        space = Battle::SPACE,
        seeds = [b"battle", player_one.key().as_ref(), player_two.key().as_ref()],
        bump
    )]
    pub battle: Account<'info, Battle>,

    pub system_program: Program<'info, System>,
}

pub fn start_battle_handler(ctx: Context<StartBattle>, stake_amount: u64) -> Result<()> {
    let battle = &mut ctx.accounts.battle;

    battle.player_one = ctx.accounts.player_one.key();
    battle.player_two = ctx.accounts.player_two.key();
    battle.player_one_pokemon_id = ctx.accounts.player_one_pokemon.id;
    battle.player_two_pokemon_id = ctx.accounts.player_two_pokemon.id;
    battle.turn = ctx.accounts.player_one.key();
    battle.status = BattleStatus::Ongoing;
    battle.stake_amount = stake_amount;
    battle.bump = *ctx.bumps.get("battle").unwrap();

    // Transfer SOL stake from both players to escrow PDA
    let escrow_key = ctx.accounts.escrow_account.key();

    // Player 1 -> escrow
    let ix1 = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.player_one.key(),
        &escrow_key,
        stake_amount,
    );
    anchor_lang::solana_program::program::invoke(
        &ix1,
        &[
            ctx.accounts.player_one.to_account_info(),
            ctx.accounts.escrow_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Player 2 -> escrow
    let ix2 = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.player_two.key(),
        &escrow_key,
        stake_amount,
    );
    anchor_lang::solana_program::program::invoke(
        &ix2,
        &[
            ctx.accounts.player_two.to_account_info(),
            ctx.accounts.escrow_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    emit!(BattleStarted {
        battle: battle.key(),
        player_one: battle.player_one,
        player_two: battle.player_two,
        player_one_pokemon: battle.player_one_pokemon_id,
        player_two_pokemon: battle.player_two_pokemon_id,
        stake_amount,
    });

    Ok(())
}

#[event]
pub struct BattleStarted {
    #[index]
    pub battle: Pubkey,
    pub player_one: Pubkey,
    pub player_two: Pubkey,
    pub player_one_pokemon: u64,
    pub player_two_pokemon: u64,
    pub stake_amount: u64,
}
