import React, { useEffect, useState, useRef } from "react";
import { Input, Button, message, notification, Upload, Icon, Select, Modal, Tabs } from 'antd';  // 移除 Drawer 导入
import 'antd/dist/antd.css';   // Import Ant Design styles
import { EventSourcePolyfill } from 'event-source-polyfill';
// 导入marked库用于解析Markdown
const { TextArea } = Input;
import EventSource from 'eventsource'

import getQueryString from '@/utils/getCookies'
const getCookies = getQueryString.getCookie

import envurls from '@/utils/envurls'
import { buildAuthHeaders } from '@/utils/authHeaders'
const getEnvUrlbyKey = envurls.getEnvUrlbyKey

import request from '@/utils/axios'
const axios = require('axios')

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { set } from "lodash";


const { nanoid } = require('nanoid');
// 注册JSON语言
SyntaxHighlighter.registerLanguage('json', json);

// 通用复制功能函数
const copyToClipboard = (text) => {
  return new Promise((resolve, reject) => {
    // 首先尝试使用现代API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          resolve(true);
        })
        .catch(() => {
          // 如果现代API失败，回退到传统方法
          fallbackCopyToClipboard(text, resolve, reject);
        });
    } else {
      // 如果不支持现代API，直接使用传统方法
      fallbackCopyToClipboard(text, resolve, reject);
    }
  });
};

// 传统复制方法（使用textarea）
const fallbackCopyToClipboard = (text, resolve, reject) => {
  try {
    // 创建临时textarea元素
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.id = 'tmpCopy';

    // 设置样式使其不可见
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    // 执行复制命令
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      resolve(true);
    } else {
      reject(new Error('复制失败'));
    }
  } catch (err) {
    document.body.removeChild(document.getElementById('tmpCopy'));
    reject(err);
  }
};

