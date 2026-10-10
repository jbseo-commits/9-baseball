// Single source of truth for the product version. The player-facing UI and
// package.json previously disagreed (UI said "V9.2", package.json said "0.3.0", docs
// were at V12). Import from here so there is exactly one version number to ship.
export const GAME_VERSION = '1.0.0';

export const GAME_VERSION_LABEL = `v${GAME_VERSION}`;
