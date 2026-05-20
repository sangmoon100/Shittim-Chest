const fs = require('fs');
const path = require('path');
const { createCanvas, registerFont } = require('canvas');
const { getCollection } = require("../utils/mongoConnection");

const CALENDAR_FONT_FAMILY = 'ShittimCalendarKR';
let hasRegisteredKoreanFont = false;

function setupCalendarFont() {
    const bundledFontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansKR-Regular.ttf');
    const windowsFontPath = 'C:/Windows/Fonts/malgun.ttf';

    try {
        if (fs.existsSync(bundledFontPath)) {
            registerFont(bundledFontPath, { family: CALENDAR_FONT_FAMILY });
            hasRegisteredKoreanFont = true;
            return;
        }

        if (fs.existsSync(windowsFontPath)) {
            registerFont(windowsFontPath, { family: CALENDAR_FONT_FAMILY });
            hasRegisteredKoreanFont = true;
            return;
        }
    } catch (error) {
        console.warn('캘린더 폰트 로딩 실패, 시스템 기본 폰트로 진행합니다:', error.message);
    }
}

setupCalendarFont();

function fitTextToWidth(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) {
        return text;
    }

    let shortened = text;
    while (shortened.length > 1 && ctx.measureText(`${shortened}...`).width > maxWidth) {
        shortened = shortened.slice(0, -1);
    }

    return `${shortened}...`;
}

// School color mapping (11 schools)
const SCHOOL_COLORS = {
    '트리니티 종합학원': '#FF6B9D',      // Pink
    '아비도스 고등학교': '#FFB266',        // Orange
    '게헨나 학원': '#9B59B6',       // Purple
    '밀레니엄 사이언스 스쿨': '#3498DB',    // Blue
    '아리우스 분교': '#95A5A6',         // Gray
    '붉은겨울 연방학원': '#E74C3C',     // Red
    '발키리 경찰학교': '#F39C12',      // Gold
    '산해경 고급중학교': '#16A085',   // Teal
    'SRT 특수학원': '#2ECC71',           // Green
    '백귀야행 연합학원': '#8E44AD',    // Dark Purple
    '와일드헌트 예술학원': '#34495E'       // Dark Gray
};

/**
 * Get calendar data for a specific month
 * @param {number} year - Year (e.g., 2026)
 * @param {number} month - Month (1-12)
 * @returns {Promise<Object>} Calendar data with events by date
 */
