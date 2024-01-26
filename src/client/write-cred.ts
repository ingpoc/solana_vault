import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import {
    Connection, PublicKey, Transaction,
    sendAndConfirmTransaction, SystemProgram,
    TransactionInstruction,
    Keypair,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { KeyPairUtil } from './util';
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { serialize } from 'borsh';

class UserData {
    username: Buffer;
    password: Buffer;

    constructor(username: Buffer, password: Buffer) {
        this.username = username;
        this.password = password;
    }
}

const userDataSchema = new Map([
    [UserData, {
        kind: 'struct',
        fields: [
            ['username', [16]],
            ['password', [16]],
        ],
    }],
]);


let connection: Connection | null = null;
let payerKeyPair: Keypair | null = null;
let payerPublicKey: PublicKey | null = null;
let programId: PublicKey | null = null;
let programKeypair: Keypair | null = null;
let clientPubKey: PublicKey | null = null;


// Create Connection to Solana Devnet
const SOLANA_DEVNET_URL = 'https://api.devnet.solana.com';

export async function createConnection() {
    try {
        if (!connection) {
            connection = new Connection(SOLANA_DEVNET_URL, 'confirmed');
        }
        return connection;
    } catch (error) {
        console.error('Error creating connection:', error);
        throw error;
    }
}


// Configure Client Account

export async function configureClientAccount(accountSpaceSize: number) {

    if (!payerKeyPair || !programId || !connection || !payerPublicKey) {
        throw new Error('payerKeyPair, programId, or connection is not initialized');
    }

    const SEED = process.env.SEED || 'default_seed';
    clientPubKey = await PublicKey.createWithSeed(payerPublicKey, SEED, programId);

    console.log(`Client public key: ${clientPubKey.toBase58()}`);

    // Check if the account already exists

    const accountInfo = await connection.getAccountInfo(clientPubKey);

    if (accountInfo === null) {
        console.log('Creating account');

        // Create the account
        const lamports = await connection.getMinimumBalanceForRentExemption(accountSpaceSize);
        const transaction = new Transaction().add(SystemProgram.createAccountWithSeed({
            fromPubkey: payerPublicKey,
            basePubkey: payerPublicKey,
            seed: SEED,
            newAccountPubkey: clientPubKey,
            lamports,
            space: accountSpaceSize,
            programId,
        }));
        await sendAndConfirmTransaction(connection, transaction, [payerKeyPair]);
        // Request airdrop
        console.log('Requesting airdrop');
        //const airdropSignature = await connection.requestAirdrop(clientPubKey, LAMPORTS_PER_SOL);
        // await connection.confirmTransaction(airdropSignature, 'confirmed');
        console.log('Account created');
    } else
        console.log('Account already exists');
}


// Trasact with program
export async function transactWithProgram(instructionData: Uint8Array) {

    if (!payerKeyPair || !programId || !connection || !clientPubKey) {
        throw new Error('payerKeyPair, programId, or connection is not initialized');
    }
    // Create an insstruction
    const instruction = new TransactionInstruction({
        keys: [{ pubkey: clientPubKey, isSigner: false, isWritable: true }],
        programId,
        data: Buffer.from(instructionData) // Convert Uint8Array to Buffer

    });

    // Send transaction
    const transaction = new Transaction().add(instruction);
    await sendAndConfirmTransaction(connection, transaction, [payerKeyPair]);

    console.log('Transaction sent');
}



async function main() {

    console.log('Hello, Solana!');
    // Connect to devnet
    await createConnection();

    // Get public key of the program
    programKeypair = await KeyPairUtil.getProgramKeypairFromJsonFile("program-keypair");
    programId = programKeypair.publicKey;
    console.log(`Program public key: ${programId}`);

    // Specify the payer account
    payerKeyPair = getKeypairFromEnvironment("SECRET_KEY");
    payerPublicKey = payerKeyPair.publicKey;
    console.log(`Payer public key: ${payerPublicKey.toBase58()}`);

    // Configure client account

    await configureClientAccount(32);

    try {
        // Encrypt the username and password
        const username = process.env.USERNAME || 'default_username';
        const password = process.env.PASSWORD || 'default_password';

        // Apply padding if username is less than 16 bytes
        const paddedUsername = username.padEnd(16, '\0');
        // Apply padding if password is less than 32 bytes
        const paddedPassword = password.padEnd(16, '\0');

        const encryptedUsername = await KeyPairUtil.encrypt(paddedUsername, payerKeyPair);
        const encryptedPassword = await KeyPairUtil.encrypt(paddedPassword, payerKeyPair);
        console.log('Encrypted username:', encryptedUsername.encrypted);
        console.log('Encrypted password:', encryptedPassword.encrypted);
        // Convert the encrypted username and password to bytes
        const usernameBytes = Buffer.from(encryptedUsername.encrypted, 'hex');
        const passwordBytes = Buffer.from(encryptedPassword.encrypted, 'hex');

       

        // Create a UserData instance
        const userData = new UserData(usernameBytes, passwordBytes);


        // Serialize the UserData instance into bytes
        const instructionData = serialize(userDataSchema, userData);
       

        // Transact with program
        await transactWithProgram(instructionData);

        console.log('Success');

    } catch (error) {
        console.error('An error occurred:', error);
    }



}

main().catch(err => {
    console.error(err);
    process.exit(1);
});