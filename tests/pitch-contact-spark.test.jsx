// @vitest-environment happy-dom
import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import PitchContactSpark,{hitSparkFrame,HIT_SPARK_DURATION_MS} from '../src/duel/battle-vnext/PitchContactSpark.jsx';
afterEach(cleanup);
it('uses the verified PNG bytes and RGBA 288x288 header',()=>{
 const png=readFileSync('assets/production-art/pxf-hit-spark/hit-spark.png');
 expect(createHash('sha256').update(png).digest('hex')).toBe('41798938d05224cc3af7c104e009fa5e51467b66cad9580e380121131cee4015');
 expect([png.readUInt32BE(16),png.readUInt32BE(20),png[25]]).toEqual([288,288,6]);
});
it('reveals only confirmed contact, never take, off, reduced-motion or pre-contact',()=>{
 for(const age of [-1,NaN,Infinity,200,201])expect(hitSparkFrame(age)).toBeNull();
 for(const options of [{enabled:false},{reduced:true},{result:'take'},{result:'whiff'}])expect(hitSparkFrame(50,options)).toBeNull();
 expect(hitSparkFrame(50,{result:'hit'})).toBe(2);expect(hitSparkFrame(50,{result:'foul'})).toBe(2);
});
it('absolute time selects all eight cells for200ms, including seeks and6x',()=>{
 expect(HIT_SPARK_DURATION_MS).toBe(200);
 for(let frame=0;frame<8;frame++){for(const rate of [.25,.5,1,2,6])expect(hitSparkFrame((frame*25/rate)*rate)).toBe(frame);expect(hitSparkFrame(frame*25+24.99)).toBe(frame);}
 expect([175,50,0,199.99].map(t=>hitSparkFrame(t))).toEqual([7,2,0,7]);
});
it('crops row-major cells at the shared point and removes the effect when disabled',()=>{
 const props={point:{x:827,y:489},age:100,result:'hit'};
 const {container,rerender}=render(<svg><PitchContactSpark {...props}/></svg>);
 const fx=container.querySelector('[data-pxf-frame]');expect(fx.getAttribute('viewBox')).toBe('96 96 96 96');expect(fx.getAttribute('x')).toBe('787');expect(fx.getAttribute('y')).toBe('449');expect(fx.getAttribute('opacity')).toBe('.5');
 rerender(<svg><PitchContactSpark {...props} enabled={false}/></svg>);expect(container.querySelector('[data-pxf-frame]')).toBeNull();
});
