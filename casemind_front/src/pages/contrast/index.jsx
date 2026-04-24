/** 历史版本对比 */
import React from 'react'
import Link from 'umi/link';
import { Table, Button, Card, Tooltip ,Pagination,Tag} from 'antd'
import moment from 'moment'
import './index.scss'
import Headers from '../../layouts/headers'
import request from '@/utils/axios'
import {useEffect, useState} from 'react';

moment.locale('zh-cn')

class Contrast extends React.Component {


  constructor(props) {
    super(props)
    this.state = {
      rowKeys: [], // 当前选择行的 key
      rows: [], // 当前选择的行数据
      historyList: [],
      pageNum:1,
      pageSize:10,
      total:0
    }

     
  }
  componentDidMount() {
    this.getHistoryList()
  }
  getHistoryList = () => {
     
    request(`/backup/getBackupByCaseId`, {
      method: 'GET',
      params: {
        caseId: this.props.match.params.caseId,
        pageNum: this.state.pageNum,
        pageSize: this.state.pageSize,
      },
    }).then(res => {
      if (res.code === 200) {
        this.setState({ historyList: res.data.caseList , total: res.data.totalCount})
      }
    })
  }
  contrastClick = () => {
    const { rows } = this.state
    this.props.history.push(`/caseManager/historyContrast/${rows[0].id}/${rows[1].id}`)
  }
  setTableColums = () => {
    const columns = [
      {
        title: '备份ID',
        dataIndex: 'id',
      },
      {
        title: '备份详情',
        dataIndex: 'caseId',
        render: (text, record) => {
          let url = `/caseManager/1/${record.caseId}/undefined/0/${record.id}`;
          return <div style={{ display: 'inline-block' }}><Link target="_blank"  to={url}>查看</Link></div>;
         
        }
      },
      {
        title: '版本',
        dataIndex: 'version',
        render: (text, record) =>{
          return <Tag color="blue">{record.version}</Tag>
        }
      },
      {
        title: '创建时间',
        dataIndex: 'gmtCreated',
        render: text => {
          return <span>{moment(text).format('YYYY-MM-DD HH:mm:ss')}</span>
        },
      },
      {
        title: '创建人',
        dataIndex: 'creator',
      },
      {
        title: '附加信息',
        dataIndex: 'extra',
      },
    ]
    return columns
  }
  onChangePagination = (current,ps) => {
     
    //
    this.setState({pageSize:ps,pageNum:current}, () => {
      this.getHistoryList()
    } );
  }

  render() {

    const {
      pageNum,
      pageSize,
      total
    } = this.state;

    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({ rowKeys: selectedRowKeys, rows: selectedRows })
      },
      getCheckboxProps: record => ({
        disabled: this.state.rowKeys.length >= 2 && !this.state.rowKeys.includes(record.id),
        name: record.name,
      }),
    }
    return (
      <section style={{ marginBottom: 30 }}>
        <Headers />
        <Card
         // bordered={false}
         // bordered={false}
          className={this.state.rowKeys.length >= 2 ? 'contras_card' : 'contras_card_default'}
        >
          <div className="contras_title">
            {/* <span>历史版本</span> */}
            <Tooltip
              placement="top"
              title={this.state.rowKeys.length < 2 ? '选择两个版本后，才可以对比哦～' : null}
            >
              <Button
                type="primary"
                disabled={this.state.rowKeys.length < 2}
                onClick={this.contrastClick}
              >
                对比已选择版本
              </Button>
            </Tooltip>
            <a target="_blank" href={`/mycasemind-cms/caseManager/1/${this.props.match.params.caseId}/undefined/0`}>查看当前用例</a>
          </div>
          <Table
            rowKey="id"
            rowSelection={rowSelection}
            columns={this.setTableColums()}
            dataSource={this.state.historyList}
            pagination={false}
          />
          <br/>
          <div
                  className="pagination"
                  style={{
                    display: total === 0 ? 'none' : 'block',
                    float: 'right',
                  }}
                >
          <Pagination
                    onChange={this.onChangePagination}
                    current={pageNum}
                    total={Number(total)}
                    pageSizeOptions={['2','10', '15', '20', '25', '30']}
                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} `}
                    showSizeChanger={true}
                    onShowSizeChange={(current,ps) => {
                         
                        
                        this.onChangePagination(current,ps)
                    }}
                  />
            </div>

        </Card>
      </section>
    )
  }
}
export default Contrast
