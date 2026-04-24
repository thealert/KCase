import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import Link from 'umi/link';
import { Excel } from 'antd-table-saveas-excel';
import ReactHTMLTableToExcel from 'react-html-table-to-excel'
import { CSVLink } from "react-csv"
import { Table, message, Button, Select, Card, Tooltip, Input, Divider, Tag,DatePicker } from 'antd'
import moment from 'moment'
import Headers from '../../layouts/headers'
import request from '@/utils/axios'
import cloneDeep from 'lodash/cloneDeep';
import './index.scss';
const { RangePicker } = DatePicker;
const { Option } = Select;

moment.locale('zh-cn')

class Analysis extends React.Component {


    constructor() {
        super()
        this.state = {
            list: [],
            list_excel:[],
            total: 0,
            businesslist: [],
            businessvalue: [],
            itearvalue: "",
            wslist: [],
            choiseDate:[],
            timerId: null,
        }

    }

    onChoiceKD = () => {
        this.setState({
            businessvalue: ["AD（广告）", "EE（信息化）"],
        });
    }

    componentDidMount() {
        this.getDirList();
        this.getSocketList();
        this.setTableID();
        var self = this;
        var timerId =setInterval(() => {
            self.getSocketList();
        }, 8000);
        this.setState({ timerId: timerId });
    }

    getDirList = () => {

        request(`/dir/getbusinessnames`, {
            method: 'GET',
            params: {
                productLineId: 1,
                channel: 1,
            },
        }).then(res => {
            if (res.code === 200) {
                //console.log(res.data)
                var filters = ["未分类用例集", "具体业务名称", "业务方向"]
                var items = []

                res.data = res.data.sort((a, b) => a.localeCompare(b));
                for (var i = 0; i < res.data.length; i++) {
                    if (!filters.includes(res.data[i]))
                        items.push(<Option key={res.data[i]}>{res.data[i]}</Option>);
                }

                this.setState({ businesslist: items, });
            }
            else {
                message.error(res.msg);
            }
        })

    }

    onSerach = () => {
        //alert(this.state.itearname)
        var { itearvalue, businessvalue } = this.state
        this.getCaseList(businessvalue, itearvalue)
    }


    setTableID = () => {
        const tableCon = ReactDOM.findDOMNode(this.refs['table'])
        const table = tableCon.querySelector('table')
        table.setAttribute('id', 'table-to-xls')
    }

    handleChange = (value) => {
        console.log(`选中的选项：${value}`);
        this.setState({
            businessvalue: value,
            bv: value,
        });
    }
    handleItera = (e) => {
        this.setState({ itearvalue: e.target.value })
    }

    onDataChange = (value, dateString) => {
        this.setState({ choiseDate: dateString });
        console.log(this.state.choiseDate)
      };

    getSocketList = () => {
        request(`/analysis/wslist`, {
            method: 'GET',
            params: {
            },
        }).then(res => {
            if (res.code === 200) {
                res.data.forEach((value, index) => { value.key = index + 1; });
                this.setState({
                    wslist: res.data,
                });
                //clearInterval(this.state.timerId);
            }
            else {
                clearInterval(this.state.timerId);
                message.error(res.msg);
            }
        })
    }

    getCaseList = (businessvalue, itearname) => {
        const {choiseDate}=this.state;
         
        request(`/analysis/list`, {
            method: 'GET',
            params: {
                pageSize: 1000,
                pageNum: 1,
                productLineId: 1,
                caseType: 0,
                channel: 1,
                bizId: '',
                beginTime: choiseDate.length > 0 ? `${choiseDate[0]} 00:00:00` : '',
                endTime: choiseDate.length > 0 ? `${choiseDate[1]}  23:59:59` : '',
                businessNames: businessvalue,
                iteratorNames: itearname,
            },
        }).then(res => {
            if (res.code === 200) {
                //console.log(res.data.dataSources.length)
                if (res.data.dataSources.length == 0) {
                    message.info("无结果")
                }

                var convertarr=[];
                res.data.dataSources.forEach((value, index) => 
                    { 
                        value.key = index; 
                        let value_clone=cloneDeep(value);
                        if(value_clone.requirementId){
                            value_clone.requirementId='=""'+value_clone.requirementId+'""'
                        }
                        convertarr.push(value_clone)
                    });
                //console.log(convertarr)

                this.setState({
                    list: res.data.dataSources,
                    total: res.data.total,
                    list_excel:convertarr,
                });
            }
            else {
                message.error(res.msg);
            }
        })

    }

    timeDiff = (d1) => {//di作为一个变量传进来
        //如果时间格式是正确的，那下面这一步转化时间格式就可以不用了
        var dateBegin = new Date(d1.replace(/-/g, "/"));//将-转化为/，使用new Date
        var dateEnd = new Date();//获取当前时间
        var dateDiff = (dateEnd.getTime() - dateBegin.getTime());//时间差的毫秒数
        var hours = Math.floor(dateDiff / (3600 * 1000))//计算出小时数
        //计算相差分钟数
        var leave2 = dateDiff % (3600 * 1000)    //计算小时数后剩余的毫秒数
        var minutes = Math.floor(leave2 / (60 * 1000))//计算相差分钟数
        //计算相差秒数
        var leave3 = leave2 % (60 * 1000)      //计算分钟数后剩余的毫秒数
        var seconds = Math.round(leave3 / 1000)

        return (hours > 0 ? (hours + "时") : "") + minutes + "分" + seconds + "秒"
    }


