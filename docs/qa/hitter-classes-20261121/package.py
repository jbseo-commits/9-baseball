from pathlib import Path
import zipfile,hashlib,json,shutil
root=Path('/workspace/9-baseball/dist');z=Path('/workspace/classes-playable.zip');manifest={}
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED,9) as a:
 for f in sorted(root.rglob('*')):
  if f.is_file():
   data=f.read_bytes();name=str(f.relative_to(root));a.writestr('dist/'+name,data);manifest[name]={'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
extract=Path('/workspace/classes-extracted');shutil.rmtree(extract,ignore_errors=True)
with zipfile.ZipFile(z) as a:a.extractall(extract)
meta={'zipBytes':z.stat().st_size,'sha256':hashlib.sha256(z.read_bytes()).hexdigest(),'files':len(manifest),'uncompressedBytes':sum(x['bytes'] for x in manifest.values()),'base':'./','entry':'/ (no query; normal campaign review)'}
Path('/workspace/classes-qa/build.json').write_text(json.dumps(meta,indent=2));Path('/workspace/classes-qa/dist-manifest.json').write_text(json.dumps(manifest,indent=2));print(meta)
