import dotenv from 'dotenv';
import path from 'path';
import {
    Connection, PublicKey, Keypair
} from '@solana/web3.js';
import { KeyPairUtil } from './util';
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { deserialize } from 'borsh';
import { SOLANA_DEVNET_URL, createConnection } from './write-cred';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class UserData {
    username: Buffer;
    password: Buffer;

    constructor({ username, password }: { username: Buffer, password: Buffer }) {
        this.username = username;
        this.password = password;
    }
}

 const userDataSchema = new Map([
    [UserData, {
        kind: 'struct',
        fields: [
            ['username', 'Buffer'],
            ['password', 'Buffer'],
        ],
    }],
]);

async function readCredentials(connection: Connection, clientPubKey: PublicKey, payerKeyPair: Keypair) {
    const accountInfo = await connection.getAccountInfo(clientPubKey);

    if (accountInfo !== null) {
        const userData = deserialize(userDataSchema, UserData, accountInfo.data);
        const salt = process.env.SALT || 'default_salt';
        const iv = process.env.IV || 'default_iv';
    
        const saltBytes = Buffer.from(salt, 'hex');
        const ivBytes = Buffer.from(iv, 'hex');
        const decryptedUsername = await KeyPairUtil.decrypt(userData.username.toString('hex'), payerKeyPair, saltBytes, ivBytes);
        const decryptedPassword = await KeyPairUtil.decrypt(userData.password.toString('hex'), payerKeyPair, saltBytes, ivBytes);
        return { username: decryptedUsername, password: decryptedPassword };
    }

    return null;
}

async function main() {
    console.log('Reading credentials');

    const connection = await createConnection();

    const payerKeyPair = getKeypairFromEnvironment("SECRET_KEY");
    const payerPublicKey = payerKeyPair.publicKey;
    console.log(`Payer public key: ${payerPublicKey.toBase58()}`);

    const SEED = process.env.SEED || 'default_seed';
    const programKeypair = await KeyPairUtil.getProgramKeypairFromJsonFile("program-keypair");
    const programId = programKeypair.publicKey;
    console.log(`Program public key: ${programId}`);

    const clientPubKey = await PublicKey.createWithSeed(payerPublicKey, SEED, programId);
    console.log(`Client public key: ${clientPubKey.toBase58()}`);

    const credentials = await readCredentials(connection, clientPubKey, payerKeyPair);
    console.log(`Username: ${credentials?.username}`);
    console.log(`Password: ${credentials?.password}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});