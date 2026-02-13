const buildMongoClientMock = () => {
    const collection = jest.fn();
    const db = jest.fn().mockReturnValue({ collection });
    const connect = jest.fn().mockResolvedValue();
    const close = jest.fn().mockResolvedValue();
    return { client: { connect, close, db }, collection, db, connect, close };
};

describe('mongoConnection', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    test('connectToMongo는 MongoClient.connect를 호출하고 클라이언트를 반환한다', async () => {
        // MongoClient를 모킹해서 실제 연결을 막는다
        const mock = buildMongoClientMock();
        jest.mock('mongodb', () => ({
            MongoClient: jest.fn(() => mock.client)
        }));

        const { connectToMongo } = require('./mongoConnection');

        const client = await connectToMongo();

        expect(mock.connect).toHaveBeenCalledTimes(1);
        expect(client).toBe(mock.client);
    });

    test('closeMongo는 MongoClient.close를 호출한다', async () => {
        // close 호출 여부만 검증
        const mock = buildMongoClientMock();
        jest.mock('mongodb', () => ({
            MongoClient: jest.fn(() => mock.client)
        }));

        const { closeMongo } = require('./mongoConnection');

        await closeMongo();

        expect(mock.close).toHaveBeenCalledTimes(1);
    });

    test('getCollection은 지정된 컬렉션을 반환한다', async () => {
        // DB/컬렉션 체인을 정상 호출하는지 확인
        const mock = buildMongoClientMock();
        jest.mock('mongodb', () => ({
            MongoClient: jest.fn(() => mock.client)
        }));

        const { getCollection } = require('./mongoConnection');

        const result = await getCollection('schools');

        expect(mock.connect).toHaveBeenCalledTimes(1);
        expect(mock.db).toHaveBeenCalledWith('ShittimChest');
        expect(mock.collection).toHaveBeenCalledWith('schools');
        expect(result).toBe(mock.collection.mock.results[0].value);
    });
});
