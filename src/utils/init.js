const { openPort } = require('./webService');
const { connectToMongo } = require('./mongoConnection');

function init() {
    openPort();
    connectToMongo();
}

module.exports = { init };