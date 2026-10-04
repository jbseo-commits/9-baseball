import { existsSync } from 'node:fs';
import { join } from 'node:path';
// npm installs a .cmd shim on Windows. Invoke its JS entry without a shell,
// so prompts, spaces and metacharacters remain separate arguments.
export function codexCommand(platform=process.platform, searchPath=process.env.PATH || process.env.Path || '') {
  if(platform!=='win32')return {file:'codex',prefix:[]};
  for(const directory of searchPath.split(';').filter(Boolean)){
    const native=join(directory,'codex.exe');
    if(existsSync(native))return {file:native,prefix:[]};
    const script=join(directory,'node_modules','@openai','codex','bin','codex.js');
    if(existsSync(script))return {file:process.execPath,prefix:[script]};
  }
  return {file:'codex',prefix:[]}; // CLI probe gives a clear missing-install result
}
