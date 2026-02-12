const { openPort } = require('./webService');
const { connectToMongo } = require('./mongoConnection');
const { loadAllSchoolsDataFromMongo } = require('./loadAllSchoolsData');

// In-memory storage for all schools data
const allSchoolsData = { schools: [] };

async function init() {
    // start web service (synchronous)
    openPort();
    // MonogoDB 연결
    await connectToMongo();
    
    const data = await loadAllSchoolsDataFromMongo();
    if (Array.isArray(data)) { // 데이터가 배열인지 확인
        allSchoolsData.schools = data;
    } else if (data && data.schools) { // schools 프로퍼티가 있는지 확인
        allSchoolsData.schools = data.schools;
    }
}

module.exports = { init, allSchoolsData };