# 전국 캠핑장 탐색

전국 캠핑장을 목록/지도에서 찾아보고, 사진과 시설 정보를 확인하고, 예약 사이트로 바로 이동할 수 있는 웹앱입니다.

배포 주소: https://jucamp.vercel.app

## 실행 방법

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속.

## 실제 데이터 연결하기

### 1. 고캠핑 API 키 (전국 캠핑장 데이터)

1. https://www.data.go.kr 접속 후 회원가입/로그인 (본인이 직접 진행)
2. "고캠핑" 검색 → **한국관광공사_고캠핑정보 서비스** 활용신청
3. 승인 후 마이페이지에서 발급받은 **일반 인증키(Decoding)** 복사
4. 프로젝트 루트에 `.env.local` 파일을 만들고 아래처럼 입력

```
GOCAMPING_API_KEY=발급받은키
```

키가 없으면 샘플(목업) 데이터 8곳으로 동작합니다.

### 2. 카카오맵 API 키 (지도 표시)

1. https://developers.kakao.com 접속 후 로그인
2. 애플리케이션 추가 → 플랫폼 키에서 JavaScript 키 복사
3. JS SDK 도메인에 `http://localhost:3000`(및 배포 도메인) 등록
4. 제품 설정 > 카카오맵에서 사용 설정을 켜기
5. `.env.local`에 추가

```
NEXT_PUBLIC_KAKAO_MAP_KEY=발급받은키
```

`.env.local` 예시는 `.env.example` 파일을 참고하세요. 키를 넣은 뒤 개발 서버를 재시작(`Ctrl+C` 후 `npm run dev`)하면 반영됩니다.

## 주요 기능

- 목록/검색: 캠핑장 이름, 주소, 지역으로 검색, 모바일에서는 목록/지도 탭으로 전환 (`src/components/ExplorerView.tsx`)
- 지도: 카카오맵에 캠핑장 위치를 클러스터 마커로 표시, 마커 클릭 시 미리보기 팝업 → 상세 페이지 이동 (`src/components/CampsiteMap.tsx`)
- 상세 페이지: 사진, 소개, 시설, 전화/예약 링크 (`src/app/campsites/[id]/page.tsx`)
- 예약 연결: 홈페이지가 있으면 바로 연결, 없거나 SNS 링크뿐이면 네이버 지도 검색으로 대체 연결 (`src/lib/links.ts`)

## 폴더 구조

```
src/
  app/
    page.tsx                 메인 목록+지도 페이지
    campsites/[id]/page.tsx  캠핑장 상세 페이지
    api/campsites/route.ts   캠핑장 목록 API
  components/
    ExplorerView.tsx  검색+목록+지도 레이아웃
    CampsiteMap.tsx   카카오맵 컴포넌트
  lib/
    campsites.ts    고캠핑 API 연동(전체 페이지네이션) + 목업 폴백
    mock-campsites.ts  샘플 데이터
    links.ts        예약/홈페이지 링크 판별 로직
    types.ts        타입 정의
```

## 알아두면 좋은 점

- 고캠핑 API는 페이지당 최대 500개씩 전체를 가져와 서버에서 1시간 캐시합니다.
- Vercel은 요청마다 파일 시스템이 초기화되므로, 방문자 수 집계 같은 상태를 저장하는 기능을 추가하려면 로컬 파일이 아니라 실제 데이터베이스(Vercel KV/Upstash 등)가 필요합니다.
