/* Review build only: canonical game, separate durable save. No seed or encounter override. */
export const NORMAL_REVIEW_PREFIX='9zone-normal-review-v1:';
export function normalReviewEnabled(search=globalThis.location?.search||''){
 return import.meta.env.VITE_NORMAL_REVIEW==='1'||new URLSearchParams(search).get('normalRun')==='1';
}
