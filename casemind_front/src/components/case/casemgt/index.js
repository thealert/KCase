/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import { Breadcrumb, Row, Button, Col, message, Tooltip,Alert,Icon} from 'antd';
//import {InfoCircleOutlined} from '@ant-design/icons';
import './index.scss';
import request from '@/utils/axios';
import getQueryString from '@/utils/getCookies';
import moment from 'moment';
import Link from 'umi/link';
import AgileTCEditor from '../../react-mindmap-editor';
import envurls from '@/utils/envurls'
import { color } from 'd3';
const getEnvUrlbyKey=envurls.getEnvUrlbyKey

const getCookies = getQueryString.getCookie;
/* global staffNamePY */
export default class CaseMgt extends React.Component {
  static propTypes = {
    params: PropTypes.any,
    form: PropTypes.any,
    productId: PropTypes.any,
    updateCallBack: PropTypes.any,
    activeProductObj: PropTypes.any,
  };
  constructor(props) {
    super(props);
    this.state = {
      modaltitle: '',
      visibleStatus: false,
      visible: false,
      title: '',
      caseContent: '',
      id: 0,
      productId: 0,
      recordDetail: null,
      casedetail: null,
    };
  }
  componentDidMount() {

    //alert(getEnvUrlbyKey('websocketurl'))
    const { iscore } = this.props.match.params;
    console.log(this.props.match.params)
    
    if (iscore === '3') {
      this.getContentById();
    } else {
       
      this.getCaseById();
    }
  }

  



  componentWillMount() {
    // 拦截判断是否离开当前页面
    window.addEventListener('beforeunload', this.handleAutoSave);
  }
  componentWillUnmount() {
    // 销毁拦截判断是否离开当前页面
    window.removeEventListener('beforeunload', this.handleAutoSave);
  //  this.handleAutoSave();
  }
  ///case/getRequirement
  handleAutoSave = () => {
    
    // e.preventDefault();
    // e.returnValue = '内容会被存储到浏览器缓存中！';
    const { historyId,iscore } = this.props.match.params;
    const minderData = this.editorNode
      ? this.editorNode.getAllData()
      : { base: 0 };
    // 是否有ws链接断开弹窗
    const hasBreak =
      document.getElementsByClassName('ws-warning') &&
      document.getElementsByClassName('ws-warning').length > 0;
    if (Number(iscore) !== 2 && minderData && !hasBreak && !historyId) {
      // 非冒烟case才可保存

        message.warn('即将离开页面，自动保存当前用例。');
        this.updateCase();
      // if (Number(minderData.base) > 1) {
      //   message.warn('即将离开页面，自动保存当前用例。');
      //   this.updateCase();
      // }
    }

  };
  getCaseById = () => {

    let url = `${this.props.doneApiPrefix}/case/getCaseInfo`;
    request(url, {
      method: 'GET',
      params: { id: this.props.match.params.caseId },
    }).then(res => {
      if (res.code == 200) {
        this.setState({
          casedetail: res.data,
        });
      } else {
        message.error(res.msg);
        this.props.history.push('/case/caseList/1');
      }
    });
  };

  ///record/getContentById
  getContentById = () => {
    let url = `${this.props.doneApiPrefix}/record/getRecordInfo`;

    request(url, {
      method: 'GET',
      params: { id: this.props.match.params.itemid },
    }).then(res => {
      if (res.code == 200) {
        this.setState({ recordDetail: res.data });
      } else {
        message.error(res.msg);
      }
    });
  };

  // 直接更新 recordDetail 的函数，用于 WebSocket 事件
  updateRecordDetail = (data) => {
    
    if (data) {
      this.setState({ recordDetail: data });
    }
  };

  //保存用例
  updateCase = (redirecturl) => {
    let recordId =
      this.props.match.params.itemid == 'undefined'
        ? undefined
        : this.props.match.params.itemid;

    const param = {
      id: this.props.match.params.caseId,
      title: '更新内容，实际不会保存title',
      recordId,
      modifier: getCookies('username'),
      caseContent: JSON.stringify(this.editorNode.getAllData()),
    };
    let url = `${this.props.doneApiPrefix}/case/update`;
    request(url, { method: 'POST', body: param }).then(res => {
      if (res.code == 200) {
        
        message.success('保存内容成功');
        if(redirecturl)
            window.location.href=redirecturl
      } else {
        message.error(res.msg);
        if(redirecturl)
            window.location.href=redirecturl
      }
    });
  };

