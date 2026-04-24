import React, { Component } from 'react';
import { Button } from 'antd';
import { CustomIcon } from '../components';
import './ThemeGroup.scss';

class StyleGroup extends Component {
  onClick = (action) => {
    const { minder } = this.props;
    if (minder.queryCommandState(action) !== -1) {
      minder.execCommand(action);
    }
  };
  render() {
    const { minder, isLock,theme } = this.props;
    let disabled = minder.getSelectedNodes().length === 0;
    if (isLock) disabled = true;
    const commonStyle = { size: 'small', type: 'link', disabled };
    return (
      <div className="nodes-actions" style={{ width: 164, display: 'flex', alignItems: 'center' }}>
        <Button {...commonStyle} className={`big-icon ${theme == 'dark' && !disabled ? 'dark-theme-button' : ''}`}  onClick={() => this.onClick('ClearStyle')} 
          style={{ color: (theme=='dark'? (!disabled?'#d5d5d5':'grey') :'')}}>
          <CustomIcon type="clear" style={{ width: 22, height: 22 ,...(theme === 'dark' && { fill: !disabled?'#d5d5d5':'grey' })}} disabled={disabled} />
          <br />
          清除样式
        </Button>
        <div style={{ width: '50%' }}>
          <Button {...commonStyle} onClick={() => this.onClick('CopyStyle')} icon="copy"
            style={{ color: (theme=='dark'? (!disabled?'#d5d5d5':'grey') :'')}}
            className={`${theme == 'dark' && !disabled ? 'dark-theme-button' : ''}`}>
            复制样式
          </Button>
          <br />
          <Button {...commonStyle} onClick={() => this.onClick('pastestyle')}
            style={{ color: (theme=='dark'? (!disabled?'#d5d5d5':'grey') :'')}}
            className={`${theme == 'dark' && !disabled ? 'dark-theme-button' : ''}`}>
            <CustomIcon type="stylePaste" style={{...(theme === 'dark' && { fill: !disabled?'#d5d5d5':'grey' })}} disabled={disabled} />
            粘贴样式
          </Button>
        </div>
      </div>
    );
  }
}
export default StyleGroup;
