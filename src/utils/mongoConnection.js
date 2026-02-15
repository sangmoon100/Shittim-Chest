const {MongoClient} = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
let dbClient;

// Only create client if URI is available
if (uri) {
    dbClient = new MongoClient(uri,{
        connectTimeoutMS: 5000, // 5초로 연결 타임아웃 설정
        maxConnecting: 20, // 최대 연결 시도 수
    });
} else {
    console.warn('⚠️ MONGO_URI not set, MongoDB connection will be disabled');
}

async function connectToMongo() {
    if (!dbClient) {
        console.warn('⚠️ MongoDB client not initialized');
        return null;
    }
    try {
        await dbClient.connect();
        console.log("✅ MongoDB Atlas 연결 성공");
        return dbClient;
    } catch (e) {
        console.error("Error connecting to MongoDB", e);
        throw e;
    }
}

async function closeMongo() {
    if (!dbClient) {
        console.warn('⚠️ MongoDB client not initialized');
        return;
    }
    try {
        await dbClient.close();
        console.log("MongoDB 연결을 종료했습니다.");
    } catch (e) {
        console.error("Error closing MongoDB connection", e);
    }
}

async function getCollection(name) {
    if (!dbClient) {
        console.warn('⚠️ MongoDB client not initialized');
        return null;
    }
    await dbClient.connect();
    const db = dbClient.db("ShittimChest"); // 원하는 DB 이름
    return db.collection(name);
}


module.exports = { connectToMongo, closeMongo, getCollection, dbClient };