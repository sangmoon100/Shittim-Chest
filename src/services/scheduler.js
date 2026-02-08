const { getCollection } = require("../utils/mongoConnection");
const { loadAllSchoolsData } = require('../utils/loadAllSchoolsData');

function checkBirthdays(client, studentsData = loadAllSchoolsData()) {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${month}/${day}`;
    
    try {
        const channelsCol = getCollection("channels");
        
        client.guilds.cache.forEach(async (guild) => { // 모든 길드(서버) 순회
            const channelId = await channelsCol.findOne({ guildId: guild.id }); // 해당 길드의 채널 ID 가져오기
            if (channelId) {
                const channel = guild.channels.cache.get(channelId); // 채널 가져오기
                if (!channel) {
                    console.error(`서버 ${guild.id}에서 채널을 찾을 수 없습니다: ${channelId}`);
                    return; // continue와 동일하게 다음 반복으로 넘어감
                }
                if (channel) {
                    // 학생들 중 오늘 생일인 사람 찾기
                    // school → clubs → students 구조 순회
                    studentsData.schools.forEach(school => {
                        school.clubs.forEach(club => {
                            club.students.forEach(student => {
                                if (student.birthday === todayStr) {
                                    const channel = client.channels.cache.get(channelId); // Bot이 속한 서버에서 채널 가져오기
                                    if (channel) {
                                        channel.send(
                                            `🎂 오늘은 **${student.name}** (${school.school}/${club.club})의 생일입니다! 축하해 주세요! 🎉`
                                        );
                                    }
                                }
                            });
                        });
                    });
                } else {
                    console.error(`서버 ${guild.id}에서 채널을 찾을 수 없습니다: ${channelId}`);
                }
            }
        });
    } catch (error) {
        console.error("생일 체크 중 오류 발생:", error);
    }
}

module.exports = { checkBirthdays };