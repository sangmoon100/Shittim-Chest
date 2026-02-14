function buildEmbed({ title, description, thumbnailUrl, color = 0x00AE86 }) {
    const embed = { title, description, color };
    if (thumbnailUrl) {
        embed.thumbnail = { url: thumbnailUrl };
    }
    return embed;
}

module.exports = { buildEmbed };
