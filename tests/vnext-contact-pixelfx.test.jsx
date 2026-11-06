// @vitest-environment happy-dom
import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import React from 'react';
import {render} from '@testing-library/react';
import ContactPixelFx from '../src/duel/battle-vnext/ContactPixelFx.jsx';

describe('new landscape battle gets the contact pixelfx (2026-11-06)',()=>{
  it('BattleScene mounts the pixelfx layer on landed contact, keyed to the shot grade and play token',()=>{
    const src=fs.readFileSync('src/duel/battle-vnext/BattleScene.jsx','utf8');
    expect(src).toContain("import ContactPixelFx from './ContactPixelFx.jsx'");
    expect(src).toMatch(/<ContactPixelFx sceneRef=\{rootRef\} active=\{[^}]*\['contact','exact','homer','foul'\]\.includes\(effect\.kind\)&&effect\.age>=0\} grade=\{scene\?\.shotGrade\} token=\{scene\?\.playToken\}/);
    const fx=fs.readFileSync('src/duel/battle-vnext/ContactPixelFx.jsx','utf8');
    expect(fx).toContain("from '../contact-pixelfx.js'");
    expect(fs.readFileSync('src/duel/battle-vnext/motion.css','utf8')).toMatch(/\.bv-contact-pixelfx\{[^}]*pointer-events:none/);
  });
  it('renders an inert canvas and never throws without a 2d context',()=>{
    const ref={current:document.createElement('section')};
    const {getByTestId,rerender}=render(<ContactPixelFx sceneRef={ref} active={false} grade="homer" token={1} contact={{x:10,y:10}}/>);
    expect(getByTestId('bv-contact-pixelfx').getAttribute('aria-hidden')).toBe('true');
    rerender(<ContactPixelFx sceneRef={ref} active grade="homer" token={1} contact={{x:10,y:10}}/>);
  });
});
