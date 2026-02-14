const { loadAllSchoolsDataFromMongo } = require('../utils/loadAllSchoolsData');
const { allSchoolsData } = require('../utils/init');
const { buildEmbed } = require('../utils/embedHelper');
const { getRandomIndex } = require('./randomGenerator'); // costum random index generator

let tempSchool = null;

function randomStudent(studentsData, schoolName = null) {
    let totalStudent;
    let studentName;
    if (schoolName) {
        const school = studentsData.schools.find(s => s.school === schoolName);
        if (!school) {
            throw new Error("학교를 찾을 수 없습니다.");
        }
        totalStudent = school.clubs.flatMap(club => club.students);
        console.log(`Selected School: ${schoolName}, Students Count: ${totalStudent.length}`);
    } else {
        // school → clubs → students 구조 순회
        totalStudent = studentsData.schools.flatMap(school => 
            school.clubs.flatMap(club => club.students)
        ); // ES6 flatMap 사용하여 모든 학생을 하나의 배열로 합침
    }
    const index = getRandomIndex(totalStudent.length); // 학생 수로 나눈 나머지로 인덱스 생성(범위 내)
    studentName = totalStudent[index].name;
    tempSchool = studentsData.schools.find(school => 
        school.clubs.some(club => 
            club.students.some(student => student.name === studentName)
        )
    )?.school || null; // 선택된 학생의 학교 이름 임시 저장(schoolName이 없는 경우 대비)
    return studentName;
}

async function getRandomStudent(interaction) {
    const schoolOption = interaction.options.getString('학교');
    const studentsAtSchools = allSchoolsData.schools.length > 0 ? allSchoolsData : await loadAllSchoolsDataFromMongo(); // 메모리에 데이터가 없으면 MongoDB에서 로드
    const fallbackLogoUrl = 'https://shittim-chest-bot.github.io/assets/img/logo.png';
    if (schoolOption) {
        const selectedStudent = randomStudent(studentsAtSchools, schoolOption);
        const schoolMarkUrl = studentsAtSchools.schools.find(s => s.school === schoolOption)?.schoolMarkUrl || fallbackLogoUrl;
        await interaction.reply({
            embeds: [
                // 학교별 결과를 임베드로 표시
                buildEmbed({
                    title: "당번 추첨 결과",
                    description: `학교: **${schoolOption}**\n당번: **${selectedStudent}**`,
                    thumbnailUrl: schoolMarkUrl
                })
            ]
        });
    } else { 
        const selectedStudent = randomStudent(studentsAtSchools);
        const schoolMarkUrl = tempSchool
            ? studentsAtSchools.schools.find(s => s.school === tempSchool)?.schoolMarkUrl || fallbackLogoUrl
            : fallbackLogoUrl;
        await interaction.reply({
            embeds: [
                // 전체 학교 결과를 임베드로 표시
                buildEmbed({
                    title: "당번 추첨 결과",
                    description: `학교: **${tempSchool}**\n당번: **${selectedStudent}**`,
                    thumbnailUrl: schoolMarkUrl
                })
            ]
        });
    }
}

module.exports = { getRandomStudent };