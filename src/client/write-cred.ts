import dotenv from 'dotenv';
import path from 'path';
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

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

export const SOLANA_DEVNET_URL = 'https://api.devnet.solana.com';

export async function createConnection() {
    try {
        return new Connection(SOLANA_DEVNET_URL, 'confirmed');
    } catch (error) {
        console.error('Error creating connection:', error);
        throw error;
    }
}

export async function configureClientAccount(connection: Connection, payerKeyPair: Keypair, programId: PublicKey, accountSpaceSize: number) {
    const SEED = process.env.SEED || 'default_seed';
    const payerPublicKey = payerKeyPair.publicKey;
    const clientPubKey = await PublicKey.createWithSeed(payerPublicKey, SEED, programId);

    console.log(`Client public key: ${clientPubKey.toBase58()}`);

    const accountInfo = await connection.getAccountInfo(clientPubKey);

    if (accountInfo === null) {
        console.log('Creating account');

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

        console.log('Account created');
    } else {
        console.log('Account already exists');
    }

    return clientPubKey;
}

async function transactWithProgram(connection: Connection, payerKeyPair: Keypair, programId: PublicKey, clientPubKey: PublicKey, instructionData: Uint8Array) {
    const instruction = new TransactionInstruction({
        keys: [{ pubkey: clientPubKey, isSigner: false, isWritable: true }],
        programId,
        data: Buffer.from(instructionData)
    });

    const transaction = new Transaction().add(instruction);
    await sendAndConfirmTransaction(connection, transaction, [payerKeyPair]);

    console.log('Transaction sent');
}

async function main() {
    console.log('Hello, Solana!');

    const connection = await createConnection();

    const programKeypair = await KeyPairUtil.getProgramKeypairFromJsonFile("program-keypair");
    const programId = programKeypair.publicKey;
    console.log(`Program public key: ${programId}`);

    const payerKeyPair = getKeypairFromEnvironment("SECRET_KEY");
    const payerPublicKey = payerKeyPair.publicKey;
    console.log(`Payer public key: ${payerPublicKey.toBase58()}`);

    const clientPubKey = await configureClientAccount(connection, payerKeyPair, programId, 32);

    const username = process.env.USERNAME || 'default_username';
    const password = process.env.PASSWORD || 'default_password';

    const salt = process.env.SALT || 'default_salt';
    const iv = process.env.IV || 'default_iv';

    const saltBytes = Buffer.from(salt, 'hex');
    const ivBytes = Buffer.from(iv, 'hex');
    


    const paddedUsername = username.padEnd(16, '\0');
    const paddedPassword = password.padEnd(16, '\0');

    const encryptedUsername = await KeyPairUtil.encrypt(paddedUsername, payerKeyPair, saltBytes, ivBytes);
    const encryptedPassword = await KeyPairUtil.encrypt(paddedPassword, payerKeyPair, saltBytes, ivBytes);

    const usernameBytes = Buffer.from(encryptedUsername.encrypted, 'hex');
    const passwordBytes = Buffer.from(encryptedPassword.encrypted, 'hex');

    const userData = new UserData(usernameBytes, passwordBytes);
    const instructionData = serialize(userDataSchema, userData);

    await transactWithProgram(connection, payerKeyPair, programId, clientPubKey, instructionData);

    console.log('Success');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});