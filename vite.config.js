import { defineConfig } from "vite";
import runtimeArt from "./scripts/lib/vite-runtime-art.mjs";
import variableFonts from "./scripts/lib/vite-variable-fonts.mjs";

export default defineConfig({
  base: process.env.VITE_BASE || (process.env.GITHUB_ACTIONS === "true" ? "/9-baseball/" : "/"),
  // ships the heavy PNGs as sized WebP derivatives (scripts/optimize-runtime-art.py)
  plugins: [runtimeArt(),variableFonts()],
  // CSS resources resolve from the stylesheet, including public fonts. Avoid
  // repeating long Pages preview prefixes hundreds of times; JS/HTML keep base.
  experimental: {
    renderBuiltUrl(_filename, { hostType }) {
      if (hostType === 'css') return { relative: true };
    },
  },
  server: {
    watch: {
      // The autonomous loop drops a Chrome profile in .qa-chrome for screen QA. Watching its
      // locked Cookies file kills the dev server with EBUSY mid-session.
      ignored: ["**/.qa-*", "**/.qa-*/**"],
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // PixiJS (V13 actors) is imported lazily and must stay out of the eager vendor chunk
            {
              name: "vendor",
              test: /node_modules[\\/](?!.*(pixi|earcut|eventemitter3|@xmldom|parse-svg-path|ismobilejs|gifuct|tiny-lru))/,
            },
          ],
        },
      },
    },
  },
});
