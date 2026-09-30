# 꿈을 잃은 세계

장편소설 「꿈을 잃은 세계」(가제)의 설정집과 원고입니다.

- 웹에서 읽기와 쓰기: https://jjsjb88-alt.github.io/lost-dreams-novel/
- 설정집: [`settings/`](settings/)
- 원고: [`manuscript/`](manuscript/)
- AI 작업 규칙: [`AGENTS.md`](AGENTS.md)

## 쓰는 방법

**1. 저장소를 직접 고칠 수 있는 AI 채팅 (Claude Code, Codex 등)**
이 저장소를 연결하고 "지금까지 이야기 설정집에 올려줘", "1화 써줘"라고 말하면 됩니다. AI가 `AGENTS.md`를 읽고 알맞은 파일을 고쳐서 올립니다.

**2. 저장소를 읽기만 하는 AI 채팅 (일반 ChatGPT 등)**
채팅에서 글을 받은 다음 웹의 **새 화 쓰기**나 **고치기**에 붙여넣고 **GitHub에 저장**을 누르세요. 처음 한 번은 웹의 **GitHub 연결** 화면에서 토큰을 등록해야 합니다.

## 로컬에서 미리보기

```bash
node scripts/build-manifest.mjs
npx serve .
```
