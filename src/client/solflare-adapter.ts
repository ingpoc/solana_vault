import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { Connection, Transaction, Keypair, SystemProgram } from '@solana/web3.js';

async function signTransaction() {
    // Initialize the Solflare wallet adapter
    const wallet = new SolflareWalletAdapter();

    // Connect to the wallet
    await wallet.connect();

    // Create a new connection to the Solana cluster (mainnet in this case)
    const connection = new Connection('https://api.mainnet-beta.solana.com');

    // Create a simple transaction
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: wallet.publicKey!,
            toPubkey: Keypair.generate().publicKey,
            lamports: 1000,
        })
    );

    // Sign the transaction
    const signedTransaction = await wallet.signTransaction(transaction);

    // Send the transaction
    const txid = await connection.sendRawTransaction(signedTransaction.serialize());

    console.log('Transaction sent:', txid);
}

signTransaction().catch(console.error);