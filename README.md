# 전국 캠핑장 탐색

전국 캠핑장을 목록/지도에서 찾아보고, 사진과 시설 정보를 확인하고, 리뷰를 남기고, 예약 사이트로 바로 이동할 수 있는 웹앱입니다.

## 지금 상태

API 키를 아직 설정하지 않아서 **샘플(목업) 데이터 8곳**으로 동작합니다. 화면 상단에 "샘플 데이터"라고 표시되면 아직 실제 데이터가 아니라는 뜻이에요. 아래 키를 설정하면 자동으로 실제 데이터로 전환됩니다.

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

### 2. 카카오맵 API 키 (지도 표시)

1. https://developers.kakao.com 접속 후 로그인
2. 애플리케이션 추가 → JavaScript 키 복사
3. 플랫폼 설정에서 Web 플랫폼에 `http://localhost:3000` 등록
4. `.env.local`에 추가

```
NEXT_PUBLIC_KAKAO_MAP_KEY=발급받은키
```

`.env.local` 예시는 `.env.example` 파일을 참고하세요. 키를 넣은 뒤 개발 서버를 재시작(`Ctrl+C` 후 `npm run dev`)하면 반영됩니다.

## 주요 기능

- 목록/검색: 캠핑장 이름, 주소, 지역으로 검색 (`src/components/ExplorerView.tsx`)
- 지도: 카카오맵에 캠핑장 위치 마커 표시, 목록과 연동 (`src/components/CampsiteMap.tsx`)
- 상세 페이지: 사진, 소개, 시설, 전화/예약 링크 (`src/app/campsites/[id]/page.tsx`)
- 리뷰: 이 사이트에 직접 별점/후기를 남기는 자체 리뷰 기능. `data/reviews.json`에 저장됩니다 (`src/lib/reviews.ts`)
- 예약 연결: 고캠핑 데이터의 홈페이지 링크로 바로 연결 (별도 예약 시스템은 없고, 각 캠핑장 홈페이지/예약 페이지로 이동합니다)

## 폴더 구조

```
src/
  app/
    page.tsx                 메인 목록+지도 페이지
    campsites/[id]/page.tsx  캠핑장 상세 페이지
    api/campsites/route.ts   캠핑장 목록 API
    api/reviews/[id]/route.ts 리뷰 조회/등록 API
  components/
    ExplorerView.tsx  검색+목록+지도 레이아웃
    CampsiteMap.tsx   카카오맵 컴포넌트
    ReviewSection.tsx 리뷰 목록/작성 폼
  lib/
    campsites.ts       고캠핑 API 연동 + 목업 폴백
    mock-campsites.ts  샘플 데이터
    reviews.ts          리뷰 파일 저장소
    types.ts             타입 정의
data/reviews.json  리뷰 저장 파일 (자동 생성, git에는 올라가지 않음)
```

## 알아두면 좋은 점

- 리뷰는 로컬 JSON 파일에 저장되는 간단한 방식입니다. 나중에 여러 사람이 같이 쓰는 서비스로 키우려면 실제 데이터베이스(Supabase, PlanetScale 등)로 옮기는 게 좋아요.
- 고캠핑 API에는 "리뷰"가 없어서, 리뷰는 이 사이트 자체 기능으로 만들었습니다.
- 예약은 각 캠핑장이 자체 운영하는 시스템(홈페이지, 네이버 예약, 캠핑톡 등)을 쓰기 때문에, 이 사이트에서는 "예약 사이트로 이동" 링크만 제공합니다.
