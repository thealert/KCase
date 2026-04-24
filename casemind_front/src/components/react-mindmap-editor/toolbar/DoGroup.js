import React, { Component } from 'react';
import { Button } from 'antd';
import jsonDiff, { deepClone } from 'fast-json-patch';
import getQueryString from '@/utils/getCookies'
const getCookies = getQueryString.getCookie
import cloneDeep from 'lodash/cloneDeep';
import './DoGroup.scss';

const MAX_HISTORY = 100;

let doDiffs = [];

class DoGroup extends Component {
  state = {
    undoDiffs: [],
    redoDiffs: [],
    patchLock: false,
    lastSnap: this.props.minder && this.props.minder.exportJson(),
  };
  componentDidMount() {
    let { minder } = this.props;
    minder.on('import', this.reset);
    // minder.on('patch', this.updateSelection);
  }
  reset = () => {
    this.setState({
      undoDiffs: [],
      redoDiffs: [],
      lastSnap: this.props.minder.exportJson(),
    });
  };

  makeUndoDiff = () => {
    const { minder } = this.props;
    let { undoDiffs, lastSnap } = this.state;
    
    const headSnap = minder.exportJson();
    console.log('----headsnap---', headSnap);
    const diff = jsonDiff.compare(headSnap, lastSnap);

    const doDiff = jsonDiff.compare(lastSnap, headSnap);
    if (diff.length) {
      if (diff.length === 1 && diff[0].path === '/base') {
        const undoTop = undoDiffs.pop()
        console.log(diff)
        undoTop.push(diff[0]);
        undoDiffs.push(undoTop);
      
      } else {
        undoDiffs.push(diff);
        doDiffs.push(doDiff);
      }
      
      while (undoDiffs.length > MAX_HISTORY) {
        undoDiffs.shift();
      }

      
      lastSnap = headSnap;
      this.setState({ undoDiffs, lastSnap });
      return true;
    }
  };
  makeRedoDiff = () => {
    const { minder } = this.props;
    let { lastSnap, redoDiffs } = this.state;
    let revertSnap = minder.exportJson();
    redoDiffs.push(jsonDiff.compare(revertSnap, lastSnap));
    lastSnap = revertSnap;
    this.setState({ redoDiffs, lastSnap });
  };
  // 撤销
  undo = (notifyInfo) => {
    this.notifyInfo = notifyInfo;
    this.setState({ patchLock: true }, () => {
      console.log('notifyInfo', this.notifyInfo)
      const { minder } = this.props;
      let { undoDiffs } = this.state;
      if (!this.notifyInfo){
          
        let curdiff = undoDiffs.length>0?undoDiffs[undoDiffs.length - 1]:null;
          // minder.applyPatches(undoDiff)
          // this.makeRedoDiff();

          if(curdiff){
            this.props.wsInstance.sendSocketMessage(JSON.stringify({ 'type': 'undo', 'data': JSON.stringify({'message':curdiff,'userName': getCookies('username')}) }))
          }
   
      }
      else{

        const undoDiff = undoDiffs.pop();
        const doDiff = doDiffs.pop();

        minder.applyPatches(JSON.parse(notifyInfo || '{}'))
        this.makeRedoDiff();
      }
      
        // const caseObj = minder.exportJson();
        // var info = { caseContent: JSON.stringify(caseObj) };
        // window.ws.sendSocketMessage(JSON.stringify({ 'type': 'sycase', 'data': info }))
        // var diffs=[];
        // for(var i=0;i<undoDiff.length;i++){
        //   var diffcontent={};
        //   if(undoDiff[i].express=="data.replace"){
        //     diffcontent.op=undoDiff[i].op;
        //     diffcontent.path=undoDiff[i].path;
        //     diffcontent.value=undoDiff[i].value;
        //     diffs.push(diffcontent)
        //   }
        // }
        // console.log(undoDiff)
        // console.log( [diffs])
        // // console.log( JSON.stringify(diffs))
        // var info={caseContent: JSON.stringify(caseObj), patch: JSON.stringify([diffs]), caseVersion: caseObj.base };
        //window.ws.sendSocketMessage(JSON.stringify({'type':'edit','data':info}))

      
      this.setState({ patchLock: false });
    });
  };
  // 重做
  redo = (notifyInfo) => {
    this.notifyInfo = notifyInfo;
    this.setState({ patchLock: true }, () => {
      const { minder } = this.props;
      let { redoDiffs } = this.state;
      if (!this.notifyInfo){
         
         let curdiff = redoDiffs.length>0?redoDiffs[redoDiffs.length - 1]:null;
          // minder.applyPatches(redoDiff);
          // this.makeUndoDiff();
          // doDiffs.pop()
          if(curdiff){
            this.props.wsInstance.sendSocketMessage(JSON.stringify({ 'type': 'redo', 'data': JSON.stringify({'message':curdiff,'userName': getCookies('username')}) }))
          
            }
           
      }
      else{
          const redoDiff = redoDiffs.pop();
          minder.applyPatches(redoDiff);
          this.makeUndoDiff();
          doDiffs.pop()
      }

      
      this.setState({ patchLock: false });
    });
  };
  getAndResetPatch = () => {
    const diffs = [...doDiffs];
    doDiffs = [];
    return diffs;
  };
  changed = () => {
    const { patchLock } = this.state;
    if (window.minderData) {
      if (patchLock) return;
      if (this.makeUndoDiff()) {
        this.setState({ redoDiffs: [] });
      }
    }
  };
  hasUndo = () => {
    const { undoDiffs } = this.state;
    return !!undoDiffs.length;
  };
  hasRedo = () => {
    const { redoDiffs } = this.state;
    return !!redoDiffs.length;
  };

  updateSelection = (e) => {
    const { patchLock } = this.state;
    const { minder } = this.props;
    if (!patchLock) return;
    const patch = e.patch;
    // eslint-disable-next-line default-case
    switch (patch.express) {
      case 'node.add':
        minder.select(patch.node.getChild(patch.index), true);
        break;
      case 'node.remove':
      case 'data.replace':
      case 'data.remove':
      case 'data.add':
        minder.select(patch.node, true);
        break;
    }
  };

  render() {
    const { isLock,theme } = this.props;
    let hasUndo = this.hasUndo();
    let hasRedo = this.hasRedo();
    if (isLock) {
      hasUndo = false;
      hasRedo = false;
    }
    
    return (
      <div className="nodes-actions" style={{ width: 64 }}>
        <Button
          title="撤销 (Ctrl + Z)"
          type="link"
          icon="left-circle"
          size="small"
          onClick={() => this.undo()}
          disabled={!hasUndo}
          className={ theme=='dark'&&hasUndo ?'dark-theme-button':''}
          style={{ color: (theme=='dark'? (hasUndo?'#d5d5d5':'grey') :'')}}
        >
          撤销
        </Button>
        <Button
          title="重做 (Ctrl + Y)"
          type="link"
          size="small"
          disabled={!hasRedo}
          icon="right-circle"
          onClick={() => this.redo()}
          className={ theme=='dark'&&hasRedo ?'dark-theme-button':''}
          style={{ color: (theme=='dark'? (hasRedo?'#d5d5d5':'grey') :'')}}
        >
          重做
        </Button>
      </div>
    );
  }
}
export default DoGroup;
