import dotenv from 'dotenv';
import path from 'path';
import {
    Connection, PublicKey, Keypair
} from '@solana/web3.js';
import { KeyPairUtil } from './util';
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { deserialize } from 'borsh';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class UserData {
    username: Buffer;
    password: Buffer;

    constructor({ username, password }: { username: Buffer, password: Buffer }) {
        this.username = username;
        this.password = password;
    }
}

const SOLANA_DEVNET_URL = 'https://api.devnet.solana.com';


export const userDataSchema = new Map([
    [UserData, {
        kind: 'struct',
        fields: [
            ['username', [16]],
            ['password', [16]],
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

        const authTagUsername = process.env.AUTH_TAG_USERNAME || 'default_auth_tag';
        const authTagPassword = process.env.AUTH_TAG_PASSWORD || 'default_auth_tag';

        const authTagUsernameBytes = Buffer.from(authTagUsername, 'hex');
        const authTagPasswordBytes = Buffer.from(authTagPassword, 'hex');

        const decryptedUsername = await KeyPairUtil.decrypt(userData.username, payerKeyPair, saltBytes, ivBytes, authTagUsernameBytes);
        const decryptedPassword = await KeyPairUtil.decrypt(userData.password, payerKeyPair, saltBytes, ivBytes, authTagPasswordBytes);
        return { username: decryptedUsername, password: decryptedPassword };
    }

    return null;
}

export async function createConnection() {
    try {
        return new Connection(SOLANA_DEVNET_URL, 'confirmed');
    } catch (error) {
        console.error('Error creating connection:', error);
        throw error;
    }
}

async function main() {
    console.log('Reading credentials');

    const connection = await createConnection();

    const payerKeyPair = getKeypairFromEnvironment("SECRET_KEY");
    const payerPublicKey = payerKeyPair.publicKey;
    console.log(`Payer public keyz: ${payerPublicKey.toBase58()}`);

    const SEED = process.env.SEED || 'default_seed';
    const programKeypair = await KeyPairUtil.getProgramKeypairFromJsonFile("program-keypair");
    const programId = programKeypair.publicKey;
   console.log(`Program public keyz: ${programId}`);

    const clientPubKey = await PublicKey.createWithSeed(payerPublicKey, SEED, programId);
    console.log(`Client public keyz: ${clientPubKey.toBase58()}`);

    const credentials = await readCredentials(connection, clientPubKey, payerKeyPair);
    console.log(`Username: ${credentials?.username}`);
    console.log(`Password: ${credentials?.password}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});