import MimeType from './mimetype';
import { guid } from '../util';
import { Modal, Form, Input, Radio, Upload, Button, Icon,message } from 'antd';
const axios = require('axios')
import getQueryString from '@/utils/getCookies'
import envurls from '@/utils/envurls'
import { buildAuthHeaders } from '@/utils/authHeaders'
const getCookies = getQueryString.getCookie
const getEnvUrlbyKey=envurls.getEnvUrlbyKey

const normalizeImageUrl = url => {
  if (!url || typeof window === 'undefined') return url;
  try {
    const imageUrl = new URL(url, window.location.href);
    const localHosts = ['localhost', '127.0.0.1', '[::1]'];
    if (localHosts.includes(imageUrl.hostname) && !localHosts.includes(window.location.hostname)) {
      imageUrl.protocol = window.location.protocol;
      imageUrl.hostname = window.location.hostname;
      return imageUrl.href;
    }
  } catch (e) {
    return url;
  }
  return url;
};

let beforeCopy = null;
let beforeCut = null;
let beforePaste = null;

const ClipboardRuntime = (minder, readOnly) => {
  let _selectedNodes = [];
  const Data = window.kityminder.data;
  const decode = Data.getRegisterProtocol('json').decode;
  const encode = (nodes) => {
    const kmencode = MimeType.getMimeTypeProtocol('application/km');
    let _nodes = [];
    for (let i = 0, l = nodes.length; i < l; i++) {
      _nodes.push(minder.exportNode(nodes[i]));
    }
    return kmencode(Data.getRegisterProtocol('json').encode(_nodes));
  };
  const isActive = (e) => {
    
    const hasModal = document.getElementsByClassName('agiletc-modal').length > 0;
    const hasDrawer = document.getElementsByClassName('agiletc-note-drawer').length > 0;
    const hasNotePreviewer = document.getElementsByClassName('note-previewer').length > 0;
    
    // 检查脑图视图是否获得焦点
     
    let tmpCopy = document.getElementById('tmpCopy');
    
    const isChatFocused =   (
      isChatTextArea(e.target) ||
      (e.target.closest('.markdown-content') !== null) ||
      (e.target.closest('.sence-desc') !== null) ||
      e.target === tmpCopy
    );
    
    return (
      !hasModal &&
      !hasDrawer &&
      !hasNotePreviewer &&
      !window.showEdit &&
      e.preventDefault &&
      !window.search &&
      !window.tagInput &&
      minder &&
      !isChatFocused // 添加对脑图视图焦点的检查
    );
  };

 const isChatTextArea = (targetElement) => {
  return targetElement.id === 'chatReqTextAreaNormal' || 
    targetElement.id === 'chatReqTextAreaContinue' ||
    targetElement.id === 'chatMarkdownContent';
 }


  beforeCopy = (e) => {

    const targetElement = e.target;
    if ( isChatTextArea(targetElement)) {
      return true;
    } 

    if (isActive(e)) {
      const clipBoardEvent = e;
      const state = minder.getStatus();
      
      switch (state) {
        case 'input': {
          
          break;
        }
        case 'normal': {
          
          if (!readOnly) {
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
              const str = encode(nodes);
              clipBoardEvent.clipboardData.setData('text/plain', str);
            } 
          } else {
             
            const nodes = minder.getSelectedNodes();
            
            if(nodes && nodes.length>0){

              var cpStr=""
              nodes.forEach(function(node) {
                if(cpStr!=""){
                  cpStr+="\n"
                }
                cpStr+=node.getText()
              })
               
              clipBoardEvent.clipboardData.setData('text/plain',cpStr);
            }
            else{
              clipBoardEvent.clipboardData.setData('text/plain',   ''); 
            }
            
          }

          e.preventDefault();
          break;
        }
      }
    }
  };
  beforeCut = (e) => {
     
    if (isActive(e) && !readOnly) {
      if (minder.getStatus() !== 'normal') {
        e.preventDefault();
        return;
      }

      const clipBoardEvent = e;
      const state = minder.getStatus();

      switch (state) {
        case 'input': {
          break;
        }
        case 'normal': {
          let nodes = minder.getSelectedNodes();
          if (nodes.length) {
            clipBoardEvent.clipboardData.setData('text/plain', encode(nodes));
            minder.execCommand('removenode');
          }
          e.preventDefault();
          break;
        }
      }
    }
  };
  beforePaste = (e) => {

    const targetElement = e.target;
    if (isChatTextArea(targetElement)) {
      return true;
    } 
     
    if (isActive(e) && !readOnly) {
      if (minder.getStatus() !== 'normal') {
        e.preventDefault();
        return;
      }
      const clipBoardEvent = e;
      const textData = clipBoardEvent.clipboardData.getData('text/plain');
      const sNodes = minder.getSelectedNodes();
      const setId = (nodesList, newList) => {
        for (let item of nodesList) {
          const id = guid();
          item.data.id = id;
          item.data.created = new Date().valueOf();
          newList.push({ ...item });
          if (item.children.length > 0) {
            setId(item.children, newList);
          }
        }
      };

      var uploadImageIndex = -1;
     
      for(var i=0;i<clipBoardEvent.clipboardData.items.length;i++){
        var copy_item=(clipBoardEvent.clipboardData.items[i])
        if(copy_item.type.indexOf('image') > -1){
          uploadImageIndex = i;
          break;
        }
      }

      if (MimeType.whichMimeType(textData) === 'application/km') {
        
        const nodes = decode(MimeType.getPureText(textData));
        let _node = null;
        //console.log(nodes)
        sNodes.forEach(function (node) {
          // 由于粘贴逻辑中为了排除子节点重新排序导致逆序，因此复制的时候倒过来
          for (let i = nodes.length - 1; i >= 0; i--) {
            nodes[i].data.id = guid();
            nodes[i].data.created = new Date().valueOf();
            let allChildren = [];
            setId(nodes[i].children, allChildren);
            _node = minder.createNode(null, node);
            minder.importNode(_node, nodes[i]);
            _selectedNodes.push(_node);
            node.appendChild(_node);
          }
        });
        minder.select(_selectedNodes, true);
        _selectedNodes = [];
        minder.refresh();
        
      } else if(uploadImageIndex>-1){

         if(!minder.getSelectedNode()){
           message.warning('请选择节点再粘贴图片',2)
           return
         }
        
          var copy_item=(clipBoardEvent.clipboardData.items[uploadImageIndex])
          if(copy_item.type.indexOf('image') > -1){
            message.info('上传图片中,请稍后...',2)
            let imageFile = copy_item.getAsFile();
            let reader = new FileReader();
            reader.onload = function(event) {
              let base64Image = event.target.result;
             // minder.execCommand('image', base64Image);
            };
            reader.readAsDataURL(imageFile);
            const formData = new FormData()
            let newFileName = getCookies('username')+'_image.png'; // 你可以根据需要设置文件名
            let newFile = new File([imageFile], newFileName, { type: imageFile.type });

            formData.append('file', newFile)
            axios.post( getEnvUrlbyKey("proxyurl") + '/api/file/uploadFile', formData, {
              headers: buildAuthHeaders({
                'Content-Type': 'multipart/form-data',
                Username: getCookies('username'),
              }),
            })
            .then(function (response) {
              message.success('上传成功',1)
             // minder.execCommand('image', '');
              minder.execCommand('image', normalizeImageUrl(response.data.url))
            })
            .catch(function (error) {
              message.error('上传失败',2)
              setTimeout(minder.execCommand('image', ''), 100);
            });
          }
        
      }
      // else if (
      //   clipBoardEvent.clipboardData &&
      //   clipBoardEvent.clipboardData.items[0].type.indexOf('image') > -1
      // ) {
        
      //   let imageFile = clipBoardEvent.clipboardData.items[0].getAsFile();
         
      //   let serverService = angular.element(document.body).injector().get('server');
      //   return serverService.uploadImage(imageFile).then(function (json) {
      //     let resp = json.data;
      //     if (resp.errno === 0) {
      //       minder.execCommand('image', resp.data.url);
      //     }
      //   });
      // } 
      else {
        sNodes.forEach(function (node) {
          minder.Text2Children(node, textData);
        });
      }
      e.preventDefault();
    }
  };


  document.addEventListener('copy', beforeCopy);
  document.addEventListener('cut', beforeCut);
  document.addEventListener('paste', beforePaste);
};
const removeListener = () => {
   
  document.removeEventListener('copy', beforeCopy);
  document.removeEventListener('cut', beforeCut);
  document.removeEventListener('paste', beforePaste);
};
export default { init: ClipboardRuntime, removeListener };
