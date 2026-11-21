export const TIDE_PLAYTEST_PREFIX='9zone-tide-playtest-v1:';
export const TIDE_PLAYTEST_SEED=4;
export const tidePlaytestEnabled=(search=globalThis.location?.search||'')=>new URLSearchParams(search).get('tidePlaytest')==='1';
