require('dotenv').config();
const { getCollection, closeMongo } = require('./src/utils/mongoConnection');

/**
 * Seed calendar command and sample events into MongoDB
 */
async function seedCalendarData() {
    try {
        console.log('🌱 캘린더 데이터 시드 시작...');

        // 1. Add calendar command to commands collection
        const commandsCol = await getCollection('commands');
        
        const calendarCommand = {
            name: '캘린더',
            description: '월간 이벤트 캘린더를 표시합니다'
        };

        // Check if command already exists
        const existingCommand = await commandsCol.findOne({ name: '캘린더' });
        if (existingCommand) {
            console.log('ℹ️  캘린더 명령어가 이미 존재합니다.');
        } else {
            await commandsCol.insertOne(calendarCommand);
            console.log('✅ 캘린더 명령어 추가 완료');
        }

        // 2. Create events collection with sample data
        const eventsCol = await getCollection('events');
        
        // Clear existing events (optional - remove this line if you want to keep existing events)
        // await eventsCol.deleteMany({});

        const sampleEvents = [
            {
                name: '픽업: 타카네',
                startDate: new Date(2026, 4, 7),  // May 7, 2026
                endDate: new Date(2026, 4, 14),   // May 14, 2026
                type: 'gacha',
                school: '붉은겨울 연방학원',
                description: '통상 픽업 가챠'
            }
        ];

        // Check how many events exist
        const existingEventsCount = await eventsCol.countDocuments();
        if (existingEventsCount > 0) {
            console.log(`ℹ️  이미 ${existingEventsCount}개의 이벤트가 존재합니다.`);
            console.log('   샘플 이벤트를 추가하시겠습니까? (기존 이벤트는 유지됩니다)');
        }

        // Insert sample events
        await eventsCol.insertMany(sampleEvents);
        console.log(`✅ ${sampleEvents.length}개의 샘플 이벤트 추가 완료`);

        // 3. Verify the data
        const totalCommands = await commandsCol.countDocuments();
        const totalEvents = await eventsCol.countDocuments();
        
        console.log('\n📊 데이터 확인:');
        console.log(`   - 총 명령어 수: ${totalCommands}`);
        console.log(`   - 총 이벤트 수: ${totalEvents}`);
        
        console.log('\n✅ 시드 완료!');
        console.log('\n다음 단계:');
        console.log('1. node deploy-commands.js 를 실행하여 Discord에 명령어를 등록하세요.');
        console.log('2. node index.js 로 봇을 실행하세요.');
        console.log('3. Discord에서 /캘린더 명령어를 테스트하세요.');

    } catch (error) {
        console.error('❌ 시드 중 오류 발생:', error);
        process.exitCode = 1;
    } finally {
        await closeMongo();
    }
}

// Run the seed function
seedCalendarData();
