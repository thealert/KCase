import React, { useState, useImperativeHandle } from 'react';
import { Button, Icon, Dropdown, Menu, Input } from 'antd';
import { CustomIcon } from '../components';
import { expandToList, selectedList } from '../constants';

import './index.scss';
// 视图tab
const ViewGroup = props => {
  var searchInput = null;
  const [selectIndex, setSelectIndex] = useState(0);
  const [searchResult, setSearchResult] = useState(null);
  const [searchText, setSearchText] = useState('');
  const { minder, isLock,theme,recordId } = props;
  
  const handleExpandClick = ({ key }) => {
    minder.execCommand('ExpandToLevel', Number(key));
  };
  const makeBoxActive = () => {
    const $container = document.getElementsByClassName(
      'kityminder-core-container',
    )[0];
    const containerClass = $container.className;
    if (containerClass.indexOf('focus') < 0) {
      $container.className = containerClass + ' focus';
    }
  };
  const handleSelectClick = ({ key }) => {
    let selection = [];
    const selected = minder.getSelectedNodes();
    makeBoxActive();
    switch (key) {
      case 'all':
        minder.getRoot().traverse(node => {
          selection.push(node);
        });
        break;
      case 'revert':
        minder.getRoot().traverse(node => {
          if (selected.indexOf(node) === -1) {
            selection.push(node);
          }
        });
        break;
      case 'siblings':
        selected.forEach(node => {
          if (!node.parent) return;
          node.parent.children.forEach(function (sibling) {
            if (selection.indexOf(sibling) === -1) selection.push(sibling);
          });
        });
        break;
      case 'level':
        const selectedLevel = minder.getSelectedNodes().map(node => {
          return node.getLevel();
        });
        minder.getRoot().traverse(node => {
          if (selectedLevel.indexOf(node.getLevel()) !== -1) {
            selection.push(node);
          }
        });
        break;
      case 'path':
        selected.forEach(function (node) {
          while (node && selection.indexOf(node) === -1) {
            selection.push(node);
            node = node.parent;
          }
        });
        break;
      default:
        minder.getRoot().traverse(node => {
          selection.push(node);
        });
    }
    minder.select(selection, true);
    minder.fire('receiverfocus');
  };
  const generateMenu = list => {
    let menuItems = [];
    for (let key in list) {
      menuItems.push(<Menu.Item key={key}>{list[key]}</Menu.Item>);
    }
    return menuItems;
  };

  const doExSearch = (type) => {
    if (type === 1) {
      setSearchText('#nodepass#')
      doSearch('#nodepass#')
    } else if (type === 2) {
      setSearchText('#nodefail#')
      doSearch('#nodefail#')
    } else if (type === 3) {
      setSearchText('#nodenoexe#')
      doSearch('#nodenoexe#')
    }
  };

  useImperativeHandle(props.onRef, () => ({
    // onChild 就是暴露给父组件的方法
    setSearchFocus: () => {

      setTimeout(() => {

        searchInput.focus();

      }, 500);
    }
  }))

  const doSearch = (keyword, direction) => {
    minder.fire('hidenoterequest');
    makeBoxActive();

    keyword = keyword.toLowerCase();
    let selection = [];

    const exsearch = { '#nodefail#': [1, 2, 3, 5, 6, 7, 8,12,13,16,17], '#nodepass#': [4, 9] }
    if (keyword in exsearch) {

      minder.getRoot().traverse(node => {
        const needCompare = ['progress'];
        const tempItem = node.getData();

        for (let key in tempItem) {
          if (needCompare.indexOf(key) !== -1) {

            if (typeof tempItem[key] === 'number') {
              if (exsearch[keyword].indexOf(tempItem[key]) > -1) {
                selection.push(node);
              }
            }
          }
        }

      });
    }
    else if (keyword === '#nodenoexe#') {

      minder.getRoot().traverse(node => {
        const tempItem = node.getData();
        if ('priority' in tempItem && tempItem['priority'] > 0) {

          if (!('progress' in tempItem)) {

            selection.push(node);
          }
        }
      });
    }
    else {
      const needCompare = ['text', 'note', 'resource'];
      minder.getRoot().traverse(node => {
        const tempItem = node.getData();
        const tempContent = [];
        console.log(tempItem)
        for (let key in tempItem) {
          if (needCompare.indexOf(key) !== -1) {
            if (typeof tempItem[key] !== 'string') {
              if (tempItem[key]) {
                tempContent.push(...tempItem[key]);
              }
            } else tempContent.push(tempItem[key] + '');
          }
        }
        if (tempContent.some(item => item.toLowerCase().indexOf(keyword) > -1)) {
          selection.push(node);
        }
      });
    }
    let _index = selectIndex;
    if (direction === undefined) {
      setSearchResult(selection);
      if (keyword === searchText && (searchResult || []).length > 0) {
        _index = _index < selection.length - 1 ? _index + 1 : 0;
      } else {
        _index = 0;
      }
    } else {
      if (direction === 'prev') {
        _index = _index > 0 ? _index - 1 : selection.length - 1;
      }
      if (direction === 'next') {
        _index = _index < selection.length - 1 ? _index + 1 : 0;
      }
    }
    const node =
      selection.length > 0 ? [selection[_index]] : [minder.getRoot()];
    minder.select(node, true);
    if (!node[0].isExpanded()) minder.execCommand('expand', true);
    setSelectIndex(_index);
  };

  const expandMenu = (
    <Menu onClick={handleExpandClick}>{generateMenu(expandToList)}</Menu>
  );
  const selectedMenu = (
    <Menu onClick={handleSelectClick}>{generateMenu(selectedList)}</Menu>
  );

 

  return (
    <div className="nodes-actions" style={{ width: '100%' }}>
      <Dropdown
        disabled={isLock}
        overlay={expandMenu}
        getPopupContainer={triggerNode => triggerNode.parentNode}
      >
        <Button type="link" size="small"
          className={`big-icon ${theme == 'dark'  ? 'dark-theme-button' : ''}`}
          style={{ color: (theme=='dark'? ('#d5d5d5') :'')}}
          >
            
          <Icon type="arrows-alt" style={{ fontSize: '1.6em' }} />
          <br />
          展开 <Icon type="caret-down" />
        </Button>
      </Dropdown>
      <Dropdown
        overlay={selectedMenu}
        getPopupContainer={triggerNode => triggerNode.parentNode}
      >
        <Button type="link" size="small" className={`big-icon ${theme == 'dark'  ? 'dark-theme-button' : ''}`}
          style={{ color: (theme=='dark'? ('#d5d5d5') :'')}}>
          <CustomIcon type="selectedAll" style={{ width: 22, height: 22,...(theme === 'dark' && { fill: '#d5d5d5' }) }} />
          <br />
          全选 <Icon type="caret-down" />
        </Button>
      </Dropdown>
      <Input.Search
        ref={input => {
          searchInput = input;
        }}
        className={theme == 'dark'?'search-input-dark':''}
        placeholder="搜索"
        onSearch={value => doSearch(value)}
        style={{ width: 200, marginLeft: 8, marginRight: 8 }}
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        onFocus={() => {
          window.search = true;
        }}
        onBlur={() => {
          window.search = false;
        }}
      />
     {recordId!=="undefined"  && (<span style={{ color: (theme=='dark'? ('#d5d5d5') :'')}}>查找：</span>)}
     {recordId!=="undefined" && (<Button type="" size="small" style={{color:"white",background: "green",marginLeft:5}} onClick={() => doExSearch(1)}>通过Case</Button>)}
     {recordId!=="undefined" && (<Button type="" size="small" style={{color:"white",background: "red",marginLeft:5}} onClick={() => doExSearch(2)}>未通过Case</Button>)}
     {recordId!=="undefined" && (<Button type="" size="small" style={{color:"white",background: "grey",marginLeft:5}} onClick={() => doExSearch(3)}>未执行Case</Button>)}
     
      {searchResult && (
        <div style={{ display: 'inline-block' }}>
          <span style={{ color: (theme=='dark'? ('#d5d5d5') :'')}}>
            第{' '}
            {searchResult
              ? searchResult.length === 0
                ? 0
                : selectIndex + 1
              : 0}
            /{searchResult.length} 条
          </span>{' '}
          <Button.Group size="small">
            <Button onClick={() => doSearch(searchText, 'prev')}>
              <Icon type="up" />
            </Button>
            <Button onClick={() => doSearch(searchText, 'next')}>
              <Icon type="down" />
            </Button>
          </Button.Group>
        </div>
      )}
    </div>
  );
};
export default ViewGroup;
