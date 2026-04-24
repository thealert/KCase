import React, { useState, useImperativeHandle, forwardRef ,useEffect} from 'react';
import { CustomIcon } from '../components';
import { zoom } from '../constants';
import { Icon } from 'antd';
import { fill } from 'lodash';

// 左下角放大缩小工具栏
const NavBar = (props, ref) => {
  const { minder,theme } = props;
  const [zoomValue, setZoomValue] = useState(100);
  const [showMini, setShowMini] = useState(true);
  const  [navClassName,setNavClassName]= useState("nav-previewer df");
  if (minder !== null) {
    minder.setDefaultOptions({ zoom });
  }
  const iconStyle = {
    width: 24,
    height: 24,
  };

  const iconDarkStyle = {
    width: 24,
    height: 24,
    fill:'white'
  };

  const handleClick = (key) => {
    minder.execCommand(key);
  };
  const handleCameraClick = () => {
    minder.execCommand('camera', minder.getRoot(), 600);
  };
  if (minder) {
    minder.on('zoom', () => {
      setZoomValue(minder.queryCommandValue('zoom'));
    });
  }

  // useEffect(() => {
  //   if (props.minder) {
  //     // 画布，渲染缩略图
  //     const paper = new kity.Paper(document.getElementsByClassName('nav-previewer')[0]);
  //     //  // 用两个路径来挥之节点和连线的缩略图
  //     const nodeThumb = paper.put(new kity.Path());
  //     const connectionThumb = paper.put(new kity.Path());

  //     //  // 表示可视区域的矩形
  //     const visibleRect = paper.put(new kity.Rect(100, 100).stroke('red', '1%'));
  //     let contentView = new kity.Box();
  //     let visibleView = new kity.Box();

  //     let pathHandler = getPathHandler(props.minder.getTheme());

  //     // 主题切换事件
  //     props.minder.on('themechange', (e) => {
  //       pathHandler = getPathHandler(e.theme);
  //     });

  //     function moveView(center, duration) {
  //       var box = visibleView;
  //       center.x = -center.x;
  //       center.y = -center.y;

  //       var viewMatrix = props.minder.getPaper().getViewPortMatrix();
  //       box = viewMatrix.transformBox(box);

  //       var targetPosition = center.offset(box.width / 2, box.height / 2);

  //       props.minder.getViewDragger().moveTo(targetPosition, duration);
  //   }


  //     function getPathHandler(theme) {
  //       switch (theme) {
  //         case 'tianpan':
  //         case 'tianpan-compact':
  //           return function (nodePathData, x, y, width, height) {
  //             const r = width >> 1;
  //             nodePathData.push('M', x, y + r, 'a', r, r, 0, 1, 1, 0, 0.01, 'z');
  //           };
  //         default: {
  //           return function (nodePathData, x, y, width, height) {
  //             nodePathData.push('M', x, y, 'h', width, 'v', height, 'h', -width, 'z');
  //           };
  //         }
  //       }
  //     }

  //     function bind() {
  //       props.minder.on('layout layoutallfinish', updateContentView);
  //       props.minder.on('viewchange', updateVisibleView);
  //     }

  //     bind();

  //     var dragging = false;

  //     paper.on('mousedown', function(e) {
  //         dragging = true;
  //         moveView(e.getPosition('top'), 200);
  //         setNavClassName("nav-previewer grab")
  //         //document.getElementsByClassName('nav-previewer')[0].className+='grab';
  //     });

  //     paper.on('mousemove', function(e) {
  //         if (dragging) {
  //             moveView(e.getPosition('top'));
  //         }
  //     });

  //     window.addEventListener("mouseup", function() {
  //       dragging= false;
  //       setNavClassName("nav-previewer df")
  //       //document.getElementsByClassName('nav-previewer').removeClass('grab');
  //     });

  //     function updateContentView() {
  //       const view = props.minder.getRenderContainer().getBoundaryBox();
  //       contentView = view;
  //       const padding = 30;

  //       paper.setViewBox(
  //         view.x - padding - 0.5,
  //         view.y - padding - 0.5,
  //         view.width + padding * 2 + 1,
  //         view.height + padding * 2 + 1
  //       );

  //       const nodePathData = [];
  //       const connectionThumbData = [];

  //       props.minder.getRoot().traverse(function (node) {
  //         const box = node.getLayoutBox();
  //         pathHandler(nodePathData, box.x, box.y, box.width, box.height);
  //         if (node.getConnection() && node.parent && node.parent.isExpanded()) {
  //           connectionThumbData.push(node.getConnection().getPathData());
  //         }
  //       });

  //       paper.setStyle('background', props.minder.getStyle('background'));

  //       if (nodePathData.length) {
  //         nodeThumb.fill(props.minder.getStyle('root-background')).setPathData(nodePathData);
  //       } else {
  //         nodeThumb.setPathData(null);
  //       }

  //       if (connectionThumbData.length) {
  //         connectionThumb
  //           .stroke(props.minder.getStyle('connect-color'), '0.5%')
  //           .setPathData(connectionThumbData);
  //       } else {
  //         connectionThumb.setPathData(null);
  //       }

  //       updateVisibleView();
  //     }

  //     updateContentView();

  //     function updateVisibleView() {
  //       visibleView = props.minder.getViewDragger().getView();
  //       visibleRect.setBox(visibleView.intersect(contentView));
  //     }
  //     updateVisibleView();
  //   }
  // }, [props]);

  useImperativeHandle(ref, () => ({
    // 暴露给父组件的方法
    handleClick,
  }));


  return (
    <div className="nav-bar" style={{background:theme=='dark'?'#303030':''}}>
      <a onClick={() => handleClick('ZoomIn')} title="放大">
        <CustomIcon type="zoomIn" style={theme=='dark'?iconDarkStyle:iconStyle} />
      </a>
      <span className="zoom-text" style={{color:theme=='dark'?'white':''}}>{zoomValue}%</span>
      <a onClick={() => handleClick('ZoomOut')} title="缩小">
        <CustomIcon type="zoomOut" style={theme=='dark'?iconDarkStyle:iconStyle} />
      </a>
      <a style={{ marginLeft: 8 }} onClick={handleCameraClick} title="定位根节点">
        <CustomIcon type="target" style={theme=='dark'?iconDarkStyle:iconStyle} />
      </a>
      {/* <a
        style={{ marginLeft: 8 }}
        onClick={() => {
          setShowMini(!showMini);
        }}
        title="展示/隐藏缩略图"
      >
        <Icon type="eye" style={{ fontSize: 24, color: 'rgba(0, 0, 0, 0.85)' }} />
      </a>
      <div className={navClassName} style={{ visibility: showMini ? 'visible' : 'hidden' }}></div> */}
    </div>
  );
};

export default forwardRef(NavBar);
