// @vitest-environment happy-dom
import React from 'react';
import {render,cleanup,fireEvent} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import PortraitFrame from '../src/duel/PortraitFrame.jsx';
beforeEach(()=>{
  // Test the host geometry; the actual game inside the frame is exercised in browser QA.
  const create=document.createElement.bind(document);
  vi.spyOn(document,'createElement').mockImplementation((tag,...args)=>{
    const element=create(tag,...args);if(tag==='iframe')element.setAttribute('srcdoc','');return element;
  });
});
afterEach(()=>{cleanup();vi.restoreAllMocks();window.history.replaceState({},'','/');});
it('fits the lab controls into a short wide window using a scaled logical portrait viewport',()=>{
  window.history.replaceState({},'','/?experiment=defense');
  const height=vi.spyOn(window,'innerHeight','get').mockReturnValue(390);
  const {container}=render(<PortraitFrame/>);const frame=container.querySelector('iframe');
  expect(frame.style.height).toBe('568px');expect(frame.style.width).toBe('320px');
  expect(frame.style.transform).toBe(`scale(${390/568})`);
  height.mockReturnValue(720);fireEvent(window,new Event('resize'));
  expect(frame.style.transform).toBe('');expect(frame.style.height).toBe('');
});
it('fits main-run controls in a short PC window and preserves the iframe when resized',()=>{
  const height=vi.spyOn(window,'innerHeight','get').mockReturnValue(700);
  const {container}=render(<PortraitFrame/>);const frame=container.querySelector('iframe'),src=frame.getAttribute('src');
  expect(frame.getAttribute('style')).toBeNull();
  height.mockReturnValue(500);fireEvent(window,new Event('resize'));
  expect(frame.style.height).toBe('640px');expect(frame.style.width).toBe('360px');
  expect(frame.style.transform).toBe(`scale(${500/640})`);
  expect(container.querySelector('iframe')).toBe(frame);expect(frame.getAttribute('src')).toBe(src);
  height.mockReturnValue(640);fireEvent(window,new Event('resize'));
  expect(frame.style.transform).toBe('');expect(frame.style.height).toBe('');
  expect(container.querySelector('iframe')).toBe(frame);expect(frame.getAttribute('src')).toBe(src);
});
