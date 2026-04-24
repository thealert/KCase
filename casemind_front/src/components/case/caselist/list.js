/* eslint-disable */
import React from 'react';
import Link from 'umi/link';
import router from 'umi/router';
import request from '@/utils/axios';
const axios = require('axios')
import cloneDeep from 'lodash/cloneDeep';
import {CopyToClipboard} from 'react-copy-to-clipboard';

import { css } from '@emotion/react';
import {
  Table,
  Pagination,
  message,
  Modal,
  Checkbox,
  Icon,
  Menu,
  Dropdown,
  Tooltip,
  Tag,
  Progress,
  Button,
  Steps
} from 'antd';

const { Step } = Steps;
import './index.scss';
import moment from 'moment';
import { getRequirmentAllInfos } from '@/utils/requirementUtils.js';
import { buildAuthHeaders } from '@/utils/authHeaders'
moment.locale('zh-cn');
import _ from 'lodash';
import PropTypes from 'prop-types';
import TaskModal from './taskModal';
import ReviewModal from './prviewModal';
import getQueryString from '@/utils/getCookies';
const getCookies = getQueryString.getCookie;
import debounce from 'lodash/debounce';
import envurls from '@/utils/envurls'

const getEnvUrlbyKey=envurls.getEnvUrlbyKey

