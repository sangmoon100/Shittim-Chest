const fs = require('fs');
const path = require('path');
const { getCollection } = require('./mongoConnection');

async function loadAllSchoolsDataFromMongo() {
    const allDataMongo = await getCollection("schools");
    
    const allData = await allDataMongo.find({school: {$exists: true}}).toArray();

    return allData;
}

function loadAllSchoolsData(dataDir = path.join(__dirname, '../../data/schools')) {
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

    const allData = {
        schools: []
    };

    for (const file of files) { // 각 파일 처리
        try {
            const filePath = path.join(dataDir, file);
            const rawData = fs.readFileSync(filePath, 'utf8');
            const schoolData = JSON.parse(rawData);

            // 기본 검증
            if (!schoolData.school || !schoolData.clubs) {
                console.warn(`⚠️ Skipping invalid file: ${file}`);
                continue;
            }

            allData.schools.push(schoolData); // 데이터 병합
        } catch (error) {
            console.error(`❌ Failed to load ${file}:`, error.message);
        }
    }

    return allData;
}
module.exports = { loadAllSchoolsData, loadAllSchoolsDataFromMongo };