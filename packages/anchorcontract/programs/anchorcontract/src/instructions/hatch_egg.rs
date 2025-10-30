use anchor_lang::prelude::*;
use crate::accounts::*;
use crate::events::*;
use crate::errors::*;
use crate::constants::ADMIN_PUBKEY;
use bs58;
use std::str::FromStr;

#[derive(Accounts)]
pub struct HatchEgg<'info> {
    /// 🧑‍💼 Admin signer (backend)
    #[account(mut)]
    pub admin: Signer<'info>,

    /// ⚙️ System Program
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<HatchEgg>,
    user: Pubkey,
    card_ids: Vec<u64>,
    egg_id: String,
    metadata_urls: Vec<String>,
    user_signature: String,
    admin_signature: String,
    user_payload: String,
    admin_payload: String,
) -> Result<()> {
    // ✅ 1. Verify admin authority
    require!(
        ctx.accounts.admin.key().to_string() == ADMIN_PUBKEY,
        ErrorCode::Unauthorized
    );
    require!(card_ids.len() == metadata_urls.len(), ErrorCode::InvalidInput);

    // ✅ 2. Verify admin signature
    let admin_pubkey = Pubkey::from_str(ADMIN_PUBKEY).unwrap();
    let admin_message = admin_payload.as_bytes();
    let admin_sig = bs58::decode(admin_signature)
        .into_vec()
        .map_err(|_| ErrorCode::InvalidSignature)?;
    admin_pubkey
        .verify(admin_message, &admin_sig)
        .map_err(|_| ErrorCode::InvalidSignature)?;

    // ✅ 3. Verify user signature
    let user_message = user_payload.as_bytes();
    let user_sig = bs58::decode(user_signature)
        .into_vec()
        .map_err(|_| ErrorCode::InvalidSignature)?;
    user.verify(user_message, &user_sig)
        .map_err(|_| ErrorCode::InvalidSignature)?;

    // ✅ 4. Create CardInstance PDAs
    for (i, card_id) in card_ids.iter().enumerate() {
        let metadata_url = &metadata_urls[i];

        // generate a unique instance_id (you can also pass from backend)
        let instance_id = Clock::get()?.unix_timestamp as u64 + i as u64;

        // derive PDA for this card instance
        let (pda, _bump) = Pubkey::find_program_address(
            &[b"card_instance", user.as_ref(), &instance_id.to_le_bytes()],
            ctx.program_id,
        );

        // Create the on-chain account for CardInstance
        let lamports = Rent::get()?.minimum_balance(CardInstance::LEN);
        let space = CardInstance::LEN as u64;
        let system_program = ctx.accounts.system_program.to_account_info();

        anchor_lang::system_program::create_account(
            CpiContext::new(
                system_program,
                anchor_lang::system_program::CreateAccount {
                    from: ctx.accounts.admin.to_account_info(),
                    to: AccountInfo::new(
                        &pda,
                        false,
                        true,
                        &mut [],
                        &mut [],
                        ctx.program_id,
                        false,
                        0,
                    ),
                },
            ),
            lamports,
            space,
            ctx.program_id,
        )?;

        // write data to CardInstance struct
        let mut instance_data: Account<CardInstance> = Account::try_from(&AccountInfo::new(
            &pda,
            false,
            true,
            &mut [],
            &mut [],
            ctx.program_id,
            false,
            0,
        ))?;

        instance_data.instance_id = instance_id;
        instance_data.card_id = *card_id;
        instance_data.owner = user;
        instance_data.metadata_url = metadata_url.clone();
        instance_data.acquired_at = Clock::get()?.unix_timestamp;

        // ✅ Emit event for frontend/backend tracking
        emit!(CardInstanceCreated {
            instance_id,
            card_id: *card_id,
            owner: user,
        });
    }

    Ok(())
}