    render() {

        var dataSource = this.state.list;
        var wsdataSource = this.state.wslist;
        var { businesslist, businessvalue, bv } = this.state

        const socketcolumns = [

            {
                title: '序号',
                dataIndex: 'key',
                key: 'key',
                align: 'center',
                sorter: (a, b) => a.key - b.key,
            },
            {
                title: 'sessionId',
                dataIndex: 'sessionId',
                key: 'sessionId',
                align: 'center',


                render: (text, record) => {
                    return <Tag>{text}</Tag>
                }
            },
            {
                title: 'caseId',
                dataIndex: 'caseId',
                key: 'caseId',
                align: 'center',
                sorter: (a, b) => a.caseId - b.caseId,
            },
            {
                title: 'case名称',
                dataIndex: 'caseTitle',
                key: 'caseTitle',
                align: 'center',
                render: (text, record) => {
                    let url = `/caseManager/1/${record.caseId}/undefined/0`;
                    return <div style={{ display: 'inline-block' }}><Link target="_blank" to={url}>{text}</Link></div>;

                },
            },
            {
                title: '任务Id',
                dataIndex: 'recordId',
                key: 'recordId',
                align: 'center',
                sorter: (a, b) => a.recordId.localeCompare(b.recordId),
                render: (text, record) => {
                    if(text === 'undefined')
                        return '-'
                    return text
                }
            },
            {
                title: '任务名称',
                dataIndex: 'recordTitle',
                key: 'recordTitle',
                align: 'center',
                render: (text, record) => {

                    if (!(text === "")) {
                        let url = `/caseManager/1/${record.caseId}/${record.recordId}/3`;
                        return <div style={{ display: 'inline-block' }}><Link target="_blank" to={url}>{text}</Link></div>;
                    }
                    else {
                        return "-"
                    }
                }
            },

            {
                title: '用户',
                dataIndex: 'username',
                key: 'username',
                align: 'center',
                sorter: (a, b) => a.username.localeCompare(b.username),
            },

            {
                title: '创建时间',
                dataIndex: 'creatTime',
                key: 'creatTime',
                align: 'center',
                sorter: (a, b) => a.creatTime.localeCompare(b.creatTime),
            },
            {
                title: '连接时长',
                dataIndex: 'creatTime',
                key: 'conntTime',
                align: 'center',

                render: (text, record) => {

                    return <span>{this.timeDiff(text)}</span>;

                }
            },

            {
                title: '传输大小限制',
                dataIndex: 'sizeLimit',
                key: 'sizeLimit',
                align: 'center',
                render: (text, record) => {

                    return <span>{text}M</span>;

                }
            },

        ]

        const columns = [
            {
                title: '业务名称',
                dataIndex: 'businessname',
                key: 'businessname',
                width: '7%'
            },
            {
                title: '迭代名',
                dataIndex: 'iteratorname',
                key: 'iteratorname',
                width: '5%'
            },
            {
                title: '项目ID',
                dataIndex: 'requirementId',
                key: 'requirementId',
                align: 'center',
                width: '7%'
            },
            {
                title: '用例名',
                dataIndex: 'title',
                key: 'title',
                align: 'center',
                width: '7%'
            },
            {
                title: '创建人',
                dataIndex: 'creator',
                key: 'creator',
                width: '6%'
            },
            {
                title: '用例数',
                dataIndex: 'case_count',
                key: 'case_count',
                width: '5%',
                align: 'center'
            },
            {
                title: 'P0',
                dataIndex: 'p0',
                key: 'p0',
            },
            {
                title: 'P1',
                dataIndex: 'p1',
                key: 'p1',
            },
            {
                title: 'P2',
                dataIndex: 'p2',
                key: 'p2',
            },
            {
                title: 'P3',
                dataIndex: 'p3',
                key: 'p3',
            },
            {
                title: '开发成功数',
                dataIndex: 'rdtestSuccess',
                key: 'rdtestSuccess',
                align: 'center'
            },
            {
                title: '开发总数',
                dataIndex: 'rdtestTotal',
                key: 'rdtestTotal',
                align: 'center'
            },
            {
                title: '开发通过率',
                dataIndex: 'rdtestPassRate',
                key: 'rdtestPassRate',
                align: 'center',
                render: (text, record) => {
                    if (text < 90)
                        return <b style={{ color: 'red' }}>{text}</b>
                    else
                        return <b style={{ color: 'green' }}>{text}</b>
                }
            },
            {
                title: '冒烟成功数',
                dataIndex: 'smokeTestSuccess',
                key: 'smokeTestSuccess',
                align: 'center'
            },
            {
                title: '冒烟总数',
                dataIndex: 'smokeTestTotal',
                key: 'smokeTestTotal',
                align: 'center'
            },
            {
                title: '冒烟通过率',
                dataIndex: 'smokeTestPassRate',
                key: 'smokeTestPassRate',
                align: 'center'
            },

            {
                title: '一轮成功数',
                dataIndex: 'firstTestSuccess',
                key: 'firstTestSuccess',
                align: 'center'
            },
            {
                title: '一轮执行总数',
                dataIndex: 'firstExecTotal',
                key: 'firstExecTotal',
                align: 'center'
            },
            {
                title: '一轮总数',
                dataIndex: 'firstTestTotal',
                key: 'firstTestTotal',
                align: 'center'
            },
            
            {
                title: '一轮执行通过率',
                dataIndex: 'firstExecPassRate',
                key: 'firstExecPassRate',
                align: 'center',
                render: (text, record) => {
                    if (text < 100)
                        return <b style={{ color: 'red' }}>{text}</b>
                    else
                        return <b style={{ color: 'green' }}>{text}</b>
                }
            },

            {
                title: '一轮通过率',
                dataIndex: 'firstTestPassRate',
                key: 'firstTestPassRate',
                align: 'center',
                render: (text, record) => {
                    if (text < 100)
                        return <b style={{ color: 'red' }}>{text}</b>
                    else
                        return <b style={{ color: 'green' }}>{text}</b>
                }
            },

            {
                title: '当前成功数',
                dataIndex: 'curTestSuccess',
                key: 'curTestSuccess',
                align: 'center'
            },
            {
                title: '当前总数',
                dataIndex: 'curTestTotal',
                key: 'curTestTotal',
                align: 'center'
            },
            {
                title: '当前通过率',
                dataIndex: 'curTestPassRate',
                key: 'curTestPassRate',
                align: 'center'
            },

            {
                title: '创建时间',
                dataIndex: 'gmtCreated',
                key: 'gmtCreated',
                align: 'center',
                render: (text, record) => {
                    return (
                        <span>
                        {moment(text).format('YY-MM-DD HH:mm:ss')}
                        </span>
                    );
                },
            },
        ];

        var headers = [
            // { label: "Email", key: "email" }
        ];

        for (var i = 0; i < columns.length; i++) {
            headers.push({ label: columns[i].title, key: columns[i].key })
        }

        return (
            <section style={{ marginBottom: 30 }}>
                <Headers />
                <div style={{ padding: 24 }}>

                    &nbsp;<b>业务线:</b>&nbsp;
                    <Select
                        mode="multiple"
                        allowClear
                        onChange={this.handleChange}
                        placeholder="选择业务线"
                        value={businessvalue}
                        //  defaultValue={[]}
                        style={{ width: 400 }}
                    >
                        {businesslist}
                    </Select>
                    &nbsp;<b>迭代序号:</b>(多个迭代用英文逗号分隔)&nbsp;
                    <Input style={{ width: 200 }} onChange={this.handleItera}  ></Input>&nbsp;
                    <RangePicker
                    style={{ width: '20%' }}
                    format={'YYYY-MM-DD'}
                    placeholder={['开始时间', '结束时间']}
                    onChange={this.onDataChange}
                    />&nbsp;
                    <Button onClick={this.onSerach} type="primary">查询</Button>&nbsp;
                    <CSVLink
                        filename={"Expense_Table.csv"}
                        data={this.state.list_excel}
                        headers={headers}
                        className="btn btn-primary"
                    >
                        <Button>导出表格</Button>
                    </CSVLink>
                    {/* <Button
                style={{
                marginBottom: 20,
                }}
                onClick={() => {
                const excel = new Excel();
                excel
                    .addSheet('test')
                    .addColumns(columns)
                    .addDataSource(dataSource, {
                    str2Percent: true,
                    })
                    .saveAs('统计.xlsx');
                }}
            >
                下载表格
            </Button> */}
                    {/* &nbsp;<Button onClick={this.onChoiceKD}>默认选中</Button> */}

                    <Table style={{ marginTop: "10px" }} className="analytable" dataSource={dataSource} columns={columns} pagination={false}
                        rowClassName={(record, i) => (i % 2 === 1 ? "row-color" : "")} />
                    <Divider >Websocket实时在线 &nbsp;
                        &nbsp;<ReactHTMLTableToExcel
                            id="test-table-xls-button"
                            table="table-to-xls"
                            filename="Socket表格"
                            className="download-table-xls-button"
                            sheet="sheet1"
                            buttonText="XLS"
                        >
                        </ReactHTMLTableToExcel>


                    </Divider>


                    <Table ref="table" className="sockettable" dataSource={wsdataSource} columns={socketcolumns} pagination={false}
                        rowClassName={(record, i) => (i % 2 === 1 ? "row-color" : "")} />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Button style={{ marginTop: '5px' }} onClick={this.getSocketList}>刷新</Button>
                    </div>
                </div>


            </section>
        )
    }
}

export default Analysis