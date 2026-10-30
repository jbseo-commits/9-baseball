/* These 120 numbered Noto Sans KR subsets were inspected with fontTools:
   every file has fvar wght 100..900. Six declarations share the EXACT binary
   and unicode range. Emit that binary once with its supported weight range.
   Other families/static files and the development source remain untouched. */
const variableSource=/url\(\/fonts\/v40-PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4\.\d+\.woff2\)/;
export function compactVariableFonts(css){
  const groups=new Map();
  for(const match of css.matchAll(/@font-face\s*\{[^}]*\}/g)){
    const block=match[0];if(!variableSource.test(block))continue;
    const weight=/font-weight:\s*(\d+)\s*;/.exec(block);if(!weight)continue;
    const key=block.replace(weight[0],'font-weight: RANGE;');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push({block,weight:Number(weight[1])});
  }
  for(const entries of groups.values()){
    if(entries.length!==6||entries.map(e=>e.weight).sort((a,b)=>a-b).join(',')!=='400,500,600,700,800,900')continue;
    css=css.replace(entries[0].block,entries[0].block.replace(/font-weight:\s*\d+\s*;/,'font-weight: 400 900;'));
    for(const entry of entries.slice(1))css=css.replace(entry.block,'');
  }
  return css;
}
export default function variableFonts(){return {name:'verified-variable-font-subsets',enforce:'pre',apply:'build',
  transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/duel/fonts.css'))return {code:compactVariableFonts(code),map:null};},
};}
