import React from 'react';
import PropTypes from 'prop-types';
import { Tree, Icon, Button, Tooltip } from 'antd';
import _, { min } from 'lodash';
import { render } from "react-dom";
import { Rnd } from "react-rnd";
import { Typography,ConfigProvider } from 'antd';
import './outline.scss';
import { color } from 'd3';


const { TreeNode } = Tree;


const { Title } = Typography;

const style = {
  display: "flex",
  alignItems: "left",
  justifyContent: "left",
  background: "rgba(255,255,255,0.9)",
  zIndex: 10,
  borderRadius: 10, 
  overflow: 'hidden'
};

const style1 = {
  display: "flex",
  alignItems: "right",
  justifyContent: "right",
};

class OutlineTree extends React.Component {

  // static propTypes = {
  //   treeData: PropTypes.array.isRequired,
  // };
  constructor(props) {
    const orgChart = [
      {
        "key": 0,
        "title": 1,
        children: [{
          "key": 0,
          "title": 1,
        }]
      }
    ];
    super(props);

    this.state = {
      bgColor: "rgba(255,255,255,0.9)",
      color: "rgba(0, 0, 0, .65)",
      border: "solid 1px #ddd",
      treeData: [],
      expandedKeys: [],
      RndY: 0,
      RndX: 0,
      width: 300,
      height: '75%',
      autoExpandParent:true,
      isComplete:false,
      runCount:0,
      theme:'',
      isTablet: this.detectTablet(),
     // timerId:-1,
    }

    //this.state.timerId=setInterval(this.timerMethod, 500); 
    // setTimeout(() => {

    //   this.props.doOutline();
      
    // }, 800);
  }

  var  = 0;    
  // timerMethod =()=>{
     
  //   this.props.doOutline();
  //   this.setState({runCount:this.state.runCount+1})
  //   if(this.state.runCount >= 3) clearInterval(this.state.timerId);
  // }

  // 检测是否为平板设备
  detectTablet = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
     