class Lists extends React.Component {
  static contextTypes = {
    router: PropTypes.object,
  };
  constructor(props) {
    
    super(props);
    this.state = {
      list: this.props.list,
      total: 0, // 数据条数
      current: 1, // 当前第几页
      choiseDate: [], // 时间筛选最终选择
      iterationFilter: '', // 需求筛选最终选择
      createrFilter: '', // 创建人筛选最终选择
      nameFilter: '', // 用例名称筛选最终选择
      caseFile: null, // 保存上传的file文件，单文件    };
      checked: false,
      requirementIds: [],
      requirementObj: [],
      taskVisible: false,
      prviewVisible: false,
      record: null,
      extRecord: null,
      expendKeys: [],
      titleModeTask: '',
      titleModePrview: '',
      loading: this.props.loading,
      extendLoading: new Map(),
      caseInfo: {},
      ownerList: [],
      fetching: false,
      requirementSeach: '',
      pageSize:10
    };
    this.lastFetchId = 0;
    this.getOwnerList = debounce(this.getOwnerList, 800);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.list != nextProps.list) {
      this.setState({ list: nextProps.list }, () => {
        this.setState({
          loading: nextProps.loading,
          current: this.props.current,
          choiseDate: this.props.choiseDate,
          iterationFilter: this.props.iterationFilter,
          createrFilter: this.props.createrFilter,
          nameFilter: this.props.nameFilter,
          caseKeyWords: this.props.caseKeyWords,
          expendKeys: [],
        });
      });
    }
  }
  delOk = record => {
    let { getTreeList } = this.props;
    let url = `${this.props.doneApiPrefix}/case/delete`;

    let params = {
      id: record.id,
    };
    request(url, {
      method: 'POST',
      body: params,
    }).then(res => {
      if (res.code === 200) {
        message.success('删除成功');
        // this.props.getCaseList(this.state.current, '', '', '', '');
        getTreeList();
        this.setState({ checked: false });
      } else {
        message.error(res.msg);
      }
      return null;
    });
  };

  downloadXmind= (recordid,title) =>{
    var url=`${getEnvUrlbyKey('proxyurl')}/api/file/export?id=${recordid}`
    
    
    axios({
      url:url,
      method: 'GET',
      responseType: 'blob',
      headers : buildAuthHeaders()
    }).then(response => {
      const href = URL.createObjectURL(response.data);

      // create "a" HTML element with href to file & click
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', title+'.xmind'); //or any other extension
      document.body.appendChild(link);
      link.click();
  
      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    })
  }

  onChangeCheckbox = e => {
    this.setState({ checked: e.target.checked });
  };
  setColumns = () => {
    const columns = [
      {
        title: '用例ID',
        dataIndex: 'id',
        key: 'id',
        width: '4%',
        render: text => <div style={{ minWidth: '70px' }}>{text}</div>,
        
      },
      {
        title: '用例集名称',
        dataIndex: 'title',
        key: 'title',
        width: '20%',
        align:'left',
        
        // filters: [
        //   {
        //     text: '用例',
        //     value: 'case',
        //   },
        //   {
        //     text: '快照',
        //     value: 'cap',
        //   }
        // ],
        // filterIcon: filtered => <Icon type="filter"   style={{ fontSize:'16px',color: '#fff' }}/>,
        // onFilter: (value, record) => {
        //     //console.log(value,record)
        //     if(value === "case")
        //       return record.case_extype === 0
        //     else if(value === "cap")
        //       return record.case_extype === 1
        // },
        
        render: (text, record) => {
            let url = `${this.props.baseUrl}/caseManager/${this.props.productId}/${record.id}/undefined/0`;
            if(record.case_extype==0)
              return <div style={{ display: 'inline-block' }}>
                <Tag color="#87d068">用例</Tag>
                <Link to={url} style={{ marginRight: "5px"}}>{text}</Link>
            </div>;
            else if(record.case_extype==1)
              return <div style={{ display: 'inline-block' }}><Tag color="#2db7f5">快照</Tag><Link to={url}>{text}</Link></div>;
            else
              return <Link to={url}>{text}</Link>
          },
      },

      {
        title: '项目名称',
        dataIndex: 'requirementId',
        key: 'requirementId',
        width: '15%',
        align:'left',
        render: (text, record)  =>{
          const requirementName = record.requirement_name || text;
          if (requirementName) {
            return <div style={{ minWidth: '200px' }}><Tag color="#63b6ff">项目</Tag>{requirementName}</div>
          }
          return <div style={{ minWidth: '200px' }}>{text}</div>
        } 
      },

      {
        title: '当前状态',
        dataIndex: 'case_count',
        key: 'case_count',
        width: '7%',
        align:'center',
        render: (text, record)  =>{
          if (record.captureNum && record.captureNum>0)
            return <div><Tag color="green">快照已生成</Tag><br/><Tag  style={{marginTop:'5px'}}> 用例:{record.case_count} AI:{record.ai_case_count}</Tag></div>
          else if(record.recordNum && record.recordNum>0)
            return <div><Tag color="orange" >用例执行</Tag><br/><Tag   style={{marginTop:'5px'}}> 用例:{record.case_count} AI:{record.ai_case_count} </Tag></div>
          else if(record.prviewNum && record.prviewNum>0)
            return <div><Tag color="blue" >用例评审</Tag><br/><Tag  style={{marginTop:'5px'}}> 用例:{record.case_count} AI:{record.ai_case_count}</Tag></div>
          else
            return <div><Tag color="magenta">用例撰写</Tag><br/><Tag  style={{marginTop:'5px'}}> 用例:{record.case_count} AI:{record.ai_case_count}</Tag></div>
        },
        
      },

      {
        title: '操作流程',
        dataIndex: 'parentid',
        key: 'parentid',
        width: '20%',
        align:'center',
        render: (text, record) => {
          return <Steps
                type="default"
                size="small"
                current={8}
            >

              <Step
                  title={`评审`}

                  status={record.prviewNum && record.prviewDoneNum > 0 ?`finish`:'wait'}
                  description={
                    <Tooltip title="创建评审任务">
                      <a
                          //className="icon-bg"
                          onClick={() => {
                            this.showPrview('新建评审任务', record);
                          }}
                      >
                        <Icon type="team" style={{ fontSize: '16px', color: '#3377ff' }}/>
                      </a>
                    </Tooltip>
                  }
              />
              <Step
                  title="执行"
                  status={record.recordNum && record.recordNum > 0 ?`finish`:'wait'}
                  description={
                    <Tooltip title="创建测试任务">
                      <a
                          //className="icon-bg"
                          onClick={() => {
                            this.showTask('新建测试任务', record);
                          }}
                      >
                        <Icon type="play-circle" style={{ fontSize: '16px', color: '#3377ff' }}></Icon>
                      </a>

                    </Tooltip>
                  }
              />
              <Step
                  title="快照"
                  status={record.captureNum && record.captureNum > 0 ?`finish`:'wait'}
                  // description="Step2中生成快照"
              />
            </Steps>
        }
        //   if(record.parentid  && record.parentid > 0){           
        //     return <div><a target="_blank"  href={`/mycasemind-cms/caseManager/1/${record.parentid}/undefined/0`}>{record.parentname}</a><br/>
        //     <Tag>id: {record.parentid}</Tag></div> 
        //   }
        //   else
        //     return <div><span>-</span></div>
        // } 
      },

     


      // {
      //   title: '更新人',
      //   dataIndex: 'modifier',
      //   width: '7%',
      //   key: 'modifier',
      // },
      {
        title: '创建人',
        dataIndex: 'creator',
        width: '8%',
        key: 'creator',
        align:'center',
        render: (text, record) => {
          return (
            <div>
              <span>{text}</span><br/>
              <span style={{fontSize:'10px'}}>{moment(record.gmtCreated).format('YY/MM/DD HH:mm:ss')} </span>
              {/* <span>{record.modifier}</span> */}
            </div>
          );
        },
      },
      // {
      //   title: '创建/修改时间',
      //   dataIndex: 'gmtCreated',
      //   width: '12%',
      //   key: 'gmtCreated',
      //   align:'center',
      //   render: (text, record) => {
      //     return (
      //       <span>
      //         {moment(text).format('YY-MM-DD HH:mm:ss')}<br/>
      //         {moment(record.gmtModified).format('YY-MM-DD HH:mm:ss')}
      //       </span>
      //     );
      //   },
      // },

      {
        title: '操作',
        dataIndex: 'handle',
        width: '18%',
        align:'center',
        key: 'handle',
        render: (text, record) => {
          const { projectLs, requirementLs } = this.props.options;
          const { type } = this.props;

          let creator = getCookies('username');
          let recordCreator = record.creator.match(/\(([^)]*)\)/)
            ? record.creator.match(/\(([^)]*)\)/)[1]
            : record.creator;

          return (<span>
            {record.case_extype==1 && (
              <span>
                <Tooltip title="删除用例">
              <a
              className="icon-bg"
              onClick={() => {
                Modal.confirm({
                  title: '确认删除用例集吗',
                  content: (
                    <span>
                      当前正在删除&nbsp;&nbsp;
                      <span style={{ color: 'red' }}>
                        {record.title}
                      </span>
                      &nbsp;&nbsp;用例集，并且删除用例集包含的{' '}
                      <span style={{ color: 'red' }}>
                        {record.recordNum}
                      </span>{' '}
                      个测试任务与测试结果等信息，此操作不可撤销
                      <br />
                      <br />
                      <Checkbox onChange={this.onChangeCheckbox}>
                        我明白以上操作
                      </Checkbox>
                    </span>
                  ),
                  onOk: e => {
                    if (this.state.checked) {
                      this.delOk(record);
                      Modal.destroyAll();
                    } else {
                      message.info('请先勾选我已明白以上操作');
                    }
                  },
                  icon: <Icon type="exclamation-circle" />,
                  cancelText: '取消',
                  okText: '删除',
                });
              }}
            >
               <Icon type="delete" style={{ fontSize: '16px' }}/>
            </a>
            </Tooltip>
              <Tooltip title="导出xmind">
              <a
                className="icon-bg"
                        // href={`${getEnvUrlbyKey('proxyurl')}/api/file/export?id=${record.id}`}
                onClick={e =>this.downloadXmind(record.id,record.title)}
              >
                <Icon type="cloud-download" style={{ fontSize: '16px' }}/>
              </a>
              </Tooltip>
            </span>
            )
            }
            {record.case_extype!==1 && (
                <span>

                <Tooltip title="创建评审任务">
                <a
                  className="icon-bg"
                  onClick={() => {
                    this.showPrview('新建评审任务', record);
                  }}
                >
                  <Icon type="team" style={{ fontSize: '16px', color: '#3377ff' }}/>
                </a>
              </Tooltip>


              <Tooltip title="创建测试任务">
                <a
                  className="icon-bg"
                  onClick={() => {
                    this.showTask('新建测试任务', record);
                  }}
                >
                  <Icon type="play-circle" style={{ fontSize: '16px', color: '#3377ff' }}/>
                </a>
              </Tooltip>

             

              <Tooltip title="编辑用例集">
                <a
                  onClick={() => {
                    let infos =
                      getRequirmentAllInfos(
                        projectLs,
                        requirementLs,
                        record.requirementId,
                      ) || {};
                    let project = infos.project || [];
                    let requirement = infos.requirement || [];
                    this.props.handleTask(
                      'edit',
                      record,
                      project,
                      requirement,
                      this.state.current,
                    );
                  }}
                  className="icon-bg border-a-redius-left"
                >
                  <Icon type="edit"  />
                </a>
              </Tooltip>


              <Tooltip title="复制用例集">
                <a
                  onClick={() => {
                    let infos =
                      getRequirmentAllInfos(
                        projectLs,
                        requirementLs,
                        record.requirementId,
                      ) || {};
                    let project = infos.project || [];
                    let requirement = infos.requirement || [];
                    this.props.handleTask('copy', record, project, requirement);
                  }}
                  className="icon-bg border-a-redius-right "
                >
                  <Icon type="copy" />
                </a>
              </Tooltip>

              <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item>
                        <CopyToClipboard
                            text={`${window.location.origin}/mycasemind-cms/caseManager/${this.props.productId}/${record.id}/undefined/0`}
                            onCopy={() => message.info(<span>用例 <span style={{color: "red"}}>{record.title}</span> 链接已复制到剪切板</span>)}>
                          <a>分享链接</a>
                        </CopyToClipboard>
                      </Menu.Item>
                      <Menu.Item>
                        <a
                            onClick={() => {
                              Modal.confirm({
                                title: '确认删除用例集吗',
                                content: (
                                    <span>
                                当前正在删除&nbsp;&nbsp;
                                      <span style={{color: 'red'}}>
                                  {record.title}
                                </span>
                                      &nbsp;&nbsp;用例集，并且删除用例集包含的{' '}
                                      <span style={{color: 'red'}}>
                                  {record.recordNum}
                                </span>{' '}
                                      个测试任务与测试结果等信息，此操作不可撤销
                                <br/>
                                <br/>
                                <Checkbox onChange={this.onChangeCheckbox}>
                                  我明白以上操作
                                </Checkbox>
                              </span>
                                ),
                                onOk: e => {
                              if (this.state.checked) {
                                this.delOk(record);
                                Modal.destroyAll();
                              } else {
                                message.info('请先勾选我已明白以上操作');
                              }
                            },
                            icon: <Icon type="exclamation-circle" />,
                            cancelText: '取消',
                            okText: '删除',
                          });
                        }}
                      >
                        删除
                      </a>
                    </Menu.Item>
                    <Menu.Item>
                      <a href={`/mycasemind-cms/history/${record.id}`}>历史版本</a>
                    </Menu.Item>
                    <Menu.Item>
                      {/* <Button onClick={e =>this.downloadXmind(record.id,record.title)}>xxx</Button> */}
                      <a
                        // href={`${getEnvUrlbyKey('proxyurl')}/api/file/export?id=${record.id}`}
                        onClick={e =>this.downloadXmind(record.id,record.title)}
                      >
                        导出xmind
                      </a>
                    </Menu.Item>
                  </Menu>
                }
              >
                <a className="icon-bg border-around">
                  <Icon type="ellipsis" />
                </a>
              </Dropdown>
              </span>
              )
            }
          </span>

          );
          
        },
      },
    ];
    return columns;
  };
  // 分页
  onChangePagination = page => {
     
    this.setState({ current: page, expendKeys: [] }, () => {
      const {
        nameFilter,
        createrFilter,
        iterationFilter,
        choiseDate,
        caseKeyWords,
        pageSize,
      } = this.state;
      //alert(pageSize)
      this.props.getCaseList(
        this.state.current,
        nameFilter || '',
        createrFilter || '',
        iterationFilter || '',
        choiseDate || [],
        caseKeyWords || '',
        pageSize,
      );
    });
  };

  onClosePrview = form => {
    (this.state.ownerList = []), form.resetFields();
    this.setState({ prviewVisible: false });
  };
  handleOkPrview = record => {
    this.getRecordList(record.caseId || record.id);
    this.setState({
      prviewVisible: false,
      expendKeys: [record.caseId || record.id],
    });
  };

  onCloseTask = form => {
    (this.state.ownerList = []), form.resetFields();
    this.setState({ taskVisible: false });
  };
  handleOkTask = record => {
    
    this.getRecordList(record.caseId || record.id);
    this.getPrviewList(record.caseId || record.id)
    this.setState({
      taskVisible: false,
      expendKeys: [record.caseId || record.id],
    });
  };
  // priority 数据转换
  handleChooseContent = content => {
    let val = content && JSON.parse(content).priority;
    let val1 = val.indexOf('0') > -1 ? '0' : '1';
    return {
      content: val1,
      priority: val1 === '1' ? val : [],
    };
  };

  showPrview = (title, record) => {
    console.log(record.chooseContent)
    let priority = record.chooseContent
      ? this.handleChooseContent(record.chooseContent).priority
      : [];
    let resource = record.chooseContent
      ? JSON.parse(record.chooseContent).resource
      : [];
    this.setState(
      { prviewVisible: true, record: record, titleModePrview: title, caseInfo: {} },
      () => {
        this.getCaseInfo(priority, resource);
      },
    );
  };
  showTask = (title, record) => {
    console.log(record.chooseContent)
    let priority = record.chooseContent
      ? this.handleChooseContent(record.chooseContent).priority
      : [];
    let resource = record.chooseContent
      ? JSON.parse(record.chooseContent).resource
      : [];
    this.setState(
      { taskVisible: true, record: record, titleModeTask: title, caseInfo: {} },
      () => {
        this.getCaseInfo(priority, resource);
      },
    );
  };

  getProgressColor= (successPercent)=> {
    let color = ''
    if (successPercent < 50) {
      color = '#f50'
    } else if (successPercent >= 50 && successPercent < 75) {
      color = '#FF9900'
    } else if (successPercent >= 75) {
      color = '#87d068'
    }
    return color
  };

  // 获取case信息
  getCaseInfo = (priority, resource) => {
    
    const { record, titleModeTask,titleModePrview } = this.state;
    let url = `${this.props.doneApiPrefix}/case/countByCondition`;

    request(url, {
      method: 'GET',
      params: {
        caseId: (titleModeTask === '编辑测试任务' || titleModePrview === '编辑评审任务') ? record.caseId : record.id,
        priority,
        resource: resource || [],
      },
    }).then(res => {
      if (res.code === 200) {
        
        this.setState({ caseInfo: res.data });
      }
    });
  };
  renderExpand = item => {

    const columns_prview = [
      {
        title: '任务ID',
        dataIndex: 'id',
        key: 'id',
        width: 30,
        scopedSlots: { customRender: 'alignAlias' },
		    align: 'center', //头部单元格和列内容水平居中
      },
      {
        title: '评审任务名称',
        dataIndex: 'title',
        key: 'title',
        width: 100,
        align: 'left',
        render: (text, record) => {
          let url = `${this.props.baseUrl}/caseManager/${this.props.productId}/${record.caseId}/undefined/4/prview/${record.id}`;
          return (
            <div style={{ display: 'inline-block' }}>
              <Tag color="orange">评审任务</Tag>
            <Tooltip title={text}>
              <a
                onClick={() => this.taskLink(url, record)}
                // className="table-ellipsis"
              >
                {text}
              </a>
            </Tooltip>
            </div>
          );
        },
      },
      {
        title: () => (
          <Tooltip placement="top" title="负责执行任务与标记用例结果">
            <span style={{ cursor: 'pointer' }}>负责人</span>
          </Tooltip>
        ),
        dataIndex: 'owner',
        key: 'owner',
        width: 50,
        render: text => (
          <Tooltip title={text}>
            <span className="table-ellipsis">{text}</span>
          </Tooltip>
        ),
      },
      {
        title: () => (
          <Tooltip placement="top" title="参与标记用例结果的人员列表">
            <span style={{ cursor: 'pointer' }}>执行人</span>
          </Tooltip>
        ),
        dataIndex: 'executors',
        key: 'executors',
        width: 50,
        render: text => (
          <Tooltip title={text}>
            <span className="table-ellipsis">{text}</span>
          </Tooltip>
        ),
      },
      {
        title: '评审结果',
        dataIndex: 'review_result',
        key: 'review_result',
        align: 'center',
        width: 40,
        render: (text, record) => {
          
          if(text===1)
            return <Tag color="#87d068">评审通过</Tag>
          else if(text===2)
            return <Tag color="#f50">评审不通过</Tag>
          else if(text===0)
            return <Tag color="#2db7f5">待评审</Tag>
        }
      },
      {
        title: '修改时间',
        dataIndex: 'modifyTime',
        align: 'center',
        width: '10%',
        key: 'modifyTime',
        render: text => {
          return (
            <div>
              <span>{moment(text).format('YYYY-MM-DD HH:mm:ss')}</span>
            </div>
          );
        },
      },
      {
        title: '操作',
        dataIndex: 'handle',
        key: 'handle',
        width: '17%',
        align:'center',
        render: (text, record) => {
          let creator = getCookies('username');
          let recordCreator = record.creator.match(/\(([^)]*)\)/)
            ? record.creator.match(/\(([^)]*)\)/)[1]
            : record.creator;
          let url = `${this.props.baseUrl}/caseManager/${this.props.productId}/${record.caseId}/${record.id}/4`;
          let url_privew = `${this.props.baseUrl}/caseManager/${this.props.productId}/${record.caseId}/undefined/4/prview/${record.id}`;
          return (
            <span>
              <Tooltip title="编辑任务">
                <a
                  onClick={() => {
                    this.showPrview('编辑评审任务', record);
                  }}
                  className="icon-bg border-a-redius-left"
                >
                  <Icon type="edit" />
                </a>
              </Tooltip>
              <Tooltip title="执行评审">
                <a
                  className="icon-bg"
                  onClick={() => this.taskLink(url_privew, record)}
                >
                  <Icon type="file-done" />
                </a>
              </Tooltip>
              <Tooltip title={`删除任务`}>
                <a
                  onClick={() => {
                    Modal.confirm({
                      title: '确认删除测试任务吗',
                      content: (
                        <span>
                          这将删除该测试任务下所有的测试与测试结果等信息，并且不可撤销。{' '}
                          <br />
                          <Checkbox onChange={this.onChangeCheckbox}>
                            我明白以上操作
                          </Checkbox>
                        </span>
                      ),
                      onOk: e => {
                        if (this.state.checked) {
                          this.deleteRecordList(record);

                          Modal.destroyAll();
                        } else {
                          message.info('请先勾选我已明白以上操作');
                        }
                      },
                      icon: <Icon type="exclamation-circle" />,
                      cancelText: '取消',
                      okText: '删除',
                    });
                  }}
                  className="icon-bg border-a-redius-right margin-3-right"
                >
                  <Icon type="delete" />
                </a>
              </Tooltip>

              <CopyToClipboard text={`${window.location.origin}/mycasemind-cms/caseManager/${this.props.productId}/${record.caseId}/undefined/4/prview/${record.id}`} onCopy={() => message.info(<span >用例 <span style={{ color:"red"}}>{record.title}</span> 链接已复制到剪切板</span>)}>                
              <Tooltip title="分享链接">
                 <a  className="icon-bg border-a-redius-right margin-3-right">  <Icon type="share-alt" /> </a>                 
              </Tooltip>
              </CopyToClipboard>
            </span>
          );
        },
      },
    ]

    
    const columns = [
      {
        title: '任务ID',
        dataIndex: 'id',
        key: 'id',
        width: 40,
        //scopedSlots: { customRender: 'alignAlias' },
		    align: 'center', //头部单元格和列内容水平居中
      },
      {
        title: '执行任务名称',
        dataIndex: 'title',
        key: 'title',
        width: 130,
        align: 'left',
        render: (text, record) => {
          let url = `${this.props.baseUrl}/caseManager/${this.props.productId}/${record.caseId}/${record.id}/3`;
          
          return (
            <div style={{ display: 'inline-block' }}>
              {record.record_type === 0 && <Tag color="blue">执行任务</Tag>}
              {record.record_type === 2 && <Tag color="geekblue">快照</Tag>}
            <Tooltip title={text}>
              <a
                onClick={() => this.taskLink(url, record)}
                // className="table-ellipsis"
              >
                {text}
              </a>
            </Tooltip>
            </div>
          );
        },
      },
      {
        title: () => (
          <Tooltip placement="top" title="负责执行任务与标记用例结果">
            <span style={{ cursor: 'pointer' }}>负责人</span>
          </Tooltip>
        ),
        dataIndex: 'owner',
        key: 'owner',
        width: 50,
        render: text => (
          <Tooltip title={text}>
            <span className="table-ellipsis">{text}</span>
          </Tooltip>
        ),
      },
      {
        title: () => (
          <Tooltip placement="top" title="参与标记用例结果的人员列表">
            <span style={{ cursor: 'pointer' }}>执行人</span>
          </Tooltip>
        ),
        dataIndex: 'executors',
        key: 'executors',
        width: 50,
        render: text => (
          <Tooltip title={text}>
            <span className="table-ellipsis">{text}</span>
          </Tooltip>
        ),
      },

      {
        title: '任务类型',
        dataIndex: 'env',
        key: 'env',
        align: 'center',
        width: 40,
        
        render: (text, record) => {
            
            if(text == 0){
              return <div style={{marginLeft: '10px'}}><Tag color="magenta">冒烟测试</Tag></div>
            }
            else if(text == 1){
              return <div style={{marginLeft: '10px'}}><Tag color="purple">系统测试</Tag></div>
            }
            else if(text == 2){
              return <div style={{marginLeft: '10px'}}><Tag color="green">回归测试</Tag></div>
            }
            else if(text == 3){
              return <div style={{marginLeft: '10px'}}><Tag color="volcano">研发自测</Tag></div>
            }
          }        
      },

      {
        title: '整体通过率',
        dataIndex: 'successNum',
        key: 'successNum',
        align: 'center',
        width: 80,
        render: (text, record) => (
          <span className="table-operation">
           {/* <Tag color="#2db7f5">{parseInt((text / record.totalNum) * 100)}%</Tag>  */}
           <Tooltip title={ "统计："+text +"/"+ record.totalNum} >
           <Progress 
            format={percent => <div><div><b style={{ color:percent==0?"red":""}}>{percent}</b>
            <b style={{fontSize: '10px',color:percent==0?"red":"" }}>%</b></div>
             <span style={{fontSize: '9px' }}>{ text +"/"+ record.totalNum} </span></div>}
            type="circle" width={50} 
            strokeColor={this.getProgressColor(parseInt((text / record.totalNum) * 100))}
            percent={parseInt((text / record.totalNum) * 100)} size={100} 
            />
            </Tooltip>
          </span>
        ),
      },

      {
        title: '已执行通过率',
        dataIndex: 'successNum',
        key: 'partsuccessNum',
        align: 'center',
        width: 80,
        render: (text, record) => (
          <span className="table-operation">
           {/* <Tag color="#2db7f5">{parseInt((text / record.totalNum) * 100)}%</Tag>  */}
            <Tooltip title={ "统计："+text +"/"+ record.executeNum} >
           <Progress 
            format={percent => <div><div><b style={{ color:percent==0?"red":""}}>{percent}</b>
            <b style={{fontSize: '10px',color:percent==0?"red":"" }}>%</b></div>
             <span style={{fontSize: '9px' }}>{ text +"/"+ record.executeNum} </span></div>}
            type="circle" width={50} 
            strokeColor={this.getProgressColor(parseInt((text / record.executeNum) * 100))}
            percent={parseInt((text / record.executeNum) * 100)} size={100}>
            </Progress>
            </Tooltip>
          </span>
        ),
      },
      
      // {
      //   title: '执行状态',
      //   dataIndex: 'executeNum',
      //   key: 'executeNum',
      //   align: 'center',
      //   width:  '10%',
      //   render: (text, record) => (
      //     <span className="table-operation">
      //       {text} / {record.totalNum}
      //     </span>
      //   ),
      // },
      // {
      //   title: '创建时间',
      //   dataIndex: 'createTime',
      //   align: 'center',
      //   width: '10%',
      //   key: 'gmtCreated',
      //   render: text => {
      //     return (
      //       <div>
      //         <span>{moment(text).format('YYYY-MM-DD HH:mm:ss')}</span>
      //       </div>
      //     );
      //   },
      // },
      
      // {
      //   title: '期望时间',
      //   dataIndex: 'expectStartTime',
      //   key: 'expectStartTime',
      //   render: (text, record) =>
      //     text
      //       ? `${moment(text).format('YYYY-MM-DD')} 至 ${moment(
      //           record.expectEndTime,
      //         ).format('YYYY-MM-DD')}`
      //       : '',
      // },
      {
        title: '操作',
        dataIndex: 'handle',
        key: 'handle',
        width: 150,
        align: 'center',
        render: (text, record) => {
          let creator = getCookies('username');
          let recordCreator = record.creator.match(/\(([^)]*)\)/)
            ? record.creator.match(/\(([^)]*)\)/)[1]
            : record.creator;
          let url = `${this.props.baseUrl}/caseManager/${this.props.productId}/${record.caseId}/${record.id}/3`;
          let url_priview = `${this.props.baseUrl}/caseManager/${this.props.productId}/${record.caseId}/undefined/4/prview/${record.id}`;
          return  record.case_extype!==1 && (
            <span>
              <Tooltip title="编辑任务">
                <a
                  onClick={() => {
                    this.showTask('编辑测试任务', record);
                  }}
                  className="icon-bg border-a-redius-left"
                >
                  <Icon type="edit" />
                </a>
              </Tooltip>
              <Tooltip title="执行测试">
                <a
                  className="icon-bg"
                  onClick={() => this.taskLink(url, record)}
                >
                  <Icon type="file-done" />
                </a>
              </Tooltip>
              <Tooltip title={`删除任务`}>
                <a
                  onClick={() => {
                    Modal.confirm({
                      title: '确认删除测试任务吗',
                      content: (
                        <span>
                          这将删除该测试任务下所有的测试与测试结果等信息，并且不可撤销。{' '}
                          <br />
                          <Checkbox onChange={this.onChangeCheckbox}>
                            我明白以上操作
                          </Checkbox>
                        </span>
                      ),
                      onOk: e => {
                        if (this.state.checked) {
                          this.deleteRecordList(record);

                          Modal.destroyAll();
                        } else {
                          message.info('请先勾选我已明白以上操作');
                        }
                      },
                      icon: <Icon type="exclamation-circle" />,
                      cancelText: '取消',
                      okText: '删除',
                    });
                  }}
                  className="icon-bg border-a-redius-right margin-3-right"
                >
                  <Icon type="delete" />
                </a>
              </Tooltip>

              <CopyToClipboard text={`${window.location.origin}/mycasemind-cms/caseManager/${this.props.productId}/${record.caseId}/${record.id}/3`} onCopy={() => message.info(<span >用例 <span style={{ color:"red"}}>{record.title}</span> 链接已复制到剪切板</span>)}>                
              <Tooltip title="分享链接">
                 <a  className="icon-bg border-a-redius-right margin-3-right">  <Icon type="share-alt" /> </a>                 
              </Tooltip>
              </CopyToClipboard>
            </span>
          );
        },
      },
    ];
    
    let columnscaputre=cloneDeep(columns);
    columnscaputre[1].title='快照任务名称';

    return (
      <div className="" style={{ width: '95%' }}>

        {item.prviewList &&
          item.prviewList.length > 0 &&
          ((
            <Table
              className="prviewtable"
              columns={columns_prview}
              dataSource={item.prviewList}
              pagination={false}
              loading={this.state.extendLoading.get(item.id)}
              rowKey="id"
              size="middle"
            />
          ) ||
            null)}

        {item.recordList &&
          item.recordList.length > 0 &&
          ((
            <Table
              className="recordtable"
              columns={columns}
              dataSource={item.recordList}
              pagination={false}
              loading={this.state.extendLoading.get(item.id)}
              rowKey="id"
              size="middle"
            />
          ) ||
            null)}

        {item.captureList &&
          item.captureList.length > 0 &&
          ((
            <Table
              className="capturetable"
              columns={columnscaputre}
              dataSource={item.captureList}
              pagination={false}
              loading={this.state.extendLoading.get(item.id)}
              rowKey="id"
              size="middle"
            />
          ) ||
            null)}
          
      </div>
    );
  };
  // 任务名称跳转
  taskLink = (url, record) => {
    let loginUser = getCookies('username');
    if (record.owner === '' || record.owner.indexOf(loginUser) > -1) {
      router.push(url);
    } else {
      this.showConfirm(url);
    }
  };
  // 任务名称跳转、执行测试confirm弹框
  showConfirm = url => {
    return Modal.confirm({
      title: '您不是当前测试任务指派的负责人，确认要执行该任务？',
      onOk() {
        router.push(url);
      },
      onCancel() {},
      icon: <Icon type="question-circle" style={{ color: '#1890FF' }} />,
      cancelText: '取消',
      okText: '确认',
    });
  };
  getOwnerList = value => {
    
    console.log("getOwnerList... "+value)
    if (!value) {
      return;
    }
    
    this.lastFetchId += 1;
    const fetchId = this.lastFetchId;
    this.setState({ requirementSeach: value, fetching: true });
    let url = `/user/getallusername`;
    request(url, { method: 'GET' }).then(res => {
      if (res.code === 200) {
        var users=[];
        res.data.forEach((item, index) => {
          if(item.includes(value))
            users.push(item)
        })
        
        this.setState({ ownerList: users ? users : [], fetching: false });
      } else {
        message.error("获取用户信息失败");
      }
      
    });
    // request(`${this.props.oeApiPrefix}/user/suggest`, {
    //   method: 'GET',
    //   params: {
    //     username: value,
    //     onlyEmployee: false,
    //   },
    // }).then(res => {
    //   if (fetchId !== this.lastFetchId) {
    //     return;
    //   }
    //   //  if (res.code === 200) {
    //   this.setState({ ownerList: res ? res : [], fetching: false });
    //   //  }
    // });
  };

  clearRequire = () => {
    this.setState({ requirementSeach: '' });
  };

  onExpand = (expanded, record) => {
    if (expanded) {
      this.setState({ record }, () => {});
    }
  };

  getPrviewList = id =>{
    return;
    let url = `${this.props.doneApiPrefix}/prview/list`;
    request(url, { method: 'GET', params: { caseId: id } }).then(res => {
      if (res.code == 200) {
        let { list } = this.state;
        list.map(item => {
          if (item.id === id) {
            item.prviewList = res.data;
            item.prviewNum = res.data.length;
            if (item.prviewNum === 0) {
              //this.setState({ expendKeys: [] });
            }
          }
        });

        this.setState({ list }, () => {
          let extendLoading = this.state.extendLoading.set(id, false);

          this.setState({
            extendLoading,
          });
        });
      } else {
        message.error(res.msg);
      }
    });
  };
  getRecordList = id => {
    
    let url = `${this.props.doneApiPrefix}/record/list`;

    request(url, { method: 'GET', params: { caseId: id } }).then(res => {
      if (res.code == 200) {
        let { list } = this.state;
        
        list.map(item => {
          if (item.id === id) {
            var execitem=[]
            var prviewitem=[]
            var captureitem=[]
            for(var i=0;i<res.data.length;i++)
            {
              if(res.data[i].record_type==0)
                execitem.push(res.data[i])
              else if(res.data[i].record_type==1)
                prviewitem.push(res.data[i])
              else if(res.data[i].record_type==2)
                captureitem.push(res.data[i])
            }
            //console.log(execitem)
            item.recordList = execitem;
            item.recordNum = execitem.length;
            item.prviewList = prviewitem;
            item.prviewNum = prviewitem.length;
            item.captureList = captureitem;
            item.captureNum = captureitem.length;

            if (item.recordNum === 0 && item.prviewNum ===0 && item.captureNum ===0) {
              this.setState({ expendKeys: [] });
            }
          }
        });

        this.setState({ list }, () => {
          let extendLoading = this.state.extendLoading.set(id, false);

          this.setState({
            extendLoading,
          });
        });
      } else {
        message.error(res.msg);
      }
    });
  };

  // /record/delete
  deleteRecordList = record => {
    let url = `${this.props.doneApiPrefix}/record/delete`;

    request(url, { method: 'POST', body: { id: record.id } }).then(res => {
      if (res.code == 200) {
        this.getRecordList(record.caseId);
        this.getPrviewList(record.caseId);
        this.setState({ checked: false });
        message.success(res.data);
      } else {
        message.error(res.msg);
      }
    });
  };
  seeDetail = props => {
    let { expendKeys } = this.state;

    if (expendKeys.length > 0) {
      if (
        expendKeys.some(item => {
          return item == props.record.id;
        })
      ) {
        expendKeys.map(item => {
          if (item == props.record.id) {
            expendKeys.splice(expendKeys.indexOf(item), 1);
          }
        });
      } else {
        expendKeys.push(props.record.id);
      }
    } else {
      expendKeys.push(props.record.id);
    }
    
    this.setState({ expendKeys }, () => {
      if (!props.expanded) {
        
        this.getRecordList(props.record.id);
        this.getPrviewList(props.record.id);
      }
    });
  };

  

  render() {
    const {
      list,
      current,
      expendKeys,
      // loading,
      requirementSeach,
      fetching,
      ownerList,
      pageSize,
    } = this.state;
    const { total, loading } = this.props;
    return (
      <div>
        <Table

          columns={this.setColumns()}
          dataSource={list}
          expandedRowRender={item => this.renderExpand(item)}
          rowClassName={()=>"rowClassName1"}
          className="table-wrap"
          onExpand={this.onExpand}
          expandedRowKeys={expendKeys}
          rowKey="id"
          size="middle"
          loading={loading}
          pagination={false}
          expandIcon={props => {
            if (props.record.recordNum > 0 || props.record.prviewNum > 0) {
              if (!props.expanded) {
                return (
                  <div
                    role="button"
                    tabIndex="0"
                    style={{ color: '#3377ff' }}
                    className="ant-table-row-expand-icon ant-table-row-collapsed"
                    aria-label="展开行"
                    onClick={() => {
                      let extendLoading = this.state.extendLoading.set(
                        props.record.id,
                        true,
                      );
                      
                      this.setState({ extendLoading });
                      this.seeDetail(props);
                    }}
                  ></div>
                );
              } else {
                return (
                  <div
                    role="button"
                    tabIndex="0"
                    className="ant-table-row-expand-icon ant-table-row-expanded"
                    aria-label="关闭行"
                    onClick={() => {
                      this.seeDetail(props);
                    }}
                  ></div>
                );
              }
            } else {
              return null;
            }
          }}
          footer={currentData => (
            <div style={{ height: '32px' }}>
              {
                <div
                  className="pagination"
                  style={{
                    display: total === 0 ? 'none' : 'block',
                    float: 'right',
                  }}
                >
                  <Pagination
                    onChange={this.onChangePagination}
                    current={current}
                    total={Number(total)}
                    pageSizeOptions={['10', '15', '20', '25', '30']}
                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} `}
                    // pageSize={pageSize}
                    showSizeChanger={true}
                    onShowSizeChange={(current,ps) => {
                        console.log(ps)
                        this.setState({pageSize:ps})
                        this.onChangePagination(current)
                    }}
                  />
                </div>
              }
            </div>
          )}
        />
        <ReviewModal
          
          visible={this.state.prviewVisible}
          caseInfo={this.state.caseInfo}
          onClose={this.onClosePrview}
          handleOkPrview={this.handleOkPrview}
          showTask={this.showTask}
          getOwnerList={this.getOwnerList}
          ownerList={ownerList}
          fetching={fetching}
          requirementSeach={requirementSeach}
          clearRequire={this.clearRequire}
          record={this.state.record}
          type={this.props.type}
          doneApiPrefix={this.props.doneApiPrefix}
          titleModePrview={this.state.titleModePrview}
          getCaseInfo={this.getCaseInfo}
        >
        </ReviewModal>
        <TaskModal
          key="id"
          visible={this.state.taskVisible}
          caseInfo={this.state.caseInfo}
          onClose={this.onCloseTask}
          handleOkTask={this.handleOkTask}
          showTask={this.showTask}
          getOwnerList={this.getOwnerList}
          ownerList={ownerList}
          fetching={fetching}
          requirementSeach={requirementSeach}
          clearRequire={this.clearRequire}
          record={this.state.record}
          type={this.props.type}
          doneApiPrefix={this.props.doneApiPrefix}
          titleModeTask={this.state.titleModeTask}
          getCaseInfo={this.getCaseInfo}
        />
      </div>
    );
  }
}
export default Lists;
