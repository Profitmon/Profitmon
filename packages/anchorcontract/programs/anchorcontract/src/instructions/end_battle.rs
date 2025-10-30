use anchor_lang::prelude::*;
use crate::accounts::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct EndBattle<'info> {
    #[account(mut)]
    pub battle: Account<'info, BattleRecord>,
    #[account(mut)]
    pub winner: AccountInfo<'info>,
    #[account(mut)]
    pub platform: AccountInfo<'info>,
    #[account(mut)]
    pub escrow: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<EndBattle>) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    require!(battle.status == "active", ErrorCode::BattleInactive);

    let total_stake = battle.stake.checked_mul(2).unwrap();
    let platform_fee = total_stake / 10;
    let winner_amount = total_stake.checked_sub(platform_fee).unwrap();

    **ctx.accounts.escrow.try_borrow_mut_lamports()? -= winner_amount;
    **ctx.accounts.winner.try_borrow_mut_lamports()? += winner_amount;

    **ctx.accounts.escrow.try_borrow_mut_lamports()? -= platform_fee;
    **ctx.accounts.platform.try_borrow_mut_lamports()? += platform_fee;

    battle.winner = Some(ctx.accounts.winner.key());
    battle.platform_fee = platform_fee;
    battle.winner_amount = winner_amount;
    battle.status = "completed".to_string();
    battle.end_time = Some(clock::Clock::get()?.unix_timestamp);

    Ok(())
}
