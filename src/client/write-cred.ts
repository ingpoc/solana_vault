import {
    Connection, PublicKey, Transaction,
    SystemProgram,
    TransactionInstruction
} from '@solana/web3.js';
import { KeyPairUtil } from './util';
import { serialize } from 'borsh';
import Solflare from '@solflare-wallet/sdk';
import { Buffer } from 'buffer';

class UserData {
    username: Buffer;
    password: Buffer;

    constructor(username: Buffer, password: Buffer) {
        this.username = username;
        this.password = password;
    }
}

export const userDataSchema = new Map([
    [UserData, {
        kind: 'struct',
        fields: [
            ['username', [16]],
            ['password', [16]],
        ],
    }],
]);

const SOLANA_DEVNET_URL = 'https://api.devnet.solana.com';

const wallet = new Solflare();

wallet.on('connect', () => {
    if (wallet.publicKey) {
        console.log('Connected to wallet with public key:', wallet.publicKey.toString());
    }
});
wallet.on('disconnect', () => console.log('Disconnected from wallet'));

async function connectWallet() {
    try {
        await wallet.connect();
    } catch (err: any) {
        console.error('Failed to connect to wallet:', err.message);
        console.error(err.stack);
    }
}

async function createConnection() {
    try {
        return new Connection(SOLANA_DEVNET_URL, 'confirmed');
    } catch (error) {
        console.error('Error creating connection:', error);
        throw error;
    }
}

async function configureClientAccount(connection: Connection, payerPublicKey: PublicKey, programId: PublicKey, wallet: Solflare) {
    const SEED = 'your_seed3'; // TO DO: change this to a random string
    const clientPubKey = await PublicKey.createWithSeed(payerPublicKey, SEED, programId);

    console.log(`Client public key: ${clientPubKey.toBase58()}`);

    const accountInfo = await connection.getAccountInfo(clientPubKey);
    const { blockhash } = await connection.getLatestBlockhash("finalized")
    if (accountInfo === null) {
        console.log('Creating account');
        // Ensure the wallet is connected before using it
        const lamports = await connection.getMinimumBalanceForRentExemption(32);
        const transaction = new Transaction().add(SystemProgram.createAccountWithSeed({
            fromPubkey: payerPublicKey,
            basePubkey: payerPublicKey,
            seed: SEED,
            newAccountPubkey: clientPubKey,
            lamports,
            space: 32,
            programId,
        }));
        transaction.recentBlockhash = blockhash;

        // Sign the transaction
        const signedTransaction = await wallet.signAndSendTransaction(transaction);
        console.log('Account created');
    } else {
        console.log('Account already exists');
    }

    return clientPubKey;
}

async function transactWithProgram(connection: Connection, payerPublicKey: PublicKey, programId: PublicKey, clientPubKey: PublicKey, instructionData: Uint8Array, wallet: Solflare) {
    const { blockhash } = await connection.getRecentBlockhash("finalized");
    const instruction = new TransactionInstruction({
        keys: [{ pubkey: clientPubKey, isSigner: false, isWritable: true }],
        programId,
        data: Buffer.from(instructionData)
    });

    if (!wallet.connected) {
        console.error('Wallet is not connected');
        // Retry connection or handle error
    }
    const transaction = new Transaction().add(instruction);
    transaction.feePayer = payerPublicKey;
    const blockhashResponse = await connection.getRecentBlockhash();
    console.log(blockhashResponse);
    transaction.recentBlockhash = blockhashResponse.blockhash;

    const lastValidBlockHeight = Number(blockhashResponse.blockhash) + 150; // Fix: Convert 'blockhash' from string to number

    const signedTransaction = await wallet.signTransaction(transaction);
    const rawTransaction = await signedTransaction.serialize();

    let blockheight = await connection.getBlockHeight();

    while (blockheight < lastValidBlockHeight) {
        const transaction = new Transaction().add(instruction);
        transaction.feePayer = payerPublicKey;
        transaction.recentBlockhash = blockhashResponse.blockhash;

        const signedTransaction = await wallet.signTransaction(transaction);
        await wallet.signAndSendTransaction(signedTransaction);

        blockheight = await connection.getBlockHeight();
    }

    console.log('Transaction sent');
}

export async function main() {
    console.log('Hello, Solana!');
   
    const connection = await createConnection();
    console.log('Connection established');


    const programIdString = 'ArrWmpZyyE7UdaPGY57QAnzHE9d2vHGtHZUDCrtY29NL'
    const programId = new PublicKey(programIdString);
    console.log(`Program public key: ${programId}`);
    const wallet = new Solflare();

    
   
    await connectWallet();

    const payerPublicKey = wallet.publicKey;

    if (payerPublicKey !== null) {

        const clientPubKey = await configureClientAccount(connection, payerPublicKey, programId, wallet);

        const username = 'your_username';
        const password = 'your_password';

        const salt = '9b2052b10bcfc70d707071c4847e6986';
        const iv = '152f2452bed04df88ffd5a0dc9a5b130';

        const saltBytes = Buffer.from(salt, 'hex');
        const ivBytes = Buffer.from(iv, 'hex');



        const paddedUsername = username.padEnd(16, '\0');
        const paddedPassword = password.padEnd(16, '\0');

        const encryptedUsername = await KeyPairUtil.encrypt(paddedUsername, payerPublicKey, saltBytes, ivBytes);
        const encryptedPassword = await KeyPairUtil.encrypt(paddedPassword, payerPublicKey, saltBytes, ivBytes);

        const usernameBytes = Buffer.from(encryptedUsername.encrypted, 'hex');
        const passwordBytes = Buffer.from(encryptedPassword.encrypted, 'hex');

        const userData = new UserData(usernameBytes, passwordBytes);
        const instructionData = serialize(userDataSchema, userData);

        await transactWithProgram(connection, payerPublicKey, programId, clientPubKey, instructionData, wallet);
        await wallet.disconnect();
        console.log('Success');
    }
}