const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

function openPort() {
    app.get('/', (req, res) => res.send('Bot is running!'));
    app.listen(PORT, '0.0.0.0',() => {
        console.log(`Web service is running on port ${PORT}`);
    });
}

module.exports = { openPort };