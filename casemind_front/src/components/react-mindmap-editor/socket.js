import React from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
//import io from './assets/socketio/socket.io.js';
import { notification, Modal, Button } from 'antd'
// import { AsyncStorage } from 'react-native-community/async-storage';
import WebsocketHeartbeatJs from 'websocket-heartbeat-js'
import localhelper from '@/utils/localstorehelper'
import pako from 'pako'
const { confirm } = Modal
const getLoaclWithExpiry = localhelper.getLoaclWithExpiry

const polling = {
    enabled: true,
    interval: 5000,
    timeout: 1500,
    //url:window.location.origin
}

class Socket extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            connectLoseCounters: 0,
            ts: Date.parse(new Date()),
        }
        // this.state = { ws : io(this.props.url, props.wsParam) };
        //this.state = { ws : io("xxxx", props.wsParam) };
        this.sendMessage = this.sendMessage.bind(this)
        this.setupSocket = this.setupSocket.bind(this)
        this.sendSocketMessage = this.sendSocketMessage.bind(this)
        this.leaveListener = this.leaveListener.bind(this)

        this.state.ws1 = new WebsocketHeartbeatJs({
            url: this.props.url1,
            pingTimeout: 10000,
            pongTimeout: 2000,
            reconnectTimeout: 3000,
            repeatLimit: 2,
            pingMsg: JSON.stringify({ type: 'HB', data: '' }),
        })

        if (!navigator.onLine) {
            this.doClose()
        }
        // var self=this;
        // this.state.checktimer=setInterval(() => {
        //     self.HBcheck();
        // }, 5000);
    }

    // componentWillUnmount(){
    //     clearInterval(this.state.checktimer)
    // }

    getLocalTime(nS) {
        return new Date(parseInt(nS) ).toLocaleString().replace(/:\d  {1,2}$/,' ');
    }

    // HBcheck(){
    //     var timestamp = Date.parse(new Date());
    //     var diff = timestamp-this.state.ts;
    //     console.log(this.getLocalTime(timestamp))
    //     console.log(this.getLocalTime(this.state.ts))
    //     console.log(diff)
    //     // if(diff>20000){
    //     //     console.log("over~~~!!!")
    //     //     if (typeof this.props.onClose === 'function') this.props.onClose();

    //     // }
    // }

    doClose() {
        if (typeof this.props.onClose === 'function') this.props.onClose()
        this.state.ws1.close()
    }

    getLastTime(jsonboj, timedic) {
        if (jsonboj.data && jsonboj.data.created) {
            if (jsonboj.data.created > timedic.created) {
                timedic.created = jsonboj.data.created
            }
        }
        if (jsonboj.children) {
            for (let i = 0; i < jsonboj.children.length; ++i) {
                //console.log(jsonboj.children[i]);
                this.getLastTime(jsonboj.children[i], timedic)
            }
        }
    }

    ifUseLocal(dbrecord, cacherecord, notlow) {
        if (dbrecord.root && cacherecord.root) {
            let timedb = { created: 0 }
            let timecache = { created: 0 }
            this.getLastTime(dbrecord.root, timedb)
            this.getLastTime(cacherecord.root, timecache)
            if (timecache.created > timedb.created || (timecache.created === timedb.created && notlow))
                return true
        }
        return false
    }
    closePage = () => {
        if (
            navigator.userAgent.indexOf('Firefox') != -1 ||
            navigator.userAgent.indexOf('Chrome') != -1
        ) {
            window.location.href = 'about:blank'
            window.close()
        } else {
            window.opener = null
            window.open('', '_self')
            window.close()
        }
    }

    setupSocket() {
        let self = this
        let websocket1 = this.state.ws1
        websocket1.onopen = function () {
            self.state.connectLoseCounters = 0

            console.log('connect open')
            console.log(self.props.url1)
            console.log(self.props.wsParam)
        }
        websocket1.onmessage = function (e) {
            // console.log(`onmessage: ${e.data}`);
            // var timestamp = Date.parse(new Date());
            // console.log(self.getLocalTime(timestamp));

            self.setState({ ts: Date.parse(new Date()) });
            self.state.connectLoseCounters = 0
            
            let receivedData = e.data;
            
            // 尝试检测是否为压缩消息
            try {
                const tempParse = JSON.parse(receivedData);
                if (tempParse.compressed === true && tempParse.data) {
                    console.log('收到压缩消息，开始解压');
                    // Base64 解码
                    const binaryString = atob(tempParse.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    // gzip 解压
                    const decompressed = pako.ungzip(bytes, { to: 'string' });
                    receivedData = decompressed;
                    console.log('消息解压完成');
                }
            } catch (e) {
                // 不是压缩消息或解压失败，使用原始数据
            }
            
            const recv = JSON.parse(receivedData || '{}')

            if (recv && recv.type) {
                if (recv.type === 'open_event') {
                    const dataJson = JSON.parse(recv.data)
                    //const recordId = new URLSearchParams(self.props.url1).get("recordId");
                    //const { historyId } = self.props.match.params;

                    try {
                        // if(localStorage.getItem('template_select')){
                        //     self.props.wsMinder.execCommand('Template', localStorage.getItem('template_select'));
                        // }

                        //const cacheContent = JSON.parse(localStorage.getItem(JSON.stringify(self.props.wsParam)));
                        const cacheContent = JSON.parse(getLoaclWithExpiry(JSON.stringify(self.props.wsParam)))

                        if (cacheContent == undefined) {
                            //notification.info({ message: '本地无缓存数据,拉取服务端最新数据', duration: 2 })
                            throw 'cache is empty'
                        }
                        if (self.props.historyId || dataJson.base > cacheContent.base) {

                            // 服务端版本高
                            if(!self.props.historyId){
                                notification.info({ message: '服务端版本高，拉取新数据，本地缓存将存储到备份库供恢复', duration: 5})
                                var info={ caseContent: JSON.stringify(cacheContent), patch: '', caseVersion: '' };
                                self.sendSocketMessage(JSON.stringify({'type':'save','data':info}))
                                localStorage.removeItem(JSON.stringify(self.props.wsParam));
                            }
                            

                            throw 'choose server'
                            // if (self.props.historyId ||
                            //     self.props.wsParam.query.recordId !== "undefined" ||
                            //     !self.ifUseLocal(dataJson, cacheContent, cacheContent.base>=dataJson.base)) {

                            //     throw 'choose server';
                        } else {
                            throw 'choose server';
                            notification.info({ message: '本地缓存不低于服务端版本，优先使用本地缓存数据', duration: 3 })
                            // 客户端版本高 或者 相同
                            // do nothing
                            // websocket.sendMessage('edit', { caseContent: JSON.stringify(cacheContent), patch: null, caseVersion: caseContent.base });
                        }
                        window.minderData = undefined
                        //console.log(cacheContent.root)
                        //console.log(self.props.wsMinder.exportJson().root)
                        if (
                            !(
                                JSON.stringify(cacheContent.root) ===
                                JSON.stringify(self.props.wsMinder.exportJson().root)
                            )
                        ) {
                            self.props.wsMinder.importJson(cacheContent)
                        }
                        window.minderData = cacheContent
                        self.expectedBase = self.props.wsMinder.getBase()

                        console.log('import case . cache base: ', cacheContent.base)
                        //console.log(self.props.wsParam.query.recordId)
                        if (self.props.wsParam.query.recordId === 'undefined') {
                            if (!_.isEqual(dataJson, cacheContent)) {
                                //console.log(JSON.stringify(dataJson))
                                //console.log(JSON.stringify(cacheContent))
                                console.log('syn db!!!!!!!!!!')
                                let info = { caseContent: JSON.stringify(cacheContent) }
                                self.sendSocketMessage(JSON.stringify({ type: 'sycase', data: info }))
                            }
                        }

                        // todo 测试版本，暂不清除
                        //localStorage.removeItem(JSON.stringify(self.props.wsParam));
                    } catch (e) {
                        console.error(e)
                        // console.log('接收消息，当前内容: ', JSON.stringify(self.props.wsMinder.exportJson()));
                        if (JSON.stringify(dataJson) === JSON.stringify(self.props.wsMinder.exportJson())) {
                            return
                        }

                        window.minderData = undefined
                        self.props.wsMinder.importJson(dataJson)
                        window.minderData = dataJson
                        self.props.doOutline(dataJson);

                        // 第一次打开用例，预期base与用例的base保持一直
                        self.expectedBase = self.props.wsMinder.getBase()
                        console.log('----- 接收消息，expected base: ', self.expectedBase)
                        // this.props.onMessage(evt.data);
                    }

                    if (recv.exinfo && recv.exinfo == '1') {
                        self.props.wsMinder.setStatus('readonly')
                        self.props.hideToolBar()
                    }
                } else if (recv.type === 'connect_notify_event') {
                    console.log('connect notify ', recv.data)
                    if (typeof self.props.handleWsUserStat === 'function')
                        self.props.handleWsUserStat(recv.data)
                } else if (recv.type === 'save_result') {
                    notification.info({ message: recv.data, duration: 2 })
                } else if (recv.type === 'edit_ack_event') {
                    console.log('edit_ack_event', recv.data)
                    const parserecv = JSON.parse(recv.data || '{}')
                    
                    // 如果json解析没有root节点
                    self.props.wsMinder.setStatus('readonly')
                    const recvPatches = self.travere(parserecv)
                    console.warn('====parserecv=====', parserecv)
                    console.warn('====recvPatches=====', recvPatches)
                    // const recvBase = recvPatches.filter((item) => item.path === '/base')[0]?.value;
                    // const recvFromBase = recvPatches.filter((item) => item.path === '/base')[0]?.fromValue;
                    try {
                        self.props.wsMinder.applyPatches(recvPatches)
                        
                    } catch (e) {
                        alert('客户端接受应答消息异常，请刷新重试')
                    }
                    console.warn('base: '+self.props.wsMinder.getBase())

                } else if(recv.type === 'reload_record_event' ||recv.type === 'reload_notify_record_event'){
                    console.log("reload_record_event receive")
                    // 如果提供了直接更新的回调函数，则直接使用返回的数据更新 state
                    if (typeof self.props.updateRecordDetail === 'function' && recv.data) {
                        try {
                            // 将 JSON 字符串解析为对象
                            const parsedData = typeof recv.data === 'string' ? JSON.parse(recv.data) : recv.data;
                            console.log("updateRecordDetail called with parsed data:", parsedData)
                            self.props.updateRecordDetail(parsedData)
                        } catch (e) {
                            console.error("Failed to parse recv.data:", e)
                            // 解析失败时使用原来的方式重新调用接口
                            setTimeout(self.props.getContentById,200)
                        }
                    } else {
                        // 否则使用原来的方式重新调用接口
                        setTimeout(self.props.getContentById,200)
                    }
                }
                else if (recv.type === 'edit_notify_event') {
                    console.log('edit_notify_event', recv.data)
                    const parserecv = JSON.parse(recv.data || '{}')
                    // 如果json解析没有root节点
                    try {
                        self.props.wsMinder.setStatus('readonly')
                        const recvPatches = self.travere(parserecv)
                        self.props.wsMinder.applyPatches(recvPatches)
                    } catch (e) {
                        alert('客户端接受通知消息异常，请刷新重试')
                    }
                } else if (recv.type === 'syforcapok' || recv.type === 'syok') {
                    console.log('syn info', recv.data)
                    if (typeof self.props.saveCapture === 'function') self.props.saveCapture()
                } else if (recv.type === 'inroom') {
                    websocket1.close()
                    confirm({
                        title: '提示',
                        content: '您已经打开了相同的页面，请不要重复打开',
                        cancelButtonProps: { style: { display: 'none' } },
                        onOk: () => {
                            window.location.href = '/mycasemind-cms/case/caseList/1'
                        },
                    })
                } else if (recv.type === 'lock') {
                    console.log('lock info', recv.data)
                    if (typeof self.props.handleLock === 'function') self.props.handleLock(recv.data)
                } else if (recv.type === 'warning') {
                    notification.error({ message: '数据一致性出错, 请刷新页面' })
                }else if (recv.type === 'refresh') {
                    notification.error({ message: recv.data })

                     Modal.warning({
                            title: recv.data,
                            className: 'agiletc-modal ws-warning',
                            getContainer: () =>
                              document.getElementsByClassName('kityminder-core-container')[0],
                            okText: '知道了，立即刷新',
                            onOk: () => {
                               
                              location.reload();
                            },
                          });
                }
                else if (recv.type === 'notify_msg') {
                    notification.error({ message: recv.data })
                }
                else if (recv.type === 'undo') {
                    console.log('undo info', recv.data);
                    try{
                        if (typeof self.props.handleUndoAck === 'function') {
                            self.props.handleUndoAck(recv.data);
                        }
                    }catch(e) {
                        alert('客户端接受通知消息异常，请刷新重试');
                    }
                    
                }
                else if (recv.type === 'redo') {
                    console.log('redo info', recv.data);
                    try{
                        if (typeof self.props.handleRedoAck === 'function') {
                            self.props.handleRedoAck(recv.data);
                        }
                    }catch(e) {
                        alert('客户端接受通知消息异常，请刷新重试');
                    }
                }


                // else if (recv.type === 'HB') {
                //     console.log("reveive HB")
                //     self.setState({ ts: Date.parse(new Date()) });
                // }
            }
        }
        websocket1.onreconnect = function () {
            console.log('reconnecting...')
        }
        websocket1.onerror = e => {
            console.log('connect onerror')
            self.setState({ connectLoseCounters: self.state.connectLoseCounters + 1 })
            if (self.state.connectLoseCounters >= 2) {
                if (typeof self.props.onClose === 'function') self.props.onClose()
            }
        }

        websocket1.onclose = function () {
            console.log('connect onclose')
        }
        // websocket1.onclose =  function (){
        //     if (typeof self.props.onClose === 'function') self.props.onClose();
        //     localStorage.setItem(JSON.stringify(self.props.wsParam), JSON.stringify(self.props.wsMinder.exportJson()));
        //     console.log('onclose...');
        // }

        return

        let websocket = this.state.ws

        websocket.on('connect', () => {
            console.log(this.props)
            if (typeof this.props.onOpen === 'function') this.props.onOpen()
        })

        websocket.on('reconnect', () => {
            console.log(this.props)
            websocket.disconnect()
            notification.error({ message: 'Version of client is not equal to server, please refresh.' })
        })

        websocket.on('disconnect', () => {
            if (typeof this.props.onClose === 'function') this.props.onClose()
            console.log('disconnect happened.')
            localStorage.setItem(
                JSON.stringify(this.props.wsParam),
                JSON.stringify(this.props.wsMinder.exportJson()),
            )
        })

        websocket.on('connect_notify_event', evt => {
            console.log('connect notify ', evt.message)
            if (typeof this.props.handleWsUserStat === 'function')
                this.props.handleWsUserStat(evt.message)
        })

        websocket.on('save_result', evt => {
            notification.info({ message: evt, duration: 0.5 })
        })

        websocket.on('open_event', evt => {
            const recv = JSON.parse(evt.message || '{}')
            const dataJson = { ...recv }
            return
            try {
                const cacheContent = JSON.parse(localStorage.getItem(JSON.stringify(this.props.wsParam)))
                console.log(this.props.wsParam)
                console.log(
                    '服务器版本' +
                    dataJson.base +
                    ', 缓存版本' +
                    (cacheContent == undefined ? 'no' : cacheContent.base),
                )

                if (this.props.wsParam.query && this.props.wsParam.query.recordId) {
                    console.log('Bug Fix==========use server')
                    throw 'use Server ！'
                }

                if (cacheContent == undefined) {
                    throw 'cache is empty'
                }

                if (dataJson.base > cacheContent.base) {
                    // 服务端版本高
                    throw 'choose server'
                } else {
                    // 客户端版本高 或者 相同
                    // do nothing
                    // websocket.sendMessage('edit', { caseContent: JSON.stringify(cacheContent), patch: null, caseVersion: caseContent.base });
                }
                window.minderData = undefined
                this.props.wsMinder.importJson(cacheContent)
                window.minderData = cacheContent
                this.expectedBase = this.props.wsMinder.getBase()
                console.log('import case from cache. cache base: ', cacheContent.base)
                // todo 测试版本，暂不清除
                localStorage.removeItem(JSON.stringify(this.props.wsParam))
            } catch (e) {
                console.error(e)

                console.log('接收消息，data: ', evt.message)
                console.log('接收消息，当前内容: ', JSON.stringify(this.props.wsMinder.exportJson()))
                if (evt.message === JSON.stringify(this.props.wsMinder.exportJson())) {
                    return
                }

                window.minderData = undefined
                this.props.wsMinder.importJson(dataJson)
                window.minderData = dataJson

                // 第一次打开用例，预期base与用例的base保持一直
                this.expectedBase = this.props.wsMinder.getBase()
                console.log('----- 接收消息，expected base: ', this.expectedBase)
                // this.props.onMessage(evt.data);
            }
        })

        websocket.on('edit_ack_event', evt => {
            console.log('edit_ack_event', evt.message)
            const recv = JSON.parse(evt.message || '{}')
            // 如果json解析没有root节点
            this.props.wsMinder.setStatus('readonly')
            const recvPatches = this.travere(recv)
            console.log('====recv=====', evt.message, recv, recvPatches)
            // const recvBase = recvPatches.filter((item) => item.path === '/base')[0]?.value;
            // const recvFromBase = recvPatches.filter((item) => item.path === '/base')[0]?.fromValue;
            try {
                this.props.wsMinder.applyPatches(recvPatches)
            } catch (e) {
                alert('客户端接受应答消息异常，请刷新重试')
            }
            // this.props.wsMinder._status='nomal';
        })

        websocket.on('edit_notify_event', evt => {
            console.log('edit_notify_event', evt.message)
            const recv = JSON.parse(evt.message || '{}')
            // 如果json解析没有root节点
            try {
                this.props.wsMinder.setStatus('readonly')
                const recvPatches = this.travere(recv)
                this.props.wsMinder.applyPatches(recvPatches)
            } catch (e) {
                alert('客户端接受通知消息异常，请刷新重试')
            }
        })

        // message 0:加锁；1：解锁；2:加/解锁成功；3:加/解锁失败
        websocket.on('lock', evt => {
            console.log('lock info', evt.message)
            if (typeof this.props.handleLock === 'function') this.props.handleLock(evt.message)
        })

        websocket.on('connect_error', e => {
            console.log('connect_error', e)
            websocket.disconnect()
        })

        websocket.on('warning', e => {
            notification.error({ message: 'server process patch failed, please refresh' })
        })
    }

    travere = arrPatches => {
        let patches = []
        for (let i = 0; i < arrPatches.length; i++) {
            if (arrPatches[i].op === undefined) {
                for (let j = 0; j < arrPatches[i].length; j++) {
                    patches.push(arrPatches[i][j])
                }
            } else {
                patches.push(arrPatches[i])
            }
        }
        return patches
    }

    sendSocketMessage(message) {
        //let websocket = this.state.ws1;
        //console.log(this.state.ws1.ws.readyState);
        
        // 压缩阈值：100KB
        const COMPRESSION_THRESHOLD = 100 * 1024;
        const messageSize = new Blob([message]).size;
        
        try {
            if (messageSize > COMPRESSION_THRESHOLD) {
                // 消息超过阈值，启用 gzip 压缩
                console.log(`消息大小 ${(messageSize / 1024).toFixed(2)}KB 超过阈值，启用压缩`);
                
                // 使用 pako 进行 gzip 压缩
                const compressed = pako.gzip(message);
                
                // 将压缩后的二进制数据转换为 Base64
                const base64Compressed = btoa(String.fromCharCode.apply(null, compressed));
                
                // 创建包装对象，标识消息已压缩
                const wrappedMessage = JSON.stringify({
                    compressed: true,
                    data: base64Compressed
                });
                
                const compressedSize = new Blob([wrappedMessage]).size;
                console.log(`压缩后大小 ${(compressedSize / 1024).toFixed(2)}KB，压缩率 ${((1 - compressedSize / messageSize) * 100).toFixed(2)}%`);
                
                this.state.ws1.send(wrappedMessage);
            } else {
                // 消息未超过阈值，直接发送
                this.state.ws1.send(message);
            }
        } catch (e) {
            console.error('消息压缩失败，使用原始消息发送:', e);
            this.state.ws1.send(message);
        }
        // var jsonObject = {userName: 'userName', message: message};
    }

    sendMessage(type, message) {
        return
        let websocket = this.state.ws
        console.log('-- message --', message)
        // var jsonObject = {userName: 'userName', message: message};
        websocket.emit(type, message)
    }

    leaveListener(e) {
        //   e.preventDefault();
        //   e.returnValue = '内容将被存储到缓存，下次打开相同用例优先从缓存获取！';
        // if (this.props.wsMinder.getBase() > 16) {
        //     localStorage.setItem(JSON.stringify(this.props.wsParam), JSON.stringify(this.props.wsMinder.exportJson()));
        // }
    }

    componentDidMount() {
        console.log(' -- componentDidMount -- ')
        this.setupSocket()
        window.addEventListener('beforeunload', this.leaveListener)

        // this.interval = setInterval(() => {
        //     if (this.props.wsParam.query.recordId === 'undefined') {
        //         let info = {
        //             caseContent: JSON.stringify(this.props.wsMinder.exportJson()),
        //             patch: '',
        //             caseVersion: '',
        //         }
        //         this.sendSocketMessage(JSON.stringify({ type: 'save', data: info }))
        //     }
        // }, 600000)
    }

    componentWillUnmount() {
        window.removeEventListener('beforeunload', this.leaveListener)
        clearInterval(this.interval)

        //this.state.ws.disconnect();
        this.state.ws1.close()

        console.log(' -- componentWillUnmount -- ')
    }

    render() {
        return (
            <div>
                {/* <Online polling={polling}>Online 🆗</Online>
        <Offline polling={polling}>⚠️Offline⚠️</Offline> */}
                {/* <Detector
                    onChange={connected => {
                        if (!connected) {
                            this.doClose()
                        }
                    }}
                    render={({ online }) => <div></div>}
                /> */}
            </div>
        )
    }
}

Socket.propTypes = {
    url: PropTypes.string.isRequired,
    onMessage: PropTypes.func.isRequired,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    handleLock: PropTypes.func,
    handleUndoAck: PropTypes.func,
    handleRedoAck: PropTypes.func,
    saveCapture: PropTypes.func,
    handleWsUserStat: PropTypes.func,
    hideToolBar: PropTypes.func,
    getContentById: PropTypes.func,
    updateRecordDetail: PropTypes.func,
    doOutline: PropTypes.func,
}

export default Socket
