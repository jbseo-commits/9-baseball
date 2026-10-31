/* A real Duel run, isolated from the player's production localStorage. */
export const PLAYABLE_PREFIX='9zone-playable-v1:';
export function playableStorage(backing,namespace=null){
 const keyPrefix=PLAYABLE_PREFIX+(namespace?String(namespace)+':':'');
 const memory=new Map();
 return {getItem(key){if(memory.has(key))return memory.get(key);try{return backing?.getItem(keyPrefix+key)??null;}catch{return null;}},
  setItem(key,value){value=String(value);memory.set(key,value);try{backing?.setItem(keyPrefix+key,value);}catch{}},
  removeItem(key){memory.set(key,null);try{backing?.removeItem(keyPrefix+key);}catch{}}};
}
