const fs = require('fs');
const path = require('path');
const { loadAllSchoolsData } = require('./loadAllSchoolsData');

// Mock loadAllSchoolsDataFromMongo to avoid MongoDB requirement in tests
jest.mock('./loadAllSchoolsData', () => {
    const actual = jest.requireActual('./loadAllSchoolsData');
    return {
        ...actual,
        loadAllSchoolsDataFromMongo: jest.fn(async () => {
            return [
                {
                    school: "몽고테스트학교",
                    clubs: [{ club: "몽고동아리", students: [{ name: "몽고학생", birthday: "02/12" }] }]
                }
            ];
        })
    };
});

describe('loadAllSchoolsData', () => {
    const testDir = path.join(__dirname, 'test_schools');

    beforeAll(() => {
        // 테스트용 디렉토리 생성
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        // 정상 파일
        fs.writeFileSync(
            path.join(testDir, 'validSchool.json'),
            JSON.stringify({
                school: "테스트학교",
                clubs: [
                    { club: "동아리A", students: [{ name: "홍길동", birthday: "02/12" }] },
                    { club: "동아리B", students: [{ name: "김철수", birthday: "03/15" }] }
                ]
            }, null, 4)
        );

        // 필드 누락된 파일
        fs.writeFileSync(
            path.join(testDir, 'invalidSchool.json'),
            JSON.stringify({
                clubs: [{ club: "동아리C", students: [] }]
            }, null, 4)
        );

        // 잘못된 JSON 파일
        fs.writeFileSync(
            path.join(testDir, 'broken.json'),
            "{ school: '깨진학교' " // JSON 문법 오류
        );
    });

    afterAll(() => {
        // 테스트 파일 정리
        fs.rmSync(testDir, { recursive: true, force: true });
    });

    test('정상 파일을 불러오면 schools 배열에 포함된다', () => {
        const data = loadAllSchoolsData(testDir);
        expect(data.schools.length).toBeGreaterThan(0);
        expect(data.schools[0].school).toBe("테스트학교");
    });

    test('필드 누락된 파일은 스킵된다', () => {
        const data = loadAllSchoolsData(testDir);
        const hasInvalid = data.schools.some(s => !s.school || !s.clubs);
        expect(hasInvalid).toBe(false);
    });

    test('깨진 JSON 파일은 로드 실패 처리된다', () => {
        const data = loadAllSchoolsData(testDir);
        expect(Array.isArray(data.schools)).toBe(true);
    });

    test('clubs 배열이 올바른 구조를 가진다', () => {
        const data = loadAllSchoolsData(testDir);
        const school = data.schools[0];
        expect(Array.isArray(school.clubs)).toBe(true);
        expect(school.clubs[0]).toHaveProperty('club');
        expect(school.clubs[0]).toHaveProperty('students');
        expect(Array.isArray(school.clubs[0].students)).toBe(true);
    });

    test('students 배열이 올바른 구조를 가진다', () => {
        const data = loadAllSchoolsData(testDir);
        const school = data.schools[0];
        const student = school.clubs[0].students[0];
        expect(student).toHaveProperty('name');
        expect(student).toHaveProperty('birthday');
    });
});
