// mongo-adapter.ts
import { MongoClient, Db, Collection } from 'mongodb';

export class MongoDBAdapter {
    private db: Db | undefined;
    private collection: Collection | undefined;

    constructor(private uri: string, private dbName: string, private collectionName: string) {}

    async connect() {
        const client = new MongoClient(this.uri);
        await client.connect();
        this.db = client.db(this.dbName);
        this.collection = this.db.collection(this.collectionName);
    }

    async writeCredentials(publicKey: string, credentials: any) {
        if (!this.collection) throw new Error('Database not connected');
        await this.collection.updateOne({ publicKey }, { $set: credentials }, { upsert: true });
    }

    async readCredentials(publicKey: string) {
        if (!this.collection) throw new Error('Database not connected');
        return this.collection.findOne({ publicKey });
    }
}