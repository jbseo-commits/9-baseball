import React from 'react';
/* A comparison failure must never offer to delete a real save. */
export default class MemoryPreviewBoundary extends React.Component{
  state={error:false};
  static getDerivedStateFromError(){return {error:true};}
  render(){return this.state.error?<main className="bc-memory-error" role="alert"><p>비교 화면을 불러오지 못했습니다.</p><button type="button" onClick={()=>window.location.reload()}>다시 불러오기</button></main>:this.props.children;}
}
