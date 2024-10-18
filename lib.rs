use anchor_lang::prelude::*;

declare_id!("ECxNNCekfqJ4J7u2ZCYdrZCZxdg5st5gtVbBEsq1x8fm");

// define wallet state for tracking the transfer hook

#[account]
pub struct WalletState {
    pub owner: Pubkey, //owner of the wallet
    pub is_transfer_on: bool, //switch: true = on, false = off
}

#[derive(Accounts)]
pub struct ToggleTransferSwitch<'info> {
    #[account(mut, has_one = owner)]
    pub wallet_state: Account<'info, wallet_state>,
    pub owner: Signer<'info>, //Signer
}

#[program]
pub mod transfer_hook_transfer_switch {
    use super::*;

    pub fn toggle_transfer(ctx: Context<ToggleTransferSwitch>, new_state: bool) -> Result<()> {
        let wallet_state = &mut ctx.accounts.wallet_state;
        wallet_state.is_transfer_on = new_state;
        Ok(())
    }

    pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        let sender_wallet_state = &ctx.accounts.sender_wallet_state;   // Sender's state
        let recipient_wallet_state = &ctx.accounts.recipient_wallet_state; // Recipient's state
    
        // Block transfer if the sender's transfer switch is off
        require!(sender_wallet_state.is_transfer_on, ErrorCode::TransferNotAllowed);
    
        // Block transfer if the recipient's transfer switch is off
        require!(recipient_wallet_state.is_transfer_on, ErrorCode::TransferNotAllowed);
    
        // Proceed with token transfer logic here...
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TransferHook<'info> {
    pub sender_wallet_state: Account<'info, WalletState>,   // The state account of the sender
    pub recipient_wallet_state: Account<'info, WalletState>, // The state account of the recipient
    
}

#[error_code]
pub enum ErrorCode {
    #[msg("Transfer is not allowed on this wallet.")] TransferNotAllowed,
}