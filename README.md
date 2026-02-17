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

- 🎂 생일 알림: 매일 아침 7시(Asia/Seoul)에 학생의 생일을 체크하여 등록된 채널로 알림을 전송합니다.

📚 학교 목록: 아비도스, 아리우스, 게헨나, 하이랜더, 백귀야행, 밀레니엄, 붉은겨울, 산해경, SRT, 트리니티, 발키리, 와일드헌트

## 🧰 기술 스택
- Node.js (LTS 권장)
- discord.js 14.25.1 (Discord API)
- express 5.2.1 (웹 프레임워크)
- node-cron 4.2.1 (작업 스케줄링)
- dotenv 17.2.3 (환경 설정)
- Jest 30.2.0 (테스팅)
- MongoDB 7.1.0 (데이터베이스)

## 프로젝트 구조

```
src/
├── commands/         # 슬래시 명령어 핸들러
├── services/         # 비즈니스 로직 (생일 체크, 스케줄 등)
├── utils/            # 유틸리티 함수 (데이터 로드, 초기화 등)
data/
├── commands.json     # 봇 명령어 정의
└── schools/          # 학교별 학생 JSON 파일 (로컬 로딩용)
assets/
└── images/          # 로고 및 아이콘
```

## 📦 설치 및 실행

```bash
npm install
npm start
npm test
```

## ⚙️ 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수들을 설정하세요:

```
# Discord Bot Token (봇 실행용)
TOKEN=your_discord_bot_token_here

# Discord Bot Token (명령어 배포용)
TOKEN_DEV=your_discord_bot_token_here

# Discord Application Client ID (명령어 배포용)
CLIENT_ID_DEV=your_client_id_here

# MongoDB 연결 문자열
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

**참고:**
- `TOKEN`: Discord Developer Portal에서 봇 생성 후 토큰 복사
- `TOKEN_DEV`, `CLIENT_ID_DEV`: 슬래시 명령어 배포 스크립트용
- `MONGO_URI`: MongoDB Atlas 연결 문자열
- 민감한 정보는 `.env` 파일에만 저장하고 절대 버전 관리에 추가하지 마세요

## 🚀 명령어 배포

```bash
node deploy-commands.js
```

## 🔄 DevOps 파이프라인

### CI (Continuous Integration)
- **플랫폼**: GitHub Actions
- **테스트**: Jest를 활용한 자동화된 테스트 실행
- **트리거**: Pull Request 및 Push 시 자동 실행
- **워크플로우**: 코드 품질 검증 및 유닛 테스트 수행

### CD (Continuous Deployment)
- **플랫폼**: Render.com
- **배포 방식**: GitHub Push Trigger 기반 자동 배포
- **트리거**: main/master 브랜치에 Push 시 자동 배포
- **배포 타입**: Background Worker (봇 실행용)
  - `Build Command`: `npm install`
  - `Start Command`: `npm start`

## 📡 호스팅

- 호스팅: Render.com에 리포지토리를 연결해 배포합니다.
- Background Worker: 봇 실행용(추천). `Build Command`는 `npm install`, `Start Command`는 `npm start`로 설정합니다.
