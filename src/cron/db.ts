import { MongoClient, ServerApiVersion, Collection } from "mongodb";

export const client = new MongoClient(process.env.MONGO_URI!, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

enum Collections {
  BIRTHDAYS = "birthdays",
}

type Birthday = {
  date: Date;
  name: string;
  email: string;
};

export interface Db {
  [Collections.BIRTHDAYS]: Collection<Birthday>;
}

export const db: Db = {
  [Collections.BIRTHDAYS]: client.db().collection(Collections.BIRTHDAYS),
};
