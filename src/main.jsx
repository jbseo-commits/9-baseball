import React from "react";
import { createRoot } from "react-dom/client";
import Duel from "./duel/App.jsx";
import CinematicV2Showcase from "./duel/CinematicV2Showcase.jsx";
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
import "./duel/title-pixel.css";
import "./duel/cinematic-director.css";
import "./duel/cinematic-commit-handoff.css";
import "./duel/cinematic-pitch-handoff.css";
import "./duel/hud-clarity.css";

watchLayoutMode();
const showcase=new URLSearchParams(window.location.search).get("showcase")==="cinematic-v2";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {showcase ? (
      <ErrorBoundary><CinematicV2Showcase /></ErrorBoundary>
    ) : layoutMode() === "frame" ? <PortraitFrame /> : (
      <ErrorBoundary>
        <Duel />
      </ErrorBoundary>
    )}
  </React.StrictMode>,
);
