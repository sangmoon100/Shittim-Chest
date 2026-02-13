const { getCollection } = require('./mongoConnection');

async function loadAllSchoolsDataFromMongo() {
    const allDataMongo = await getCollection("schools");
    
    const allData = await allDataMongo.find({school: {$exists: true}}).toArray();

    return allData;
}

module.exports = { loadAllSchoolsDataFromMongo };