    return isTablet ;
  }


  onSelect = (selectedKeys, info) => {

    this.setState({
       
      autoExpandParent: true
    });
    const { minder } = this.props
    console.log('selected', selectedKeys, info);
    //console.log(selectedKeys)

    if (selectedKeys.length > 0) {
      this.setState({
        expandedKeys: selectedKeys
      });
    }


    if (info.selectedNodes.length === 0)
      return
    console.log(info.selectedNodes[0].props);


    const $container = document.getElementsByClassName(
      'kityminder-core-container',
    )[0];
    const containerClass = $container.className;
    if (containerClass.indexOf('focus') < 0) {
      $container.className = containerClass + ' focus';
    }


    //this.setState({expandedKeys:['0-0-0']});

    minder.getRoot().traverse(node => {
      const tempItem = node.getData();
      if (info.selectedNodes[0].props.id === tempItem.id) {
        console.log(tempItem.id)
        minder.select([node], true);
        minder.execCommand('camera', node);
        if (!node.isExpanded()) minder.execCommand('expand', true);
        return
      }

    });
  };
  onExpand = expandedKeys => {
    console.log(expandedKeys)
    this.setState({
       
      expandedKeys: expandedKeys
    });

    this.setState({
       
      autoExpandParent: false
    });
    
  };


  deepTraversa = (node, nodeList = []) => {
    if (node !== null) {
      nodeList.push(node.key + '')
      let children = node.children
      for (let i = 0; i < children.length; i++) {
        this.deepTraversa(children[i], nodeList)
      }
    }
    return nodeList
  }

  //展开全部
  onExpandAll = () => {
    const { treeData } = this.props;
    const expandedKeys = [];
    treeData.forEach(item => {
      expandedKeys.push(this.deepTraversa(item))
    })
    this.setState({
      expandedKeys: expandedKeys.flat()
    });
  }

  getHeight() {
    var h = (document.body.clientHeight * 0.75 - 200) + "px"
    return h;
  }

  componentDidMount() {


    this.setState({ treeData: this.props.treeData })
     
  }
  waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
  }

  

  componentWillReceiveProps(nextProps) {
    // if (!_.isEqual(nextProps.treeData, this.props.treeData)) {
    if (!_.isEqual(nextProps.treeData, this.props.treeData) || (this.state.expandedKeys.length == 0 && nextProps.treeData.length > 0)) {
      this.setState({ treeData: nextProps.treeData })
      console.log(this.props.treeData)
      console.log(this.props.minder.getRoot().data.id)
      if (this.state.expandedKeys.length == 0) {
        this.setState({
          expandedKeys: [this.props.minder.getRoot().data.id]
        });
      }

      this.waitForElm('.ant-tabs-tabpane-active').then((elm) => {
        var tabpane=document.getElementsByClassName('ant-tabs-tabpane-active')
        if(tabpane && tabpane.length>0){
          this.setState({
            RndY: tabpane[0].offsetHeight + 50,
          });
        
      }

      const { minder } = this.props
      if(minder){
        //console.log(minder.getTheme())
        if(minder.getTheme()=='fresh-black'){
          this.setTheme('dark');
        }
        else{
          this.setTheme('default');
        }
      }

      minder.on('themechange', (e)=>{
        const { minder } = this.props
       
        
        if(minder){
          //console.log(minder.getTheme())
          if(e.theme=='fresh-black'){
            this.setTheme('dark',true,e.theme);
          }
          else{
            this.setTheme('default',true,e.theme);
          }
          this.render()
        }
  
      }
      );
      
      this.setState({isComplete:true})
      
      });
     
    }
  }

  setTheme(theme,force=false,themeVal){
    const { minder } = this.props
    
    var sectionDom=document.getElementById("sectionDom")
    var caseContentDiv=document.getElementById("caseContentDiv")
    var recordHeadRow=document.getElementById("recordHeadRow")
    var lastTheme=minder.getTheme();

    if(force){
      localStorage.setItem('minderTheme',themeVal)
    }
    else{
      if(localStorage.getItem("minderTheme")){
        if(lastTheme!=localStorage.getItem("minderTheme")){
          var stortTheme=localStorage.getItem("minderTheme")
          minder.execCommand('Theme', localStorage.getItem("minderTheme"));
          minder.fire('contentchange');
          if(stortTheme=='fresh-black'){
            theme='dark';
          }
          else{
            theme='default';
          }
        }
      }
    }

    this.state.theme=theme;
    
    if((localStorage.getItem("minderTheme") && localStorage.getItem("minderTheme") == "fresh-black" )|| theme=='dark'){
      
      this.setState({bgColor:'rgba(45,45,45,0.7)',color:"#d5d5d5",border:"solid 1px grey"})
      this.props.setTheme('dark');
      if(sectionDom)
        sectionDom.style.backgroundColor='#2d2d2d';
      if(caseContentDiv)
        caseContentDiv.style.backgroundColor='#2d2d2d';
      if(recordHeadRow){
        recordHeadRow.style.backgroundColor='#2d2d2d';
        recordHeadRow.style.color='white';
      }
    }
    else{
      if(minder.getTheme()=='fresh-forest'){
        this.setState({bgColor:'rgba(253, 246, 223, .7)',color:'rgba(0, 0, 0, .65)',border:"solid 1px #ddd"})
      }
      else{
        this.setState({bgColor:'rgba(255,255,255,0.7)',color:'rgba(0, 0, 0, .65)',border:"solid 1px #ddd"})
      }
      
      this.props.setTheme('default');
      if(sectionDom)
        sectionDom.style.backgroundColor='';
      if(caseContentDiv)
        caseContentDiv.style.backgroundColor='white';
      if(recordHeadRow){
        recordHeadRow.style.backgroundColor='white';
        recordHeadRow.style.color='';
      }
    }

    

  }

  reRender(){
    const { minder } = this.props
      if(minder){
        //console.log(minder.getTheme())
        if(minder.getTheme()=='fresh-black'){
          this.setTheme('dark');
          
        }
        else{
          this.setTheme('default');
        }
        this.render()
      }

      
  }

  render() {

    const theme = {
      token: {
          colorPrimary: 'red', // 设置按钮的主色调为红色
          colorPrimaryHover: 'darkred', // 设置按钮悬停时的颜色
      },
    };

    var isShow=this.props.isShow
    
    var {isComplete,bgColor,color,border}=this.state;

    style.backgroundColor=bgColor;
    style.color=color;
    style.border=border

    const renderTreeNodes = (data) => {

      return data.map((item) => ({
        title: <span style={{color:color}}>{item.title}</span>,
        key: item.key,
        id: item.id,
        children: item.children ? renderTreeNodes(item.children) : null,
      }));
    };
    //alert(isShow)
   
    return isShow && isComplete &&   
      <Rnd
      style={style}
      position={{ x: this.state.RndX+4, y: this.state.RndY }}
      onDragStop={(e, d) => { this.setState({ RndX: d.x, RndY: d.y }) }}
      onResize={(e, direction, ref, delta, position) => {
        this.setState({
          width: ref.offsetWidth>300?ref.offsetWidth:300,
          height: ref.offsetHeight>(document.body.clientHeight * 0.75 - 150)?ref.offsetHeight:document.body.clientHeight * 0.75 - 150,
          ...position,
        });
      }}
      size={{ width: this.state.width, height: this.state.height }}
      dragHandleClassName={this.state.isTablet ? "outline-drag-handle" : undefined}
    >

      <div style={{ height: "300px",color:color}}>
        <div className={this.state.isTablet ? "outline-drag-handle" : ""} style={{ padding: "5px 10px", cursor: this.state.isTablet ? "move" : "default" }}>
          <span style={{ fontSize: "15px" }}><b>大纲视图</b>
            <span style={{ fontSize: "10px" }}>&nbsp;&nbsp;(三层级,支持拖拽)</span>
          </span>
          <Button size="small" icon="close" onClick={this.props.showHidleOutline}
            style={{ marginTop: "0px",marginLeft: "55px", color: color,backgroundColor: bgColor}}>关闭</Button>
        </div>

        {/* <Button size="small" icon="reload" onClick={()=>{this.props.doOutline()}}
          style={{ marginTop: "5px",marginLeft: "5px", backgroundColor: "rgba(255,255,255,0.9)"}}>刷新</Button> */}
        <div style={{ overflow: 'auto', height: this.getHeight(), width: "300px" }}>
          <Tree
          
            //treeData={this.state.treeData}
            treeData={renderTreeNodes(this.state.treeData)}
            onSelect={this.onSelect}
            className={this.state.theme=='dark'?'custom-tree-node':''}
            //showLine
            // height={100}
            switcherIcon={<Icon type="down" style={{ color: color }}/>}
            autoExpandParent={this.state.autoExpandParent}
            defaultExpandAll
            onExpand={this.onExpand}
            expandedKeys={this.state.expandedKeys}
            
          />

        </div>

      </div>
     

    </Rnd>
    


  }
}
export default OutlineTree;