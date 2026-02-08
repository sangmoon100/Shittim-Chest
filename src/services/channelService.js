const { getCollection, dbClient } = require("../utils/mongoConnection");

async function registerChannel(interaction) {
    const channel = interaction.options.getChannel('채널');
    const colaction = await getCollection("channels");

    await colaction.updateOne(
        { guildId: interaction.guild.id },
        { $set: { channelId: channel.id } },
        { upsert: true } // 이미 있으면 업데이트, 없으면 삽입
    );
    await interaction.reply(`알람 채널이 ${channel.name}으로 등록되었습니다.`);
}

module.exports = { registerChannel };