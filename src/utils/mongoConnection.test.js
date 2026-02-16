const buildMongoClientMock = () => {
    const collection = jest.fn();
    const db = jest.fn().mockReturnValue({ collection });
    const connect = jest.fn().mockResolvedValue();
    const close = jest.fn().mockResolvedValue();
    return { client: { connect, close, db }, collection, db, connect, close };
};

describe('mongoConnection', () => {
    const originalEnv = process.env.MONGO_URI;

    afterEach(() => {
        process.env.MONGO_URI = originalEnv;
        jest.resetModules();
        jest.unmock('mongodb');
    });

    describe('URI가 없을 때', () => {
        test('connectToMongo는 null을 반환한다', async () => {
            delete process.env.MONGO_URI;
            await jest.isolateModules(async () => {
                const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
                const { connectToMongo } = require('./mongoConnection');

                const result = await connectToMongo();

                expect(result).toBeNull();
                expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ MongoDB client not initialized');
                consoleWarnSpy.mockRestore();
            });
        });

        test('closeMongo는 경고만 출력한다', async () => {
            delete process.env.MONGO_URI;
            await jest.isolateModules(async () => {
                const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
                const { closeMongo } = require('./mongoConnection');

                await closeMongo();

                expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ MongoDB client not initialized');
                consoleWarnSpy.mockRestore();
            });
        });

        test('getCollection은 null을 반환한다', async () => {
            delete process.env.MONGO_URI;
            await jest.isolateModules(async () => {
                const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
                const { getCollection } = require('./mongoConnection');

                const result = await getCollection('schools');

                expect(result).toBeNull();
                expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ MongoDB client not initialized');
                consoleWarnSpy.mockRestore();
            });
        });
    });

    describe('URI가 있을 때', () => {
        test('connectToMongo는 MongoClient.connect를 호출하고 클라이언트를 반환한다', async () => {
            await jest.isolateModules(async () => {
                process.env.MONGO_URI = 'mongodb://test:27017';
                const mock = buildMongoClientMock();
                jest.doMock('mongodb', () => ({
                    MongoClient: jest.fn(() => mock.client)
                }));

                const { connectToMongo } = require('./mongoConnection');
                const client = await connectToMongo();

                expect(mock.connect).toHaveBeenCalledTimes(1);
                expect(client).toBe(mock.client);
            });
        });

        test('connectToMongo는 연결 실패 시 에러를 던진다', async () => {
            await jest.isolateModules(async () => {
                process.env.MONGO_URI = 'mongodb://test:27017';
                const mock = buildMongoClientMock();
                mock.connect.mockRejectedValueOnce(new Error('Connection failed'));
                jest.doMock('mongodb', () => ({
                    MongoClient: jest.fn(() => mock.client)
                }));

                const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
                const { connectToMongo } = require('./mongoConnection');

                await expect(connectToMongo()).rejects.toThrow('Connection failed');
                consoleErrorSpy.mockRestore();
            });
        });

        test('closeMongo는 MongoClient.close를 호출한다', async () => {
            await jest.isolateModules(async () => {
                process.env.MONGO_URI = 'mongodb://test:27017';
                const mock = buildMongoClientMock();
                jest.doMock('mongodb', () => ({
                    MongoClient: jest.fn(() => mock.client)
                }));

                const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
                const { closeMongo } = require('./mongoConnection');
                await closeMongo();

                expect(mock.close).toHaveBeenCalledTimes(1);
                consoleLogSpy.mockRestore();
            });
        });

        test('closeMongo는 close 실패 시 에러를 로그하지만 던지지는 않는다', async () => {
            await jest.isolateModules(async () => {
                process.env.MONGO_URI = 'mongodb://test:27017';
                const mock = buildMongoClientMock();
                mock.close.mockRejectedValueOnce(new Error('Close failed'));
                jest.doMock('mongodb', () => ({
                    MongoClient: jest.fn(() => mock.client)
                }));

                const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
                const { closeMongo } = require('./mongoConnection');

                await closeMongo();

                expect(consoleErrorSpy).toHaveBeenCalledWith('Error closing MongoDB connection', expect.any(Error));
                consoleErrorSpy.mockRestore();
            });
        });

        test('getCollection은 지정된 컬렉션을 반환한다', async () => {
            await jest.isolateModules(async () => {
                process.env.MONGO_URI = 'mongodb://test:27017';
                const mock = buildMongoClientMock();
                jest.doMock('mongodb', () => ({
                    MongoClient: jest.fn(() => mock.client)
                }));

                const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
                const { getCollection } = require('./mongoConnection');
                const result = await getCollection('schools');

                expect(mock.connect).toHaveBeenCalledTimes(1);
                expect(mock.db).toHaveBeenCalledWith('ShittimChest');
                expect(mock.collection).toHaveBeenCalledWith('schools');
                expect(result).toBe(mock.collection.mock.results[0].value);
                consoleLogSpy.mockRestore();
            });
        });
    });
});
