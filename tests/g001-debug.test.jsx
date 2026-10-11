// @vitest-environment happy-dom
import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,startBattle,saveV10Duel,readV10Duel,V10_SAVE_KEY} from '../src/duel/engine.js';

beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup()});

describe('G-001 debug',()=>{
  it('debug corrupt save rendering',async()=>{
    saveV10Duel(localStorage,createV10Duel(7));
    localStorage.setItem('9zone-v10-run','{broken-json');
    
    const {container} = render(<Duel/>);
    
    // Print the rendered HTML
    console.log('=== RENDERED HTML ===');
    console.log(document.body.innerHTML);
    console.log('=== END HTML ===');
    
    // Check if error message is in the document
    const hasErrorText = document.body.innerText.includes('저장 기록이 손상되어');
    console.log('Has error text:', hasErrorText);
    
    // Check for error div
    const errorDiv = document.querySelector('.save-error');
    console.log('Error div exists:', !!errorDiv);
    if (errorDiv) {
      console.log('Error div content:', errorDiv.textContent);
    }
    
    // Check for continue button
    const continueBtn = document.querySelector('button[aria-label="이어하기"]');
    console.log('Continue button exists:', !!continueBtn);
    if (continueBtn) {
      console.log('Continue button disabled:', continueBtn.disabled);
    }
    
    // Just pass for now to see the output
    expect(true).toBe(true);
  });
});