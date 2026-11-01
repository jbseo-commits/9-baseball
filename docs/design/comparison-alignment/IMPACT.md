# 비교판 A 구도 보정 — 구현 전 영향도

2026-10-29 KST · 기준a93fbde · 사용자 screenshot: 타자 왼쪽 잘림/구장과 배우 어긋남. 이전 비교 검수에서 실제 source 발 anchor까지 대조하지 못했다.

측정: 440폭/350구장에서 u3.52, V15 READY512×768 cell(frameleft−49px) 실제발x≈140,y763, 비교판 배우 높이는 원화480px(기존600~650px보다 작게)로 등록이 화면왼쪽에붙음. defaultViolet는실제256atlas사용, source발194/256=.758과stance.757은일치하며 genericfallback이라고단정하지않는다. 배경941×1672의rubber(644,844),home(468,1355),왼쪽타석발(120,1460)을 기준으로 source기반compare-only기하를등록한다.

| 축 | 영향 | 대응 |
|---|---|---|
| UI/레이아웃 | 있음 | Aiframe원래portrait폭<=440/가능높이. .bc-legacy-host안에서만그림/배우발등록·구장높이보정. 타자모든pose silhouette의좌우잘림/발/마운드를실제그림으로검증. hand/grid/버튼의 DOM·입력·크기 유지, 9존은 배우를 가리지 않는 오른쪽 하단에 배치. |
| 입력/제스처 | 확인 | 같은DOM/callback. nativeviewport축소하지않고부모/자식스크롤·카드swipe·존touch·Inspector검증. |
| 게임/밸런스 | 없음 | engine/cards/판정/에너지/fixture값불변. |
| 저장/불러오기 | 없음 | 비교메모리상태/메시지유지,실제저장sentinel확인. |
| 모바일viewport | 있음 | 390/440/667/844/1440/1920에서A/B탭·나란히·standalone. B가로는변경없음. |
| 스크롤/overflow | 있음 | A전체구장·hand를 원래 비율로 표시하고 필요하면 native 세로 스크롤. 전역overflow없음. |
| 기존흐름 | 확인 | 일반main/legacyfallback/newView모션무변경. compareA만독립bgzoom해제하여발/배경드리프트방지. 준비/공접근/접촉/팔로스루회귀. |
| 테스트 | 있음 | sourceanchor순수기하,pose별bounds/foot vs실제landmark,iframe폭/전환/초기화/숨김진행/전체suite/smoke. |
| 빌드/배포 | 있음 | 새그림·패키지없음. build/60MiB,같은PR66branch게시후공개이미지재검수. |
