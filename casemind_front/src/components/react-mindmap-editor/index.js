import React, { Component, createRef, useRef } from 'react';
import PropTypes from 'prop-types';
import './index.scss';
import 'kity';
import './assets/kityminder-core/kityminder.core.js';
import request from '@/utils/axios';
import { CopyToClipboard } from 'react-copy-to-clipboard';
// import Websocket from 'react-websocket';
import Socket from './socket.js';
import { Fab, Action } from 'react-tiny-fab';
import 'react-tiny-fab/dist/styles.css';
import getQueryString from '@/utils/getCookies'
import OutlineTree from './outline.js'
import AIChat from './difychat.js'
import { buildAuthHeaders } from '@/utils/authHeaders'
const getCookies = getQueryString.getCookie
import Link from 'umi/link';

import aiIcon from './assets/img/ai.png';

import {

  Drawer,
  ConfigProvider,
  Tabs,
  Select,
  Input,
  Button,
  Icon,
  notification,
  Modal,
  Spin,
  Switch,
  Tooltip,
  Popover,
  List,
  Avatar,
  message,
  Row,
} from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import marked from 'marked';
import 'hotbox-ui/hotbox';
import 'hotbox-ui/hotbox.css';
import DoGroup from './toolbar/DoGroup';
import DoMove from './toolbar/DoMove';
import Nodes from './toolbar/Nodes';
import PriorityGroup from './toolbar/PriorityGroup';
import ProgressGroup from './toolbar/ProgressGroup';
import OperationGroup from './toolbar/OperationGroup';
import MediaGroup from './toolbar/MediaGroup';
import TagGroup from './toolbar/TagGroup';
import ThemeGroup from './outlook/ThemeGroup';
import TemplateGroup from './outlook/TemplateGroup';
import ResetLayoutGroup from './outlook/ResetLayoutGroup';
import StyleGroup from './outlook/StyleGroup';
import FontGroup from './outlook/FontGroup';
import ViewGroup from './view';
import { initData, buttons, theme } from './constants';
import { NavBar } from './components';
import { preview, editInput, measureTextWidth, clipboardRuntime } from './util';
import { useHistory } from "react-router-dom";
import _ from 'lodash';
import localhelper from '@/utils/localstorehelper'
const setLocalWithExpiry = localhelper.setLocalWithExpiry
import envurls from '@/utils/envurls'
import { color } from 'd3';
const getEnvUrlbyKey = envurls.getEnvUrlbyKey
const axios = require('axios')

const { confirm } = Modal;
const HotBox = window.HotBox;

const TabPane = Tabs.TabPane;

// 鼠标右键
const MOUSE_RB = 2;

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false,
});

class KityminderEditor extends Component {

  constructor(props) {
    super(props);
    this.state = {
      minder: null,
      selectedNode: null,
      noteNode: null,
      noteContent: null,
      showEdit: false,
      inputContent: null,
      activeTab: '1',
      showToolBar: this.props.type === 'compare' ? false : true,
      fullScreen: false,
      loading: true,
      isLock: this.props.isLock || false, // 被其他人锁住
      locked: false, // 当前session主动锁住
      popoverVisible: false,
      nowUseList: [],
      modalvisible: false,
      modalcapvisible: false,
      prviewres: 1,
      capres: '第一轮',
      outlinedata: [],
      showoutline: true,
      lastminerdata: 1,
      fontVal: '"SF Pro SC","SF Pro Text","SF Pro Icons","PingFang SC","Helvetica Neue","Helvetica","Arial", sans-serif',
      exportVal: '',
      theme: 'default',
      showDifyChat: false, // 添加showDifyChat状态
      isPad: false,
    };

    this.aichatRef = React.createRef();


    this.base = -1;
    this.expectedBase = -1;
    setTimeout(() => {
      if (this.minder) {
        this.setState({
          minder: this.minder,

        });


        //clipboardRuntime.init(this.minder, this.props.readOnly);
        //alert(this.props.readOnly&& this.props.historyId === "undefined")

        clipboardRuntime.init(this.minder,
          this.props.readOnly && this.props.historyId == undefined
          //   ||
          //  this.props.recordId !== "undefined") &&
          //  this.props.historyId === "undefined"
        );
      }


    }, 100);

    setTimeout(() => {
      const isiPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      this.setState({
        isPad: /iPad|Android.*Tablet/i.test(navigator.userAgent) || isiPadOS,
        // isPad: true,
      });
    }, 3000);

    this.navNode = createRef();
    this.outlineTreeRef = createRef();
    this.tabsRef = createRef();

  }
  viewgroup = {}
  onVGRef = (ref) => {
    this.viewgroup = ref
  }
  onPGRef = (ref) => {
    this.progressgroup = ref
  }
  componentDidMount() {

    setTimeout(() => {

      if (!this.props.readOnly) {
        this.arguments = arguments;
        this.initKeyBoardEvent(arguments);

      } else {

        setTimeout(() => {

          console.log("添加record键盘事件的监听函数")
          document.addEventListener('keydown', this.handleRecordKeyDown);

        }, 300);

      }


    }, 1000);
    this.initData = initData;

    var fontsel = localStorage.getItem("font_select")
    if (fontsel) {
      this.handleFontChange(fontsel)
      this.setState({ fontVal: fontsel })

    }
  }

  importCase = () => {
    // 动态创建一个文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.mm'; // 只接受 .mm 后缀的文件
    var self = this;
    // 监听文件输入元素的变化事件
    fileInput.addEventListener('change', function (event) {
      const file = event.target.files[0];

      // 检查文件后缀是否为 .mm
      if (file && file.name.endsWith('.mm')) {
        const reader = new FileReader();

        // 监听文件读取完成事件
        reader.onload = function (e) {
          const fileContent = e.target.result;
          console.log(fileContent); // 在控制台输出文件内容

          // 你可以在这里处理读取到的文件内容
          // 例如，解析文件内容并显示在页面上
        };

        // 读取文件内容
        reader.readAsText(file);
      } else {
        alert('请选择一个后缀为 .mm 的文件');
      }
    });

    // 触发文件输入元素的点击事件
    fileInput.click();
  }

  exportCaseFile = (title, caseid, type) => {

    if (!caseid)
      return

    var url = ""
    var fileExt = ""
    if (type == 'freemind') {
      url = `${getEnvUrlbyKey('proxyurl')}/api/file/exportFreeMind?id=${caseid}`
      fileExt = '.mm'
    }
    else if (type == 'xmind') {
      url = `${getEnvUrlbyKey('proxyurl')}/api/file/export?id=${caseid}`
      fileExt = '.xmind'
    }

    else if (type == 'excel') {
      url = `${getEnvUrlbyKey('proxyurl')}/api/file/exportExcel?id=${caseid}`
      fileExt = '.xlsx'
    }

    axios({
      url: url,
      method: 'GET',
      responseType: 'blob',
      headers: buildAuthHeaders()
    }).then(response => {
      const href = URL.createObjectURL(response.data);

      // create "a" HTML element with href to file & click
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', title + fileExt); //or any other extension
      document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    })
  }

  exportMarkDown = (title) => {
    if (!title) {
      title = "未命名";
    }

    this.minder.exportData('markdown').then(function (data) {
      // 创建一个 Blob 对象
      const blob = new Blob([data], { type: 'text/markdown;charset=utf-8' });

      // 创建下载链接
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = title + '.md';

      // 添加到文档并触发点击
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    });
  };

  exportCasePng = (title) => {

    if (!title) {
      title = "未命名"
    }

    this.minder.exportData('png').then(function (data) {
      // 创建一个隐藏的链接元素
      const link = document.createElement('a');
      link.style.display = 'none';

      // 将 base64 编码的数据转换为 Blob 对象
      const byteString = atob(data.split(',')[1]);
      const mimeString = data.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      // 创建一个指向 Blob 对象的 URL
      const url = URL.createObjectURL(blob);

      // 设置链接元素的 href 和 download 属性
      link.href = url;
      link.download = title + '.png';

      // 将链接元素添加到文档中
      document.body.appendChild(link);

      // 触发链接的点击事件
      link.click();

      // 移除链接元素
      document.body.removeChild(link);

      // 释放 URL 对象
      URL.revokeObjectURL(url);
    });
  }

  handleMouseEnter = () => {
    this.setState({ popoverVisible: true });
  };


  componentWillUnmount() {
    window.minderData = undefined;
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keydown', this.handleRecordKeyDown);
    //document.removeEventListener('keyup', this.handleRecordKeyUp);
    clipboardRuntime.removeListener();
    this.touchPanLastPoint = null;
    this.isTouchPanning = false;
    // this.heartCheck.reset();
  }
  getAllData = () => {
    return this.minder.exportJson();
  };
  setEditerData = data => {
    this.minder.importJson(data);
    this.minder.fire('contentchange');
  };
  // 键盘事件的监听
  initKeyBoardEvent = () => {
    var self = this;
    setTimeout(() => {
      if (self.state.showToolBar) {
        console.log("添加键盘事件的监听函数")
        document.addEventListener('keydown', this.handleKeyDown);

      }
    }, 300);
  };

