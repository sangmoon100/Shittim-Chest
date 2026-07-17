const fs = require('fs');
const path = require('path');
const https = require('https');

const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts');
const FONT_PATH = path.join(FONT_DIR, 'NotoSansKR-Regular.otf');
const FONT_URL = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Korean/NotoSansCJKkr-Regular.otf';

function downloadFile(url, outputPath, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        if (redirectCount > 5) {
            reject(new Error('Too many redirects while downloading Korean font.'));
            return;
        }

        const request = https.get(url, (response) => {
            const { statusCode, headers } = response;

            if (statusCode >= 300 && statusCode < 400 && headers.location) {
                response.resume();
                downloadFile(headers.location, outputPath, redirectCount + 1)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            if (statusCode !== 200) {
                response.resume();
                reject(new Error(`Failed to download font. HTTP ${statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(outputPath);
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close(resolve);
            });

            fileStream.on('error', (error) => {
                reject(error);
            });
        });

        request.on('error', (error) => {
            reject(error);
        });
    });
}

async function ensureKoreanFont() {
    if (fs.existsSync(FONT_PATH)) {
        console.log('Korean font already exists:', FONT_PATH);
        return;
    }

    fs.mkdirSync(FONT_DIR, { recursive: true });

    console.log('Downloading Korean font for canvas rendering...');

    try {
        await downloadFile(FONT_URL, FONT_PATH);
        console.log('Korean font downloaded:', FONT_PATH);
    } catch (error) {
        console.warn('Could not download Korean font automatically:', error.message);
        console.warn('Calendar image text may be broken in environments without Korean system fonts.');
    }
}

ensureKoreanFont();
