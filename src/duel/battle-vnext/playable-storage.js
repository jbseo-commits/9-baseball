/* A real Duel run, isolated from the player's production localStorage. */
export const PLAYABLE_PREFIX='9zone-playable-v1:';
export function playableStorage(backing){
 const memory=new Map();
 return {getItem(key){if(memory.has(key))return memory.get(key);try{return backing?.getItem(PLAYABLE_PREFIX+key)??null;}catch{return null;}},
  setItem(key,value){value=String(value);memory.set(key,value);try{backing?.setItem(PLAYABLE_PREFIX+key,value);}catch{}},
  removeItem(key){memory.set(key,null);try{backing?.removeItem(PLAYABLE_PREFIX+key);}catch{}}};
}