  setExpander = (node, isShow) => {

    var render = node.getRenderer('ExpanderRenderer')
    var expander = render.expander

    if (expander) {
      render.isShow = isShow
      if (isShow)
        expander.setState(true)
      else
        expander.setState('hide')
      render.update(render.getRenderShape(), node)
    }
  };

  initOnEvent = minder => {
    minder.on('import', () => {
      this.setState({ loading: false });
    });
    const { readOnly } = this.props;
    var laseSel = null;
    // 视图选中节点变更事件
    minder.on('selectionchange', () => {

      const node = minder.getSelectedNode();
      if (!readOnly) {
        const { selectedNode, showEdit, inputContent } = this.state;
        // 如果被选中节点之前处于编辑状态，变更后节点失去焦点
        // 则先更新节点内容，然后隐藏编辑框、清空编辑框字段
        if (showEdit) {

          if (selectedNode.getText() !== inputContent) {

            selectedNode.setText(inputContent);
            selectedNode.render();
            selectedNode.getMinder().layout(300);
            //this.minder.refresh();
            //this.minder.fire('contentchange');
          }

          this.setState({ showEdit: false, inputContent: null });
          window.showEdit = false;
        }
      }
      this.hotbox.active(HotBox.STATE_IDLE);
      this.setState({
        selectedNode: node,
        noteContent: null,
      });
    });

    minder.on('selectionchange', () => {
      if (laseSel)
        self.setExpander(laseSel, false)
      laseSel = null
    });

    // 定义一个变量来存储定时器 ID
    let timeoutId;
    var isDbClick = false;
    var self = this;
    minder.on('click', e => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(function () {

        if (isDbClick) {
          isDbClick = false;
          return
        }
        const nodes = minder.getSelectedNodes();
        if (laseSel)
          self.setExpander(laseSel, false)
        if (nodes && nodes.length == 1) {
          var node = nodes[0]
          laseSel = node;
          self.setExpander(node, true)

        } else {
          if (laseSel) {
            self.setExpander(laseSel, false)
            laseSel = null
          }
        }
      }, 180);

    });

    if (!readOnly) {

      // 视图双击事件
      minder.on('dblclick', e => {

        // 双击节点，呼出编辑框
        isDbClick = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        this.handleShowInput();


        return false;
      });

    }
    minder.on('mousedown', e => {
      if (e.originEvent.button === MOUSE_RB) {
        e.preventDefault();
        const { minder, inputNode } = this;
        if (minder.getSelectedNode() && minder._status !== 'readonly') {
          const node = minder.getSelectedNode();
          const position = editInput(node, inputNode, 'positionOnly');
          setTimeout(() => {
            this.hotbox.active('main', position);
          }, 200);
        }
      }
      this.setState({
        noteContent: null,
      });
    });

    // 视图改变事件的监听，用于持续渲染编辑框的位置
    minder.on('viewchange', e => {
      const { showEdit, noteContent } = this.state;
      const node = minder.getSelectedNode();
      if (showEdit) {
        editInput(node, this.inputNode);
      }
      this.hotbox.active(HotBox.STATE_IDLE);
      if (noteContent !== null) {
        this.handleNotePreview();
      }
    });

    // 备注是否展示的事件监听
    let previewTimer = null;
    minder.on('shownoterequest', e => {
      previewTimer = setTimeout(() => this.handleNotePreview(e), 200);
    });
    minder.on('hidenoterequest', () => {
      clearTimeout(previewTimer);
    });

