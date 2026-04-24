import React, { Component } from 'react';
import { Select } from 'antd';
import { template } from '../constants';
import './ThemeGroup.scss';

class TemplateGroup extends Component {
  state = {
    templateValue: this.props.minder.queryCommandValue('Template'),
  };

  componentDidMount() {
    // if(localStorage.getItem('template_select')){
    //   this.setState({ templateValue:localStorage.getItem('template_select') });
    // }
  }

  handleTemplateChange = (templateValue) => {
    const { minder } = this.props;
    minder.execCommand('Template', templateValue);
    this.setState({ templateValue });
   // localStorage.setItem('template_select',templateValue);
  };
  render() {
    const { minder, toolbar = {}, isLock,theme } = this.props;
    let options = [];
    const customTemplate = toolbar.template || Object.keys(template);
    for (let i = 0; i < customTemplate.length; i++) {
      options.push(
        <Select.Option key={customTemplate[i]} value={customTemplate[i]}>
          {template[customTemplate[i]]}
        </Select.Option>
      );
    }
    return (
      <div className="nodes-actions" style={{ width: 140 }}>
        <Select
          dropdownMatchSelectWidth={false}
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
          value={minder.queryCommandValue('Template')}
          onChange={this.handleTemplateChange}
          disabled={isLock}
          className={theme=='dark'?'dark-select':''}
          style={{marginLeft: 4}}
        >
          {options}
        </Select>
      </div>
    );
  }
}
export default TemplateGroup;