async function getCalendarData(year, month) {
    try {
        const schoolsCol = await getCollection("schools");
        const eventsCol = await getCollection("events");

        // Format month as MM
        const monthStr = String(month).padStart(2, '0');

        // Get birthdays for this month using aggregation pipeline
        const birthdayPipeline = [
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
                        "$regex": `^${monthStr}/`
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

        const birthdays = await schoolsCol.aggregate(birthdayPipeline).toArray();

        // Get events for this month
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        
        const events = await eventsCol.find({
            $or: [
                { startDate: { $gte: firstDay, $lte: lastDay } },
                { endDate: { $gte: firstDay, $lte: lastDay } },
                { 
                    startDate: { $lte: firstDay },
                    endDate: { $gte: lastDay }
                }
            ]
        }).toArray();

        // Organize data by date
        const calendarData = {};
        
        // Add birthdays
        for (const item of birthdays) {
            const [_, day] = item.student.birthday.split('/');
            const date = parseInt(day);
            
            if (!calendarData[date]) {
                calendarData[date] = [];
            }
            
            calendarData[date].push({
                name: item.student.name,
                type: 'birthday',
                school: item.school,
                club: item.club,
                color: SCHOOL_COLORS[item.school?.toLowerCase()] || '#95A5A6'
            });
        }

        // Add events
        for (const event of events) {
            const startDate = new Date(event.startDate);
            const endDate = event.endDate ? new Date(event.endDate) : startDate;
            
            // Add event to all dates it spans in this month
            const startDay = startDate.getMonth() === month - 1 ? startDate.getDate() : 1;
            const endDay = endDate.getMonth() === month - 1 ? endDate.getDate() : lastDay.getDate();
            
            for (let day = startDay; day <= endDay; day++) {
                if (!calendarData[day]) {
                    calendarData[day] = [];
                }
                
                calendarData[day].push({
                    name: event.name,
                    type: event.type || 'event',
                    school: event.school || 'event',
                    color: event.color || SCHOOL_COLORS[event.school?.toLowerCase()] || '#E67E22',
                    description: event.description,
                    rangeStartDay: startDay,
                    rangeEndDay: endDay
                });
            }
        }

        return calendarData;
    } catch (error) {
        console.error("캘린더 데이터 조회 중 오류:", error);
        return {};
    }
}

/**
 * Generate calendar image for a specific month
 * @param {number} year - Year (e.g., 2026)
 * @param {number} month - Month (1-12)
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateCalendarImage(year, month) {
    const WIDTH = 900;
    const HEIGHT = 700;
    const PADDING = 40;
    const HEADER_HEIGHT = 80;
    const LEGEND_HEIGHT = 60;
    const CELL_WIDTH = (WIDTH - 2 * PADDING) / 7;
    const CELL_HEIGHT = (HEIGHT - HEADER_HEIGHT - LEGEND_HEIGHT - 2 * PADDING) / 6;

    // Create canvas
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Get calendar data
    const calendarData = await getCalendarData(year, month);
    
    // Draw header
    ctx.fillStyle = '#2C3E50';
    ctx.font = `bold 32px "${CALENDAR_FONT_FAMILY}", "Malgun Gothic", "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'center';
    const monthTitle = hasRegisteredKoreanFont ? `${year}년 ${month}월` : `${year}-${String(month).padStart(2, '0')}`;
    ctx.fillText(monthTitle, WIDTH / 2, 50);

    // Draw day labels
    const days = hasRegisteredKoreanFont ? ['일', '월', '화', '수', '목', '금', '토'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    ctx.font = `bold 18px "${CALENDAR_FONT_FAMILY}", "Malgun Gothic", "Noto Sans KR", sans-serif`;
    const dayLabelY = HEADER_HEIGHT + PADDING;
    
    for (let i = 0; i < 7; i++) {
        const x = PADDING + i * CELL_WIDTH + CELL_WIDTH / 2;
        ctx.fillStyle = i === 0 ? '#E74C3C' : i === 6 ? '#3498DB' : '#2C3E50';
        ctx.fillText(days[i], x, dayLabelY);
    }

    // Calculate first day of month and total days
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    // Draw calendar grid and dates
    ctx.font = `18px "${CALENDAR_FONT_FAMILY}", "Malgun Gothic", "Noto Sans KR", sans-serif`;
    const gridStartY = dayLabelY + 20;

    for (let date = 1; date <= daysInMonth; date++) {
        const dayOffset = firstDayOfWeek + date - 1;
        const row = Math.floor(dayOffset / 7);
        const col = dayOffset % 7;

        const cellX = PADDING + col * CELL_WIDTH;
        const cellY = gridStartY + row * CELL_HEIGHT;

        // Draw cell border
        ctx.strokeStyle = '#ECF0F1';
        ctx.strokeRect(cellX, cellY, CELL_WIDTH, CELL_HEIGHT);

        // Draw date number
        ctx.fillStyle = col === 0 ? '#E74C3C' : col === 6 ? '#3498DB' : '#2C3E50';
        ctx.textAlign = 'left';
        ctx.fillText(date, cellX + 8, cellY + 22);

        // Draw event indicators
        if (calendarData[date]) {
            const events = calendarData[date];
            const birthdays = events.filter(event => event.type === 'birthday');
            const periodEvents = events
                .filter(event => event.type !== 'birthday')
                .sort((a, b) => {
                    if (a.rangeStartDay !== b.rangeStartDay) {
                        return a.rangeStartDay - b.rangeStartDay;
                    }
                    return a.name.localeCompare(b.name, 'ko');
                });

            // Period events are rendered as horizontal lines with labels.
            const maxEventLines = 3;
            const periodEventFontSize = 10;
            const periodEventLineWidth = periodEventFontSize;
            const periodEventRowGap = periodEventFontSize + 2;
            const eventLineStartX = cellX + 8;
            const eventLineEndX = cellX + CELL_WIDTH - 8;
            const eventLineStartY = cellY + 36;

            for (let i = 0; i < Math.min(periodEvents.length, maxEventLines); i++) {
                const event = periodEvents[i];
                const lineY = eventLineStartY + i * periodEventRowGap;
                const continuesLeft = date > event.rangeStartDay;
                const continuesRight = date < event.rangeEndDay;
                const drawStartX = continuesLeft ? cellX : eventLineStartX;
                const drawEndX = continuesRight ? cellX + CELL_WIDTH : eventLineEndX;

                ctx.strokeStyle = event.color;
                ctx.lineWidth = periodEventLineWidth;
                ctx.lineCap = continuesLeft || continuesRight ? 'butt' : 'round';
                ctx.beginPath();
                ctx.moveTo(drawStartX, lineY);
                ctx.lineTo(drawEndX, lineY);
                ctx.stroke();

                // Show event label only at the visible start of this month segment.
                if (!continuesLeft) {
                    ctx.fillStyle = '#2C3E50';
                    ctx.font = `${periodEventFontSize}px "${CALENDAR_FONT_FAMILY}", "Malgun Gothic", "Noto Sans KR", sans-serif`;
                    ctx.textAlign = 'left';
                    const labelStartX = eventLineStartX + 6;
                    const eventLabel = fitTextToWidth(ctx, event.name, CELL_WIDTH - (labelStartX - cellX) - 8);
                    ctx.fillText(eventLabel, labelStartX, lineY + 3);
                }
            }

            if (periodEvents.length > maxEventLines) {
                ctx.fillStyle = '#95A5A6';
                ctx.font = `bold ${periodEventFontSize}px "${CALENDAR_FONT_FAMILY}", "Malgun Gothic", "Noto Sans KR", sans-serif`;
                ctx.textAlign = 'right';
                ctx.fillText(`+${periodEvents.length - maxEventLines}`, cellX + CELL_WIDTH - 8, eventLineStartY + (maxEventLines - 1) * periodEventRowGap + 3);
            }

            // Birthdays remain as compact dots and name labels.
            const birthdayDotRadius = 3;
            const birthdayDotSpacing = 10;
            const birthdayDotStartX = cellX + 10;
            const birthdayDotY = cellY + CELL_HEIGHT - 22;

            for (let i = 0; i < Math.min(birthdays.length, 4); i++) {
                const birthday = birthdays[i];
                const dotX = birthdayDotStartX + i * birthdayDotSpacing;

                ctx.fillStyle = birthday.color;
                ctx.beginPath();
                ctx.arc(dotX, birthdayDotY, birthdayDotRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            if (birthdays.length > 0) {
                const previewNames = birthdays.slice(0, 2).map(event => event.name).join(', ');
                const suffix = birthdays.length > 2 ? ` +${birthdays.length - 2}` : '';
                const birthdayLabel = fitTextToWidth(
                    ctx,
                    `${previewNames}${suffix}`,
                    CELL_WIDTH - 16
                );

                ctx.fillStyle = '#2C3E50';
                ctx.font = `11px "${CALENDAR_FONT_FAMILY}", "Malgun Gothic", "Noto Sans KR", sans-serif`;
                ctx.textAlign = 'left';
                ctx.fillText(birthdayLabel, cellX + 8, cellY + CELL_HEIGHT - 10);
            }

            // Show "..." if more than 10 events
            if (events.length > 10) {
                ctx.fillStyle = '#95A5A6';
                ctx.font = `bold 11px "${CALENDAR_FONT_FAMILY}", "Malgun Gothic", "Noto Sans KR", sans-serif`;
                ctx.textAlign = 'right';
                ctx.fillText(`+${events.length - 10}`, cellX + CELL_WIDTH - 8, cellY + 18);
                ctx.textAlign = 'left';
            }
        }
    }

    // Draw legend
    const legendY = HEIGHT - LEGEND_HEIGHT + 20;
    const usedSchools = new Set();
    
    // Collect all schools that have events this month
    for (const date in calendarData) {
        for (const event of calendarData[date]) {
            if (event.school) {
                usedSchools.add(event.school);
            }
        }
    }

    ctx.font = `14px "${CALENDAR_FONT_FAMILY}", "Malgun Gothic", "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'left';
    let legendX = PADDING;
    const legendItemWidth = 120;

    for (const school of Array.from(usedSchools).slice(0, 7)) {
        const color = SCHOOL_COLORS[school.toLowerCase()] || '#95A5A6';
        
        // Draw color box
        ctx.fillStyle = color;
        ctx.fillRect(legendX, legendY - 8, 12, 12);
        
        // Draw school name
        ctx.fillStyle = '#2C3E50';
        ctx.fillText(school, legendX + 18, legendY + 2);
        
        legendX += legendItemWidth;
    }

    // Return image buffer
    return canvas.toBuffer('image/png');
}

/**
 * Create navigation buttons for calendar
 * @param {number} year - Current year
 * @param {number} month - Current month (1-12)
 * @returns {Object} Discord ActionRow component
 */
function createCalendarButtons(year, month) {
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    // Calculate previous and next month
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 1) {
        prevMonth = 12;
        prevYear--;
    }
    
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
        nextMonth = 1;
        nextYear++;
    }

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`cal_prev_${prevYear}_${prevMonth}`)
                .setLabel('◀ 이전 달')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`cal_next_${nextYear}_${nextMonth}`)
                .setLabel('다음 달 ▶')
                .setStyle(ButtonStyle.Primary)
        );

    return row;
}

module.exports = {
    getCalendarData,
    generateCalendarImage,
    createCalendarButtons,
    SCHOOL_COLORS
};
