import React, { Component } from 'react'
import { Icon, Button, Tooltip, notification } from 'antd'
import { CustomIcon } from '../components'
import './PriorityGroup.scss'

class ProgressGroup extends Component {
  componentDidMount() {
    //必须在这里声明，所以 ref 回调可以引用它
    this.props.onRef(this)
  }

  handleAction = priority => {
    const { minder } = this.props
    let totoal = 0
    let p_count = 0
    minder.getSelectedNodes().map(node => {
      if (node.data && node.data.priority && node.data.priority > 0) {
        p_count++
      }
      totoal++
    })

    if (totoal > 0 && totoal === p_count) minder.execCommand('Progress', priority)
    else {
      notification.error({ message: '只能在在有用例优先级标签的节点打标' })
    }
  }

  render() {
    const { minder, isLock ,theme} = this.props
    let disabled = minder.getSelectedNodes().length === 0
    if (isLock) disabled = true
    const btnProps = {
      type: 'link',
      disabled,
      style: { padding: 4, height: 28 },
    }
    const progressList = [
      {
        label: '移除结果',
        icon: (
          <Icon
            type="minus-circle"
            theme="filled"
            style={{ fontSize: '18px', color: theme=='dark'?'grey':'rgba(0, 0, 0, 0.6)' }}
          />
        ),
      },
      {
        label: '失败 (快捷键 Command/Ctrl+↓)',
        value: 1,
        icon: <CustomIcon type="fail" disabled={disabled} style={{ width: 18, height: 18 }} />,
      },
      {
        label: '通过 (快捷键 Command/Ctrl+↑)',
        value: 9,
        icon: <CustomIcon type="checked" disabled={disabled} style={{ width: 18, height: 18 }} />,
      },
      // {
      //   label: '阻塞',
      //   value: 5,
      //   icon: <CustomIcon type="block" disabled={disabled} style={{ width: 18, height: 18 }} />,
      // },
      {
        label: '搁置(算通过)',
        value: 4,
        icon: <CustomIcon type="skip" disabled={disabled} style={{ width: 18, height: 18 }} />,
      },

      {
        label: 'Android失败',
        value: 2,
        icon: (
          <CustomIcon
            type="android_icon"
            disabled={disabled}
            style={{ width: 18, height: 18 }}
            color="#d81e06"
          />
        ),
      },

      {
        label: 'iPhone失败',
        value: 3,
        icon: (
          <CustomIcon
            type="ios_icon"
            disabled={disabled}
            style={{ width: 18, height: 18 }}
            color="#d81e06"
          />
        ),
      },

      {
        label: 'Web失败',
        value: 6,
        icon: (
          <CustomIcon
            type="web_icon"
            disabled={disabled}
            style={{ width: 18, height: 18 }}
            color="#d81e06"
          />
        ),
      },

      {
        label: 'Server失败',
        value: 7,
        icon: (
          <CustomIcon
            type="server_icon"
            disabled={disabled}
            style={{ width: 18, height: 18 }}
            color="#d81e06"
          />
        ),
      },

      {
        label: 'Android通过',
        value: 12,
        icon: (
          <CustomIcon
            type="android_icon"
            disabled={disabled}
            style={{ width: 18, height: 18 }}
            color="#31AF0F"
          />
        ),
      },
      {
        label: 'iPhone通过',
        value: 13,
        icon: (
          <CustomIcon
            type="ios_icon"
            disabled={disabled}
            style={{ width: 18, height: 18 }}
            color="#31AF0F"
          />
        ),
      },
      {
        label: 'Web通过',
        value: 16,
        icon: (
          <CustomIcon
            type="web_icon"
            disabled={disabled}
            style={{ width: 18, height: 18 }}
            color="#31AF0F"
          />
        ),
      },
      {
        label: 'Server通过',
        value: 17,
        icon: (
          <CustomIcon
            type="server_icon"
            disabled={disabled}
            style={{ width: 18, height: 18 }}
            color="#31AF0F"
          />
        ),
      },

      {
        label: 'Android通过IOS失败',
        value: 20,
        icon: (
          <CustomIcon
            type="android_ios_icon"
            disabled={disabled}
            style={{ width: 18, height: 18 }}
            color="#f00|#0f0"
          />
        ),
      },

      {
        label: 'IOS通过Android失败',
        value: 21,
        icon: (
          <CustomIcon
            type="android_ios_icon"
            disabled={disabled}
            style={{ width: 18, height: 18 }}
            color="#0f0|#f00"
          />
        ),
      },
    ]
    return (
      <div className="nodes-actions" style={{ width: 360 }}>
        {progressList &&
          progressList.map(item => (
            <Tooltip
              key={item.value || 0}
              title={item.label}
              getPopupContainer={triggerNode => triggerNode.parentNode}
            >
              <Button {...btnProps} onClick={() => this.handleAction(item.value)}>
                {item.icon}
              </Button>
              {item.label.includes('Server失败') ? ' | ' : ''}
              {item.label.includes('搁置') ? ' | ' : ''}
            </Tooltip>
          ))}
      </div>
    )
  }
}
export default ProgressGroup
