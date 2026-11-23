// @vitest-environment happy-dom
import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import BallparkMap,{firstHomewardStep} from '../src/duel/BallparkMap.jsx';
import * as E from '../src/duel/engine.js';
afterEach(cleanup);
it('only the completed regular entry with real same-act next branches carries the heading',()=>{
 const map=E.selectV10Map(E.createV10Duel(14));const props={...map,currentNodeId:'a1-entry',completedIds:['a1-entry'],reachableIds:map.edges.filter(e=>e.from==='a1-entry').map(e=>e.to)};
 expect(firstHomewardStep(props)).toBe(true);
 const before=JSON.stringify(props);const v=render(<BallparkMap {...props}/>);expect(v.getAllByRole('heading',{name:'동료에게 한 걸음 가까워졌다.'})).toHaveLength(1);expect(JSON.stringify(props)).toBe(before);
 v.rerender(<BallparkMap {...props}/>);expect(v.getAllByRole('heading',{name:'동료에게 한 걸음 가까워졌다.'})).toHaveLength(1);
 for(const change of [{completedIds:[]},{completedIds:['a1-entry','a1-r1l0']},{currentNodeId:'a1-r1l0'},{reachableIds:[]},{edges:[]},{reachableIds:['a2-entry']},{nodes:props.nodes.map(n=>({...n,act:2}))}])expect(firstHomewardStep({...props,...change})).toBe(false);
});
