# 우마무스메 라이브 콜 가이드

data 폴더에 곡 파일(.json)을 넣으면 곡 목록에 자동으로 나타나는 콜 가이드입니다.
Vaundy 2026 Seoul 떼창 가이드의 구조를 바탕으로 만들었습니다.

## 파일 구성

```
index.html                      ← 본체 (이벤트 정보 · 화면 · 동작)
sw.js                           ← 오프라인 저장
manifest.json, icon-*.png       ← 홈 화면 설치
data/                           ← ★ 곡 파일을 넣는 곳
  ms-victoria.json              ← 예시 곡 (타이밍·동작·콜만, 가사는 비어 있음)
scripts/build-song-index.mjs    ← data 폴더를 훑어 곡 목록(data/index.json)을 만드는 스크립트
.github/workflows/deploy.yml    ← 올릴 때마다 위 스크립트를 돌리고 사이트를 배포
```

## 곡 추가하기

1. 곡 파일을 만듭니다 (형식은 아래).
2. 저장소의 `data` 폴더에 올립니다.
3. 1~2분 뒤 사이트 곡 목록에 나타납니다. 코드는 고치지 않습니다.

곡 파일 형식:

```json
{
  "title": "Ms. VICTORIA",
  "youtube": "https://www.youtube.com/watch?v=vsnyQd6Ur-M",
  "sub": "",
  "order": 1,
  "cards": [
    { "time": 1.3, "action": "", "jp": "", "kr": "", "pron": "", "call": "" }
  ]
}
```

- `youtube` — watch, youtu.be, shorts 링크 모두 됩니다. 비우면 영상 없이 타이머로 진행합니다.
- `order` — 목록 순서 (작을수록 위). 없으면 제목 가나다순.
- `cards` — 친구분 사이트의 JSON 저장 형식과 같습니다.
- 파일 이름이 곡 주소가 됩니다: `data/ms-victoria.json` → `#/song/ms-victoria`
- 파일 이름이 `_`로 시작하면 목록에서 빠집니다 (임시 보관용).
- 친구분 사이트에서 저장한 배열 형식 파일도 그대로 인식하지만, 제목은 파일 이름이 되고 영상은 나오지 않습니다.

**가장 쉬운 방법:** 사이트의 곡 목록 화면 맨 아래 "곡 파일 만들기"에서 가사 JSON을 고르고
제목과 유튜브 링크를 적은 뒤 "곡 파일 저장"을 누르면 위 형식의 파일이 받아집니다.
"이 기기에서 미리보기"로 올리기 전에 내 폰·PC에서 먼저 확인할 수도 있어요.

## 처음 배포하기 (GitHub Pages + Actions)

1. Public 저장소를 만들고 이 폴더의 내용물을 올립니다.
   - `.github` 폴더는 숨김 폴더라 맥 Finder에서 안 보일 수 있습니다. 안 올라갔다면 저장소에서
     Add file → Create new file → 이름 칸에 `.github/workflows/deploy.yml` 입력 →
     deploy.yml 내용을 붙여 넣고 Commit 하세요.
2. Settings → Pages → Build and deployment 의 Source 를 **GitHub Actions** 로 바꿉니다.
3. Actions 탭에서 "사이트 배포"가 초록색 체크가 되면 `https://아이디.github.io/저장소이름/` 에서 열립니다.
   처음 한 번은 Actions 탭 → 사이트 배포 → Run workflow 로 직접 실행해도 됩니다.

이후에는 파일을 올릴 때마다 자동으로 다시 배포되고, 오프라인 캐시 버전(sw.js)도 자동으로 올라갑니다.
곡 파일 JSON에 문법 오류가 있으면 그 파일만 목록에서 빠지고, Actions 기록에 노란 경고로 표시됩니다.

`data/index.json` 은 배포할 때 자동으로 만들어지니 저장소에 올리지 마세요.

### Actions 없이 올렸을 때 (Source: Deploy from a branch)

그래도 동작합니다. 사이트가 GitHub API로 data 폴더를 직접 읽어 목록을 만듭니다.
다만 GitHub API는 같은 인터넷 주소에서 시간당 60번까지만 허용돼서, 공연장처럼 많은 사람이
같은 통신망에서 동시에 열면 막힐 수 있습니다 (마지막으로 읽은 목록을 대신 씁니다).
또 sw.js 의 `CACHE_VERSION` 을 고칠 때마다 직접 올려야 합니다. 공연용이라면 Actions 방식을 권장합니다.

개인 도메인을 붙였다면 index.html 의 `CONFIG.github` 에 `{ owner:"아이디", repo:"저장소이름" }` 을 적어 주세요.

## 내 컴퓨터에서 테스트

```
python -m http.server
```

폴더에서 실행한 뒤 `http://localhost:8000` 을 열면 data 폴더 목록을 읽어 곡을 표시합니다.
(index.html 을 더블클릭해서 열면 data 폴더를 읽을 수 없어 예시 곡만 보입니다.)

## 이벤트 정보 고치기

index.html 위쪽 `CONFIG` — 이벤트 이름, 공연 일정(카운트다운), 당일 타임라인, 장소, 링크, 공지 이미지.
비워 두면 해당 카드가 빠집니다.