  //清除执行记录
  clearRecord = () => {
    const params = {
      id: this.props.match.params.itemid,
      modifier: getCookies('username'),
    };

    let url = `${this.props.doneApiPrefix}/record/clear`;
    request(url, { method: 'POST', body: params }).then(res => {
      if (res.code == 200) {
        message.success('清除执行记录成功');
        this.editorNode.setEditerData(JSON.parse(res.data.caseContent));
      } else {
        message.error(res.msg);
      }
    });
  };

  render() {
    //this.props.match.params.iscore  0:需求case  3:执行记录详情
    const { match } = this.props;
    const { iscore, caseId, itemid ,historyId,recordid} = match.params;
    const user = getCookies('username');
    const { recordDetail, casedetail } = this.state;
    let readOnly = false;
    let progressShow = false;
    let addFactor = false;
    if (iscore === '0' || iscore === '1' ||iscore === '4') {
      readOnly = false;
      progressShow = false;
      addFactor = true;
    }else if(iscore === '3'){
      readOnly = false;
      progressShow = true;
      addFactor = false;
    }
     else {
      readOnly = true;
      progressShow = true;
      addFactor = false;
    }
    return (
      <div style={{ position: 'relative', minHeight: '80vh' }}>
        {/* <Breadcrumb style={{ marginBottom: 8, fontSize: 13 }}>
          <Breadcrumb.Item>
            <Link   to="/case/caseList/1">
              {casedetail ? '用例' : '任务'}管理
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            {casedetail ? '用例' : '任务'}详情：
            {recordDetail ? recordDetail.title : ''}
            {casedetail ? casedetail.title : ''}
          </Breadcrumb.Item>
        </Breadcrumb> */}
        <div
          id="caseContentDiv"
          style={{
            padding: 10,
            background: '#fff',
          }}
        >
          
          {(recordDetail && (
            <Row id="recordHeadRow" >
             
              {/* <Col span={4} className="description-case elipsis-case">
                <Tooltip
                  title={recordDetail.title}
                  placement="bottomLeft"
                >
                  标题：{recordDetail.title}
                </Tooltip>
              </Col> */}
              
              

              <Col offset={4} span={2} className="font-size-12">
                通过率: {recordDetail.passRate.toFixed(2) + '%'}
              </Col>
              <Col span={2} className="font-size-12">
                {' '}
                已测: {recordDetail.passCount + '/' + recordDetail.totalCount}
              </Col>



              <Col
                span={4}
                style={{ textAlign: 'center' }}
                className="progress"
              >
                <div>
                  {(
                    <Tooltip
                      title={`通过:${recordDetail.successCount} (${(
                        (recordDetail.successCount / recordDetail.totalCount) *
                        100
                      ).toFixed(2)}%)`}
                      className="font-size-12"
                    >
                      <div
                        className="div-wrap"
                        style={{
                          width: `${(recordDetail.successCount /
                            recordDetail.totalCount) *
                            100}%`,
                          backgroundColor: '#61C663',
                        }}
                      >
                        <span></span>
                      </div>
                    </Tooltip>
                  ) || null}
                  {(recordDetail.blockCount > 0 && (
                    <Tooltip
                      title={`阻塞:${recordDetail.blockCount} (${(
                        (recordDetail.blockCount / recordDetail.totalCount) *
                        100
                      ).toFixed(2)}%)`}
                      className="font-size-12"
                    >
                      <div
                        className="div-wrap"
                        style={{
                          width: `${(recordDetail.blockCount /
                            recordDetail.totalCount) *
                            100}%`,
                          backgroundColor: '#85A1D6',
                        }}
                      >
                        <span></span>
                      </div>
                    </Tooltip>
                  )) ||
                    null}
                  {(recordDetail.bugNum > 0 && (
                    <Tooltip
                      title={`失败:${recordDetail.bugNum} (${(
                        (recordDetail.bugNum / recordDetail.totalCount) *
                        100
                      ).toFixed(2)}%)`}
                    >
                      <div
                        className="div-wrap"
                        style={{
                          width: `${(recordDetail.bugNum /
                            recordDetail.totalCount) *
                            100}%`,
                          backgroundColor: '#FF7575',
                        }}
                      >
                        <span></span>
                      </div>
                    </Tooltip>
                  )) ||
                    null}
                  {(recordDetail.totalCount - recordDetail.passCount > 0 && (
                    <Tooltip
                      title={`未执行:${recordDetail.totalCount -
                        recordDetail.passCount} (${(
                        ((recordDetail.totalCount - recordDetail.passCount) /
                          recordDetail.totalCount) *
                        100
                      ).toFixed(2)}%)`}
                    >
                      <div
                        className="div-wrap"
                        style={{
                          width: `${((recordDetail.totalCount -
                            recordDetail.passCount) /
                            recordDetail.totalCount) *
                            100}%`,
                          backgroundColor: '#EDF0FA',
                        }}
                      >
                        <span></span>
                      </div>
                    </Tooltip>
                  )) ||
                    null}
                </div>
              </Col>
              <Col span={1}></Col>
              {/* <Col span={1} className="font-size-12">
               
              </Col> */}

              <Col  span={4} className="font-size-12">
              标题 : &nbsp; {recordDetail.title}
                {/* {recordDetail.expectStartTime
                  ? moment(recordDetail.expectStartTime).format('YYYY/MM/DD')
                  : null}
                -{' '}
                {recordDetail.expectEndTime
                  ? moment(recordDetail.expectEndTime).format('YYYY/MM/DD')
                  : null} */}
              </Col>
              
            </Row>
          )) ||
            null}

          {(casedetail && (
            <Row>
              {/* <Col span={6} className="description-case elipsis-case">
                <Tooltip title={casedetail.description} placement="topLeft">
                  {casedetail.description}
                </Tooltip>
              </Col> */}
              {/* <Col span={1}></Col> */}
              {/* <Col span={10} >
              { (casedetail ? <span>
                <Icon  class="myalert" type="info-circle" theme="filled" style={{ fontSize: '16px', color: '#1890ff' }}/><span className="font-size-14"> 重要更新！每次用例编辑都会存储到备份库，如有丢失请在备份库恢复，备份库请点击右下角的 <Icon type="history" />  圆圈按钮</span> 
                </span>:"")
                }
              </Col> */}
            </Row>
          )) ||
            null}
          
          <AgileTCEditor
            ref={editorNode => (this.editorNode = editorNode)}
            tags={['前置条件', '执行步骤', '预期结果',
              'iOS','Android','Web','服务端',
              '任务1','任务2','任务3','任务4','废弃',
              'AI','缓存','数据','变更']}
            iscore={iscore}
            progressShow={progressShow}
            readOnly={!historyId?readOnly:true}
            getContentById={this.getContentById}
            updateRecordDetail={this.updateRecordDetail}
            mediaShow={!progressShow}
            editorStyle={{ height: 'calc(100vh - 40px)' }} 
            caseTitle={casedetail}
            recordTitle={recordDetail}
            toolbar={{
              image: true,
              theme: ['fresh-blue','fresh-black','fresh-forest','classic-compact',  'fresh-green-compat'],
              template: ['default', 'right', 'fish-bone'],
              noteTemplate: '# test',
              addFactor,
            }}
            baseUrl=""
            uploadUrl={`${getEnvUrlbyKey('proxyurl')}/api/file/uploadAttachment`}
            wsUrl1={`${getEnvUrlbyKey('websocketurl')}/socket.io/?caseId=${caseId}&recordId=${itemid}&user=${user}&historyId=${historyId}&EIO=3&transport=websocket`}
            wsParam = {{ transports:['websocket','xhr-polling','jsonp-polling'], query: { caseId: caseId, recordId: itemid, user: user }}}
            recordId={itemid}
            caseId={caseId}
            historyId={historyId}
            recordId_V2={recordid}
            onSave={
              Number(iscore) !== 2
                ? (data) => {
                    
                    message.loading('保存中......', 1);
                    if(data && data.redirecturl){
                      this.updateCase(data.redirecturl);
                      //window.location.href=data.redirecturl
                    }
                      
                    else
                      this.updateCase();
                  }
                : null
            }
          />
        </div>
      </div>
    );
  }
}
