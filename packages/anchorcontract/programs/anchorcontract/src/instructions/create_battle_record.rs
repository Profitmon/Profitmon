use anchor_lang::prelude::*;
use crate::accounts::*;

#[derive(Accounts)]
pub struct CreateBattleRecord<'info> {
    #[account(mut)]
    pub player1_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub player2_account: Account<'info, UserAccount>,
    #[account(init, payer = player1_account, space = 8 + 500)]
    pub battle_record: Account<'info, BattleRecord>,
    #[account(mut)]
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateBattleRecord>, 
    winner: Option<Pubkey>, 
    result_note: String
) -> Result<()> {
    let battle = &mut ctx.accounts.battle_record;
    let timestamp = clock::Clock::get()?.unix_timestamp as i64;

    battle.id = timestamp as u64;
    battle.player1 = ctx.accounts.player1_account.wallet;
    battle.player2 = ctx.accounts.player2_account.wallet;
    battle.winner = winner;
    battle.stake = 0;
    battle.platform_fee = 0;
    battle.winner_amount = 0;
    battle.start_time = timestamp;
    battle.end_time = Some(timestamp);
    battle.status = "completed".to_string();
    battle.result_note = result_note;

    ctx.accounts.player1_account.battles.push(battle.key());
    ctx.accounts.player2_account.battles.push(battle.key());

    Ok(())
}