    minder.on('contentchange', this.sendPatch);

  };
  initHotbox = minder => {
    const {
      priority = [1, 2, 3, 4],
      progressShow = false,
      readOnly = false,
    } = this.props;
    const container = minder.getPaper().container.parentNode;
    const hotbox = new HotBox(container);
    const main = hotbox.state('main');
    if (!readOnly) {
      main.button({
        position: 'center',
        label: '编辑',
        key: 'F2',
        enable: () => !readOnly,
        action: this.handleShowInput,
      });
      buttons.forEach(button => {
        const parts = button.split(':');
        const label = parts.shift();
        const key = parts.shift();
        const command = parts.shift();
        main.button({
          position: 'ring',
          label: label,
          key: key,
          enable: () => !readOnly,
          action: () => {
            if (
              'AppendSiblingNode,AppendChildNode,AppendParentNode'.indexOf(
                command,
              ) > -1
            ) {
              minder.execCommand(command, '分支主题');
              setTimeout(this.handleShowInput, 300);
            } else {
              minder.execCommand(command);
            }
          },
        });
      });
    }

    main.button({
      position: 'top',
      label: '撤销',
      key: 'Ctrl + Z',
      enable: () => {
        if (this.groupNode) {
          return this.groupNode.hasUndo();
        }
        return !readOnly;
      },
      action: () => {
        //this.handleUndo();
        this.groupNode.undo()
      },
      next: 'idle',
    });
    main.button({
      position: 'top',
      label: '重做',
      key: 'Ctrl + Y',
      enable: () => {
        if (this.groupNode) {
          return this.groupNode.hasRedo();
        }
        return !readOnly;
      },
      action: () => {
        //this.handleRedo();
        this.groupNode.redo()
      },
      next: 'idle',
    });
    if (!readOnly) {
      main.button({
        position: 'top',
        label: '优先级',
        key: 'P',
        next: 'priorityBox',
        enable: () => !readOnly,
      });
      const priorityBox = hotbox.state('priorityBox');
      priority.join('').replace(/./g, p => {
        priorityBox.button({
          position: 'ring',
          label: `P${Number(p) - 1}`,
          key: `${Number(p) - 1}`,
          action: () => {
            minder.execCommand('Priority', p);
          },
        });
      });
      priorityBox.button({
        position: 'top',
        label: '移除',
        key: 'Del',
        action: () => {
          minder.execCommand('Priority', 0);
        },
      });
      priorityBox.button({
        position: 'top',
        label: '返回',
        key: 'esc',
        next: 'back',
      });
    }
    if (progressShow) {
      main.button({
        position: 'top',
        label: '结果',
        key: 'G',
        next: 'progress',
        enable: () => progressShow,
      });
      const progress = hotbox.state('progress');
      '1459'.replace(/./g, p => {
        let label = '失败';
        if (p === '4') label = '不执行';
        if (p === '5') label = '阻塞';
        if (p === '9') label = '通过';
        progress.button({
          position: 'ring',
          label,
          key: label,
          action: () => {

            minder.execCommand('Progress', parseInt(p));
          },
        });
      });
      progress.button({
        position: 'top',
        label: '移除',
        key: 'Del',
        action: function () {
          minder.execCommand('Progress', 0);
        },
      });
      progress.button({
        position: 'top',
        label: '返回',
        key: 'esc',
        next: 'back',
      });
    }

    this.hotbox = hotbox;
  };
  // handleUndo = () => {
  //   this.ws.sendMessage('1undo');
  //   const { undoCnt, redoCnt } = this.state;
  //   this.setState({ undoCnt: undoCnt - 1, redoCnt: redoCnt + 1 });
  // };
  // handleRedo = () => {
  //   this.ws.sendMessage('1redo');
  //   const { undoCnt, redoCnt } = this.state;
  //   this.setState({ undoCnt: undoCnt + 1, redoCnt: redoCnt - 1 });
  // };

  handleUndoAck = (data) => {

    console.log('undo ack get', data)
    this.groupNode.undo(data)
  }
  handleRedoAck = (data) => {
    console.log('redo ack get', data)
    this.groupNode.redo(data)

  }

  getKeyCodeForEdit = () => {
    var keycodes = [];
    for (var i = 0; i < 26; i++)//英文字母
      keycodes.push(65 + i)
    for (var i = 0; i < 10; i++)//数字上方符号
      keycodes.push(48 + i)
    for (var i = 0; i < 10; i++) //数字
      keycodes.push(96 + i)
    for (var i = 0; i < 6; i++) //特殊字符
      keycodes.push(187 + i)
    return keycodes
  }

  handleRecordKeyDown = event => {


    let e = event || window.event || this.arguments.callee.caller.arguments[0]; //事件
    const ctrlKey = window.event.metaKey || window.event.ctrlKey;
    const hasModal =
      document.getElementsByClassName('agiletc-modal').length > 0;
    const { showEdit, selectedNode, inputContent, showToolBar } = this.state;
    const hasDrawer =
      document.getElementsByClassName('agiletc-note-drawer').length > 0;
    const isRefresh = ctrlKey && window.event.keyCode === 82;
    if (showToolBar && ctrlKey && window.event.keyCode === 70) {
      e.preventDefault();
      this.setState({ activeTab: '3' });
      this.viewgroup.setSearchFocus()
      //this.progressgroup.handleAction(4);
    }
    if (this.props.iscore != 3)
      return
    if (showToolBar && ctrlKey && window.event.code === 'ArrowUp') {
      e.preventDefault();
      this.progressgroup.handleAction(9);
    }
    else if (showToolBar && ctrlKey && window.event.code === 'ArrowDown') {
      e.preventDefault();
      this.progressgroup.handleAction(1);
    }

    //上下左右切换节点
    if ([37, 38, 39, 40].indexOf(window.event.keyCode) > -1) {
      this.minder.fire('keydown', e);
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.event.keyCode === 32) {
      e.preventDefault();
      window.isSpaceDown = true
    }

  }


  handleKeyDown = event => {

    const chatReqTextArea = document.getElementById('chatReqTextAreaNormal');
    const chatTextArea = document.getElementById('chatReqTextAreaContinue');
    const chatCaseDescInput = document.getElementById('chatCaseDescInput');

    if ((event.target === chatReqTextArea) || (event.target === chatTextArea) || (event.target === chatCaseDescInput) || (event.target.closest('.markdown-content') !== null)) {
      // 如果是来自chatReqTextArea，则跳过处理
      return;
    }

    // eslint-disable-next-line
    let e = event || window.event || this.arguments.callee.caller.arguments[0]; //事件
    const ctrlKey = window.event.metaKey || window.event.ctrlKey;
    const shiftKey = window.event.shiftKey;
    const hasModal =
      document.getElementsByClassName('agiletc-modal').length > 0;
    const { showEdit, selectedNode, inputContent } = this.state;
    const hasDrawer =
      document.getElementsByClassName('agiletc-note-drawer').length > 0;
    const isRefresh = ctrlKey && window.event.keyCode === 82;
    // comm + s 保存
    if (ctrlKey && window.event.keyCode === 83 && this.props.onSave) {
      e.preventDefault();
      this.props.onSave(this.minder.exportJson());
      // message.info('保存成功！');
    }

    // comm + f 搜索
    if (ctrlKey && window.event.keyCode === 70) {
      e.preventDefault();
      this.setState({ activeTab: '3' });
      this.viewgroup.setSearchFocus()
    }
    if (
      !hasModal &&
      !hasDrawer &&
      !showEdit &&
      e.preventDefault &&
      !isRefresh &&
      !window.search &&
      !window.tagInput
    ) {
      //上下左右切换节点
      if ([37, 38, 39, 40].indexOf(window.event.keyCode) > -1) {


        this.minder.fire('keydown', e);

        return;
      }


      var keycodes = this.getKeyCodeForEdit()
      if (keycodes.indexOf(window.event.keyCode) > -1 && !ctrlKey) {
        this.handleShowInput()
        //e.preventDefault();
      }
      // 空格
      if (window.event.keyCode === 32) {
        e.preventDefault();
        window.isSpaceDown = true
        let targetString = event.target.className;
        if (targetString.indexOf('input') !== -1) {
          return;
        }

        let minder = this.minder;
        if (!minder.getSelectedNodes() || minder.getSelectedNodes().length !== 1) {
          return;
        }
        setTimeout(this.handleShowInput, 100);

      }
      if (ctrlKey && [49, 50, 51, 52, 53].indexOf(window.event.keyCode) > -1) {
        e.preventDefault();
        var priority = window.event.keyCode - 49 + 1
        if (window.event.keyCode != 53)
          this.minder.execCommand('Priority', priority);
        else //移除优先级
          this.minder.execCommand('Priority', null);
      }

      // ctrl + e ai助手
      if (ctrlKey && window.event.keyCode === 69 && this.props.recordId === "undefined" && !this.props.historyId) {
        e.preventDefault();
        this.setState({
          showDifyChat: true
        });
        this.aichatRef.current.copyCase()
      }
      // ctrl + a 全选
      if (ctrlKey && window.event.keyCode === 65) {
        e.preventDefault();
        let selection = [];
        this.minder.getRoot().traverse(node => {
          selection.push(node);
        });
        this.minder.select(selection, true);
      }
      if (this.state.selectedNode !== null) {
        // if (ctrlKey && window.event.keyCode === 67) {
        //   e.preventDefault();
        //   this.minder.execCommand('Copy');
        // }
        // if (ctrlKey && window.event.keyCode === 88) {
        //   e.preventDefault();
        //   this.minder.execCommand('Cut');
        // }
        // if (ctrlKey && window.event.keyCode === 86) {
        //   e.preventDefault();
        //   this.minder.execCommand('Paste');
        // }
        if ([13, 9].indexOf(window.event.keyCode) > -1) {
          const parentClass =
            document.activeElement.parentNode.parentNode.className || '';

          if (window.event.keyCode === 13 && window.event.shiftKey &&
            parentClass.indexOf('resource-input') < 0) {
            e.preventDefault();
            
            // setTimeout(this.handleShowInput, 250);
           
            this.minder.execCommand('AppendParentNode', '分支主题');
            setTimeout(this.handleShowInput, 250);
          }
          if (
            window.event.keyCode === 13 && !window.event.shiftKey &&
            parentClass.indexOf('resource-input') < 0
          ) {
            e.preventDefault();
            
            //setTimeout(this.handleShowInput, 250);
            // 监听布局完成事件（一次性监听器）
           
            this.minder.execCommand('AppendSiblingNode', '分支主题');
            setTimeout(this.handleShowInput, 250);
          }
          if (window.event.keyCode === 9) {
            e.preventDefault();
           
             
            
            this.minder.execCommand('AppendChildNode', '分支主题');
            setTimeout(this.handleShowInput, 250);
          }


        }
        if (window.event.keyCode === 8) {
          e.preventDefault();
          this.minder.execCommand('RemoveNode');
        }
      }
      if (this.groupNode) {
        if (ctrlKey && window.event.keyCode === 90) {
          // this.expectedBase = this.minder.getBase() - 1;
          // this.handleUndo();
          e.preventDefault();
          this.groupNode.undo();
        }
        if (ctrlKey && window.event.keyCode === 89) {
          // this.expectedBase = this.minder.getBase() + 1;
          // this.handleRedo();
          e.preventDefault();
          this.groupNode.redo();
        }
      }
    }
    if (showEdit) {
      // 显示编辑框时，shift+回车=换行
      if (window.event.keyCode === 13 && !window.event.shiftKey) {



        this.setState({ showEdit: false, inputContent: null });
        window.showEdit = false;

        selectedNode.setText(inputContent);
        selectedNode.render();
        selectedNode.getMinder().layout(300);
        // this.minder.setStatus('readonly');
        //this.minder.refresh();
        //this.minder.setStatus('normal');
        //this.minder.fire('contentchange');

        e.preventDefault();
      }
    }
  };
  sendPatch = e => {

    var self = this;
    var historyId = self.props.historyId;

    if (this.groupNode && window.minderData) {
      this.groupNode.changed();
      const caseObj = e.minder.exportJson();


      caseObj.right = window.minderData.right || 1;

      const patch = this.groupNode.getAndResetPatch();

      if (patch.length === 1 && patch[0].path === '/base') {
        e.minder._status = 'normal';
        return;
      }

      if (patch.length > 0 && e.minder._status !== 'readonly') {


        // if (this.expectedBase !== e.minder.getBase()) {
        //   alert(
        //     `版本信息不对，请刷新页面重试。ExpBase: ${
        //       this.expectedBase
        //     }, base: ${e.minder.getBase()}`,
        //   );
        //   return;
        // }
        // this.ws.sendMessage('1' + JSON.stringify({ case: caseObj, patch }));
        // const { undoCnt } = this.state;
        // this.setState({ undoCnt: undoCnt + 1 });
        // this.websocketHeartbeatJs.send(JSON.stringify({ case: caseObj, patch }));
        //this.ws.sendMessage('edit', { caseContent: JSON.stringify(caseObj), patch: JSON.stringify(patch), caseVersion: caseObj.base });


        this.base = e.minder.getBase();
        this.expectedBase = this.base + 1;

        if (!historyId) {

          this.doOutline(caseObj)

          var ts = new Date().getTime();
          var info = { caseContent: JSON.stringify(caseObj), patch: JSON.stringify(patch), caseVersion: caseObj.base, ts: ts };
          this.ws.sendSocketMessage(JSON.stringify({ 'type': 'edit', 'data': info }))

          
           
          //this.ws.sendSocketMessage(JSON.stringify({ 'type': 'edit', 'data': info }))

          //console.log("Send mod data")

          // e.minder.execCommand('resetlayout');

          // caseObj.base=caseObj.base+1;

          //不适用本地缓存
          // if (this.props.recordId === "undefined") {
          //   //localStorage.setItem(JSON.stringify(this.props.wsParam), JSON.stringify(caseObj))
          //   caseObj.base = caseObj.base + 1;
          //   setLocalWithExpiry(JSON.stringify(this.props.wsParam), JSON.stringify(caseObj))

          // }
        }

      }
      e.minder._status = 'normal';
    }
  };
  travere = arrPatches => {
    var patches = [];
    for (var i = 0; i < arrPatches.length; i++) {
      if (arrPatches[i].op === undefined) {
        for (var j = 0; j < arrPatches[i].length; j++) {
          patches.push(arrPatches[i][j]);
        }
      } else {
        patches.push(arrPatches[i]);
      }
    }
    return patches;
  };



  updateInputWidth = (text) => {
    if (!this.inputNode) return;
    const textarea = this.inputNode.querySelector('textarea');
    const font = textarea
      ? window.getComputedStyle(textarea).font
      : "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const textWidth = measureTextWidth(text, font);
    const newWidth = Math.max(textWidth + 32, 120);
    this.inputNode.style.width = Math.round(newWidth) + 'px';
  };

  handleShowInput = () => {
    const { minder, inputNode } = this;
    if (minder.getSelectedNode() && minder.getStatus() !== 'readonly') {
      const node = minder.getSelectedNode();
      const text = node.getText() || '';
      this.setState({ showEdit: true, inputContent: text }, () => {
        window.showEdit = true;
        editInput(node, inputNode);
        this.updateInputWidth(text);
        document.getElementsByClassName('edit-input')[0].children[0].select();
      });
    }
  };
  handleInputChange = e => {
    const text = e.target.value;
    this.setState({ inputContent: text });
    this.updateInputWidth(text);
  };
  handleNotePreview = e => {
    if (e) {
      this.setState(
        {
          noteContent: e.node.getData('note')
            ? marked(e.node.getData('note'))
            : '',
          noteNode: e,
        },
        () => {
          preview(e.node, this.previewNode);
        },
      );
    } else {
      this.setState({ noteContent: null });
    }
  };

  hideToolBar = () => {
    this.setState({ showToolBar: false })
    //
  }

  handleWsClose = e => {
    // if (this.props.onClose) {
    //   this.props.onClose(this.minder.exportJson());
    // }
    if (this.modal === undefined) {
      this.modal = Modal.warning({
        title: 'Websocket通信已断开，请手动刷新页面。',
        className: 'agiletc-modal ws-warning',
        getContainer: () =>
          document.getElementsByClassName('kityminder-core-container')[0],
        okText: '知道了，立即刷新',
        onOk: () => {
          this.modal = undefined;
          location.reload();
        },
      });
    }
    // this.heartCheck.reset();
  };

  /**
   * 懒绘制大量节点函数
   * @param minder 实例
   * @param data JSON数据
   * @param level 缓加载层数,默认3层
   * @param taskBatchCount 每次执行任务数,默认5次
   */
  largeJsonImport = (minder, data, level = 3, taskBatchCount = 5) => {
    const childrens = [];
    /**
     * 工具函数
     */
    const handleTreeOnDepthWithCallback = (root, depth = 1, cb = () => { }) => {
      if (depth === 0) {
        cb(root);
        return;
      }
      if (root && root.children.length > 0) {
        root.children.forEach(child =>
          handleTreeOnDepthWithCallback(child, depth - 1, cb),
        );
      }
    };
    return new Promise(resolve => {
      let idx = 0;
      handleTreeOnDepthWithCallback(data.root, 3, root => {
        idx++;
        if (root.children && root.children.length > 0) {
          childrens[idx] = JSON.parse(JSON.stringify(root));
          childrens[idx].expandState = 'collapse';
          root.children = [];
        }
      });

      idx = 0;
      const tasks = [];
      const batchRunTask = deadline => {
        while (
          (deadline.timeRemaining() > 0 || deadline.didTimeout) &&
          tasks.length > 0
        ) {
          // 批量执行任务 默认5个一批
          let taskBatchIdx = taskBatchCount;
          while (taskBatchIdx-- && tasks.length) {
            tasks.shift()();
          }
        }

        // 刷新
        minder.refresh(0);
        if (tasks.length > 0) {
          // 需要考虑浏览器兼容，可以考虑pollyfill；
          requestIdleCallback(batchRunTask);
        } else {
          resolve();
        }
      };

      const handleImportBigBundle = () => {
        handleTreeOnDepthWithCallback(minder._root, 3, root => {
          tasks.push(() => {
            idx++;
            const temp = childrens[idx];
            temp !== undefined && minder.importNode(root, temp);
          });
        });
        // 启动渲染
        requestIdleCallback(batchRunTask);

        // 取消动画
        minder.refresh(0);
        // 没有once，手动实现
        minder.off('import', handleImportBigBundle);
      };
      minder.on('import', handleImportBigBundle);
    });
  };

  heartCheck = {
    timeout: 10000, // 毫秒
    timeoutObj: null,
    serverTimeoutObj: null,
    reset: function () {
      clearInterval(this.timeoutObj);
      clearInterval(this.serverTimeoutObj);
      return this;
    },
    start: function (ws) {
      const self = this;
      this.timeoutObj = setTimeout(function () {
        // 这里发送一个心跳，后端收到后，返回一个心跳消息，
        // onmessage拿到返回的心跳就说明连接正常
        ws.sendMessage('0' + 'ping ping ping');
        self.serverTimeoutObj = setTimeout(function () {
          // 如果超过一定时间还没重置，说明后端主动断开了
          // 这里为什么要在send检测消息后，倒计时执行这个代码呢，因为这个代码的目的时为了触发onclose方法，这样才能实现onclose里面的重连方法
          // 所以这个代码也很重要，没有这个方法，有些时候发了定时检测消息给后端，后端超时（我们自己设定的时间）后，不会自动触发onclose方法。
          ws.state.ws.close();
          ws.state.ws.onclose();
        }, self.timeout);
      }, this.timeout);
    },
  };

  handleWsOpen = () => {
    window.ws = this.ws;
    // this.heartCheck.reset().start(this.ws);
    console.log("handle ws open", window.ws);
  };
  handleLock = (data) => {
    switch (data) {
      case '0':
        this.minder.setStatus('readonly');
        this.setState({ isLock: true }, () => {
          document.removeEventListener('keydown', this.handleKeyDown);
        });
        notification.warning({ message: '用例被锁住，当前只读' });
        break;

      case '1':
        this.minder.setStatus('normal', true);
        this.setState({ isLock: false }, () => {
          this.initOnEvent(this.minder);
          document.addEventListener('keydown', this.handleKeyDown);
        });
        notification.warning({ message: '用例被解锁，请刷新重试' });
        break;

      case '2':
        notification.success({ message: '加/解锁成功' });
        var cur = !this.state.locked;
        this.setState({ locked: cur });


        break;

      case '3':
        notification.error({ message: '加/解锁失败' });
        break;
    }
  }

  handleWsUserStat = (data) => {
    console.log('user info , ', data);
    this.setState({ nowUseList: data?.split(',') || [] });
  }

  handleWsData = data => {
    // if (data === 'pong pong pong') {
    //   this.heartCheck.reset().start(this.ws);
    //   return;
    // }
    // if (data === 'ping ping ping') {
    //   this.heartCheck.reset().start(this.ws);
    //   this.ws.sendMessage('0' + 'pong pong pong');
    //   return;
    // }
    if (data === 'HTTP_ACCESS_ERROR') {
      notification.warning({ message: '服务端实例退出，请刷新页面。' });
      return;
    }
    if (data === 'websocket on error') {
      this.ws.state.ws.onclose();
      return;
    }

    if (data.substring(0, 4) == '当前用户') {
      // notification.warning({ message: data.split(',')[0] });
      this.setState({ nowUseList: data.split('用户是:')[1]?.split(',') || [] });
      return;
    }
    // if (data.substring(0, 1) == '2') {
    //   // 控制消息
    //   if (data.substring(1, 5) == 'lock') {
    //     this.minder.setStatus('readonly');
    //     this.setState({ isLock: true }, () => {
    //       document.removeEventListener('keydown', this.handleKeyDown);
    //     });
    //     notification.warning({ message: '用例被锁住，当前只读' });
    //   } else if (data.substring(1, 5) == 'unlo') {
    //     this.minder.setStatus('normal', true);
    //     this.setState({ isLock: false }, () => {
    //       this.initOnEvent(this.minder);
    //       document.addEventListener('keydown', this.handleKeyDown);
    //     });
    //     notification.warning({ message: '用例被解锁，请刷新重试' });
    //   } else if (data.substring(1, 5) == 'succ') {
    //     notification.success({ message: '加/解锁成功' });
    //     this.setState({ locked: !this.state.locked });
    //   } else {
    //     notification.error({ message: '加/解锁失败' });
    //   }
    //   return;
    // }
    // const recv;
    try {
      const recv = JSON.parse(data || '{}');

      if (recv.root === undefined) {
        // 如果json解析没有root节点
        this.minder.setStatus('readonly');
        const recvPatches = this.travere(recv);
        const recvBase = recvPatches.filter(item => item.path === '/base')[0]
          ?.value;
        const recvFromBase = recvPatches.filter(
          item => item.path === '/base',
        )[0]?.fromValue;
        this.minder.applyPatches(recvPatches);
        if (!(recvPatches.length === 1)) {
          // 如果是通知报文
          if (recvFromBase != undefined && recvFromBase == recvBase + 1) {
            // undo
            if (this.expectedBase != recvBase + 1) {
              alert(
                `通知报文回复的version错误，需要刷新. Exp:${this.expectedBase},Act:${recvBase}`,
              );
            } else {
              this.expectedBase = recvBase;
            }
          } else {
            if (this.expectedBase != recvBase - 1) {
              alert(
                `通知报文回复的version错误，需要刷新. Exp:${this.expectedBase},Act:${recvBase}`,
              );
            } else {
              this.expectedBase = recvBase;
            }
          }
        } else {
          // 如果是应答报文
          if (this.expectedBase != recvBase) {
            alert(
              `应答报文回复的version错误，需要刷新. Exp:${this.expectedBase},Act:${recvBase}`,
            );
          }
        }
      } else {
        const dataJson = { ...recv };

        // this.largeJsonImport(this.minder, data).then(() => {
        //   // 可以给个右下角的loading标记
        //   // 不需要加遮罩层，界面还是可以操作的
        // });
        if (data === JSON.stringify(this.minder.exportJson())) {
          return;
        }
        window.minderData = undefined;
        this.minder.importJson(dataJson);
        window.minderData = dataJson;

        // 第一次打开用例，预期base与用例的base保持一直
        this.expectedBase = this.minder.getBase();
      }
    } catch (e) {
      console.error(e);
      alert('连接异常，请刷新重试');
    }
  };
  // 随机色
  getColorByName(str) {
    for (
      var i = 0, hash = 0;
      i < str.length;
      hash = str.charCodeAt(i++) + ((hash << 5) - hash)
    );
    let color = Math.floor(
      Math.abs(((Math.sin(hash) * 10000) % 1) * 16777216),
    ).toString(16);
    let rgb = '#' + Array(6 - color.length + 1).join('0') + color;
    return rgb + 'bf';
  }

  onGotoList = () => {
    this.props.onSave({ "redirecturl": "/mycasemind-cms/case/caseList/1" })
    //window.location.href="/mycasemind-cms/case/caseList/1"
  }

  convertJsontoOutline = (json, res, level) => {

    if (level > 2)
      return

    var title = json.data.text;
    if (title && title.length > 12)
      title = title.substring(0, 12) + " ..."
    var cur = { "key": json.data.id, "title": <Tooltip title={json.data.text}>{title}</Tooltip>, "id": json.data.id, "children": [] }
    res.push(cur)
    if (json.children) {
      for (var i = 0; i < json.children.length; i++) {
        this.convertJsontoOutline(json.children[i], cur["children"], level + 1)
      }
    }
  }



  doOutline = (content) => {
    // this.minder.exportData('text').then(function (content) {
    //     console.log(content)
    // });
    console.log("doOutline " + content)
    var json
    if (content)
      json = content
    else
      json = this.minder.exportJson();

    var res = []
    this.convertJsontoOutline(json.root, res, 0);
    if (!_.isEqual(this.state.outlinedata, res)) {
      this.setState({ outlinedata: res });
    }

    //console.log(this.state.outlinedata)
  }

  onButtonSave = () => {

    //this.ws.sendMessage('save', { caseContent: JSON.stringify(this.minder.exportJson()), patch: '', caseVersion: '' });
    var info = { caseContent: JSON.stringify(this.minder.exportJson()), patch: '', caseVersion: '' };
    this.ws.sendSocketMessage(JSON.stringify({ 'type': 'save', 'data': info }))
  }

  onButtonClear = () => {
    //this.ws.sendMessage('save', { caseContent: JSON.stringify(this.minder.exportJson()), patch: '', caseVersion: '' });

    //var info={ caseContent: JSON.stringify(this.minder.exportJson()), patch: '', caseVersion: '' };
    //this.ws.sendSocketMessage(JSON.stringify({'type':'save','data':info}))

    //this.ws.sendMessage('record_clear', { caseContent: '', patch: '', caseVersion: '' });

    var self = this;
    confirm({
      title: '确认清除执行记录?',
      content: '确认清除执行记录？所有的执行记录将会清除',
      onOk() {
        var info = { caseContent: '', patch: '', caseVersion: '' };
        self.ws.sendSocketMessage(JSON.stringify({ 'type': 'record_clear', 'data': info }))
      },
      onCancel() { },
    });

  }

  showModal = () => {
    this.setState({
      modalvisible: true,
    });
  };

  hideModal = () => {
    this.setState({
      modalvisible: false,
    });
  };

  showCapModal = () => {
    this.setState({
      modalcapvisible: true,
    });
  };

  hideCapModal = () => {
    this.setState({
      modalcapvisible: false,
    });
  };

  handleSelect = (value) => {
    //console.log(`selected ${value}`);
    this.setState({
      prviewres: value,
    });
  }

  handleCapSelect = (value) => {
    //console.log(`selected ${value}`);
    this.setState({
      capres: value,
    });
  }

  saveCapture = () => {
    var curparam = { 'caseId': this.props.caseId, 'recordId': this.props.recordId, 'capInfo': this.state.capres }
    let url = `/case/capture`;
    request(url, { method: 'POST', body: curparam }).then(res => {
      if (res.code === 200) {
        message.success("提交成功")
      } else {
        message.error(res.msg);
      }
    });
  }

  submitCapture = () => {
    this.hideCapModal();
    this.ws.sendSocketMessage(JSON.stringify({ 'type': 'syrecord', 'data': "forcap" }))
  }

  createCaptue = () => {
    // alert(this.props.caseId+","+this.props.recordId)
    this.showCapModal()

  }

  submitPrview = () => {
    //alert(this.state.prviewres)

    this.hideModal()
    var curparam = { 'id': this.props.recordId_V2, 'review_result': this.state.prviewres, 'user_name': getCookies('username') }
    let url = `/record/editprview`;
    request(url, { method: 'POST', body: curparam }).then(res => {
      if (res.code === 200) {
        message.success("提交成功")
      } else {
        message.error(res.msg);
      }
    });
  }

  goBack = () => {
    //window.location.href=`/mycasemind-cms/history/${this.props.caseId}`
    history.back()
  }


  BackupSyn = () => {
    //backupsyn
    var self = this;
    confirm({
      title: '你确定要同步用例么?',
      // icon: <ExclamationCircleFilled />,
      content: '最新的用例将被覆盖，请确认是否同步。',
      onOk() {
        var caseId = self.props.caseId;
        var historyId = self.props.historyId;
        var curparam = { 'caseId': caseId, 'historyId': historyId }
        let url = `/case/backupsyn`;
        request(url, { method: 'POST', body: curparam }).then(res => {
          if (res.code === 200) {
            message.success("同步成功")
          } else {
            message.error(res.msg);
          }
        });
      },
      onCancel() {
        console.log('Cancel');
      },
    });


  }

  showHidleOutline = () => {

    this.setState({
      showoutline: (!this.state.showoutline),
    });
  }

  onButtonPrview = () => {

    this.setState({
      modalvisible: true,
    });

  }

  handleExportChange = (value) => {
    const { caseTitle } = this.props;
    if (value == "freeMind") {
      this.exportCaseFile(caseTitle.title, caseTitle.id, 'freemind')
    }
    else if (value == "xmind") {
      this.exportCaseFile(caseTitle.title, caseTitle.id, 'xmind')
    }
    else if (value == "png") {
      this.exportCasePng(caseTitle.title)
    }
    else if (value == "excel") {
      const caseObj = this.minder.exportJson();
      var info = { caseContent: JSON.stringify(caseObj) };
      this.ws.sendSocketMessage(JSON.stringify({ 'type': 'sycase', 'data': info }))
      setTimeout(() => {
        this.exportCaseFile(caseTitle.title, caseTitle.id, 'excel')
      }, 1000);

    }
    else if (value == "markdown") {
      this.exportMarkDown(caseTitle.title)
    }
  }

  changeTab = (activeKey) => {
    alert(activeKey);

  };

  handleFontChange = (value) => {

    if (value === '"LXGW WenKai Mono Screen", sans-serif') {
      const cssLoaded = Array.from(document.styleSheets).some(styleSheet =>
        styleSheet.href && styleSheet.href.includes('https://registry.npmmirror.com/lxgw-wenkai-screen-web/latest/files/style.css')
      );

      // 如果外部样式表未加载，则加载它
      if (!cssLoaded) {
        const link = document.createElement('link');
        link.href = 'https://registry.npmmirror.com/lxgw-wenkai-screen-web/latest/files/style.css'; // 替换为你要加载的 CSS 文件路径
        link.rel = 'stylesheet';
        link.onload = () => {
          //setCssLoaded(true); // 当 CSS 加载完成后更新状态

        };
        document.head.appendChild(link);
      }
    }
    var allElements = document.querySelectorAll('*');
    for (var i = 0; i < allElements.length; i++) {
      var element = allElements[i];
      // 设置元素的字体样式

      element.style.fontFamily = value;
    }
    localStorage.setItem('font_select', value)
  }

  // 修改 theme 的方法
  setTheme = (newTheme) => {
    this.setState({ theme: newTheme });
  }

  copyToClipboardV1 = (text) => {
    if (!navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text)
    } else {
      // 判断是否支持拷贝
      if (!document.execCommand('copy')) return Promise.reject()
      // 创建标签，并隐藏
      const textArea = document.createElement('textarea')
      textArea.style.position = 'fixed'
      textArea.style.top = textArea.style.left = '-100vh'
      textArea.style.opacity = '0'
      textArea.value = text
      document.body.appendChild(textArea)
      // 聚焦、复制
      textArea.focus()
      textArea.select()
      return new Promise((resolve, reject) => {
        // 不知为何，必须写这个三目，不然copy不上
        document.execCommand('copy') ? resolve() : reject()
        textArea.remove()

      })
    }

  }

  toggleDifyChat = () => {
    this.setState(prevState => ({
      showDifyChat: !prevState.showDifyChat
    }));
  };

  getTouchCenter = touches => {
    const firstTouch = touches[0];
    const secondTouch = touches[1];
    return {
      x: (firstTouch.clientX + secondTouch.clientX) / 2,
      y: (firstTouch.clientY + secondTouch.clientY) / 2,
    };
  };

  stopTouchPanEvent = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation && e.nativeEvent.stopImmediatePropagation();
    }
  };

  handleTouchPanStart = e => {
    if (!this.state.isPad || !this.minder || e.touches.length !== 2) return;

    this.stopTouchPanEvent(e);
    this.isTouchPanning = true;
    this.touchPanLastPoint = this.getTouchCenter(e.touches);
  };

  handleTouchPanMove = e => {
    if (!this.isTouchPanning || !this.minder || e.touches.length !== 2) return;

    this.stopTouchPanEvent(e);
    const currentPoint = this.getTouchCenter(e.touches);
    const offsetX = currentPoint.x - this.touchPanLastPoint.x;
    const offsetY = currentPoint.y - this.touchPanLastPoint.y;

    if (offsetX || offsetY) {
      this.minder.execCommand('moveV2', offsetX, offsetY);
    }
    this.touchPanLastPoint = currentPoint;
  };

  handleTouchPanEnd = e => {
    if (!this.isTouchPanning) return;

    this.stopTouchPanEvent(e);
    if (e.touches.length < 2) {
      this.isTouchPanning = false;
      this.touchPanLastPoint = null;
    }
  };

  handleCloseDifyChat = () => {
    this.setState({
      showDifyChat: false
    });
  };

  render() {


    const {
      minder,
      noteContent,
      showEdit,
      inputContent,
      noteNode,
      activeTab,
      showToolBar,
      fullScreen,
      loading,
      isLock,
      locked,
      // undoCnt,
      // redoCnt,
      popoverVisible,
      nowUseList,
      outlinedata,
      showoutline,
      fontVal,
      exportVal,
      theme,
      showDifyChat,
    } = this.state;
    const {
      progressShow = true,
      caseTitle = '',
      recordTitle = '',
      readOnly = false,
      editorStyle = {},
      tags,
      wsUrl1 = '',
      getContentById,
      updateRecordDetail,
      wsParam,
      callback,
      iscore,
      type,
      historyId,

    } = this.props;
    const titleText = caseTitle ? caseTitle.title : '';
    const titleDisplay =
      titleText.length > 9 ? `${titleText.slice(0, 9)}...` : titleText;
    const childProps = {
      ...this.props,
      minder,
      isLock,
    };
    const { Option } = Select;
    const tabContentClass = `toolbar has-right-border`;


    var capOptionData = ['第一轮', '第二轮', '第三轮', '第四轮', '第五轮'],
      MakeItem = (X) => {
        return <Option key={X} value={X} >{X}</Option>;
      };

    return (
      <ConfigProvider locale={zhCN}>
        <div

          className={`kityminder-editor-container${fullScreen ? ' full-screen' : ''
            }`}
          style={editorStyle}
        >

          {(<OutlineTree
            ref={this.outlineTreeRef}
            isShow={this.state.showoutline}
            doOutline={this.doOutline}
            treeData={outlinedata}
            minder={this.minder}
            showHidleOutline={this.showHidleOutline}
            setTheme={this.setTheme}
          >
          </OutlineTree>)}

          {minder && type !== 'compare' && (


            <Socket
              historyId={historyId}
              url=""
              url1={wsUrl1}
              getContentById={getContentById}
              updateRecordDetail={updateRecordDetail}
              wsParam={wsParam}
              onOpen={this.handleWsOpen}
              onMessage={this.handleWsData}
              onClose={this.handleWsClose}
              wsMinder={this.minder}
              hideToolBar={this.hideToolBar}
              handleLock={this.handleLock}
              handleUndoAck={this.handleUndoAck}
              handleRedoAck={this.handleRedoAck}
              saveCapture={this.saveCapture}
              handleWsUserStat={this.handleWsUserStat}
              doOutline={this.doOutline}
              // onError={e => {
              //   notification.info({
              //     message: 'websocket连接错误，错误详情：' + e,
              //   });
              // }}
              // reconnect={false}
              ref={ws => {
                this.ws = ws;
                window.ws = ws;
              }}
            />
          )}
          {minder && (
            <div >

              <Tabs

                ref={this.tabsRef}
                tabBarStyle={{
                  backgroundColor: theme == 'dark' ? '#2d2d2d' : '', // 修改tab背景色
                  color: theme == 'dark' ? '#d5d5d5' : '', // 修改tab字体颜色

                }}


                style={{ backgroundColor: theme == 'dark' ? '#2d2d2d' : '' }}
                activeKey={activeTab}
                className={`${theme == 'dark' ? 'custom-dark-tabs' : ''} custom-tabs kityminder-tools-tab${showToolBar ? '' : ' collapsed'
                  } `}
                tabBarExtraContent={[

                  <Icon
                    onClick={() => {
                      window.location.href = "/mycasemind-cms/case/caseList/1"
                    }}
                    type="double-left"
                    className="custom-button" />,
                  <span className="centered-text">&nbsp;
                    <CopyToClipboard
                      text={titleText}
                      onCopy={() => message.info('标题已复制到剪切板！', 0.5)}>
                      <span title={titleText}>{titleDisplay}</span>
                    </CopyToClipboard></span>,
                  <span style={{ marginRight: "10px" }}>
                    {this.props.recordId === "undefined" && !historyId && (

                      <Button onClick={this.toggleDifyChat} style={{ backgroundColor: theme === 'dark' ? '#232323' : 'white', color: theme === 'dark' ? '#d5d5d5' : '#1890ff' }}>
                        {this.state.showDifyChat ? '关闭AI助手' : '打开AI助手'}
                      </Button>


                    )}
                  </span>,
                  <span style={{ marginRight: "10px" }}>
                    {/* <span>
                    {nowUseList.map((item) => (
                      <span key={item} >
                        {item}
                      </span>
                    ))}
                  </span> */}

                    {caseTitle && !historyId && (

                      <Select defaultValue={exportVal}
                        style={{
                          width: 100, color: theme == 'dark' ? '#d5d5d5' : '#1890ff',
                        }}
                        className={theme == 'dark' ? 'dark-select' : ''}
                        onChange={this.handleExportChange}>
                        <Option value='' >
                          导出用例
                        </Option>
                        <Option value='freeMind'>
                          FreeMind
                        </Option>
                        <Option value='xmind'>
                          XMind
                        </Option>
                        <Option value='excel'>
                          Excel
                        </Option>
                        <Option value="png">
                          PNG图片
                        </Option>
                        <Option value="markdown">
                          Markdown
                        </Option>
                      </Select>
                      //   <Button  style={{ backgroundColor: 'white', color: '#1890ff' }}
                      //           onClick={()=>{
                      //             console.log(recordTitle)
                      //             //this.exportCase(caseTitle?caseTitle.title:(recordTitle.title?recordTitle.title:''))}}
                      //             this.exportCaseFreeMind(caseTitle.title,caseTitle.id)}}
                      //             >
                      //   导出
                      // </Button>
                    )
                    }
                  </span>,
                  // <span style={{marginRight:"10px"}}>
                  //   <Button  style={{ backgroundColor: 'white', color: '#1890ff' }}>
                  //     <Link to="/case/caseList/1">返回</Link>
                  //     </Button>
                  // </span>,

                  <Popover
                    key="list"
                    placement="bottomRight"
                    content={
                      <List
                        grid={{
                          gutter: 30,
                          column: nowUseList.length >= 4 ? 4 : 1,
                        }}
                        itemLayout="horizontal"
                        dataSource={nowUseList || []}
                        renderItem={item => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  style={{
                                    backgroundColor: this.getColorByName(item),
                                  }}
                                >
                                  {item.substr(0, 1)}
                                </Avatar>
                              }
                              title={
                                <div style={{ lineHeight: '32px' }}>{item}</div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    }
                    trigger="click"
                    visible={popoverVisible}
                    onVisibleChange={visible =>
                      this.setState({ popoverVisible: visible })
                    }
                  >

                    {
                      !historyId &&
                      <Button
                        //type="primary"
                        onMouseEnter={this.handleMouseEnter}
                        style={{ marginRight: 12, backgroundColor: theme === 'dark' ? '#232323' : 'white', color: theme === 'dark' ? '#d5d5d5' : '#1890ff' }}
                        onClick={() =>
                          this.setState({ popoverVisible: !popoverVisible })
                        }
                      >
                        {nowUseList ? nowUseList.length : 1}人在线
                      </Button>

                    }
                  </Popover>,

                  (!historyId &&
                    <Tooltip
                      title="复制链接，分享用例"
                      key="linkcopy">
                      <CopyToClipboard text={location.href}
                        onCopy={() => message.info('分享链接已复制到剪切板！')}>
                        <Button
                          style={{ backgroundColor: theme === 'dark' ? '#232323' : 'white', color: theme === 'dark' ? '#d5d5d5' : '#1890ff' }}>
                          用例分享
                        </Button>
                      </CopyToClipboard><span>&nbsp;&nbsp;</span>
                    </Tooltip>
                  ),


                  (!historyId &&
                    <Tooltip
                      title="设置字体"
                    >
                      <Select defaultValue={fontVal}
                        style={{ width: 100, color: theme == 'dark' ? '#d5d5d5' : '#1890ff' }}
                        className={theme == 'dark' ? 'dark-select' : ''}
                        onChange={this.handleFontChange}>
                        <Option value='"SF Pro SC","SF Pro Text","SF Pro Icons","PingFang SC","Helvetica Neue","Helvetica","Arial", sans-serif'>
                          本地字体
                        </Option>
                        <Option value='"LXGW WenKai Mono Screen", sans-serif'>
                          霞鶩文楷
                        </Option>
                        <Option value="仓耳今楷">
                          仓耳今楷
                        </Option>
                      </Select>
                      &nbsp; &nbsp;
                    </Tooltip>
                  ),


                  (!historyId && <Tooltip
                    key="lock"
                    title={
                      isLock || locked
                        ? '用例被锁住，当前只读，点击开关解锁。'
                        : '用例未上锁，点击开关锁住。'
                    }
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                  >
                    {type !== 'compare' && (
                      <Switch
                        size="small"
                        checkedChildren={<Icon type="lock" />}
                        unCheckedChildren={<Icon type="unlock" />}
                        checked={isLock || locked}
                        onClick={checked => {
                          //this.ws.sendMessage('lock', {message: checked ? 'lock' : 'unlock'});
                          var info = { message: checked ? 'lock' : 'unlock' };
                          this.ws.sendSocketMessage(JSON.stringify({ 'type': 'lock', 'data': info }))

                        }}
                        className="agiletc-lock"
                      />
                    )}
                  </Tooltip>),
                  <Button
                    key="full"
                    type="link"
                    icon={`fullscreen${fullScreen ? '-exit' : ''}`}
                    style={{ backgroundColor: theme === 'dark' ? '#232323' : 'white', color: theme === 'dark' ? '#d5d5d5' : '#1890ff' }}
                    onClick={() => {
                      this.setState({ fullScreen: !fullScreen });
                      callback && callback({ fullScreen: !fullScreen });
                    }}
                  >
                    {fullScreen ? '退出全屏' : '全屏'}
                  </Button>,
                  <Button
                    key="show"
                    type="link"
                    style={{ backgroundColor: theme === 'dark' ? '#232323' : 'white', color: theme === 'dark' ? '#d5d5d5' : '#1890ff' }}
                    onClick={() => this.setState({ showToolBar: !showToolBar })}
                  >
                    <Icon type="double-left" rotate={showToolBar ? 90 : -90} />{' '}
                    {showToolBar ? '收起' : '展开'}
                  </Button>,

                ]}

                // onChange={activeKey => {
                //   return
                //   this.setState({ activeTab: activeKey });
                // }}

                onTabClick={(activeKey, e) => {
                  if (e)
                    this.setState({ activeTab: activeKey });
                }}

              >

                {type !== 'compare' && (
                  <TabPane tab="思路" key="1" >
                    <div className={tabContentClass}
                      style={{ borderBottom: theme == 'dark' ? '1px solid grey' : '' }}>
                      <DoGroup
                        ref={groupNode => (this.groupNode = groupNode)}
                        initData={this.initData}
                        {...childProps}
                        wsInstance={this.ws}
                        theme={theme}
                      />
                      {!readOnly && (
                      <Nodes
                        initData={this.initData}
                        {...childProps}
                        theme={theme}
                        callback={() => {
                          setTimeout(this.handleShowInput, 300);
                        }}
                      />
                    )}
                      {!readOnly && 
                      <DoMove 
                        {...childProps} 
                        theme={theme}
                      />}
                      {/* {!readOnly && (
                      <OperationGroup
                        {...childProps}
                        theme={theme}
                        handleShowInput={this.handleShowInput}
                      />
                    )} */}
                      <MediaGroup {...childProps} theme={theme} />
                      {!readOnly && <PriorityGroup {...childProps} theme={theme} />}
                      {!readOnly && tags && <TagGroup {...childProps} theme={theme} />}
                      {progressShow &&
                        <ProgressGroup {...childProps}
                          onRef={this.onPGRef}
                          theme={theme}
                        />}

                    </div>
                  </TabPane>
                )}
                <TabPane tab="外观" key={type !== 'compare' ? '2' : '1'}>
                  <div className={tabContentClass}
                    style={{ borderBottom: theme == 'dark' ? '1px solid grey' : '' }} >
                    <ThemeGroup
                      {...childProps}
                      themeVal={theme}
                      callOutlineReRender={() => {

                        if (this.outlineTreeRef.current) {
                          this.outlineTreeRef.current.reRender();
                        }
                      }} />
                    <TemplateGroup {...childProps} theme={theme} />
                    {type !== 'compare' && (
                      <React.Fragment>
                        <ResetLayoutGroup {...childProps} theme={theme} />
                        <StyleGroup {...childProps} theme={theme} />
                        <FontGroup {...childProps} theme={theme} />
                      </React.Fragment>
                    )}
                  </div>
                </TabPane>
                {type !== 'compare' && (
                  <TabPane tab="视图" key="3">
                    <div className={tabContentClass}
                      style={{ borderBottom: theme == 'dark' ? '1px solid grey' : '' }}>
                      <ViewGroup
                        onRef={this.onVGRef}
                        {...childProps}
                        theme={theme}
                        recordId={this.props.recordId}
                      />
                    </div>
                  </TabPane>
                )}
              </Tabs>
            </div>)}
          <div
            className="kityminder-core-container"
            onTouchStartCapture={this.handleTouchPanStart}
            onTouchMoveCapture={this.handleTouchPanMove}
            onTouchEndCapture={this.handleTouchPanEnd}
            onTouchCancelCapture={this.handleTouchPanEnd}
            ref={input => {
              if (!this.minder) {
                this.minder = new window.kityminder.Minder({
                  renderTo: input,
                });
                this.centerNode = input;
                this.initOnEvent(this.minder);
                this.initHotbox(this.minder);
              }
            }}
            style={{
              height: `calc(100% - 45px - ${showToolBar ? '80px' : '0px'})`,
              touchAction: this.state.isPad ? 'none' : undefined,
            }}
          >
            {loading && <Spin className="agiletc-loader" />}
          </div>
          <NavBar ref={this.navNode} {...childProps} theme={theme} />
          {this.minder && noteContent && (
            <div
              ref={previewNode => (this.previewNode = previewNode)}
              className={`note-previewer${noteContent ? '' : ' hide'}`}
              dangerouslySetInnerHTML={{ __html: noteContent }}
              onMouseEnter={() => this.minder.fire('shownoterequest', noteNode)}
            />
          )}
          {this.minder && (
            <div
              className={`edit-input${showEdit ? '' : ' hide'}`}
              ref={inputNode => (this.inputNode = inputNode)}
            >
              <Input.TextArea
                rows={1}
                value={inputContent || ''}
                onChange={this.handleInputChange}
                onBlur={() => {
                  // minder.setStatus('readonly');
                  minder.refresh();
                  // this.minder.setStatus('normal');
                  // minder.fire('contentchange');

                }}
                style={{ width: '100%', minWidth: 0 }}
                autoFocus
                autoSize
              />
            </div>
          )}
        </div>

        <div
          style={{
            display: 'inline-block',
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 999,
          }}
        >
          {/* 移除条件渲染，改为始终渲染 SSEButton 组件 */}
          <AIChat ref={this.aichatRef} visible={this.state.showDifyChat} onClose={this.handleCloseDifyChat} minder={this.minder} theme={theme} />
        </div>
        <div
          style={{
            display: 'inline-block',
            position: 'fixed',
            bottom: '30px',
            right: '20px',
            // zIndex: 999,
          }}
        >

          {!readOnly && iscore != 2 && iscore != 3 && showToolBar &&
            (
              <div style={{ display: 'inline-block' }}>

                <Tooltip title="">
                  <Button style={{ borderColor: theme == 'dark' ? '#3c3c3c' : '', backgroundColor: theme == 'dark' ? '#3c3c3c' : 'white', color: theme == 'dark' ? '#d5d5d5' : 'rgba(0, 0, 0, 0.7)' }} shape="round" onClick={this.showHidleOutline}>
                    {showoutline ? '隐藏大纲' : '显示大纲'}
                  </Button>
                </Tooltip>

                &nbsp;&nbsp;
                <Tooltip title="暂存数据，可从历史数据恢复用例">
                  <Button style={{ borderColor: theme == 'dark' ? '#3c3c3c' : '', backgroundColor: theme == 'dark' ? '#3c3c3c' : 'white', color: theme == 'dark' ? '#d5d5d5' : 'rgba(0, 0, 0, 0.7)' }} shape="round" onClick={this.onButtonSave}>
                    暂存
                  </Button>
                </Tooltip>

                &nbsp;&nbsp;
                <Button style={{ borderColor: theme == 'dark' ? '#3c3c3c' : '', backgroundColor: theme == 'dark' ? '#3c3c3c' : 'white', color: theme == 'dark' ? '#d5d5d5' : 'rgba(0, 0, 0, 0.7)' }} shape="round" onClick={() => {
                  // window.location.href="/mycasemind-cms/history/"+this.props.caseId
                  window.open("/mycasemind-cms/history/" + this.props.caseId, '_blank', 'noopener,noreferrer');
                }}>
                  历史数据
                </Button>

                &nbsp;&nbsp;
                <Button style={{ borderColor: theme == 'dark' ? '#3c3c3c' : '', backgroundColor: theme == 'dark' ? '#3c3c3c' : 'white', color: theme == 'dark' ? '#d5d5d5' : 'rgba(0, 0, 0, 0.7)' }} shape="round" onClick={this.onGotoList}>
                  保存&返回
                </Button>


                &nbsp;
              </div>
            )}
          &nbsp;
          {iscore == 3 && showToolBar && (
            <div style={{ display: 'inline-block' }}>

              <Tooltip title="">
                <Button style={{ borderColor: theme == 'dark' ? '#3c3c3c' : '', backgroundColor: theme == 'dark' ? '#3c3c3c' : 'white', color: theme == 'dark' ? '#d5d5d5' : 'rgba(0, 0, 0, 0.7)' }} shape="round" onClick={this.showHidleOutline}>
                  {showoutline ? '隐藏大纲' : '显示大纲'}
                </Button>
              </Tooltip>
              &nbsp;

              <Button style={{ borderColor: theme == 'dark' ? '#3c3c3c' : '', backgroundColor: theme == 'dark' ? '#3c3c3c' : 'white', color: theme == 'dark' ? '#d5d5d5' : 'rgba(0, 0, 0, 0.7)' }} shape="round" onClick={this.onButtonClear} >
                清除执行记录
              </Button>
              &nbsp;

              {/* <Button style={{ borderColor: theme == 'dark' ? '#3c3c3c':'',backgroundColor: theme=='dark'?'#3c3c3c':'white', color: theme=='dark'?'#d5d5d5':'rgba(0, 0, 0, 0.7)' }}  shape="round" onClick={() => {
                //this.ws.sendSocketMessage(JSON.stringify({'type':'syrecord','data':""}))
                window.location.reload()
              }}>
                保存
              </Button>
              &nbsp; */}

              <Button style={{ borderColor: theme == 'dark' ? '#3c3c3c' : '', backgroundColor: theme == 'dark' ? '#3c3c3c' : 'white', color: theme == 'dark' ? '#d5d5d5' : 'rgba(0, 0, 0, 0.7)' }} shape="round" onClick={this.createCaptue} >
                快照当前结果
              </Button>

            </div>
          )}

          {iscore == 4 && showToolBar && (
            <div style={{ display: 'inline-block' }}>
              {/* <Button type="primary" onClick={this.onButtonClear} >
                清除执行记录
              </Button>&nbsp;&nbsp; */}

              <Button style={{ borderColor: theme == 'dark' ? '#3c3c3c' : '', backgroundColor: theme == 'dark' ? '#3c3c3c' : 'white', color: theme == 'dark' ? '#d5d5d5' : 'rgba(0, 0, 0, 0.7)' }} shape="round" onClick={this.onButtonPrview}>评审结论</Button>
            </div>
          )}

          {historyId &&
            (
              <div>

                <Button type="danger" onClick={this.BackupSyn}>恢复用例</Button>
                &nbsp;
                <Button style={{ borderColor: theme == 'dark' ? '#3c3c3c' : '', backgroundColor: theme == 'dark' ? '#3c3c3c' : 'white', color: theme == 'dark' ? '#d5d5d5' : 'rgba(0, 0, 0, 0.7)' }} onClick={this.goBack}>返回</Button>

              </div>
            )
          }

          {/* {!historyId && iscore == 0 &&
            <Fab
              mainButtonStyles={{ color: 'grey', backgroundColor: '#fff', width: 40, height: 40 }}
              style={{ bottom: 50, right: 100 }}
              icon={<Tooltip title="历史数据恢复"><Icon type="history" /></Tooltip>}
              event={'click'}

              onClick={() => {
                // window.location.href="/mycasemind-cms/history/"+this.props.caseId
                window.open("/mycasemind-cms/history/" + this.props.caseId, '_blank', 'noopener,noreferrer');
              }}
            >
            </Fab>} */}



          <Modal
            title="评审结论"
            visible={this.state.modalvisible}
            onOk={this.submitPrview}
            onCancel={this.hideModal}
            okText="确认"
            cancelText="取消"
          >
            <div style={{ display: 'flex', justifyContent: 'left' }}>
              <h4> 请选择评审结果： </h4> &nbsp;&nbsp;
              <Select defaultValue="通过" style={{ width: 120 }} onChange={this.handleSelect}>
                <Option key="1" value="1">通过</Option>
                <Option key="2" value="2">不通过</Option>
              </Select>
            </div>
          </Modal>

          <Modal
            title="请选择验证轮数，保存当前验证结果"
            visible={this.state.modalcapvisible}
            onOk={this.submitCapture}
            onCancel={this.hideCapModal}
            okText="确认"
            cancelText="取消"
          >
            <div style={{ display: 'flex', justifyContent: 'left' }}>
              <h4> 验证轮数： </h4> &nbsp;&nbsp;
              <Select defaultValue="第一轮" style={{ width: 120 }} onChange={this.handleCapSelect}>

                {capOptionData.map(MakeItem)}

              </Select>
            </div>
          </Modal>

        </div>
      </ConfigProvider>
    );
  }
}
KityminderEditor.propTypes = {
  priority: PropTypes.any, // priority优先级列表，默认[1,2,3]
  progressShow: PropTypes.any, // 进度toolbar是否显示
  caseTitle: PropTypes.any, //用例标题
  recordTitle: PropTypes.any, //执行用例标题
  readOnly: PropTypes.any, // 是否只读，不可编辑，不展示toolbar
  tags: PropTypes.any, // 标签列表，没有改属性则工具栏不展示
  toolbar: PropTypes.any, // 工具栏其他设置
  editorStyle: PropTypes.any, // 容器样式
  uploadUrl: PropTypes.any, // 上传请求地址（相对路径）
  wsUrl1: PropTypes.any, // websocket请求地址（绝对路径）
  baseUrl: PropTypes.any, // 请求前缀
  onClose: PropTypes.any, // wesocket通信关闭时触发的回调
  onSave: PropTypes.any, // 快捷键保存时触发的事件
  callback: PropTypes.any, // 抛出其他事件，例如全屏
  type: PropTypes.any, // 判断是否为对比历史版本结果页面or查看xmind（只读）
  recordId: PropTypes.any,
  historyId: PropTypes.any
};

export default KityminderEditor;
