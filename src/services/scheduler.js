const { getCollection } = require("../utils/mongoConnection");

async function checkBirthdays(client, studentsAtSchools) {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${month}/${day}`;
    console.log(`오늘 날짜: ${todayStr} 🎂 - 생일 체크 시작`);
    try {
        const channelsCol = await getCollection("channels");

        for (const guild of client.guilds.cache.values()) { // 모든 길드(서버) 순회
            const channelDoc = await channelsCol.findOne({ guildId: guild.id }); // 해당 길드의 채널 문서 가져오기
            if (channelDoc && channelDoc.channelId) {
                const targetChannel = guild.channels.cache.get(channelDoc.channelId); // 채널 가져오기
                if (!targetChannel) {
                    console.error(`서버 ${guild.id}에서 채널을 찾을 수 없습니다: ${channelDoc.channelId}`);
                    continue; // 다음 반복으로 넘어감
                }

                // 학생들 중 오늘 생일인 사람 찾기
                // school → clubs → students 구조 순회 (동기적 배열이므로 for-of 사용)
                for (const school of studentsAtSchools.schools) {
                    for (const club of school.clubs) {
                        for (const student of club.students) {
                            if (student.birthday === todayStr) {
                                if (targetChannel) {
                                    await targetChannel.send(
                                        `🎂 오늘은 **${student.name}** (${school.school}/${club.club})의 생일입니다! 축하해 주세요! 🎉`
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("생일 체크 중 오류 발생:", error);
    }
}

module.exports = { checkBirthdays };