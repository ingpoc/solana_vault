import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { Keypair } from '@solana/web3.js';

export class KeyPairUtil {
    static async getProgramKeypairFromJsonFile(keypairjson: string): Promise<Keypair> {
        const PROGRAM_KEYPAIR_PATH = path.join(path.resolve(__dirname, '../../dist/sum'), keypairjson + '.json');

        const secretKeyString = await fs.readFile(PROGRAM_KEYPAIR_PATH, { encoding: 'utf8' });
        const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
        return Keypair.fromSecretKey(secretKey);
    }

    static generateSalt(): Buffer {
        return randomBytes(16);
    }

    static deriveKey(payerKey: string, salt: Buffer): Buffer {
        try {
            return pbkdf2Sync(payerKey, salt, 100000, 32, 'sha512');
        } catch (err) {
            console.error('Error deriving key:', err);
            throw err;
        }
    }

    static async encrypt(credential: string, payerKeyPair: Keypair, salt: Buffer, iv: Buffer): Promise<{ encrypted: string, iv: Buffer, salt: Buffer, authTag: Buffer }> {
        const key = this.deriveKey(payerKeyPair.secretKey.toString(), salt);
    
        try {
            const cipher = createCipheriv('aes-256-gcm', key, iv);
            let encrypted = cipher.update(credential, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            return { encrypted, iv, salt, authTag };
        } catch (err) {
            console.error('Error encrypting data:', err);
            throw err;
        }
    }


    static async decrypt(encryptedBuffer: Buffer, payerKeyPair: Keypair, salt: Buffer, iv: Buffer, authTag: Buffer): Promise<string> {
        const key = this.deriveKey(payerKeyPair.secretKey.toString(), salt);
    
        try {
            const decipher = createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encryptedBuffer);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
    
            // Convert decrypted data back to a string
            return decrypted.toString('utf8');
        } catch (err) {
            console.error('Error decrypting data:', err);
            throw err;
        }
    }
}