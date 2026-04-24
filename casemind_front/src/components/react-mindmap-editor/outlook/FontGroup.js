import React, { Component } from 'react';
import { Select, Button } from 'antd';
import { fontSizeList } from '../constants';
import { ColorPicker } from '../components';
import './ThemeGroup.scss';

class FontGroup extends Component {
  state = {
    FontSize: this.props.minder.queryCommandValue('FontSize'),
  };
  componentWillReceiveProps(nextProps) {
    this.setState({ FontSize: nextProps.minder.queryCommandValue('FontSize') || '' });
  }
  onChange = (action, value) => {
    const { minder } = this.props;
    if (minder.queryCommandState(action) !== -1) {
      minder.execCommand(action, value);
      this.setState({ [action]: value });
    }
  };
  render() {
    const { minder, isLock,theme } = this.props;
    const { FontSize = '' } = this.state;
    let disabled = minder.getSelectedNodes().length === 0;
    if (isLock) disabled = true;
    const commonStyle = { size: 'small', disabled };
    return (
      <div className="nodes-actions" style={{ width: 128 }}>
        <div>
          <Select
            {...commonStyle}
            style={{marginLeft: 4}}
            value={FontSize || ''}
            onChange={(value) => this.onChange('FontSize', value)}
            dropdownMatchSelectWidth={false}
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
            className={theme=='dark'?(disabled?'dark-select-disable':'dark-select'):''}
          >
            <Select.Option value="">字号</Select.Option>
            {fontSizeList &&
              fontSizeList.map((item) => (
                <Select.Option key={item} value={item}>
                  {item}
                </Select.Option>
              ))}
          </Select>
        </div>
        <div>
          <Button
            icon="bold"
            type="link"
            {...commonStyle}
            style={{ color: (theme=='dark'? (!disabled?'#d5d5d5':'grey') :'')}}
            className={`${theme == 'dark' && !disabled ? 'dark-theme-button' : ''}`}
            onClick={() => this.onChange('Bold', '')}
          />
          <Button
            icon="italic"
            type="link"
            {...commonStyle}
            style={{ color: (theme=='dark'? (!disabled?'#d5d5d5':'grey') :'')}}
            className={`${theme == 'dark' && !disabled ? 'dark-theme-button' : ''}`}
            onClick={() => this.onChange('Italic', '')}
          />
          <Button
            icon="strikethrough"
            type="link"
            {...commonStyle}
            style={{ color: (theme=='dark'? (!disabled?'#d5d5d5':'grey') :'')}}
            className={`${theme == 'dark' && !disabled ? 'dark-theme-button' : ''}`}
            onClick={() => this.onChange('del', '')}
          />
          <ColorPicker
            onChange={(color) => this.onChange('ForeColor', color)}
            {...this.props}
            button={{
              ...commonStyle,
              type: 'link',
              style: {color: (theme=='dark'? (!disabled?'#d5d5d5':'grey') :'')},
              className:theme == 'dark' && !disabled ? 'dark-theme-button' : ''
            }}
            
            icon="font-colors"
            action="ForeColor"
          />
          <ColorPicker
            onChange={(color) => this.onChange('Background', color)}
            {...this.props}
            button={{
              ...commonStyle,
              type: 'link',
              className:theme == 'dark' && !disabled ? 'dark-theme-button' : '',
              style: {color: (theme=='dark'? (!disabled?'#d5d5d5':'grey') :'')}
            }}
            icon="bg-colors"
            action="Background"
          />
        </div>
      </div>
    );
  }
}
export default FontGroup;
