import React from "react";
import { createRoot } from "react-dom/client";
import Duel from "./duel/App.jsx";
import CinematicV2Showcase from "./duel/CinematicV2Showcase.jsx";
import {HomerunVideoPreview} from "./duel/HomerunVideo.jsx";
import {HomeRunCut} from "./duel/phone-art-v18.jsx";
import HomerV3 from "./duel/HomerV3.jsx";
import ErrorBoundary from "./duel/ErrorBoundary.jsx";
import PortraitFrame from "./duel/PortraitFrame.jsx";
import { layoutMode, watchLayoutMode } from "./duel/layout-mode.js";
import "./duel/tokens.css";
import "./duel/stack-direct-tap.js";
import "./duel/landscape-first.css";
import "./duel/landscape-scroll-fix.css";
import "./duel/character-master.css";
import "./duel/responsive-master.css";
import "./duel/sts-battleboard.js";
import "./duel/sts-battleboard.css";
import "./duel/combat-readability.js";
import "./duel/combat-readability.css";
import "./duel/v10-relic-ui.js";
import "./duel/v10-relic-ui.css";
import "./duel/landscape-declutter.js";
import "./duel/landscape-declutter.css";
import "./duel/golden-master.css";
import "./duel/v12-battle-type-hud.css";
import "./duel/v12-overflow-safe.css";
import "./duel/v12-help.css";
import "./duel/pitcher-portrait.css";
import "./duel/v12-polish.css";
import "./duel/v14-portrait-master.css";
import "./duel/portrait-lock.css";
import "./duel/battle-clarity.css";
// Cinematic V2 sheets are scene-scoped; title-pixel is a global overlay and must stay LAST
// so its panel wins the cascade. The three cinematic sheets were appended after it and
// broke that contract (tests/title-pixel.test.jsx, tests/v12-ux2-polish.test.js).
import "./duel/cinematic-director.css";
import "./duel/cinematic-commit-handoff.css";
import "./duel/cinematic-pitch-handoff.css";
import "./duel/hud-clarity.css";
import "./duel/battle-readability.css";
// A main-battle-only skin. It must follow legacy portrait rules; no global selectors.
import "./duel/asset-led-battle.css";
import "./duel/compact-battle.css";
import "./duel/title-pixel.css";
import {comparisonMode} from './duel/battle-vnext/compare-config.js';
import MemoryPreviewBoundary from './duel/battle-vnext/MemoryPreviewBoundary.jsx';
import {battleUiMode} from './duel/battle-ui-mode.js';
import './duel/battle-vnext/legacy-fallback.css';
import './duel/battle-vnext/layout.css';

const battleUi=battleUiMode(),compare=comparisonMode(window.location.search);
if(battleUi.vnext)document.documentElement.dataset.battleUi='vnext';
watchLayoutMode();
const params=new URLSearchParams(window.location.search);
const PlayableRun=React.lazy(()=>import('./duel/battle-vnext/PlayableRun.jsx'));
const BattleComparison=React.lazy(()=>import('./duel/battle-vnext/BattleComparison.jsx'));
const BattleIntegrationPreview=React.lazy(()=>import('./duel/battle-vnext/IntegrationPreview.jsx'));
const ZoneFirstPreview=React.lazy(()=>import("./duel/ZoneFirstPreview.jsx"));
const zoneFirstPreview=params.get("showcase")==="zone-first";
const showcase=params.get("showcase")==="cinematic-v2";
const homerQa=params.get("qa")==="homer";
const homerV3Qa=params.get("qa")==="homer-v3";
const homerPreview=params.get("showcase")==="homer-video";

function HomerQa(){
  const [token,setToken]=React.useState(0);
  return <main className="bp-root resolving homer-qa" style={{minHeight:"100dvh"}}>
    <section className="bp-scene fx-stage-release fx-homer cam-big" aria-label="홈런 컷신 QA">
      <div className="bp-bg bp-cam" aria-hidden="true"/>
      <div className="bp-haze" aria-hidden="true"/>
      <div className="bp-verdict good splash homer" key={token} role="status">
        <HomeRunCut/>
        <strong>홈런</strong>
        <small>HOME RUN CUTSCENE V2 · QA</small>
      </div>
    </section>
    <div className="bp-verbs next">
      <button type="button" className="bp-verb go" onClick={()=>setToken(x=>x+1)}>
        <span className="bp-verb-word">홈런 다시 보기</span>
        <small className="bp-verb-sub"><span>게임 진행 없이 컷신만 즉시 재생</span></small>
      </button>
    </div>
  </main>;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {battleUi.vnext&&params.get('battlePlay')==='1'?<MemoryPreviewBoundary><React.Suspense fallback={<p role="status">경기 준비 중…</p>}><PlayableRun/></React.Suspense></MemoryPreviewBoundary>:compare.page?<MemoryPreviewBoundary><React.Suspense fallback={<p role="status">비교 화면 준비 중…</p>}><BattleComparison/></React.Suspense></MemoryPreviewBoundary>:compare.child||compare.standalone?<MemoryPreviewBoundary><React.Suspense fallback={<p role="status">비교 화면 준비 중…</p>}><BattleIntegrationPreview fixture={battleUi.fixture} variant={compare.child||compare.standalone||'vnext'} embedded={!!compare.child}/></React.Suspense></MemoryPreviewBoundary>:battleUi.fixture ? <ErrorBoundary><React.Suspense fallback={<p role="status">검수 화면 준비 중…</p>}><BattleIntegrationPreview fixture={battleUi.fixture}/></React.Suspense></ErrorBoundary> : zoneFirstPreview ? <ErrorBoundary><React.Suspense fallback={<p role="status">전투 프리뷰 준비 중…</p>}><ZoneFirstPreview /></React.Suspense></ErrorBoundary> : homerPreview ? <ErrorBoundary><HomerunVideoPreview /></ErrorBoundary> : homerV3Qa ? <ErrorBoundary><HomerV3 /></ErrorBoundary> : homerQa ? <ErrorBoundary><HomerQa /></ErrorBoundary> : showcase ? (
      <ErrorBoundary><CinematicV2Showcase /></ErrorBoundary>
    ) : layoutMode() === "frame" ? <PortraitFrame /> : (
      <ErrorBoundary>
        {battleUi.vnext?<div className="vnext-shell"><Duel /></div>:<Duel />}
      </ErrorBoundary>
    )}
  </React.StrictMode>,
);
