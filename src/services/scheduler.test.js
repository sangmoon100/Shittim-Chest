const { checkBirthdays } = require('./scheduler');
const { getCollection } = require('../utils/mongoConnection');

// MongoDB 의존성 모킹
jest.mock('../utils/mongoConnection', () => ({
    getCollection: jest.fn()
}));

describe('checkBirthdays', () => {
    let mockClient;
    let mockGuild;
    let mockChannel;
    let mockChannelsCol;
    let mockSchoolsCol;

    beforeEach(() => {
        // Discord 클라이언트 모킹
        mockChannel = {
            send: jest.fn().mockResolvedValue()
        };

        mockGuild = {
            id: 'guild123',
            channels: {
                cache: {
                    get: jest.fn().mockReturnValue(mockChannel)
                }
            }
        };

        mockClient = {
            guilds: {
                cache: {
                    values: jest.fn().mockReturnValue([mockGuild])
                }
            }
        };

        // MongoDB 컬렉션 모킹
        mockChannelsCol = {
            findOne: jest.fn()
        };

        mockSchoolsCol = {
            aggregate: jest.fn()
        };

        // console 모킹
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test('생일인 학생이 있을 때 메시지를 전송한다', async () => {
        // 채널 설정이 있는 경우
        mockChannelsCol.findOne.mockResolvedValue({
            guildId: 'guild123',
            channelId: 'channel456'
        });

        // 생일인 학생 데이터
        const birthdayStudents = [
            {
                school: '밀레니엄 사이언스 스쿨',
                club: '세미나',
                student: { name: '쿠로사키 코유키', birthday: '02/16' }
            }
        ];

        mockSchoolsCol.aggregate.mockReturnValue({
            toArray: jest.fn().mockResolvedValue(birthdayStudents)
        });

        getCollection.mockImplementation((name) => {
            if (name === 'channels') return mockChannelsCol;
            if (name === 'schools') return mockSchoolsCol;
        });

        await checkBirthdays(mockClient);

        // MongoDB 집계 파이프라인 호출 검증
        expect(mockSchoolsCol.aggregate).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ $unwind: expect.any(Object) }),
                expect.objectContaining({ $match: expect.any(Object) })
            ])
        );

        // 메시지 전송 검증
        expect(mockChannel.send).toHaveBeenCalledWith(
            expect.stringContaining('쿠로사키 코유키')
        );
        expect(mockChannel.send).toHaveBeenCalledWith(
            expect.stringContaining('밀레니엄 사이언스 스쿨')
        );
        expect(mockChannel.send).toHaveBeenCalledWith(
            expect.stringContaining('세미나')
        );
    });

    test('생일인 학생이 없을 때 메시지를 전송하지 않는다', async () => {
        mockChannelsCol.findOne.mockResolvedValue({
            guildId: 'guild123',
            channelId: 'channel456'
        });

        // 생일인 학생이 없음
        mockSchoolsCol.aggregate.mockReturnValue({
            toArray: jest.fn().mockResolvedValue([])
        });

        getCollection.mockImplementation((name) => {
            if (name === 'channels') return mockChannelsCol;
            if (name === 'schools') return mockSchoolsCol;
        });

        await checkBirthdays(mockClient);

        expect(mockChannel.send).not.toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('오늘 생일인 학생 0명 발견')
        );
    });

    test('채널이 설정되지 않은 경우 메시지를 전송하지 않는다', async () => {
        // 채널 설정이 없음
        mockChannelsCol.findOne.mockResolvedValue(null);

        mockSchoolsCol.aggregate.mockReturnValue({
            toArray: jest.fn().mockResolvedValue([])
        });

        getCollection.mockImplementation((name) => {
            if (name === 'channels') return mockChannelsCol;
            if (name === 'schools') return mockSchoolsCol;
        });

        await checkBirthdays(mockClient);

        expect(mockChannel.send).not.toHaveBeenCalled();
    });

    test('채널을 찾을 수 없는 경우 에러를 로깅한다', async () => {
        mockChannelsCol.findOne.mockResolvedValue({
            guildId: 'guild123',
            channelId: 'channel456'
        });

        // 채널을 찾을 수 없음
        mockGuild.channels.cache.get.mockReturnValue(null);

        mockSchoolsCol.aggregate.mockReturnValue({
            toArray: jest.fn().mockResolvedValue([])
        });

        getCollection.mockImplementation((name) => {
            if (name === 'channels') return mockChannelsCol;
            if (name === 'schools') return mockSchoolsCol;
        });

        await checkBirthdays(mockClient);

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('서버 guild123에서 채널을 찾을 수 없습니다')
        );
        expect(mockChannel.send).not.toHaveBeenCalled();
    });

    test('여러 학생의 생일을 처리한다', async () => {
        mockChannelsCol.findOne.mockResolvedValue({
            guildId: 'guild123',
            channelId: 'channel456'
        });

        const birthdayStudents = [
            {
                school: '밀레니엄 사이언스 스쿨',
                club: '세미나',
                student: { name: '쿠로사키 코유키', birthday: '02/16' }
            },
            {
                school: '게헨나 학원',
                club: '급식부',
                student: { name: '테스트 학생', birthday: '02/16' }
            }
        ];

        mockSchoolsCol.aggregate.mockReturnValue({
            toArray: jest.fn().mockResolvedValue(birthdayStudents)
        });

        getCollection.mockImplementation((name) => {
            if (name === 'channels') return mockChannelsCol;
            if (name === 'schools') return mockSchoolsCol;
        });

        await checkBirthdays(mockClient);

        expect(mockChannel.send).toHaveBeenCalledTimes(2);
        expect(mockChannel.send).toHaveBeenCalledWith(
            expect.stringContaining('쿠로사키 코유키')
        );
        expect(mockChannel.send).toHaveBeenCalledWith(
            expect.stringContaining('테스트 학생')
        );
    });

    test('MongoDB 에러 발생 시 에러를 로깅한다', async () => {
        const error = new Error('MongoDB connection failed');
        getCollection.mockRejectedValue(error);

        await checkBirthdays(mockClient);

        expect(console.error).toHaveBeenCalledWith(
            '생일 체크 중 오류 발생:',
            error
        );
    });

    test('여러 길드에서 메시지를 전송한다', async () => {
        const mockChannel2 = {
            send: jest.fn().mockResolvedValue()
        };

        const mockGuild2 = {
            id: 'guild789',
            channels: {
                cache: {
                    get: jest.fn().mockReturnValue(mockChannel2)
                }
            }
        };

        mockClient.guilds.cache.values.mockReturnValue([mockGuild, mockGuild2]);

        mockChannelsCol.findOne.mockImplementation(({ guildId }) => {
            if (guildId === 'guild123') {
                return Promise.resolve({ guildId: 'guild123', channelId: 'channel456' });
            }
            if (guildId === 'guild789') {
                return Promise.resolve({ guildId: 'guild789', channelId: 'channel999' });
            }
        });

        const birthdayStudents = [
            {
                school: '밀레니엄 사이언스 스쿨',
                club: '세미나',
                student: { name: '쿠로사키 코유키', birthday: '02/16' }
            }
        ];

        mockSchoolsCol.aggregate.mockReturnValue({
            toArray: jest.fn().mockResolvedValue(birthdayStudents)
        });

        getCollection.mockImplementation((name) => {
            if (name === 'channels') return mockChannelsCol;
            if (name === 'schools') return mockSchoolsCol;
        });

        await checkBirthdays(mockClient);

        expect(mockChannel.send).toHaveBeenCalledTimes(1);
        expect(mockChannel2.send).toHaveBeenCalledTimes(1);
    });
});
