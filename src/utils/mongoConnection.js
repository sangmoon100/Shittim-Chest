const {MongoClient} = require('mongodb');

const uri = process.env.MONGO_URI;
const dbClient = new MongoClient(uri);

async function connectToMongo() {
    try {
        await dbClient.connect();
        console.log("✅ MongoDB Atlas 연결 성공");
        return dbClient;
    } catch (e) {
        console.error("Error connecting to MongoDB", e);
    } finally {
        await dbClient.close();
    }
}

async function getCollection(name) {
  await dbClient.connect();
  const db = dbClient.db("ShittimChest"); // 원하는 DB 이름
  return db.collection(name);
}


module.exports = { connectToMongo, getCollection, dbClient };