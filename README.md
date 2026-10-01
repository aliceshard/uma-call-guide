# 우마무스메 라이브 콜 가이드

data 폴더에 곡 파일(.json)을 넣으면 곡 목록에 자동으로 나타나는 콜 가이드입니다.
곡이 몇 개든 코드는 고치지 않습니다. Vaundy 2026 Seoul 떼창 가이드의 구조를 바탕으로 만들었습니다.

## 파일 구성

```
index.html                      ← 본체 (이벤트 정보 · 화면 · 동작)
sw.js                           ← 오프라인 저장
manifest.json, icon-*.png       ← 홈 화면 설치
data/                           ← ★ 곡 파일을 넣는 곳 (곡마다 .json 하나)
  _예시-곡-파일.json             ← 형식 예시 (이름이 _ 로 시작해서 목록에는 안 나옴)
scripts/build-song-index.mjs    ← data 폴더를 훑어 곡 목록(data/index.json)을 만드는 스크립트
.github/workflows/deploy.yml    ← 올릴 때마다 위 스크립트를 돌리고 사이트를 배포
```

## 곡 추가하기

1. 곡 파일을 만듭니다 (형식은 아래, 또는 `data/_예시-곡-파일.json` 을 복사해서 고치기).
2. 저장소의 `data` 폴더에 올립니다. 여러 곡을 한꺼번에 올려도 됩니다.
3. 1~2분 뒤 사이트 곡 목록에 나타납니다.

곡을 빼려면 data 폴더에서 그 파일을 지우거나, 이름 앞에 `_` 를 붙이면 됩니다.

### 곡 파일 형식

```json
{
  "title": "곡 제목",
  "youtube": "https://www.youtube.com/watch?v=영상ID",
  "sub": "",
  "order": 1,
  "chance": 7,
  "cards": [
    { "time": 1.3, "action": "", "jp": "", "kr": "", "pron": "", "call": "" }
  ]
}
```

- `title` — 목록과 곡 화면에 나오는 제목. 없으면 파일 이름.
- `youtube` — watch, youtu.be, shorts 링크 모두 됩니다. 비우면 영상 없이 타이머로 진행합니다.
- `order` — 목록 순서이자 곡 번호(게이트 색) 순서. 작을수록 위. 없으면 맨 뒤에 제목 가나다순.
- `chance` — 이번 라이브에서 부를 확률(팬 예상) 1~10. 곡 목록에 별 5개로 표시됩니다
  (10 = 별 5개, 7 = 별 3개 반, 1 = 별 반 개). 9~10 거의 확실, 7~8 높음, 5~6 보통, 3~4 낮음, 1~2 희박.
  비워 두면 별을 표시하지 않습니다. 소수는 반올림, 범위를 벗어나면 1이나 10으로 맞추고 경고합니다.
- `cards` 한 줄 — `time`(초) · `action`(동작, 노랑) · `jp`(원문) · `kr`(번역) · `pron`(독음) · `call`(콜, 분홍)
- 줄 어디에든 `[oi] [clap] [wave] [jump] [cheer] [sing]` 을 적으면 아이콘이 들어갑니다.
- 파일 이름이 곡 주소가 됩니다: `data/abc.json` → `#/song/abc`. 영문 소문자·숫자·하이픈을 권장해요
  (띄어쓰기가 있으면 하이픈으로 바뀝니다).
- 파일은 UTF-8로 저장해 주세요.

### 파일에 실수가 있으면

- 닫는 따옴표 빠짐, 목록 끝에 남은 쉼표는 자동으로 고쳐서 목록에 넣고, 곡 목록 화면과
  Actions 기록에 노란 경고로 알려 줍니다. 파일도 고쳐 주세요.
- 그 밖의 문법 오류는 그 파일만 목록에서 빠지고, 몇 번째 줄이 문제인지 곡 목록 화면과
  Actions 기록(빨간 표시)에 나옵니다.

### 올리기 전에 미리보기

사이트 곡 목록 화면 맨 아래 "운영자 도구"에서 곡 파일을 여러 개 골라 내 기기에서만 목록에 넣어 볼 수 있어요.
가사 줄 목록만 있는 JSON에 제목·유튜브 링크를 붙여 곡 파일로 저장하는 도구도 같은 곳에 있습니다.

## 배포 (GitHub Pages + Actions)

1. Public 저장소에 이 폴더의 내용물을 올립니다.
   - `.github` 폴더는 숨김 폴더라 맥 Finder에서 안 보일 수 있습니다. 안 올라갔다면 저장소에서
     Add file → Create new file → 이름 칸에 `.github/workflows/deploy.yml` 입력 → 내용을 붙여 넣고 Commit.
2. Settings → Pages → Build and deployment 의 Source 를 **GitHub Actions** 로 바꿉니다.
3. Actions 탭에서 "사이트 배포"가 초록색 체크가 되면 `https://아이디.github.io/저장소이름/` 에서 열립니다.

이후 파일을 올릴 때마다 자동으로 다시 배포되고, 오프라인 캐시 버전(sw.js)도 자동으로 올라갑니다.
`data/index.json` 은 배포할 때 자동으로 만들어지니 저장소에 올리지 마세요.

Actions 없이(Source: Deploy from a branch) 올려도 사이트가 GitHub API로 data 폴더를 읽어 동작하지만,
API는 같은 인터넷 주소에서 시간당 60번까지만 허용돼 공연장에서 막힐 수 있고, 따옴표 자동 고침 경고가
Actions 기록에 남지 않습니다. 공연용이라면 Actions 방식을 권장합니다.
개인 도메인을 붙였다면 index.html 의 `CONFIG.github` 에 `{ owner:"아이디", repo:"저장소이름" }` 을 적어 주세요.

## 내 컴퓨터에서 테스트

```
python -m http.server
```

폴더에서 실행한 뒤 `http://localhost:8000` 을 열면 data 폴더 목록을 읽어 곡을 표시합니다.
index.html 을 더블클릭해서 열면 data 폴더를 읽을 수 없어 곡이 보이지 않습니다.

## 이벤트 정보 고치기

index.html 위쪽 `CONFIG` — 이벤트 이름, 공연 일정(카운트다운), 당일 타임라인, 장소, 링크, 공지 이미지.
비워 두면 해당 카드가 빠집니다.
