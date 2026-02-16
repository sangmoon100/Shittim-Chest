const { getCollection } = require("../utils/mongoConnection");

async function checkBirthdays(client) {
    const today = new Date();
    const options = { timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit" };
    const todayStr = today.toLocaleDateString("ko-KR", options);
    console.log(`오늘 날짜: ${todayStr} 🎂 - 생일 체크 시작`);
    try {
        const channelsCol = await getCollection("channels");
        const schoolsCol = await getCollection("schools");

        // MongoDB 집계 파이프라인으로 오늘 생일인 학생 조회
        const getBirthday = [
            {
                "$unwind": {
                    "path": "$clubs",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$unwind": {
                    "path": "$clubs.students",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$match": {
                    "clubs.students.birthday": {
                        "$regex": todayStr
                    }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "school": 1,
                    "club": "$clubs.club",
                    "student": "$clubs.students"
                }
            }
        ];

        const birthdayStudents = await schoolsCol.aggregate(getBirthday).toArray();
        console.log(`오늘 생일인 학생 ${birthdayStudents.length}명 발견`);

        for (const guild of client.guilds.cache.values()) { // 모든 길드(서버) 순회
            const channelDoc = await channelsCol.findOne({ guildId: guild.id }); // 해당 길드의 채널 문서 가져오기
            if (channelDoc && channelDoc.channelId) {
                const targetChannel = guild.channels.cache.get(channelDoc.channelId); // 채널 가져오기
                if (!targetChannel) {
                    console.error(`서버 ${guild.id}에서 채널을 찾을 수 없습니다: ${channelDoc.channelId}`);
                    continue; // 다음 반복으로 넘어감
                }

                // 오늘 생일인 학생들에게 축하 메시지 전송
                for (const item of birthdayStudents) {
                    await targetChannel.send(
                        `🎂 오늘은 **${item.student.name}** (${item.school}/${item.club})의 생일입니다! 축하해 주세요! 🎉`
                    );
                }
            }
        }
    } catch (error) {
        console.error("생일 체크 중 오류 발생:", error);
    }
}

module.exports = { checkBirthdays };