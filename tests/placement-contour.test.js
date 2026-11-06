import {it,expect} from 'vitest';
import {footprintContours,placementPan} from '../src/duel/battle-vnext/placement-motion.js';
const cells=zs=>zs.map(z=>({z,x:z%3*50,y:Math.floor(z/3)*50,w:50,h:50}));
it('makes a closed contour of a real 3-cell body with no internal cut and the exact perimeter',()=>{
 const c=footprintContours(cells([2,5,8]));expect(c.loops).toHaveLength(1);expect(c.perimeter).toBe(400);expect(c.path.endsWith('Z')).toBe(true);
 expect(c.loops[0][0]).toEqual(c.loops[0].at(-1));
});
it('keeps row edges and diagonal islands disconnected rather than inventing a connection',()=>{
 for(const zs of [[2,3],[0,4],[0,4,8]]){const c=footprintContours(cells(zs));expect(c.loops).toHaveLength(zs.length);expect(c.perimeter).toBe(zs.length*200);}
});
it('retains a missing middle as a hole and does not bridge a clipped corner',()=>{
 const hole=footprintContours(cells([0,1,2,3,5,6,7,8]));expect(hole.loops).toHaveLength(2);expect(hole.perimeter).toBe(800);
 const corner=footprintContours(cells([0,1,3]));expect(corner.loops).toHaveLength(1);expect(corner.perimeter).toBe(400);
 expect(corner.path).not.toContain('150');
});
it('preserves actual fractional DOM edges, ignores duplicate cells and accepts an empty footprint',()=>{
 const c=footprintContours([{z:4,x:0,y:0,w:42.375,h:42.375}]);expect(c.perimeter).toBe(169.5);expect(c.path).toContain('42.375');
 expect(footprintContours(cells([4,4])).perimeter).toBe(200);expect(footprintContours([])).toEqual({path:'',loops:[],perimeter:0});
});

it('uses the same viewport origin for sound at source and destination even when the game root is offset',()=>{
 expect(placementPan(300,100,800)).toBe(0);expect(placementPan(700,100,800)).toBe(.4);expect(placementPan(-100,100,800)).toBe(-.4);
 expect(placementPan(500,100,800)).toBe(.2);expect(placementPan(100,100,800)).toBe(-.2);
});
