# <img src="assets/images/schalelogo2.png" alt="logo" width="30" height="30" /> Shittim-Chest

디스코드 기반 블루아카이브 유틸 봇

## ⚙️ 기능

다음 명령어들을 제공합니다 (`/` 슬래시 명령어 기반):

- `미래시`: 커뮤니티/자료 링크 모음(미래시 사이트)
- `토먼트조합`: 총력전/대결전 도우미 사이트
- `샬레디비`: 캐릭터/데이터베이스 사이트 링크 제공
- `지역공략`: 지역 공략 도우미 사이트 링크 제공
- `샬레당번추첨`: 샬레 당번 학생을 무작위로 추첨합니다 (옵션: 📚 학교 지정)
- `알람등록`: 생일 알림을 보낼 채널을 등록합니다 (서버당 1채널)

자동 동작:

- 🎂 생일 알림: 매일 자정(Asia/Seoul)에 학생의 생일을 체크하여 등록된 채널로 알림을 전송합니다.

📚 학교 목록: 아비도스, 아리우스, 게헨나, 하이랜더, 백귀야행, 밀레니엄, 붉은겨울, 산해경, SRT, 트리니티, 발키리, 와일드헌트

## 🧰 기술 스택
- Node.js
- discord.js v14
- express (웹 프레임워크)
- node-cron (작업 스케줄링)
- dotenv (환경 설정)
- Jest (테스팅)
- MongoDB (데이터베이스)

## � 프로젝트 구조

```
src/
├── commands/         # 슬래시 명령어 핸들러
├── services/         # 비즈니스 로직 (생일 체크, 스케줄 등)
├── utils/            # 유틸리티 함수 (데이터 로드, 초기화 등)
data/
├── commands.json     # 봇 명령어 정의
├── channels.json     # 서버별 알람 채널 설정
├── students.json     # 학생 정보 (선택적, 초기 데이터)
schools/             # 학교별 학생 JSON 파일
assets/
└── images/          # 로고 및 아이콘
```

## �📦 설치 및 실행

```bash
npm install
npm start
npm test
```

## ⚙️ 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수들을 설정하세요:

```
# Discord Bot Token (Discord Developer Portal에서 발급)
TOKEN=your_discord_bot_token_here

# MongoDB 연결 문자열
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

**참고:**
- `TOKEN`: Discord Developer Portal에서 봇 생성 후 토큰 복사
- `MONGODB_URI`: MongoDB Atlas 또는 로컬 MongoDB 연결 문자열
- 민감한 정보는 `.env` 파일에만 저장하고 절대 버전 관리에 추가하지 마세요

## 🚀 명령어 배포

```bash
node deploy-commands.js
```

## 📡 호스팅 및 모니터링

- 호스팅: Render.com Web Service에 리포지토리를 연결하여 배포합니다. 서비스 설정에서 `Start Command`를 `npm start`로 지정하고 필요한 환경 변수(DISCORD 토큰 등)를 등록하세요.

- 헬스 체크 (UptimeRobot): UptimeRobot에서 새 모니터를 추가합니다.
	- Monitor Type: `HTTP(s)`
	- URL: `https://<your-service>.onrender.com/` (또는 앱의 `/health` 엔드포인트)
	- Interval: 5분 권장

- 알림 수신(Discord Webhook): UptimeRobot의 Alert Contact로 `Webhook`을 추가하고, Discord의 Incoming Webhook URL을 입력하면 서비스 다운/복구 알림을 해당 채널로 받을 수 있습니다.

- 팁: 더 정확한 체크를 위해 애플리케이션에 간단한 `/health`(200 OK) 엔드포인트를 구현하면 좋습니다. UptimeRobot이 해당 엔드포인트를 호출해 정상 동작 여부를 판단합니다.

예시: UptimeRobot 설정 요약

```text
Monitor: HTTP(s)  https://your-service.onrender.com/  (Interval: 5 minutes)
Alert Contact: Webhook  https://discord.com/api/webhooks/....
```

