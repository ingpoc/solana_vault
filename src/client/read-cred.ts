import {
    Connection, PublicKey
} from '@solana/web3.js';
import { KeyPairUtil } from './util';
import { deserialize } from 'borsh';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

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

async function readCredentials(connection: Connection, clientPubKey: PublicKey, payerPublicKey: PublicKey) {
    const accountInfo = await connection.getAccountInfo(clientPubKey);

    if (accountInfo !== null) {
        const userData = deserialize(userDataSchema, UserData, accountInfo.data);
        const salt = '9b2052b10bcfc70d707071c4847e6986';
        const iv = '152f2452bed04df88ffd5a0dc9a5b130';

        const saltBytes = Buffer.from(salt, 'hex');
        const ivBytes = Buffer.from(iv, 'hex');

        const authTagUsername = '4c7c25b99329073d45bca23b7b2eed1c';
        const authTagPassword = '65debe0c38dc25a56fe96a69b9284db7';

        const authTagUsernameBytes = Buffer.from(authTagUsername, 'hex');
        const authTagPasswordBytes = Buffer.from(authTagPassword, 'hex');

        const decryptedUsername = await KeyPairUtil.decrypt(userData.username, payerPublicKey, saltBytes, ivBytes, authTagUsernameBytes);
        const decryptedPassword = await KeyPairUtil.decrypt(userData.password, payerPublicKey, saltBytes, ivBytes, authTagPasswordBytes);
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

export async function main() {
    console.log('Reading credentials');

    const connection = await createConnection();

    const wallet = new SolflareWalletAdapter();
    await wallet.connect();
    const payerPublicKey = wallet.publicKey;

    if (payerPublicKey !== null) {
        console.log(`Payer public keyz: ${payerPublicKey.toBase58()}`);


        const SEED = 'your_seed3';
        const programIdString = 'ArrWmpZyyE7UdaPGY57QAnzHE9d2vHGtHZUDCrtY29NL'
        const programId = new PublicKey(programIdString);
        console.log(`Program public keyz: ${programId}`);

        const clientPubKey = await PublicKey.createWithSeed(payerPublicKey, SEED, programId);
        console.log(`Client public keyz: ${clientPubKey.toBase58()}`);

        const credentials = await readCredentials(connection, clientPubKey, payerPublicKey);
        console.log(`Username: ${credentials?.username}`);
        console.log(`Password: ${credentials?.password}`);

    }

}

main().catch(err => {
    console.log(err);
    // Display an error message to the user, retry the operation, etc.
});