const AIChat = React.forwardRef(({ visible, onClose, minder, theme }, ref) => {
  const [messages, setMessages] = useState(''); // 存储接收到的所有消息
  const [conversation_id, setConversationId] = useState(''); // 存储是否点击了Markdown区域
  const [reqNormal, setReqNormal] = useState(""); // 常规模式的输入内容
  const [reqContinue, setReqContinue] = useState(""); // 续写模式的输入内容
  const [jsonContent, setJsonContent] = useState(""); // 存储提取的JSON内容
  const [userScrolled, setUserScrolled] = useState(false); // 添加状态来跟踪用户是否手动滚动
  const [selectedImage, setSelectedImage] = useState(null); // 存储选中的图片文件
  const [fileList, setFileList] = useState([]); // 存储上传文件列表
  const [previewVisible, setPreviewVisible] = useState(false); // 控制预览模态框显示
  const [previewImage, setPreviewImage] = useState(''); // 存储预览图片URL
  const [hoverPreviewVisible, setHoverPreviewVisible] = useState(false); // 控制悬停预览显示
  const [hoverPreviewPosition, setHoverPreviewPosition] = useState({ x: 0, y: 0 }); // 悬停预览位置
  const messageIdRef = useRef(null);
  const thinkingStartedRef = useRef(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const isFinishedRef = useRef(false); // 添加 ref 来跟踪完成状态
  const textAreaRef = useRef(null); // Create a ref for the TextArea
  const buffer = useRef([]); // Buffer to temporarily store messages
  const sseRawChunksRef = useRef(''); // 本次 SSE 的 event.data 原文拼接字符串
  const lastModelExchangeRef = useRef(null); // 单次请求结束时快照：用户输入 + SSE 原文
  const timer = useRef(null); // Ref for the polling timer
  const markdownRef = useRef(null); // 添加ref用于markdown内容区域
  const eventSourceRef = useRef(null);
  const messagesRef = useRef('');
  const [prevModelType, setPrevModelType] = useState(null); // 添加新的状态来记录上一次的 modeltype
  const [answerType, setAnswerType] = useState('1'); // 回答类型：用例生成、问答
  const [activeTab, setActiveTab] = useState('1'); // 当前激活的tab
  const [caseDescModalVisible, setCaseDescModalVisible] = useState(false); // 控制场景描述输入对话框
  const [caseDescInput, setCaseDescInput] = useState(''); // 存储用户输入的场景描述
  const [caseDescPrompt, setCaseDescPrompt] = useState(''); // 存储对话框提示信息
  const caseDescCallbackRef = useRef(null); // 存储回调函数
  // 在messages更新时同步更新ref
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  //   // 在组件加载完成后设置初始值
  //   useEffect(() => {
  //     // 延迟3秒后设置初始消息内容
  //     const timer = setTimeout(() => {
  //       // 设置初始消息内容
  //       const initialMessage = `222
  // \`\`\`json
  // [{"caseTitle":"已注册邮箱成功发送重置链接测试用例","casePreCondition":"用户已注册，处于登录页面","caseStep":"1. 点击忘记密码链接；2. 输入已注册邮箱；3. 点击发送重置邮件按钮","caseResult":"系统提示'重置链接已发送至邮箱'，用户收到含重置链接的邮件"},{"caseTitle":"无效邮箱格式异常测试用例","casePreCondition":"用户已注册，处于登录页面","caseStep":"1. 点击忘记密码链接；2. 输入格式错误邮箱（如user@domain）；3. 点击发送重置邮件按钮","caseResult":"系统提示'邮箱格式错误'，未触发邮件发送行为"}]
  // \`\`\`
  // `;

  //       setMessages(initialMessage);
  //     }, 1000); // 延迟3秒

  //     // 清理函数，组件卸载时清除定时器
  //     return () => clearTimeout(timer);
  //   }, []); // 空依赖数组表示只在组件挂载时执行一次



  React.useImperativeHandle(ref, () => ({

    // 复制用例
    copyCase: copyCase,
    /** 最近一次流式请求结束（清输入框之前）的快照：{ queryId, modeltype, answerType, userInput, sseRawText } */
    getLastModelRawExchange: () => lastModelExchangeRef.current,
  }));
  // 添加停止Worker的函数
  const stopWorker = () => {
    if (timer.current) {
      timer.current.terminate(); // 终止Worker
      timer.current = null; // 清空引用
    }
  };


  const stopEventSource = () => {

    if (eventSourceRef.current) {

      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  // 始终跟踪最新的 conversation_id，便于在卸载/关闭时拿到
  const conversationIdRef = useRef('');
  useEffect(() => {
    conversationIdRef.current = conversation_id;
  }, [conversation_id]);

  // 组件卸载时，自动清除后端对应的会话历史
  useEffect(() => {
    return () => {
      const targetId = conversationIdRef.current;
      if (targetId) {
        clearBackendConversation(targetId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 通知后端清除指定会话的历史记忆
  const clearBackendConversation = (cid) => {
    const targetId = cid || conversationIdRef.current;
    if (!targetId) {
      return Promise.resolve();
    }
    const url = getEnvUrlbyKey('proxyurl') + '/api/dify/clear-conversation';
    const creator = getCookies('username');
    const headers = buildAuthHeaders({
      'Content-Type': 'application/json',
      Username: creator,
    });
    return axios
      .post(url, { conversationId: targetId }, { headers })
      .catch((err) => {
        console.warn('clear-conversation failed', err);
      });
  };

  const handleReqNormalChange = (e) => {
    setReqNormal(e.target.value);
  };

  const handleReqContinueChange = (e) => {
    setReqContinue(e.target.value);
  };

  // 处理粘贴事件
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // 遍历剪贴板中的所有项
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // 检查是否为图片类型
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault(); // 阻止默认粘贴行为
        e.stopPropagation(); // 阻止事件向下传递

        // 获取图片文件
        const file = item.getAsFile();
        if (file) {
          // 生成友好的文件名（如果原文件没有名字）
          // let fileName = file.name;
          // if (!fileName || fileName === 'image.png') {
          //   const timestamp = new Date().getTime();
          //   const extension = file.type.split('/')[1] || 'png';
          //   fileName = `pasted-image-${timestamp}.${extension}`;
          // }
          const timestamp = new Date().getTime();
          const extension = file.type.split('/')[1] || 'png';
          let fileName = `pasted-image-${timestamp}.${extension}`;

          // 创建新的File对象，带有友好的文件名
          const renamedFile = new File([file], fileName, { type: file.type });

          setSelectedImage(renamedFile);

          // 更新fileList以在Upload组件中显示
          const newFileList = [{
            uid: '-1',
            name: fileName,
            status: 'done',
            originFileObj: renamedFile
          }];
          setFileList(newFileList);

          message.success(`已添加图片: ${fileName}`);
        }
        break; // 只处理第一个图片
      }
    }
  };

  // 处理鼠标悬停预览
  const handleMouseEnter = async (e) => {
    if (!selectedImage) return;

    // 获取鼠标位置
    const rect = e.currentTarget.getBoundingClientRect();

    // 读取图片并生成预览
    const reader = new FileReader();
    reader.readAsDataURL(selectedImage);
    reader.onload = () => {
      setPreviewImage(reader.result);
      setHoverPreviewVisible(true);

      // 预览框的尺寸
      const previewWidth = 400;
      const previewHeight = 400;
      const gap = 10; // 间距

      // 获取窗口尺寸
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // 计算位置
      let x, y;

      // 优先显示在右侧，如果右侧空间不足则显示在左侧
      if (rect.right + gap + previewWidth <= windowWidth) {
        // 右侧有足够空间
        x = rect.right + gap;
      } else if (rect.left - gap - previewWidth >= 0) {
        // 左侧有足够空间
        x = rect.left - gap - previewWidth;
      } else {
        // 两侧都不够，显示在屏幕右侧边缘
        x = windowWidth - previewWidth - 20;
      }

      // 垂直方向：尽量与文件项对齐，但不超出屏幕
      y = rect.top;
      if (y + previewHeight > windowHeight) {
        // 如果底部超出，则向上调整
        y = Math.max(10, windowHeight - previewHeight - 10);
      }

      setHoverPreviewPosition({ x, y });
    };
  };

  // 处理鼠标离开
  const handleMouseLeave = () => {
    setHoverPreviewVisible(false);
  };

  // 处理图片预览（点击时）
  const handlePreview = async (file) => {
    // 如果文件有 url，直接使用
    if (file.url) {
      setPreviewImage(file.url);
      setPreviewVisible(true);
      return;
    }

    // 如果文件有 preview，使用 preview
    if (file.preview) {
      setPreviewImage(file.preview);
      setPreviewVisible(true);
      return;
    }

    // 否则，从 originFileObj 读取文件并生成预览 URL
    const fileObj = file.originFileObj || selectedImage;
    if (fileObj) {
      const reader = new FileReader();
      reader.readAsDataURL(fileObj);
      reader.onload = () => {
        setPreviewImage(reader.result);
        setPreviewVisible(true);
      };
    }
  };

  // 关闭预览
  const handleCancelPreview = () => {
    setPreviewVisible(false);
  };

  const handleChange = (e) => {
    setMessages(e.target.value);
  };

  const formatThinkingChunk = (text = '') => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\r?\n/g, '\n> ');
  };

  const extractJsonString = (content) => {
    if (!content) {
      return '';
    }
    const trimmed = content.trim();
    const jsonRegex = /```json\s*([\s\S]*?)```/g;
    const matches = [...trimmed.matchAll(jsonRegex)];
    if (matches.length > 0) {
      return matches[matches.length - 1][1].trim();
    }

    const firstArray = trimmed.indexOf('[');
    const lastArray = trimmed.lastIndexOf(']');
    if (firstArray !== -1 && lastArray > firstArray) {
      return trimmed.slice(firstArray, lastArray + 1).trim();
    }

    const firstObject = trimmed.indexOf('{');
    const lastObject = trimmed.lastIndexOf('}');
    if (firstObject !== -1 && lastObject > firstObject) {
      return trimmed.slice(firstObject, lastObject + 1).trim();
    }

    return trimmed;
  };

  const repairJsonQuotes = (jsonText) => {
    let result = '';
    let inString = false;
    let escaped = false;

    for (let i = 0; i < jsonText.length; i++) {
      const char = jsonText[i];

      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        result += char;
        escaped = true;
        continue;
      }

      if (char === '"') {
        if (!inString) {
          inString = true;
          result += char;
          continue;
        }

        let j = i + 1;
        while (j < jsonText.length && /\s/.test(jsonText[j])) {
          j++;
        }
        const nextChar = j < jsonText.length ? jsonText[j] : '';
        if (nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === ':') {
          inString = false;
          result += char;
        } else {
          result += '\\"';
        }
        continue;
      }

      result += char;
    }

    return result;
  };

  const parseAiJson = (content) => {
    const jsonText = extractJsonString(content);
    if (!jsonText) {
      throw new Error('empty-json');
    }

    try {
      return JSON.parse(jsonText);
    } catch (error) {
      const repaired = repairJsonQuotes(jsonText);
      return JSON.parse(repaired);
    }
  };

  const formatJsonForDisplay = (content) => {
    try {
      const jsonData = parseAiJson(content);
      return `\n\`\`\`json\n${JSON.stringify(jsonData, null, 2)}\n\`\`\`\n`;
    } catch (error) {
      return '';
    }
  };

  const replaceLastAnswerWithFormattedJson = (rawText) => {
    const formattedJson = formatJsonForDisplay(rawText);
    if (!formattedJson || !rawText) {
      return;
    }

    setMessages((prevMessages) => {
      if (!prevMessages) {
        return prevMessages;
      }

      if (prevMessages.endsWith(rawText)) {
        return prevMessages.slice(0, prevMessages.length - rawText.length) + formattedJson;
      }

      const lastIndex = prevMessages.lastIndexOf(rawText);
      if (lastIndex === -1) {
        return prevMessages;
      }

      return prevMessages.slice(0, lastIndex) + formattedJson + prevMessages.slice(lastIndex + rawText.length);
    });
  };


  // 解析JSON内容的函数
  const parseJsonContent = (isCopy) => {
    // 使用 messagesRef.current 替代 messages
    const messageText = messagesRef.current;
    if (!messageText) {
      message.warning("消息内容为空");
      return;
    }


    const extractedJson = extractJsonString(messageText);

    if (extractedJson) {
      if (isCopy) {
        convertJsonToClipboard(extractedJson);
      }
      else {
        const jsonData = parseAiJson(extractedJson);
        // 转换为层级结构
        const hierarchicalData = transformJsonToHierarchy(jsonData);

        // 将转换后的数据转换为字符串
        return hierarchicalData;
      }
    } else {
      const rawExchange = lastModelExchangeRef.current;
      const rawJson = rawExchange && rawExchange.sseRawText ? rawExchange.sseRawText.trim() : '';
      if (rawJson) {
        if (isCopy) {
          convertJsonToClipboard(rawJson);
        }
        else {
          const jsonData = parseAiJson(rawJson);
          const hierarchicalData = transformJsonToHierarchy(jsonData);
          return hierarchicalData;
        }
      } else {
        message.warning("未找到JSON内容");
      }
      return "";
    }
  }

  // insertToParent=false：插入为当前节点的子节点（生成用例）
  // insertToParent=true ：插入为当前节点的兄弟节点，即挂到父节点下（续写用例）
  const autosetCase = (isCopy, jsonContent=null, insertToParent=false) => {

    try {
      const nodes = [].concat(minder.getSelectedNodes());
      if (nodes.length > 0) {
        // 这里由于被粘贴复制的节点的id信息也都一样，故做此算法
        // 这里有个疑问，使用node.getParent()或者node.parent会离奇导致出现非选中节点被渲染成选中节点，因此使用isAncestorOf，而没有使用自行回溯的方式
        let _selectedNodes = [];
        var curNode = nodes[0];

        // 续写模式：挂到父节点下（与当前节点平级）
        // 若父节点不存在（当前节点已是根节点），降级为挂到当前节点下
        var selNode = curNode;
        if (insertToParent) {
          var parentNode = curNode.getParent ? curNode.getParent() : curNode.parent;
          if (parentNode) {
            selNode = parentNode;
          }
        }

        var res = null;
        if (jsonContent == null) {
          res = parseJsonContent(isCopy);
        } else {
          res = parseAiJson(jsonContent);
          if (Array.isArray(res) && res.length > 0 && res[0] && res[0].hasOwnProperty('caseTitle')) {
            res = transformJsonToHierarchy(res);
          } else if (res && typeof res === 'object' && !Array.isArray(res)) {
            res = [res];
          }
          // 为每个节点重新生成唯一 ID，避免使用 AI 返回的可能重复的 ID
          res = res.map(node => processNode(node));
        }
        for (let i = res.length - 1; i >= 0; i--) {
          let _node = minder.createNode(null, selNode);
          minder.importNode(_node, res[i]);
          selNode.appendChild(_node);
          _selectedNodes.push(_node);
        }
        minder.refresh();
        minder.select(_selectedNodes, true);
      }
    } catch (error) {
      message.error("解析JSON内容时出错");
    }

  }
  const encode = (nodes) => {

    let _nodes = [];
    for (let i = 0, l = nodes.length; i < l; i++) {

      _nodes.push(minder.exportNode(nodes[i]));
    }
    return JSON.stringify(_nodes);
  };

  const jsonToMarkdown = (nodes, level = 0) => {
    let markdown = '';
    const indent = '  '.repeat(level); // 每层缩进2个空格

    nodes.forEach(node => {
      // 添加当前节点文本，使用 - 作为列表标记
      markdown += `${indent}- ${node.data.text}\n`;

      // 如果有子节点，递归处理
      if (node.children && node.children.length > 0) {
        markdown += jsonToMarkdown(node.children, level + 1);
      }
    });

    return markdown;
  }

  // Helper function to recursively remove metadata keys
  const removeNodeMetadata = (node) => {
    if (node && node.data) {
      delete node.data.id;
      delete node.data.created;

    }
    if (node && node.children && Array.isArray(node.children)) {
      node.children.forEach(child => removeNodeMetadata(child));
    }
  };

  const copyCase = () => {

    setActiveTab('2');
    const nodes = [].concat(minder.getSelectedNodes());
    if (nodes.length) {
      // 这里由于被粘贴复制的节点的id信息也都一样，故做此算法
      // 这里有个疑问，使用node.getParent()或者node.parent会离奇导致出现非选中节点被渲染成选中节点，因此使用isAncestorOf，而没有使用自行回溯的方式
      if (nodes.length > 1) {
        let targetLevel = null;
        nodes.sort((a, b) => a.getLevel() - b.getLevel());
        targetLevel = nodes[0].getLevel();
        if (targetLevel !== nodes[nodes.length - 1].getLevel()) {
          let pnode = null;
          let idx = 0;
          let l = nodes.length;
          let pidx = l - 1;

          pnode = nodes[pidx];

          while (pnode.getLevel() !== targetLevel) {
            idx = 0;
            while (idx < l && nodes[idx].getLevel() === targetLevel) {
              if (nodes[idx].isAncestorOf(pnode)) {
                nodes.splice(pidx, 1);
                break;
              }
              idx++;
            }
            pidx--;
            pnode = nodes[pidx];
          }
        }
      }

      const originalNodesStr = encode(nodes); // 获取原始 JSON 字符串
      let processedNodesStr = originalNodesStr; // 默认为原始字符串，以防处理失败
      
      try {
        // 1. 将 JSON 字符串解析为对象数组
        let nodesArray = JSON.parse(originalNodesStr);

        // 2. 遍历数组并递归删除每个节点的 id 和 created 字段
        nodesArray.forEach(node => removeNodeMetadata(node));

        // 3. 将修改后的数组转换回 JSON 字符串 (使用 null, 2 进行格式化，方便阅读)
        processedNodesStr = JSON.stringify(nodesArray);

      } catch (error) {
        console.error("处理节点 JSON 时出错:", error);
        // 如果解析或处理出错，保留原始字符串并提示错误
        message.error("引用 case 时处理节点数据出错，将使用原始数据");
      }

      // 准备对话框提示信息
      const promptText = nodes.length > 0 && nodes[0].data.text 
        ? `前面的json是"${nodes[0].data.text}"的测试用例，你希望生成类似什么场景的测试case？`
        : "你希望生成类似什么场景的测试case？";

      // 设置提示信息
      setCaseDescPrompt(promptText);

      // 设置回调函数，在用户输入后执行
      caseDescCallbackRef.current = (userInput) => {
        var desc = ""; // 修改了描述文本
        if (nodes.length > 0) {
          if (nodes[0].data.text) {
            desc = "\n前面的json是" + nodes[0].data.text + "的测试用例，"
          }
        }
        desc += "请按照上述JSON的层级结构和格式，帮我生成" + (userInput || "类似") + "测试用例。";

        // 使用处理后的字符串设置请求内容（续写模式）
        setReqContinue(processedNodesStr + "\n" + desc);

        
        // 使用 setTimeout 确保在状态更新后设置光标位置
        setTimeout(() => {
          
          const textarea = document.getElementById('chatReqTextAreaContinue');
          if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
          }
        }, 0);
      };

      // 显示对话框
      setCaseDescInput('');
      setCaseDescModalVisible(true);
    }

  }



  useEffect(() => {
    const handleClickOutside = (event) => {
      const chatReqTextArea = document.getElementById('chatReqTextArea');
      // 检查点击的是否是脑图区域
      const isMindmapClick = event.target.closest('.kityminder-core-container') !== null;

      // 检查点击是否发生在Markdown内部
      const isMarkdownClick = event.target.closest('.markdown-content') !== null;


      if (chatReqTextArea && isMindmapClick) {
        chatReqTextArea.blur(); // 主动失焦
      }
      if (!isMarkdownClick) {

      }
      // if (chatTextArea && isMindmapClick) {
      //   chatTextArea.blur(); // 主动失焦
      //   // 取消当前选择的内容
      //   window.getSelection().removeAllRanges();
      // }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      stopWorker();
      // 清理定时器
      if (timer.current) {
        clearInterval(timer.current);
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 监听文件列表的悬停事件
  useEffect(() => {
    const attachHoverListeners = () => {
      const fileListItems = document.querySelectorAll('.ant-upload-list-item');
      fileListItems.forEach(item => {
        item.addEventListener('mouseenter', handleMouseEnter);
        item.addEventListener('mouseleave', handleMouseLeave);
      });
    };

    // 延迟执行以确保 DOM 已经渲染
    const timer = setTimeout(attachHoverListeners, 100);

    return () => {
      clearTimeout(timer);
      const fileListItems = document.querySelectorAll('.ant-upload-list-item');
      fileListItems.forEach(item => {
        item.removeEventListener('mouseenter', handleMouseEnter);
        item.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [fileList, selectedImage]); // 当 fileList 或 selectedImage 变化时重新绑定

  const cancelReqClick = () => {

    if (timer.current) {
      timer.current.terminate(); // 终止现有的 Web Worker
      timer.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsChatLoading(false);
    buffer.current = [];
    sseRawChunksRef.current = '';

  }

  const extractJsonStrings = (text) => {
    const result = [];
    let stack = [];
    let start = -1;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if ((char === '{' || char === '[')) {
        if (stack.length === 0) start = i;
        stack.push(char);
      } else if ((char === '}' && stack[stack.length - 1] === '{') ||
        (char === ']' && stack[stack.length - 1] === '[')) {
        stack.pop();
        if (stack.length === 0 && start !== -1) {
          const candidate = text.slice(start, i + 1);
          try {
            JSON.parse(candidate); // 验证合法性
            result.push({ raw: candidate, start, end: i });
          } catch (_) { /* ignore invalid JSON */ }
          start = -1;
        }
      }
    }
    return result;
  }
  const escapeJsonInText = (text) => {
    const matches = extractJsonStrings(text);
    let newText = text;
    for (let i = matches.length - 1; i >= 0; i--) {
      const { raw, start, end } = matches[i];
      const escaped = raw
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
      newText = newText.slice(0, start) + escaped + newText.slice(end + 1);
    }
    return newText.replace(/\r?\n/g, '\\n');
  }

  

  const handleReqClick = (modeltype, loopTime = 20) => {

    if (modeltype === 2) {
      let _selectedNodes = minder.getSelectedNodes();
      if (_selectedNodes.length === 0) {
        message.warning("请先选中一个节点");
        return;
      }
    }
    // 根据 modeltype 获取对应的输入值
    const req = modeltype === 1 ? reqNormal : reqContinue;
    if (!req || req.trim() === '') {
      message.warning("请输入内容");
      return;
    }
    const reqText = '<span style="color: #1890ff;">' + req.replace(/\r?\n/g, '<br>') + '</span>'

    setMessages(messages + (messages === '' ? "" : "\n\n---\n\n")
      + reqText + "\n\n" + "请求分析中，请稍后..." + "\n\n");

    const reqReplace = escapeJsonInText(req);
    var query = encodeURIComponent(reqReplace);
    let creator = getCookies('username');
    const authHeaders = buildAuthHeaders()


    setIsChatLoading(true);
    stopEventSource();
    thinkingStartedRef.current = false;
    var saveQueryUrl = getEnvUrlbyKey('proxyurl') + "/api/dify/save-query";

    // 如果有图片，使用FormData发送multipart/form-data请求（参考clipboard.js的实现）

    const formData = new FormData();
    formData.append('query', query);
    let saveQueryPromise;
    if (selectedImage) {
      
      formData.append('img', selectedImage);

    }  // 使用axios直接发送，参考clipboard.js的方式
    saveQueryPromise = axios.post(saveQueryUrl, formData, {
      headers: buildAuthHeaders({
        'Content-Type': 'multipart/form-data',
        Username: creator,
      }),
    });

    saveQueryPromise.then(res => {
      console.log(res);
      const resData = res.data; 
      if (resData.code === 200) {
        var queryId = resData.data;
        var baseUrl = getEnvUrlbyKey('proxyurl') + "/api/dify/query";
        const queryType = modeltype === 2 ? '1' : (answerType === '1' ? '1' : '2');
        const requestAnswerType = modeltype === 2 ? '1' : '0';
        const params = new URLSearchParams({
          queryType: queryType,
          queryId: queryId,
          conversationId: (prevModelType !== null && prevModelType !== modeltype) ? '' : conversation_id,
          creator: creator,
          answerType: requestAnswerType
        });
        setPrevModelType(modeltype);
        sseRawChunksRef.current = '';
        const urlWithParams = `${baseUrl}?${params.toString()}`;
        const eventSource = new EventSourcePolyfill(urlWithParams, {
          headers: authHeaders,

          // heartbeatTimeout: 60000  // 可选，心跳超时（用于断线检测）
        });
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
         
          // 解析收到的消息
          try {
            // 解析收到的消息

            const data = JSON.parse(event.data); // 将 event.data 解析为 JSON 对象

            // 判断事件类型是否为 "message"
            if (data.event === "thinking") {
              const thinkingMessage = data.thinking || '';
              if (thinkingMessage) {
                if (!thinkingStartedRef.current) {
                  buffer.current.push('\n\n> **思考中**\n>\n> ');
                  thinkingStartedRef.current = true;
                }
                buffer.current.push(formatThinkingChunk(thinkingMessage));
              }
              if (data.conversation_id) {
                setConversationId(data.conversation_id);
              }
            } else if (data.event === "message") {
              // 获取 answer 字段的内容
              const newMessage = data.answer;
              if (thinkingStartedRef.current) {
                buffer.current.push("\n\n");
                thinkingStartedRef.current = false;
              }
              sseRawChunksRef.current += newMessage;
              buffer.current.push(newMessage);
              if (data.conversation_id) {
                setConversationId(data.conversation_id);
              }
              // if(modeltype === 2){
              //     isFinishedRef.current = true;
              //     eventSource.close();
              // }

            } else if (data.event === "message_end") {
              if (thinkingStartedRef.current) {
                buffer.current.push("\n\n");
                thinkingStartedRef.current = false;
              }
              isFinishedRef.current = true;
              messageIdRef.current = data.message_id;
              eventSource.close();

            }
          } catch (error) {
            console.error("Error parsing event data", error);
          }
        };

        // 监听错误事件
        eventSource.onerror = (error) => {

          message.error("SSE连接异常" + error.status);
          console.error("SSE connection error", error);

          stopEventSource();
        };


        // 如果已经有定时器在运行，先清除它
        if (timer.current) {
          timer.current.terminate(); // 终止现有的 Web Worker
        }

        if (window.location.host.includes('local')) {
          // 创建 Web Worker
          timer.current = new Worker('/worker.js');
        } else {
          // 创建 Web Worker
          timer.current = new Worker('/mycasemind-cms/worker.js');
        }
        timer.current.postMessage({ interval: loopTime }); // 发送间隔时间


        // 监听来自 Worker 的消息
        timer.current.onmessage = () => {
          if (buffer.current.length > 0) {
            const messageToProcess = buffer.current.shift(); // 从buffer中取出第一条消息
            setMessages((prevMessages) => prevMessages + messageToProcess); // 更新状态，将新消息添加到已有消息后面
          }

          // 将完成状态检查移到外面，不依赖 buffer 是否有内容
          if (isFinishedRef.current && buffer.current.length === 0) {
            if (messageIdRef.current) {
              //alert(messageIdRef.current);
              
              messageIdRef.current = null;
            }
            isFinishedRef.current = false;
            // message.success("回答完成");
            //setMessages((prevMessages) => '```json'+prevMessages + '```');
            console.log(sseRawChunksRef.current)
            const sseRawText = sseRawChunksRef.current;
            lastModelExchangeRef.current = {
              queryId,
              modeltype,
              answerType,
              userInput: req,
              sseRawText,
            };
            replaceLastAnswerWithFormattedJson(sseRawText);

            setReqNormal('');
            setReqContinue('');
            setSelectedImage(null);
            setFileList([]);
            setPreviewVisible(false);
            setHoverPreviewVisible(false);
            setPreviewImage('');
           
            if( (answerType === '1' && modeltype === 1) ){
              autosetCase(false, sseRawText);          // 生成用例：直接使用原始流式JSON，避免依赖markdown代码块
            }
            else if(modeltype === 2){
              autosetCase(false, sseRawText, true);     // 续写用例：挂到父节点下（兄弟节点）
            }
            setIsChatLoading(false);

            if (timer.current) {
              timer.current.terminate(); // 终止 Web Worker
              timer.current = null;
            }
          }
        };
      }
    }).catch(error => {
      console.error("保存查询失败", error);
      message.error("请求失败，请稍后重试");
      setIsChatLoading(false);
    })






    // var baseUrl = getEnvUrlbyKey('proxyurl')+"/api/dify/query";
    // const params = new URLSearchParams({
    //   modeltype: modeltype,
    //   conversationId: (prevModelType !== null && prevModelType !== modeltype) ? '':conversation_id,
    //   creator: creator
    // });
    // setPrevModelType(modeltype);
    // const urlWithParams = `${baseUrl}?${params.toString()}`;

    // const eventSource = new EventSourcePolyfill(urlWithParams, {
    //   headers: {
    //     query: query,
    //     Authorization: auth,
    //   },

    //   // heartbeatTimeout: 60000  // 可选，心跳超时（用于断线检测）
    // });
    // eventSourceRef.current = eventSource;


    // eventSource.onmessage = (event) => {
    //   // 解析收到的消息
    //   try {
    //     // 解析收到的消息

    //     const data = JSON.parse(event.data); // 将 event.data 解析为 JSON 对象

    //     // 判断事件类型是否为 "message"
    //     if (data.event === "message") {
    //       // 获取 answer 字段的内容
    //       const newMessage = data.answer;

    //       buffer.current.push(newMessage);
    //       if (data.conversation_id) {
    //         setConversationId(data.conversation_id);
    //       }
    //       if(modeltype === 2){
    //           isFinishedRef.current = true;
    //           eventSource.close();
    //       }

    //       // 更新消息列表，将新消息追加到已有消息数组的末尾
    //       // setMessages((prevMessages) => {
    //       //     // const updatedMessages = [...prevMessages, newMessage];
    //       //     const updatedMessages=prevMessages+newMessage;
    //       //     return updatedMessages;
    //       // });

    //     } else if (data.event === "message_end") {
    //       isFinishedRef.current = true;
    //       eventSource.close();
    //     }
    //   } catch (error) {
    //     console.error("Error parsing event data", error);
    //   }
    // };

    // // 监听错误事件
    // eventSource.onerror = (error) => {

    //     message.error("SSE连接异常"+error.status);
    //     console.error("SSE connection error", error);

    //     stopEventSource();
    // };


    // // 如果已经有定时器在运行，先清除它
    // if (timer.current) {
    //   timer.current.terminate(); // 终止现有的 Web Worker
    // }

    // if (window.location.host.includes('local')){
    //   // 创建 Web Worker
    //   timer.current = new Worker('/worker.js');
    // }else{
    //   // 创建 Web Worker
    //   timer.current = new Worker('/mycasemind-cms/worker.js');
    // }
    // timer.current.postMessage({ interval: loopTime }); // 发送间隔时间


    // // 监听来自 Worker 的消息
    // timer.current.onmessage = () => {
    //   if (buffer.current.length > 0) {
    //     const messageToProcess = buffer.current.shift(); // 从buffer中取出第一条消息
    //     setMessages((prevMessages) => prevMessages + messageToProcess); // 更新状态，将新消息添加到已有消息后面
    //   }

    //   // 将完成状态检查移到外面，不依赖 buffer 是否有内容
    //   if (isFinishedRef.current && buffer.current.length === 0) {
    //     isFinishedRef.current = false;
    //     message.success("回答完成");
    //     autosetCase(false);
    //     setIsChatLoading(false);

    //     if (timer.current) {
    //       timer.current.terminate(); // 终止 Web Worker
    //       timer.current = null;
    //     }
    //   }
    // };
  }


  const convertJsonToClipboard = (extractedJson) => {

    try {
      // 解析JSON字符串为对象
      const jsonData = parseAiJson(extractedJson);

      // 转换为层级结构
      const hierarchicalData = transformJsonToHierarchy(jsonData);

      // 将转换后的数据转换为字符串
      const hierarchicalJsonString = JSON.stringify(hierarchicalData, null, 2);

      // 添加特殊字符前缀
      const finalJson = '\uFFFF' + '\uFEFF' + hierarchicalJsonString;

      console.log(finalJson);
      // 使用通用复制功能
      copyToClipboard(finalJson)
        .then(() => {
          message.success("已提取JSON内容并转换为层级结构，已复制到剪贴板");
        })
        .catch(err => {
          console.error('复制到剪贴板失败:', err);
          message.error("已提取JSON内容，但复制到剪贴板失败");
        });
    } catch (error) {

      message.error("JSON解析或转换错误");
      setJsonContent("");
    }
  }

  // 递归处理节点的函数
  const processNode = (node) => {
    if (!node) return node;

    // 处理当前节点的 data
    if (node.data) {
      // 始终生成新的唯一 ID，不使用 AI 返回的 ID（AI 模型可能为不同节点生成相同 ID，导致重复）
      node.data.id = nanoid(10);
      if (!node.data.created) {
        node.data.created = Date.now();
      }
    }

    // 递归处理子节点
    if (node.children && Array.isArray(node.children)) {
      node.children = node.children.map(child => processNode(child));
    }

    return node;
  };

  // 将原始JSON数据转换为层级结构
  const transformJsonToHierarchy = (jsonData) => {
    // 生成随机ID的函数
    const generateId = () => {
      return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    };

    if (Array.isArray(jsonData) && jsonData.length > 0 && jsonData[0].hasOwnProperty('caseTitle')) {
      // 如果不满足条件，可以显示警告信息并返回空数组或进行其他处理
      // 转换每个测试用例
      return jsonData.slice().reverse().map(caseItem => {
        // 创建根节点（caseTitle）
        const rootNode = {
          data: {
            id: nanoid(10),
            created: Date.now(),
            text: caseItem.caseTitle,
            resource: ["AI"]
          },
          children: []
        };

        // 动态构建子节点
        let currentNode = rootNode;

        // 如果存在 casePreCondition，创建前置条件节点
        if (caseItem.hasOwnProperty('casePreCondition') && caseItem.casePreCondition) {
          const preConditionNode = {
            data: {
              id: nanoid(10),
              created: Date.now(),
              text: caseItem.casePreCondition,
              resource: ["前置条件", "AI"]
            },
            children: []
          };
          currentNode.children.push(preConditionNode);
          currentNode = preConditionNode;
        }

        // 如果存在 caseStep，创建执行步骤节点
        if (caseItem.hasOwnProperty('caseStep') && caseItem.caseStep) {
          const stepNode = {
            data: {
              id: nanoid(10),
              created: Date.now(),
              text: caseItem.caseStep,
              resource: ["执行步骤", "AI"]
            },
            children: []
          };
          currentNode.children.push(stepNode);
          currentNode = stepNode;
        }

        // 如果存在 caseResult，创建预期结果节点
        if (caseItem.hasOwnProperty('caseResult') && caseItem.caseResult) {
          const resultNode = {
            data: {
              id: nanoid(10),
              created: Date.now(),
              text: caseItem.caseResult,
              resource: ["预期结果", "AI"]
            },
            children: []
          };
          currentNode.children.push(resultNode);
        }

        return rootNode;
      });
    }

    else {
      jsonData.map(node => processNode(node));
      return jsonData.slice().reverse(); // 返回空数组，避免后续处理出错
    }



  };

  // 监听复制事件 (Cmd + C 或 Ctrl + C)
  const handleCopy = async (e) => {
    message.success("复制成功");
    document.execCommand('copy');

  };

  // 添加自动滚动到底部的函数
  const scrollToBottom = () => {
    if (markdownRef.current && !userScrolled) {
      markdownRef.current.scrollTop = markdownRef.current.scrollHeight;
    }
  };

  // 清空常规模式的会话
  const reSetNormal = () => {
    setIsChatLoading(false);
    stopEventSource();
    stopWorker();

    const targetId = conversationIdRef.current;
    clearBackendConversation(targetId);

    setMessages('');
    setReqNormal(''); // 只清空常规模式的输入
    setConversationId('');
    setUserScrolled(false);
    setSelectedImage(null);
    setFileList([]);
  }

  // 清空续写模式的会话
  const reSetContinue = () => {
    setIsChatLoading(false);
    stopEventSource();
    stopWorker();

    const targetId = conversationIdRef.current;
    clearBackendConversation(targetId);

    setMessages('');
    setReqContinue(''); // 只清空续写模式的输入
    setConversationId('');
    setUserScrolled(false);
    setSelectedImage(null);
    setFileList([]);
  }

  // 监听messages变化，自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 添加滚动事件监听器
  useEffect(() => {
    const handleScroll = () => {
      if (markdownRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = markdownRef.current;
        // 如果用户向上滚动（不在底部），则设置userScrolled为true
        if (scrollHeight - scrollTop - clientHeight > 10) {
          setUserScrolled(true);
        } else {
          // 如果用户滚动到底部，则重置userScrolled为false
          setUserScrolled(false);
        }
      }
    };

    const markdownElement = markdownRef.current;
    if (markdownElement) {
      markdownElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (markdownElement) {
        markdownElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);



  // 在需要停止Worker的地方调用stopWorker函数
  // 例如，在组件卸载时或某个按钮点击时


  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: visible ? 0 : '-600px', // 控制显示/隐藏
        width: '600px',
        height: '99vh',
        background: theme === 'dark' ? '#141414' : '#fff',
        boxShadow: visible ? '0 0 10px rgba(0,0,0,0.15)' : 'none',
        transition: 'right 0.3s ease',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div style={{
        padding: '16px 16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, color: '#1890ff' }}>AI 助手 {conversation_id}</h3>
        <Button
          onClick={() => {
            const targetId = conversationIdRef.current;
            clearBackendConversation(targetId);
            if (typeof onClose === 'function') {
              onClose();
            }
          }}
          shape="circle"
          type="text"
          icon="close"
          style={{ background: theme === 'dark' ? 'white' : 'white' }}
        />
      </div>

      <div id="difychat" style={{ flex: 1, overflow: 'auto', padding: '5px 16px' }}>
        {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, color: theme === 'dark' ? '#d5d5d5' : '#1890ff' }}>会话ID: <span>{conversation_id}</span></h3>

        </div> */}

        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" style={{ marginBottom: '-16px' }}>
          <Tabs.TabPane tab="常规模式" key="1" />
          <Tabs.TabPane tab="续写模式" key="2" />
        </Tabs>

        <div style={{ border: '1px solid #d9d9d9', borderTop: 'none', padding: '16px', borderRadius: '0 0 2px 2px' }}>
          {activeTab === '1' && (
            <div>
              <TextArea
                id="chatReqTextAreaNormal"
                autoSize={{ minRows: 6 }}
                value={reqNormal}
                onChange={handleReqNormalChange}
                onPaste={handlePaste}
                placeholder="请输入您的问题，支持粘贴图片会自动附加到图片附件，支持用例生成和问答两种模式。"
              />

              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: fileList.length > 0 ? 'flex-start' : 'center', flexWrap: 'wrap' }}>
                  <div>
                    
                    <Select
                      value={answerType}
                      onChange={setAnswerType}
                      style={{ width: 150, marginRight: '10px', color: '#1890ff' }}
                    >
                      <Select.Option value="1">用例生成</Select.Option>
                      <Select.Option value="2">问答</Select.Option>
                    </Select>
                    {!isChatLoading && <Button type="primary" onClick={() => handleReqClick(1)}>提交</Button>}
                    {isChatLoading && <Button type="primary" onClick={cancelReqClick}>终止</Button>}
                    <Button  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff', marginLeft: '10px' }} onClick={reSetNormal}>清空会话</Button>
                  </div>

                  <div style={{ width: fileList.length > 0 ? '100%' : 'auto', marginTop: fileList.length > 0 ? '10px' : '0' }}>
                    <Upload
                      accept="image/*"
                      fileList={fileList}
                      beforeUpload={(file) => {
                        setSelectedImage(file);
                        const newFileList = [{
                          uid: '-1',
                          name: file.name,
                          status: 'done',
                          originFileObj: file
                        }];
                        setFileList(newFileList);
                        return false; // 阻止自动上传
                      }}
                      onRemove={() => {
                        setSelectedImage(null);
                        setFileList([]);
                        setPreviewVisible(false); // 关闭预览模态框
                        setHoverPreviewVisible(false); // 关闭悬停预览框
                        setPreviewImage(''); // 清空预览图片
                      }}
                      onPreview={handlePreview}
                      maxCount={1}
                      showUploadList={{
                        showPreviewIcon: true,
                        showRemoveIcon: true,
                      }}
                    >
                      <Button icon={<Icon type="upload" />} size="small">上传图片</Button>
                    </Upload>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === '2' && (
            <div>
              <TextArea
                id="chatReqTextAreaContinue"
                autoSize={{ minRows: 5 }}
                value={reqContinue}
                onChange={handleReqContinueChange}
                 
                placeholder="请输入您的问题，选择用例节点，按 ' Command(Alt)+E ' 快捷键会自动引用用例节点信息，您只需要输入场景描述即可。"
              />

              <div style={{ marginTop: '10px' }}>
                <Button onClick={copyCase}>引用case</Button>
                <Button
                  type="primary"
                  style={{ marginLeft: '10px' }}
                  onClick={() => handleReqClick(2, 10)}
                >
                  AI续写
                </Button>
                <Button  
                 style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff', marginLeft: '10px' }} 
                 onClick={reSetContinue}>清空会话</Button>
              </div>
            </div>
          )}
        </div>


        <div
          ref={markdownRef}
          style={{
            width: '100%',
            height: '55vh',
            overflowY: 'auto',
            border: '1px solid #ccc',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '10px',
            backgroundColor: '#f9f9f9',
          }}
          className="markdown-content"
        >
          <Markdown
            id="chatMarkdownContent"
            remarkPlugins={[remarkGfm]} // ✅ 这是 v6 正确方式
            rehypePlugins={[rehypeRaw]}
            // renderers={{
            //   paragraph: ({ children }) => <p>{children}</p>,
            //   // 你可以继续添加 code, tableCell 等自定义渲染器
            // }}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')

                // 添加JSON格式化处理
                let formattedChildren = String(children).replace(/\n$/, '');
                if (match && match[1] === 'json') {
                  try {
                    // 尝试解析JSON并重新格式化
                    const jsonObj = JSON.parse(formattedChildren);
                    formattedChildren = JSON.stringify(jsonObj, null, 2);
                  } catch (e) {
                    //console.error('JSON格式化失败:', e);
                    // 如果解析失败，保持原样
                  }
                }

                return !inline && match ? (
                  <div style={{ position: 'relative' }}>
                    <SyntaxHighlighter
                      style={docco}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        maxWidth: '100%',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all', // 强制断行
                        wordWrap: 'break-word',
                        fontSize: '14px',
                        border: '1px solid #eee',
                        borderRadius: '3px',
                        padding: '8px',
                        paddingRight: '40px'
                      }}

                      {...props}
                    >
                      {formattedChildren}
                    </SyntaxHighlighter>
                    {match[1] === 'json' && (
                      <Button
                        type="text"
                        icon="copy"
                        size="small"
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          color: '#1890ff',
                          background: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                        onClick={() => {
                          const jsonContent = String(children).replace(/\n$/, '');
                          convertJsonToClipboard(jsonContent);
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              },
              p: ({ node, ...props }) => <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} {...props} />,
              blockquote: ({ node, ...props }) => (
                <blockquote
                  style={{
                    borderLeft: '2px solid #1890ff',
                    margin: '10px 0',
                    paddingLeft: '16px',
                    color: '#666',
                  }}
                  {...props}
                />
              ),
              think: ({ node, ...props }) => (
                <blockquote
                  style={{
                    borderLeft: '2px solid #1890ff',
                    margin: '10px 0',
                    paddingLeft: '16px',
                    color: '#666',
                  }}
                  {...props}
                />
              ),
              // 添加表格相关样式
              table: ({ node, ...props }) => (
                <table
                  style={{
                    borderCollapse: 'collapse',
                    width: '100%',
                    margin: '10px 0',
                    border: '1px solid #ddd'
                  }}
                  {...props}
                />
              ),
              tbody: ({ node, ...props }) => (
                <tbody {...props} />
              ),
              tr: ({ node, ...props }) => (
                <tr {...props} />
              ),
              th: ({ node, isHeader, ...props }) => {
                // 输出 props 信息到控制台

                return (
                  <th
                    style={{
                      border: '1px solid #ddd',
                      padding: '8px',
                      textAlign: 'left',
                      color: '#ffffff',
                      backgroundColor: '#1890ff'
                    }}
                    {...props}
                  />
                );
              },
              td: ({ node, ...props }) => (
                <td
                  style={{
                    border: '1px solid #ddd',
                    padding: '8px',
                    textAlign: 'left'
                  }}
                  {...props}
                />
              )
            }}

          >
            {messages.replace(/<\/think>(```)/g, '</think>\n\n$1')}
          </Markdown>

        </div>
        <div style={{ marginTop: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
          <Button id="submitButton" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }} onClick={() => parseJsonContent(true)}>解析数据</Button>
        </div>
      </div>

      {/* 图片预览 Modal（点击预览） */}
      <Modal
        visible={previewVisible}
        footer={null}
        onCancel={handleCancelPreview}
        centered
        width={800}
        bodyStyle={{ padding: '20px', textAlign: 'center' }}
      >
        <img
          alt="预览"
          style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
          src={previewImage}
        />
      </Modal>

      {/* 场景描述输入对话框 */}
      <Modal
        title="输入场景描述"
        visible={caseDescModalVisible}
        onOk={() => {
          if (caseDescCallbackRef.current) {
            caseDescCallbackRef.current(caseDescInput);
            caseDescCallbackRef.current = null;
          }
          setCaseDescModalVisible(false);
        }}
        onCancel={() => {
          setCaseDescModalVisible(false);
          caseDescCallbackRef.current = null;
        }}
        okText="确定"
        cancelText="取消"
        className="sence-desc"
      >
        <div style={{ marginBottom: '16px' }}>
          <p>{caseDescPrompt}</p>
        </div>
        <TextArea
          placeholder="请输入场景描述，例如：登录、注册、支付等"
          id="chatCaseDescInput"
          value={caseDescInput}
          onChange={(e) => setCaseDescInput(e.target.value)}
          autoSize={{ minRows: 4 }}
          autoFocus
        />
      </Modal>

      {/* 悬停预览框 */}
      {hoverPreviewVisible && (
        <div
          style={{
            position: 'fixed',
            left: `${hoverPreviewPosition.x}px`,
            top: `${hoverPreviewPosition.y}px`,
            zIndex: 10000,
            backgroundColor: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            padding: '8px',
            maxWidth: '400px',
            maxHeight: '400px',
            pointerEvents: 'none', // 防止遮挡鼠标事件
          }}
        >
          <img
            alt="悬停预览"
            src={previewImage}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      )}
    </div>
  );
});

export default AIChat;