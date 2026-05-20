const {MongoClient} = require('mongodb');

const uri = process.env.MONGO_URI;
let dbClient;
let isConnected = false;
let connectPromise = null;

function isTrue(value) {
    return String(value).toLowerCase() === 'true';
}

function buildMongoClientOptions() {
    const options = {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 15000,
        maxConnecting: 20,
    };

    // Atlas(SRV)는 TLS가 기본이지만, 명시해 두면 환경 차이에서 안정적이다.
    if (uri && uri.startsWith('mongodb+srv://')) {
        options.tls = true;
    }

    // 운영 기본값은 false, 문제 분석 시에만 .env에서 켤 수 있도록 분리
    if (isTrue(process.env.MONGO_TLS_ALLOW_INVALID_CERTS)) {
        options.tlsAllowInvalidCertificates = true;
        console.warn('⚠️ MONGO_TLS_ALLOW_INVALID_CERTS=true is enabled (debug only)');
    }
    if (isTrue(process.env.MONGO_TLS_ALLOW_INVALID_HOSTNAMES)) {
        options.tlsAllowInvalidHostnames = true;
        console.warn('⚠️ MONGO_TLS_ALLOW_INVALID_HOSTNAMES=true is enabled (debug only)');
    }

    if (process.env.MONGO_TLS_CA_FILE) {
        options.tlsCAFile = process.env.MONGO_TLS_CA_FILE;
    }

    return options;
}

function logMongoConnectionHints(error) {
    const message = error?.message || '';
    if (message.includes('tlsv1 alert internal error') || message.includes('SSL alert number 80')) {
        console.error('MongoDB TLS handshake failed. Check the following:');
        console.error('- MONGO_URI host is Atlas SRV (mongodb+srv://...) and credentials are correct');
        console.error('- Atlas Network Access includes your current IP / hosting outbound IP');
        console.error('- System clock is correct and outbound 27017/443 is not blocked by firewall/proxy');
        console.error('- If corporate proxy is used, try setting MONGO_TLS_CA_FILE to the proxy root CA');
    }
}

async function ensureConnected() {
    if (!dbClient) {
        return null;
    }

    if (isConnected) {
        return dbClient;
    }

    if (!connectPromise) {
        connectPromise = dbClient.connect()
            .then(() => {
                isConnected = true;
                console.log('✅ MongoDB Atlas 연결 성공');
                return dbClient;
            })
            .finally(() => {
                connectPromise = null;
            });
    }

    return connectPromise;
}

// Only create client if URI is available
if (uri) {
    dbClient = new MongoClient(uri, buildMongoClientOptions());
} else {
    console.warn('⚠️ MONGO_URI not set, MongoDB connection will be disabled');
}

async function connectToMongo() {
    if (!dbClient) {
        console.warn('⚠️ MongoDB client not initialized');
        return null;
    }
    try {
        return await ensureConnected();
    } catch (e) {
        console.error("Error connecting to MongoDB", e);
        logMongoConnectionHints(e);
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
        isConnected = false;
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
    await ensureConnected();
    const db = dbClient.db("ShittimChest"); // 원하는 DB 이름
    return db.collection(name);
}


module.exports = { connectToMongo, closeMongo, getCollection, dbClient };