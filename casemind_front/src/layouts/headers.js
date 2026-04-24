import React from 'react'
import 'antd/dist/antd.css'
import {Layout, Icon, Menu, Row,Col,Dropdown, message, Button} from 'antd'
import getQueryString from '@/utils/getCookies'
import '../pages/landing/less/index.less'
import './headers.scss'
import request from '@/utils/axios'
import router from "umi/router";


const { Header } = Layout
const getCookies = getQueryString.getCookie

class Headers extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currentTab: '',
    }
  }
  componentDidMount() {

    //console.log("Headers componentDidMount")
    
    if (!getCookies('username')) {
      window.location.href = `/mycasemind-cms/login?jumpto=${window.location.href}`
    }

    this.setState({
      currentTab: 'caseList',
    })
    

    
  }
  // 登出
  handleDropdownClick = () => {
    localStorage.removeItem('username')
    window.location.href = `/mycasemind-cms/login?jumpto=${window.location.href}`
    // request(`/user/quit`, {
    //   method: 'POST',
    // }).then(res => {
    //   if (res && res.code === 200) {

    //     localStorage.removeItem('username')
    //     window.location.href = `/mycasemind-cms/login?jumpto=${window.location.href}`
    //   } else {
    //     message.error(res.msg)
    //   }
    // })
  }

    handleMenuClick = (event) => {
        console.log(event.key)

        switch (event.key) {
            case 'caseList':
                router.push(`/case/caseList/1`);
                break;

            default:
                break;
        }

        console.log('before currentTab: ', this.state.currentTab)
        this.setState({
          currentTab: event.key,
        })
        // this.setState({
        //     currentTab: event.key,
        // }, () => {
        //     console.log('after currentTab: ', this.state.currentTab)
        // });
    }

  render() {
    const menu = (
      <Menu className="menu" onClick={this.handleDropdownClick}>
        <Menu.Item key="logout">
          <span>
            <Icon type="logout" />
            退出登录
          </span>
        </Menu.Item>
      </Menu>
    )
    var title=`${cversion}`;
    title=title.split(' ')[1];
    return getCookies('username') ? (
      <Header style={{ zIndex: 9, background: '#3377ff' }}>

        <Row >
          <Col span={3}>
            
            <a href="/mycasemind-cms/case/caseList/1" style={{ color: '#fff', fontSize: 18 }}>
              KCase<span style={{fontSize:'8px'}}>&nbsp;{title}</span>
            </a>
          </Col>

        
          <Col span={16}  >
            
          </Col>
        <Col>
        { getCookies('username') ? (
          
          <Dropdown  overlay={menu} overlayClassName="dropStyle" placement="bottomLeft">
            <div className="user">
              <Icon type="user" className="userIcon" />
              <span className="username">{getCookies('username')}</span>
              <Icon type="down" className="dowm" />
            </div>
          </Dropdown>
        ) : (
          <a href="/mycasemind-cms/login" className="loginCss">
            登录/注册
          </a>
        )}
        </Col>

        </Row>

      </Header>
    ) : null
  }
}
export default Headers
