#[derive(Accounts)]
pub struct HatchEgg<'info> {
    #[account(mut)]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub system_program: Program<'info, System>,

    // Dynamic account for each CardInstance
    #[account(init, payer = user_account, space = 8 + 8 + 8 + 32 + 8, seeds=[b"card_instance", user_account.key().as_ref(), &card_id.to_le_bytes()], bump)]
    pub card_instance: Account<'info, CardInstance>,
}
