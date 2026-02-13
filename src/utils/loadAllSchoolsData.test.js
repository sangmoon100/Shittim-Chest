const { loadAllSchoolsDataFromMongo } = require('./loadAllSchoolsData');
const { getCollection } = require('./mongoConnection');

// MongoDB 의존성을 제거하기 위해 getCollection을 모킹
jest.mock('./mongoConnection', () => ({
    getCollection: jest.fn()
}));

describe('loadAllSchoolsDataFromMongo', () => {
    test('returns data from Mongo collection', async () => {
        // 컬렉션 조회 결과를 흉내내는 데이터
        const mockData = [
            { school: 'TestSchool', clubs: [{ club: 'TestClub', students: [] }] }
        ];
        // find() -> toArray() 체인 모킹
        const toArray = jest.fn().mockResolvedValue(mockData);
        const find = jest.fn().mockReturnValue({ toArray });

        // getCollection이 find를 가진 객체를 반환하도록 설정
        getCollection.mockResolvedValue({ find });

        // 실제 함수 호출
        const result = await loadAllSchoolsDataFromMongo();

        // 호출 인자와 반환값 검증
        expect(getCollection).toHaveBeenCalledWith('schools');
        expect(find).toHaveBeenCalledWith({ school: { $exists: true } });
        expect(result).toEqual(mockData);
    });
});
