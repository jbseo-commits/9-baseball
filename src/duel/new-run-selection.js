import {careerProgress} from './hitter-career.js';
// Temporary review admission, not a permanent unlock or save migration.
export const sluggerReviewOnly=reviewRun=>import.meta.env.VITE_NORMAL_REVIEW==='1'&&reviewRun===true;
export const defaultNewHitter=reviewRun=>sluggerReviewOnly(reviewRun)?'slugger-v1':'contact-v1';
export function canStartHitter(career,id,reviewRun=false){
 return sluggerReviewOnly(reviewRun)?id==='slugger-v1':careerProgress(career,id).unlocked;
}
