use anchor_lang::prelude::*;
use crate::accounts::*;

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(init, payer = user, space = 8 + 32 + (32 * 100) + (32 * 50))]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeUser>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    user_account.wallet = ctx.accounts.user.key();
    user_account.cards_owned = vec![];
    user_account.battles = vec![];
    Ok(())
}