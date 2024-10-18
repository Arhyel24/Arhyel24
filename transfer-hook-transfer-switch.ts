import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from '@solana/web3.js';
import { assert } from 'chai';
import { TransferHookTransferSwitch } from '../target/types/transfer-hook-transfer-switch';

describe('transfer-hook-transfer-switch', () => {
  // Configure the client to use the devnet cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.TransferHookTransferSwitch as Program<TransferHookTransferSwitch>;

  // Generate new keypairs for the sender and recipient wallets
  const senderKeypair = new Keypair();
  const recipientKeypair = new Keypair();

  // Initialize sender and recipient wallet state
  it('Initialize Sender and Recipient Wallets', async () => {
    await program.methods
      .initializeWallet()
      .accounts({
        walletState: senderKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([senderKeypair])
      .rpc();

    await program.methods
      .initializeWallet()
      .accounts({
        walletState: recipientKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([recipientKeypair])
      .rpc();

    const senderState = await program.account.walletState.fetch(senderKeypair.publicKey);
    const recipientState = await program.account.walletState.fetch(recipientKeypair.publicKey);

    // Ensure both wallets have their transfer switch initialized as true (on)
    assert(senderState.isTransferOn === true, 'Expected sender transfer switch to be true');
    assert(recipientState.isTransferOn === true, 'Expected recipient transfer switch to be true');
  });

  // Toggle the recipient's transfer switch off
  it('Toggle Recipient Transfer Switch Off', async () => {
    await program.methods
      .toggleTransfer(false)  // Turn off transfer switch
      .accounts({
        walletState: recipientKeypair.publicKey,
        owner: recipientKeypair.publicKey,
      })
      .signers([recipientKeypair])
      .rpc();

    const recipientState = await program.account.walletState.fetch(recipientKeypair.publicKey);
    assert(recipientState.isTransferOn === false, 'Expected recipient transfer switch to be false');
  });

  // Attempt to transfer when recipient's switch is off (should fail)
  it('Attempt Transfer with Recipient Switch Off (Should Fail)', async () => {
    try {
      await program.methods
        .transferHook(new anchor.BN(100))  // Try to transfer 100 tokens
        .accounts({
          senderWalletState: senderKeypair.publicKey,
          recipientWalletState: recipientKeypair.publicKey,
        })
        .signers([senderKeypair])
        .rpc();

      // If the transfer succeeds, throw an error because it shouldn't
      throw new Error('Transfer should have failed, but it succeeded');
    } catch (err) {
      assert(err.toString().includes('Transfer is not allowed for this wallet'), 'Expected transfer to be blocked');
    }
  });

  // Toggle recipient's transfer switch back on
  it('Toggle Recipient Transfer Switch On', async () => {
    await program.methods
      .toggleTransfer(true)  // Turn on transfer switch
      .accounts({
        walletState: recipientKeypair.publicKey,
        owner: recipientKeypair.publicKey,
      })
      .signers([recipientKeypair])
      .rpc();

    const recipientState = await program.account.walletState.fetch(recipientKeypair.publicKey);
    assert(recipientState.isTransferOn === true, 'Expected recipient transfer switch to be true');
  });

  // Attempt transfer when recipient's switch is on (should succeed)
  it('Attempt Transfer with Recipient Switch On (Should Succeed)', async () => {
    await program.methods
      .transferHook(new anchor.BN(100))  // Transfer 100 tokens
      .accounts({
        senderWalletState: senderKeypair.publicKey,
        recipientWalletState: recipientKeypair.publicKey,
      })
      .signers([senderKeypair])
      .rpc();

    // No need to assert here since if the transfer goes through, it means success
    console.log('Transfer succeeded as expected');
  });
});
