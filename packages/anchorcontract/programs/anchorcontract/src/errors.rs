use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Card not found")]
    CardNotFound,
    #[msg("Invalid input")]
    InvalidInput,
    #[msg("Battle not active.")]
    BattleInactive,
    #[msg("Invalid signature.")]
    InvalidSignature,
    #[msg("Instance not found.")]
    InstanceNotFound,
}
