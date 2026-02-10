const { loadAllSchoolsData } = require('../utils/loadAllSchoolsData');

let next = 1;
let a,c = 0;
let m = 2**6;

function _init(seed) {
    //select Prim Number
    let arr = Array();
    for(let i=2;i<=seed**2;i++) {
        if(isPrim(i)&&seed<i) arr.push(i);
    }
    // simple shuffle
    arr.sort(() => Math.random() - 0.5);
    next = seed;
    arr.map((v, i) => {
        if(v>1000) a = arr[i];
        if(v>10&&v<1000) c = arr[i];
    });
}

// Prim Number check
function isPrim(num) {
    if(num<2) return false;
    if(num==2) return true;
    if(num==3) return true;
    for(var i=2;i<=parseInt(Math.sqrt(num));i++) {
        if(num%i==0) return false;
    }
    return true;
}

// Linear Congruential
// Xn+1 =(a * Xn + c) mod m
function _LinearCongruential(){
    //next = (9973 * next + 123) % m;
    next = (a * next + c) % m;
    return next;
}

_init(103);

function randomStudent(studentsData, schoolName = null) {
    let totalStudent;
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
    const index = _LinearCongruential() % totalStudent.length; // 학생 수로 나눈 나머지로 인덱스 생성(범위 내)
    return totalStudent[index].name;
}

async function getRandomStudent(interaction) {
    const schoolOption = interaction.options.getString('학교');
    if (schoolOption) {
        await interaction.reply(`당번 추첨 결과: ${randomStudent(studentsData=loadAllSchoolsData(), schoolOption)}`);
    } else { 
        await interaction.reply(`당번 추첨 결과: ${randomStudent(studentsData=loadAllSchoolsData())}`);
    }
}

module.exports = { getRandomStudent };