/*!
 * ====================================================
 * Kity Minder Core - v1.4.49 - 2018-04-02
 * https://github.com/fex-team/kityminder-core
 * GitHub: https://github.com/fex-team/kityminder-core.git
 * Copyright (c) 2018 Baidu FEX; Licensed BSD-3-Clause
 * ====================================================
 */
//const uuid_short = require('short-uuid');
const getEnvUrlbyKey = require('../../../../utils/envurls').getEnvUrlbyKey
const getWebCookie = require('../../../../utils/getCookies').getCookie

const React = require('react');
const ReactDOM = require('react-dom');
const {message, Tooltip} = require('antd');
const d3 = require('d3');

const ShortUniqueId = require('short-unique-id')
const shortuid = new ShortUniqueId({ length: 10 })


const { nanoid } = require('nanoid');

; (function () {
  var _p = {
    r: function (index) {
      if (_p[index].inited) {
        return _p[index].value
      }
      if (typeof _p[index].value === 'function') {
        let module = {
          exports: {},
        },
          returnValue = _p[index].value(null, module.exports, module)
        _p[index].inited = true
        _p[index].value = returnValue
        if (returnValue !== undefined) {
          return returnValue
        } else {
          for (let key in module.exports) {
            if (module.exports.hasOwnProperty(key)) {
              _p[index].inited = true
              _p[index].value = module.exports
              return module.exports
            }
          }
        }
      } else {
        _p[index].inited = true
        return _p[index].value
      }
    },
  }

  //src/connect/arc.js
  /**
   * @fileOverview
   *
   * 圆弧连线
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[0] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let connect = _p.r(11)
      let connectMarker = new kity.Marker().pipe(function () {
        let r = 7
        let dot = new kity.Circle(r - 1)
        this.addShape(dot)
        this.setRef(r - 1, 0)
          .setViewBox(-r, -r, r + r, r + r)
          .setWidth(r)
          .setHeight(r)
        this.dot = dot
        this.node.setAttribute('markerUnits', 'userSpaceOnUse')
      })
      connect.register('arc', function (node, parent, connection, width, color) {
          
        let box = node.getLayoutBox(),
          pBox = parent.getLayoutBox()
        let start, end, vector
        let abs = Math.abs
        let pathData = []
        let side = box.x > pBox.x ? 'right' : 'left'
        node
          .getMinder()
          .getPaper()
          .addResource(connectMarker)
        start = new kity.Point(pBox.cx, pBox.cy)
        end =
          side == 'left'
            ? new kity.Point(box.right + 2, box.cy)
            : new kity.Point(box.left - 2, box.cy)
        vector = kity.Vector.fromPoints(start, end)
        pathData.push('M', start)
        pathData.push('A', abs(vector.x), abs(vector.y), 0, 0, vector.x * vector.y > 0 ? 0 : 1, end)
        connection.setMarker(connectMarker)
        connectMarker.dot.fill(color)
        connection.setPathData(pathData)
      })
    },
  }

  //src/connect/arc_tp.js
  /**
   *
   * 圆弧连线
   *
   * @author: along
   * @copyright: bpd729@163.com , 2015
   */
  _p[1] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let connect = _p.r(11)
      let connectMarker = new kity.Marker().pipe(function () {
        let r = 7
        let dot = new kity.Circle(r - 1)
        this.addShape(dot)
        this.setRef(r - 1, 0)
          .setViewBox(-r, -r, r + r, r + r)
          .setWidth(r)
          .setHeight(r)
        this.dot = dot
        this.node.setAttribute('markerUnits', 'userSpaceOnUse')
      })
      /**
       * 天盘图连线除了连接当前节点和前一个节点外, 还需要渲染当前节点和后一个节点的连接, 防止样式上的断线
       * 这是天盘图与其余的模板不同的地方
       */
      connect.register('arc_tp', function (node, parent, connection, width, color) {

        let end_box = node.getLayoutBox(),
          start_box = parent.getLayoutBox()
        let index = node.getIndex()
        let nextNode = parent.getChildren()[index + 1]
        if (node.getIndex() > 0) {
          start_box = parent.getChildren()[index - 1].getLayoutBox()
        }
        let start, end, vector
        let abs = Math.abs
        let pathData = []
        let side = end_box.x > start_box.x ? 'right' : 'left'
        node
          .getMinder()
          .getPaper()
          .addResource(connectMarker)
        start = new kity.Point(start_box.cx, start_box.cy)
        end = new kity.Point(end_box.cx, end_box.cy)
        let jl = Math.sqrt(Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2))
        //两圆中心点距离
        jl = node.getIndex() == 0 ? jl * 0.4 : jl
        vector = kity.Vector.fromPoints(start, end)
        pathData.push('M', start)
        pathData.push('A', jl, jl, 0, 0, 1, end)
        connection.setMarker(connectMarker)
        connectMarker.dot.fill(color)
        connection.setPathData(pathData)
        // 设置下一个的节点的连接线
        if (nextNode && nextNode.getConnection()) {
          let nextConnection = nextNode.getConnection()
          let next_end_box = nextNode.getLayoutBox()
          let next_end = new kity.Point(next_end_box.cx, next_end_box.cy)
          let jl2 = Math.sqrt(Math.pow(end.x - next_end.x, 2) + Math.pow(end.y - next_end.y, 2))
          //两圆中心点距离
          pathData = []
          pathData.push('M', end)
          pathData.push('A', jl2, jl2, 0, 0, 1, next_end)
          nextConnection.setMarker(connectMarker)
          connectMarker.dot.fill(color)
          nextConnection.setPathData(pathData)
        }
      })
    },
  }

  //src/connect/bezier.js
  /**
   * @fileOverview
   *
   * 提供折线相连的方法
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[2] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let connect = _p.r(11)
      connect.register('bezier', function (node, parent, connection) {

        // 连线起点和终点
        let po = parent.getLayoutVertexOut(),
          pi = node.getLayoutVertexIn()
        // 连线矢量和方向
        let v = parent.getLayoutVectorOut().normalize()
        let r = Math.round
        let abs = Math.abs
        let pathData = []
        //console.log(po.y,pi.y)
        pathData.push('M', (po.x), (po.y))


        if (abs(v.x) > abs(v.y)) {
          // x - direction
          // let hx = (pi.x + po.x) / 2
          // pathData.push('C', hx, po.y, hx, pi.y, pi.x, pi.y)

          // let hx = (pi.x + po.x) / 2;
          // let offset = abs(pi.x - po.x) / 4; // 增加控制点的偏移量
          // pathData.push('C', hx + offset, po.y, hx - offset, pi.y, pi.x, pi.y);

          // x - direction
          let hx1 = (po.x + pi.x) / 2;
          let hy1 = po.y;
          let hx2 = hx1;
          let hy2 = pi.y;

          var controlPoints = [
            { x: po.x, y: po.y },
            { x: hx1, y: hy1 },
            { x: hx2, y: hy2 },
            { x: pi.x, y: pi.y }
          ];
          if (abs(po.y - pi.y) < 1) {
            controlPoints = [
              { x: po.x, y: pi.y },
              { x: pi.x, y: pi.y }
            ]
          }

          let lineGenerator = d3.line()
            .curve(d3.curveBasis)
            .x(d => d.x)
            .y(d => d.y);

          let pathString = lineGenerator(controlPoints);
          pathData.push(pathString);

        } else {
          // y - direction
          // let hy = (pi.y + po.y) / 2
          // pathData.push('C', po.x, hy, pi.x, hy, pi.x, pi.y)

          // let hy = (pi.y + po.y) / 2;
          // let offset = abs(pi.y - po.y) / 4; // 增加控制点的偏移量
          // pathData.push('C', po.x, hy + offset, pi.x, hy - offset, pi.x, pi.y);

          // y - direction
          let hx1 = po.x;
          let hy1 = (po.y + pi.y) / 2;
          let hx2 = pi.x;
          let hy2 = hy1;

          let controlPoints = [
            { x: po.x, y: po.y },
            { x: hx1, y: hy1 },
            { x: hx2, y: hy2 },
            { x: pi.x, y: pi.y }
          ];

          let lineGenerator = d3.line()
            .curve(d3.curveBasis)
            .x(d => d.x)
            .y(d => d.y);

          let pathString = lineGenerator(controlPoints);
          pathData.push(pathString);

        }
        connection.setMarker(null)
        connection.setPathData(pathData)
      })
    },
  }

  //src/connect/fish-bone-master.js
  /**
   * @fileOverview
   *
   * 鱼骨头主干连线
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[3] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let connect = _p.r(11)
      connect.register('fish-bone-master', function (node, parent, connection) {
        let pout = parent.getLayoutVertexOut(),
          pin = node.getLayoutVertexIn()
        let abs = Math.abs
        let dy = abs(pout.y - pin.y),
          dx = abs(pout.x - pin.x)
        let pathData = []
        pathData.push('M', pout.x, pout.y)
        pathData.push('h', dx - dy)
        pathData.push('L', pin.x, pin.y)
        connection.setMarker(null)
        connection.setPathData(pathData)
      })
    },
  }

  //src/connect/l.js
  /**
   * @fileOverview
   *
   * "L" 连线
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[4] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let connect = _p.r(11)
      connect.register('l', function (node, parent, connection) {
        let po = parent.getLayoutVertexOut()
        let pi = node.getLayoutVertexIn()
        let vo = parent.getLayoutVectorOut()
        let pathData = []
        let r = Math.round,
          abs = Math.abs
        pathData.push('M', po.round())
        if (abs(vo.x) > abs(vo.y)) {
          pathData.push('H', r(pi.x))
        } else {
          pathData.push('V', pi.y)
        }
        pathData.push('L', pi)
        connection.setPathData(pathData)
      })
    },
  }

  //src/connect/poly.js
  /**
   * @fileOverview
   *
   * 提供折线相连的方法
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[5] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let connect = _p.r(11)
      connect.register('poly', function (node, parent, connection, width) {
        // 连线起点和终点
        let po = parent.getLayoutVertexOut(),
          pi = node.getLayoutVertexIn()
        // 连线矢量和方向
        let v = parent.getLayoutVectorOut().normalize()
        let r = Math.round
        let abs = Math.abs
        let pathData = []
        pathData.push('M', r(po.x), r(po.y))
        switch (true) {
          case abs(v.x) > abs(v.y) && v.x < 0:
            // left
            pathData.push('h', -parent.getStyle('margin-left'))
            pathData.push('v', pi.y - po.y)
            pathData.push('H', pi.x)
            break

          case abs(v.x) > abs(v.y) && v.x >= 0:
            // right
            pathData.push('h', parent.getStyle('margin-right'))
            pathData.push('v', pi.y - po.y)
            pathData.push('H', pi.x)
            break

          case abs(v.x) <= abs(v.y) && v.y < 0:
            // top
            pathData.push('v', -parent.getStyle('margin-top'))
            pathData.push('h', pi.x - po.x)
            pathData.push('V', pi.y)
            break

          case abs(v.x) <= abs(v.y) && v.y >= 0:
            // bottom
            pathData.push('v', parent.getStyle('margin-bottom'))
            pathData.push('h', pi.x - po.x)
            pathData.push('V', pi.y)
            break
        }
        connection.setMarker(null)
        connection.setPathData(pathData)
      })
    },
  }

  //src/connect/under.js
  /**
   * @fileOverview
   *
   * 下划线连线
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[6] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let connect = _p.r(11)
      connect.register('under', function (node, parent, connection, width, color) {

        // 连线起点和终点
        let po = parent.getLayoutVertexOut(),
          pi = node.getLayoutVertexIn()
        // 连线矢量和方向
        let v = parent.getLayoutVectorOut().normalize()
        let r = Math.round
        let abs = Math.abs
        let pathData = []

        pathData.push('M', (po.x), (po.y))


        if (abs(v.x) > abs(v.y)) {

          // x - direction
          let hx1 = (po.x + pi.x) / 2;
          let hy1 = po.y;
          let hx2 = hx1;
          let hy2 = pi.y;

          let controlPoints = [
            { x: po.x, y: po.y },
            { x: hx1, y: hy1 },
            { x: hx2, y: hy2 },
            { x: pi.x, y: pi.y }
          ];

          if (abs(po.y - pi.y) < 1) {
            controlPoints = [
              { x: po.x, y: pi.y },
              { x: pi.x, y: pi.y }
            ]
          }

          let lineGenerator = d3.line()
            .curve(d3.curveBasis)
            .x(d => d.x)
            .y(d => d.y);

          let pathString = lineGenerator(controlPoints);
          pathData.push(pathString);

        } else {

          // y - direction
          let hx1 = po.x;
          let hy1 = (po.y + pi.y) / 2;
          let hx2 = pi.x;
          let hy2 = hy1;

          let controlPoints = [
            { x: po.x, y: po.y },
            { x: hx1, y: hy1 },
            { x: hx2, y: hy2 },
            { x: pi.x, y: pi.y }
          ];

          let lineGenerator = d3.line()
            .curve(d3.curveBasis)
            .x(d => d.x)
            .y(d => d.y);

          let pathString = lineGenerator(controlPoints);
          pathData.push(pathString);

        }
        connection.setMarker(null)
        connection.setPathData(pathData)


        // let box = node.getLayoutBox(),
        //   pBox = parent.getLayoutBox()
        // let start, end, vector
        // let abs = Math.abs
        // let pathData = []
        // let side = box.x > pBox.x ? 'right' : 'left'
        // let radius = node.getStyle('connect-radius')
        // let underY = box.bottom + 3
        // let startY = parent.getType() == 'sub' ? pBox.bottom + 3 : pBox.cy
        // let p1, p2, p3, mx
        // if (side == 'right') {
        //   p1 = new kity.Point(pBox.right, startY)
        //   p2 = new kity.Point(box.left - 10, underY)
        //   p3 = new kity.Point(box.right, underY)
        // } else {
        //   p1 = new kity.Point(pBox.left, startY)
        //   p2 = new kity.Point(box.right + 10, underY)
        //   p3 = new kity.Point(box.left, underY)
        // }
        // mx = (p1.x + p2.x) / 2
        // pathData.push('M', p1)
        // pathData.push('C', mx, p1.y, mx, p2.y, p2)
        // pathData.push('L', p3)
        // connection.setMarker(null)
        // connection.setPathData(pathData)
      })
    },
  }

  //src/core/_boxv.js
  /**
   * @fileOverview
   *
   * 调试工具：为 kity.Box 提供一个可视化的渲染
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[7] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let Minder = _p.r(19)
      if (location.href.indexOf('boxv') != -1) {
        let vrect
        Object.defineProperty(kity.Box.prototype, 'visualization', {
          get: function () {
            if (!vrect) return null
            return vrect.setBox(this)
          },
        })
        Minder.registerInitHook(function () {
          this.on('paperrender', function () {
            vrect = new kity.Rect()
            vrect.fill('rgba(200, 200, 200, .5)')
            vrect.stroke('orange')
            this.getRenderContainer().addShape(vrect)
          })
        })
      }
    },
  }

  //src/core/animate.js
  /**
   * @fileOverview
   *
   * 动画控制
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[8] = {
    value: function (require, exports, module) {
      let Minder = _p.r(19)
      let animateDefaultOptions = {
        enableAnimation: true,
        layoutAnimationDuration: 300,
        viewAnimationDuration: 100,
        zoomAnimationDuration: 300,
      }
      let resoredAnimationOptions = {}
      Minder.registerInitHook(function () {
        this.setDefaultOptions(animateDefaultOptions)
        if (!this.getOption('enableAnimation')) {
          this.disableAnimation()
        }
      })
      Minder.prototype.enableAnimation = function () {
        for (let name in animateDefaultOptions) {
          if (animateDefaultOptions.hasOwnProperty(name)) {
            this.setOption(resoredAnimationOptions[name])
          }
        }
      }
      Minder.prototype.disableAnimation = function () {
        for (let name in animateDefaultOptions) {
          if (animateDefaultOptions.hasOwnProperty(name)) {
            resoredAnimationOptions[name] = this.getOption(name)
            this.setOption(name, 0)
          }
        }
      }
    },
  }

  //src/core/command.js
  _p[9] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let MinderEvent = _p.r(13)
      let COMMAND_STATE_NORMAL = 0
      let COMMAND_STATE_DISABLED = -1
      let COMMAND_STATE_ACTIVED = 1
      /**
       * 表示一个命令，包含命令的查询及执行
       */
      let Command = kity.createClass('Command', {
        constructor: function () {
          this._isContentChange = true
          this._isSelectionChange = false
        },
        execute: function (minder, args) {
          throw new Error('Not Implement: Command.execute()')
        },
        setContentChanged: function (val) {
          this._isContentChange = !!val
        },
        isContentChanged: function () {
          return this._isContentChange
        },
        setSelectionChanged: function (val) {
          this._isSelectionChange = !!val
        },
        isSelectionChanged: function () {
          return this._isContentChange
        },
        queryState: function (km) {
          return COMMAND_STATE_NORMAL
        },
        queryValue: function (km) {
          return 0
        },
        isNeedUndo: function () {
          return true
        },
      })
      Command.STATE_NORMAL = COMMAND_STATE_NORMAL
      Command.STATE_ACTIVE = COMMAND_STATE_ACTIVED
      Command.STATE_DISABLED = COMMAND_STATE_DISABLED
      kity.extendClass(Minder, {
        _getCommand: function (name) {
          return this._commands[name.toLowerCase()]
        },
        _queryCommand: function (name, type, args) {
          let cmd = this._getCommand(name)
          if (cmd) {
            let queryCmd = cmd['query' + type]
            if (queryCmd) return queryCmd.apply(cmd, [this].concat(args))
          }
          return 0
        },
        /**
         * @method queryCommandState()
         * @for Minder
         * @description 查询指定命令的状态
         *
         * @grammar queryCommandName(name) => {number}
         *
         * @param {string} name 要查询的命令名称
         *
         * @return {number}
         *   -1: 命令不存在或命令当前不可用
         *    0: 命令可用
         *    1: 命令当前可用并且已经执行过
         */
        queryCommandState: function (name) {
          return this._queryCommand(name, 'State', [].slice.call(arguments, 1))
        },
        /**
         * @method queryCommandValue()
         * @for Minder
         * @description 查询指定命令当前的执行值
         *
         * @grammar queryCommandValue(name) => {any}
         *
         * @param {string} name 要查询的命令名称
         *
         * @return {any}
         *    如果命令不存在，返回 undefined
         *    不同命令具有不同返回值，具体请查看 [Command](command) 章节
         */
        queryCommandValue: function (name) {
          return this._queryCommand(name, 'Value', [].slice.call(arguments, 1))
        },
        /**
         * @method execCommand()
         * @for Minder
         * @description 执行指定的命令。
         *
         * @grammar execCommand(name, args...)
         *
         * @param {string} name 要执行的命令名称
         * @param {argument} args 要传递给命令的其它参数
         */
        execCommand: function (name) {
          if (!name) return null
          name = name.toLowerCase()
          let cmdArgs = [].slice.call(arguments, 1),
            cmd,
            stoped,
            result,
            eventParams
          let me = this
          cmd = this._getCommand(name)
          eventParams = {
            command: cmd,
            commandName: name.toLowerCase(),
            commandArgs: cmdArgs,
          }
          if (!cmd || !~this.queryCommandState(name)) {
            return false
          }
          if (!this._hasEnterExecCommand) {
            this._hasEnterExecCommand = true
            stoped = this._fire(new MinderEvent('beforeExecCommand', eventParams, true))
            if (!stoped) {
              this._fire(new MinderEvent('preExecCommand', eventParams, false))
              result = cmd.execute.apply(cmd, [me].concat(cmdArgs))
              this._fire(new MinderEvent('execCommand', eventParams, false))
              if (cmd.isContentChanged()) {
                this._firePharse(new MinderEvent('contentchange'))
              }
              this._interactChange()
            }
            this._hasEnterExecCommand = false
          } else {
            result = cmd.execute.apply(cmd, [me].concat(cmdArgs))
            if (!this._hasEnterExecCommand) {
              this._interactChange()
            }
          }
          return result === undefined ? null : result
        },
      })
      module.exports = Command
    },
  }

  //src/core/compatibility.js
  _p[10] = {
    value: function (require, exports, module) {
      let utils = _p.r(33)
      function compatibility(json) {
        let version = json.version || (json.root ? '1.4.0' : '1.1.3')
        switch (version) {
          case '1.1.3':
            c_113_120(json)

          /* falls through */
          case '1.2.0':
          case '1.2.1':
            c_120_130(json)

          /* falls through */
          case '1.3.0':
          case '1.3.1':
          case '1.3.2':
          case '1.3.3':
          case '1.3.4':
          case '1.3.5':
            /* falls through */
            c_130_140(json)
        }
        return json
      }
      function traverse(node, fn) {
        fn(node)
        if (node.children)
          node.children.forEach(function (child) {
            traverse(child, fn)
          })
      }
      /* 脑图数据升级 */
      function c_120_130(json) {
        traverse(json, function (node) {
          let data = node.data
          delete data.layout_bottom_offset
          delete data.layout_default_offset
          delete data.layout_filetree_offset
        })
      }
      /**
       * 脑图数据升级
       * v1.1.3 => v1.2.0
       * */
      function c_113_120(json) {
        // 原本的布局风格
        let ocs = json.data.currentstyle
        delete json.data.currentstyle
        // 为 1.2 选择模板，同时保留老版本文件的皮肤
        if (ocs == 'bottom') {
          json.template = 'structure'
          json.theme = 'snow'
        } else if (ocs == 'default') {
          json.template = 'default'
          json.theme = 'classic'
        }
        traverse(json, function (node) {
          let data = node.data
          // 升级优先级、进度图标
          if ('PriorityIcon' in data) {
            data.priority = data.PriorityIcon
            delete data.PriorityIcon
          }
          if ('ProgressIcon' in data) {
            data.progress = 1 + ((data.ProgressIcon - 1) << 1)
            delete data.ProgressIcon
          }
          // 删除过时属性
          delete data.point
          delete data.layout
        })
      }
      function c_130_140(json) {
        json.root = {
          data: json.data,
          children: json.children,
        }
        delete json.data
        delete json.children
      }
      return compatibility
    },
  }

  //src/core/connect.js
  _p[11] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Module = _p.r(20)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      // 连线提供方
      let _connectProviders = {}
      function register(name, provider) {
        _connectProviders[name] = provider
      }
      register('default', function (node, parent, connection) {
        connection.setPathData(['M', parent.getLayoutVertexOut(), 'L', node.getLayoutVertexIn()])
      })
      kity.extendClass(MinderNode, {
        /**
         * @private
         * @method getConnect()
         * @for MinderNode
         * @description 获取当前节点的连线类型
         *
         * @grammar getConnect() => {string}
         */
        getConnect: function () {
          return this.data.connect || 'default'
        },
        getConnectProvider: function () {
          return _connectProviders[this.getConnect()] || _connectProviders['default']
        },
        /**
         * @private
         * @method getConnection()
         * @for MinderNode
         * @description 获取当前节点的连线对象
         *
         * @grammar getConnection() => {kity.Path}
         */
        getConnection: function () {
          return this._connection || null
        },
      })
      kity.extendClass(Minder, {
        getConnectContainer: function () {
          return this._connectContainer
        },
        createConnect: function (node) {
          if (node.isRoot()) return
          let connection = new kity.Path()
          node._connection = connection
          this._connectContainer.addShape(connection)
          this.updateConnect(node)
        },
        removeConnect: function (node) {
          let me = this
          node.traverse(function (node) {
            me._connectContainer.removeShape(node._connection)
            node._connection = null
          })
        },
        updateConnect: function (node) {
          let connection = node._connection
          let parent = node.parent
          if (!parent || !connection) return
          if (parent.isCollapsed()) {
            connection.setVisible(false)
            return
          }
          connection.setVisible(true)
          let provider = node.getConnectProvider()
          let strokeColor = node.getStyle('connect-color') || 'white',
            strokeWidth = node.getStyle('connect-width') || 2
          connection.stroke(strokeColor, strokeWidth)
          provider(node, parent, connection, strokeWidth, strokeColor)
          if (strokeWidth % 2 === 0) {
            connection.setTranslate(0.5, 0.5)
          } else {
            connection.setTranslate(0, 0)
          }
        },
      })
      Module.register('Connect', {
        init: function () {
          this._connectContainer = new kity.Group().setId(utils.uuid('minder_connect_group'))
          this.getRenderContainer().prependShape(this._connectContainer)
        },
        events: {
          nodeattach: function (e) {
            this.createConnect(e.node)
          },
          nodedetach: function (e) {
            this.removeConnect(e.node)
          },
          'layoutapply layoutfinish noderender': function (e) {
            this.updateConnect(e.node)
          },
        },
      })
      exports.register = register
    },
  }

  //src/core/data.js
  _p[12] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let MinderEvent = _p.r(13)
      let compatibility = _p.r(10)
      let Promise = _p.r(25)
      let protocols = {}
      function registerProtocol(name, protocol) {
        protocols[name] = protocol
        for (let pname in protocols) {
          if (protocols.hasOwnProperty(pname)) {
            protocols[pname] = protocols[pname]
            protocols[pname].name = pname
          }
        }
      }
      function getRegisterProtocol(name) {
        return name === undefined ? protocols : protocols[name] || null
      }
      exports.registerProtocol = registerProtocol
      exports.getRegisterProtocol = getRegisterProtocol
      // 导入导出
      kity.extendClass(Minder, {
        // 自动导入
        setup: function (target) {
          if (typeof target == 'string') {
            target = document.querySelector(target)
          }
          if (!target) return
          let protocol = target.getAttribute('minder-data-type')
          if (protocol in protocols) {
            let data = target.textContent
            target.textContent = null
            this.renderTo(target)
            this.importData(protocol, data)
          }
          return this
        },
        /**
         * @method exportJson()
         * @for Minder
         * @description
         *     导出当前脑图数据为 JSON 对象，导出的数据格式请参考 [Data](data) 章节。
         * @grammar exportJson() => {plain}
         */
        exportJson: function () {
          /* 导出 node 上整棵树的数据为 JSON */
          function exportNode(node) {
            let exported = {}
            exported.data = node.getData()
            let childNodes = node.getChildren()
            exported.children = []
            for (let i = 0; i < childNodes.length; i++) {
              exported.children.push(exportNode(childNodes[i]))
            }
            return exported
          }
          let json = {
            root: exportNode(this.getRoot()),
          }
          json.template = this.getTemplate()
          json.theme = this.getTheme()
          json.version = Minder.version
          json.base = this.getBase()
          return JSON.parse(JSON.stringify(json))
        },
        /**
         * function Text2Children(MinderNode, String)
         * @param {MinderNode} node 要导入数据的节点
         * @param {String} text 导入的text数据
         * @Desc: 用于批量插入子节点，并不会修改被插入的父节点
         * @Editor: Naixor
         * @Date: 2015.9.21
         * @example: 用于批量导入如下类型的节点
         *      234
         *      3456346 asadf
         *          12312414
         *              wereww
         *          12314
         *      1231412
         *      13123
         */
        Text2Children: function (node, text) {
          if (!(node instanceof kityminder.Node)) {
            return
          }
          let children = [],
            jsonMap = {},
            level = 0
          let LINE_SPLITTER = /\r|\n|\r\n/,
            TAB_REGEXP = /^(\t|\x20{4})/
          let lines = text.split(LINE_SPLITTER),
            line = '',
            jsonNode,
            i = 0
          let minder = this
          function isEmpty(line) {
            return line === '' && !/\S/.test(line)
          }
          function getNode(line) {
            return {
              data: {
                text: line.replace(/^(\t|\x20{4})+/, '').replace(/(\t|\x20{4})+$/, ''),
              },
              children: [],
            }
          }
          function getLevel(text) {
            let level = 0
            while (TAB_REGEXP.test(text)) {
              text = text.replace(TAB_REGEXP, '')
              level++
            }
            return level
          }
          function addChild(parent, node) {
            parent.children.push(node)
          }
          function importChildren(node, children) {
            for (let i = 0, l = children.length; i < l; i++) {
              let childNode = minder.createNode(null, node)
              childNode.setData('text', children[i].data.text || '')
              importChildren(childNode, children[i].children)
            }
          }
          while ((line = lines[i++]) !== undefined) {
            line = line.replace(/&nbsp;/g, '')
            if (isEmpty(line)) continue
            level = getLevel(line)
            jsonNode = getNode(line)
            if (level === 0) {
              jsonMap = {}
              children.push(jsonNode)
              jsonMap[0] = children[children.length - 1]
            } else {
              if (!jsonMap[level - 1]) {
                throw new Error('Invalid local format')
              }
              addChild(jsonMap[level - 1], jsonNode)
              jsonMap[level] = jsonNode
            }
          }
          importChildren(node, children)
          minder.refresh()
        },
        /**
         * @method exportNode(MinderNode)
         * @param  {MinderNode} node 当前要被导出的节点
         * @return {Object}      返回只含有data和children的Object
         * @Editor: Naixor
         * @Date: 2015.9.22
         */
        exportNode: function (node) {
          let exported = {}
          exported.data = node.getData()
          let childNodes = node.getChildren()
          exported.children = []
          for (let i = 0; i < childNodes.length; i++) {
            exported.children.push(this.exportNode(childNodes[i]))
          }
          return exported
        },
        /**
         * @method importNode()
         * @description 根据纯json {data, children}数据转换成为脑图节点
         * @Editor: Naixor
         * @Date: 2015.9.20
         */
        importNode: function (node, json) {
          let data = json.data
          node.data = {}
          for (let field in data) {
            node.setData(field, data[field])
          }
          let childrenTreeData = json.children || []
          for (let i = 0; i < childrenTreeData.length; i++) {
            let childNode = this.createNode(null, node)
            this.importNode(childNode, childrenTreeData[i])
          }
          return node
        },
        /**
         * @method importJson()
         * @for Minder
         * @description 导入脑图数据，数据为 JSON 对象，具体的数据字段形式请参考 [Data](data) 章节。
         *
         * @grammar importJson(json) => {this}
         *
         * @param {plain} json 要导入的数据
         */
        importJson: function (json) {
          if (!json) return
          /**
           * @event preimport
           * @for Minder
           * @when 导入数据之前
           */
          this._fire(new MinderEvent('preimport', null, false))
          // 删除当前所有节点
          while (this._root.getChildren().length) {
            this.removeNode(this._root.getChildren()[0])
          }
          json = compatibility(json)
          this.importNode(this._root, json.root)
          this.setTemplate(json.template || 'default')
          this.setTheme(json.theme || null)
          this.setBase(json.base)
          this.refresh()
          /**
           * @event import,contentchange,interactchange
           * @for Minder
           * @when 导入数据之后
           */

          this.fire('import')
          this._firePharse({
            type: 'contentchange',
          })
          this._interactChange()
          return this
        },
        /**
         * @method exportData()
         * @for Minder
         * @description 使用指定使用的数据协议，导入脑图数据
         *
         * @grammar exportData(protocol) => Promise<data>
         *
         * @param {string} protocol 指定的数据协议（默认内置五种数据协议 `json`、`text`、`markdown`、`svg` 和 `png`）
         */
        exportData: function (protocolName, option) {
          let json, protocol
          json = this.exportJson()
          // 指定了协议进行导出，需要检测协议是否支持
          if (protocolName) {
            protocol = protocols[protocolName]
            if (!protocol || !protocol.encode) {
              return Promise.reject(new Error('Not supported protocol:' + protocolName))
            }
          }
          // 导出前抛个事件
          this._fire(
            new MinderEvent('beforeexport', {
              json: json,
              protocolName: protocolName,
              protocol: protocol,
            }),
          )
          return Promise.resolve(protocol.encode(json, this, option))
        },
        /**
         * @method importData()
         * @for Minder
         * @description 使用指定的数据协议，导入脑图数据，覆盖当前实例的脑图
         *
         * @grammar importData(protocol, callback) => Promise<json>
         *
         * @param {string} protocol 指定的用于解析数据的数据协议（默认内置三种数据协议 `json`、`text` 和 `markdown` 的支持）
         * @param {any} data 要导入的数据
         */
        importData: function (protocolName, data, option) {
          let json, protocol
          let minder = this
          // 指定了协议进行导入，需要检测协议是否支持
          if (protocolName) {
            protocol = protocols[protocolName]
            if (!protocol || !protocol.decode) {
              return Promise.reject(new Error('Not supported protocol:' + protocolName))
            }
          }
          let params = {
            local: data,
            protocolName: protocolName,
            protocol: protocol,
          }
          // 导入前抛事件
          this._fire(new MinderEvent('beforeimport', params))
          return Promise.resolve(protocol.decode(data, this, option)).then(function (json) {
            minder.importJson(json)
            return json
          })
        },
        /**
         * @method decodeData()
         * @for Minder
         * @description 使用指定的数据协议，解析为脑图数据，与 importData 的区别在于：不覆盖当前实例的脑图
         *
         * @grammar decodeData(protocol, callback) => Promise<json>
         *
         * @param {string} protocol 指定的用于解析数据的数据协议（默认内置三种数据协议 `json`、`text` 和 `markdown` 的支持）
         * @param {any} data 要导入的数据
         */
        decodeData: function (protocolName, data, option) {
          let json, protocol
          let minder = this
          // 指定了协议进行导入，需要检测协议是否支持
          if (protocolName) {
            protocol = protocols[protocolName]
            if (!protocol || !protocol.decode) {
              return Promise.reject(new Error('Not supported protocol:' + protocolName))
            }
          }
          let params = {
            local: data,
            protocolName: protocolName,
            protocol: protocol,
          }
          // 导入前抛事件
          this._fire(new MinderEvent('beforeimport', params))
          return Promise.resolve(protocol.decode(data, this, option))
        },
      })
    },
  }

  //src/core/event.js
  _p[13] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      /**
       * @class MinderEvent
       * @description 表示一个脑图中发生的事件
       */
      let MinderEvent = kity.createClass('MindEvent', {
        constructor: function (type, params, canstop) {
          params = params || {}
          if (params.getType && params.getType() == 'ShapeEvent') {
            /**
             * @property kityEvent
             * @for MinderEvent
             * @description 如果事件是从一个 kity 的事件派生的，会有 kityEvent 属性指向原来的 kity 事件
             * @type {KityEvent}
             */
            this.kityEvent = params
            /**
             * @property originEvent
             * @for MinderEvent
             * @description 如果事件是从原声 Dom 事件派生的（如 click、mousemove 等），会有 originEvent 指向原来的 Dom 事件
             * @type {DomEvent}
             */
            this.originEvent = params.originEvent
          } else if (params.target && params.preventDefault) {
            this.originEvent = params
          } else {
            kity.Utils.extend(this, params)
          }
          /**
           * @property type
           * @for MinderEvent
           * @description 事件的类型，如 `click`、`contentchange` 等
           * @type {string}
           */
          this.type = type
          this._canstop = canstop || false
        },
        /**
         * @method getPosition()
         * @for MinderEvent
         * @description 如果事件是从一个 kity 事件派生的，会有 `getPosition()` 获取事件发生的坐标
         *
         * @grammar getPosition(refer) => {kity.Point}
         *
         * @param {string|kity.Shape} refer
         *     参照的坐标系，
         *     `"screen"` - 以浏览器屏幕为参照坐标系
         *     `"minder"` - （默认）以脑图画布为参照坐标系
         *     `{kity.Shape}` - 指定以某个 kity 图形为参照坐标系
         */
        getPosition: function (refer) {
          if (!this.kityEvent) return
          if (!refer || refer == 'minder') {
            return this.kityEvent.getPosition(this.minder.getRenderContainer())
          }
          return this.kityEvent.getPosition.call(this.kityEvent, refer)
        },
        /**
         * @method getTargetNode()
         * @for MinderEvent
         * @description 当发生的事件是鼠标事件时，获取事件位置命中的脑图节点
         *
         * @grammar getTargetNode() => {MinderNode}
         */
        getTargetNode: function () {
          let findShape = this.kityEvent && this.kityEvent.targetShape
          if (!findShape) return null
          while (!findShape.minderNode && findShape.container) {
            findShape = findShape.container
          }
          let node = findShape.minderNode
          if (node && findShape.getOpacity() < 1) return null
          return node || null
        },
        /**
         * @method stopPropagation()
         * @for MinderEvent
         * @description 当发生的事件是鼠标事件时，获取事件位置命中的脑图节点
         *
         * @grammar getTargetNode() => {MinderNode}
         */
        stopPropagation: function () {
          this._stoped = true
        },
        stopPropagationImmediately: function () {
          this._immediatelyStoped = true
          this._stoped = true
        },
        shouldStopPropagation: function () {
          return this._canstop && this._stoped
        },
        shouldStopPropagationImmediately: function () {
          return this._canstop && this._immediatelyStoped
        },
        preventDefault: function () {
          this.originEvent.preventDefault()
        },
        isRightMB: function () {
          let isRightMB = false
          if (!this.originEvent) {
            return false
          }
          if ('which' in this.originEvent) isRightMB = this.originEvent.which == 3
          else if ('button' in this.originEvent) isRightMB = this.originEvent.button == 2
          return isRightMB
        },
        getKeyCode: function () {
          let evt = this.originEvent
          return evt.keyCode || evt.which
        },
      })
      Minder.registerInitHook(function (option) {
        this._initEvents()
      })
      kity.extendClass(Minder, {
        _initEvents: function () {
          this._eventCallbacks = {}
        },
        _resetEvents: function () {
          this._initEvents()
          this._bindEvents()
        },
        _bindEvents: function () {
          /* jscs:disable maximumLineLength */
          this._paper.on(
            'click dblclick mousedown contextmenu mouseup mousemove mouseover mousewheel DOMMouseScroll touchstart touchmove touchend dragenter dragleave drop',
            this._firePharse.bind(this),
          )
          if (window) {
            window.addEventListener('resize', this._firePharse.bind(this))
          }
        },
        /**
         * @method dispatchKeyEvent
         * @description 派发键盘（相关）事件到脑图实例上，让实例的模块处理
         * @grammar dispatchKeyEvent(e) => {this}
         * @param  {Event} e 原生的 Dom 事件对象
         */
        dispatchKeyEvent: function (e) {
          this._firePharse(e)
        },
        _firePharse: function (e) {
          let beforeEvent, preEvent, executeEvent
          if (e.type == 'DOMMouseScroll') {
            e.type = 'mousewheel'
            e.wheelDelta = e.originEvent.wheelDelta = e.originEvent.detail * -10
            e.wheelDeltaX = e.originEvent.mozMovementX
            e.wheelDeltaY = e.originEvent.mozMovementY
          }
          beforeEvent = new MinderEvent('before' + e.type, e, true)
          if (this._fire(beforeEvent)) {
            return
          }
          preEvent = new MinderEvent('pre' + e.type, e, true)
          executeEvent = new MinderEvent(e.type, e, true)
          if (this._fire(preEvent) || this._fire(executeEvent))
            this._fire(new MinderEvent('after' + e.type, e, false))
        },
        _interactChange: function (e) {
          let me = this
          if (me._interactScheduled) return
          setTimeout(function () {
            me._fire(new MinderEvent('interactchange'))
            me._interactScheduled = false
          }, 100)
          me._interactScheduled = true
        },
        _listen: function (type, callback) {
          let callbacks = this._eventCallbacks[type] || (this._eventCallbacks[type] = [])
          callbacks.push(callback)
        },
        _fire: function (e) {
          /**
           * @property minder
           * @description 产生事件的 Minder 对象
           * @for MinderShape
           * @type {Minder}
           */
          e.minder = this
          let status = this.getStatus()
          let callbacks = this._eventCallbacks[e.type.toLowerCase()] || []
          if (status) {
            callbacks = callbacks.concat(
              this._eventCallbacks[status + '.' + e.type.toLowerCase()] || [],
            )
          }
          if (callbacks.length === 0) {
            return
          }
          let lastStatus = this.getStatus()
          for (let i = 0; i < callbacks.length; i++) {
            callbacks[i].call(this, e)
            /* this.getStatus() != lastStatus ||*/
            if (e.shouldStopPropagationImmediately()) {
              break
            }
          }
          return e.shouldStopPropagation()
        },
        on: function (name, callback) {
          let km = this
          name.split(/\s+/).forEach(function (n) {
            km._listen(n.toLowerCase(), callback)
          })
          return this
        },
        off: function (name, callback) {
          let types = name.split(/\s+/)
          let i, j, callbacks, removeIndex
          for (i = 0; i < types.length; i++) {
            callbacks = this._eventCallbacks[types[i].toLowerCase()]
            if (callbacks) {
              removeIndex = null
              for (j = 0; j < callbacks.length; j++) {
                if (callbacks[j] == callback) {
                  removeIndex = j
                }
              }
              if (removeIndex !== null) {
                callbacks.splice(removeIndex, 1)
              }
            }
          }
        },
        fire: function (type, params) {
          let e = new MinderEvent(type, params)
          this._fire(e)
          return this
        },
      })
      module.exports = MinderEvent
    },
  }

  //src/core/focus.js
  _p[14] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let Minder = _p.r(19)
      Minder.registerInitHook(function () {
        this.on('beforemousedown', function (e) {
          this.focus()
          e.preventDefault()
        })
        this.on('paperrender', function () {
          this.focus()
        })
      })
      kity.extendClass(Minder, {
        focus: function () {
          if (!this.isFocused()) {
            let renderTarget = this._renderTarget
            renderTarget.classList.add('focus')
            this.renderNodeBatch(this.getSelectedNodes())
          }
          this.fire('focus')
          return this
        },
        blur: function () {
          if (this.isFocused()) {
            let renderTarget = this._renderTarget
            renderTarget.classList.remove('focus')
            this.renderNodeBatch(this.getSelectedNodes())
          }
          this.fire('blur')
          return this
        },
        isFocused: function () {
          let renderTarget = this._renderTarget
          return renderTarget && renderTarget.classList.contains('focus')
        },
      })
    },
  }

  //src/core/keymap.js
  _p[15] = {
    value: function (require, exports, module) {
      let keymap = {
        Backspace: 8,
        Tab: 9,
        Enter: 13,
        Shift: 16,
        Control: 17,
        Alt: 18,
        CapsLock: 20,
        Esc: 27,
        Spacebar: 32,
        PageUp: 33,
        PageDown: 34,
        End: 35,
        Home: 36,
        Insert: 45,
        Left: 37,
        Up: 38,
        Right: 39,
        Down: 40,
        direction: {
          37: 1,
          38: 1,
          39: 1,
          40: 1,
        },
        Del: 46,
        NumLock: 144,
        Cmd: 91,
        CmdFF: 224,
        F1: 112,
        F2: 113,
        F3: 114,
        F4: 115,
        F5: 116,
        F6: 117,
        F7: 118,
        F8: 119,
        F9: 120,
        F10: 121,
        F11: 122,
        F12: 123,
        '`': 192,
        '=': 187,
        '-': 189,
        '/': 191,
        '.': 190,
        controlKeys: {
          16: 1,
          17: 1,
          18: 1,
          20: 1,
          91: 1,
          224: 1,
        },
        notContentChange: {
          13: 1,
          9: 1,
          33: 1,
          34: 1,
          35: 1,
          36: 1,
          16: 1,
          17: 1,
          18: 1,
          20: 1,
          91: 1,
          //上下左右
          37: 1,
          38: 1,
          39: 1,
          40: 1,
          113: 1,
          114: 1,
          115: 1,
          144: 1,
          27: 1,
        },
        isSelectedNodeKey: {
          //上下左右
          37: 1,
          38: 1,
          39: 1,
          40: 1,
          13: 1,
          9: 1,
        },
      }
      // 小写适配
      for (let key in keymap) {
        if (keymap.hasOwnProperty(key)) {
          keymap[key.toLowerCase()] = keymap[key]
        }
      }
      let aKeyCode = 65
      let aCharCode = 'a'.charCodeAt(0)
      // letters
      'abcdefghijklmnopqrstuvwxyz'.split('').forEach(function (letter) {
        keymap[letter] = aKeyCode + (letter.charCodeAt(0) - aCharCode)
      })
      // numbers
      let n = 9
      do {
        keymap[n.toString()] = n + 48
      } while (--n)
      module.exports = keymap
    },
  }

  //src/core/keyreceiver.js
  _p[16] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      function listen(element, type, handler) {
        type.split(' ').forEach(function (name) {
          element.addEventListener(name, handler, false)
        })
      }
      Minder.registerInitHook(function (option) {
        this.setDefaultOptions({
          enableKeyReceiver: true,
        })
        if (this.getOption('enableKeyReceiver')) {
          this.on('paperrender', function () {
            this._initKeyReceiver()
          })
        }
      })
      kity.extendClass(Minder, {
        _initKeyReceiver: function () {
          if (this._keyReceiver) return
          let receiver = (this._keyReceiver = document.createElement('input'))
          receiver.classList.add('km-receiver')
          let renderTarget = this._renderTarget
          renderTarget.appendChild(receiver)
          let minder = this
          listen(receiver, 'keydown keyup keypress copy paste blur focus input', function (e) {
            switch (e.type) {
              case 'blur':
                minder.blur()
                break

              case 'focus':
                minder.focus()
                break

              case 'input':
                receiver.value = null
                break
            }
            minder._firePharse(e)
            e.preventDefault()
          })
          this.on('focus', function () {
            receiver.select()
            receiver.focus()
          })
          this.on('blur', function () {
            receiver.blur()
          })
          if (this.isFocused()) {
            receiver.select()
            receiver.focus()
          }
        },
      })
    },
  }

  //src/core/kity.js
  /**
   * @fileOverview
   *
   * Kity 引入
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[17] = {
    value: function (require, exports, module) {
      module.exports = window.kity
    },
  }

  //src/core/layout.js
  _p[18] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let MinderEvent = _p.r(13)
      let Command = _p.r(9)
      let _layouts = {}
      let _defaultLayout
      function register(name, layout) {
        _layouts[name] = layout
        _defaultLayout = _defaultLayout || name
      }
      /**
       * @class Layout 布局基类，具体布局需要从该类派生
       */
      let Layout = kity.createClass('Layout', {
        /**
         * @abstract
         *
         * 子类需要实现的布局算法，该算法输入一个节点，排布该节点的子节点（相对父节点的变换）
         *
         * @param  {MinderNode} node 需要布局的节点
         *
         * @example
         *
         * doLayout: function(node) {
         *     var children = node.getChildren();
         *     // layout calculation
         *     children[i].setLayoutTransform(new kity.Matrix().translate(x, y));
         * }
         */
        doLayout: function (parent, children) {
          throw new Error('Not Implement: Layout.doLayout()')
        },
        /**
         * 对齐指定的节点
         *
         * @param {Array<MinderNode>} nodes 要对齐的节点
         * @param {string} border 对齐边界，允许取值 left, right, top, bottom
         *
         */
        align: function (nodes, border, offset) {
          let me = this
          offset = offset || 0
          nodes.forEach(function (node) {
            let tbox = me.getTreeBox([node])
            let matrix = node.getLayoutTransform()
            switch (border) {
              case 'left':
                return matrix.translate(offset - tbox.left, 0)

              case 'right':
                return matrix.translate(offset - tbox.right, 0)

              case 'top':
                return matrix.translate(0, offset - tbox.top)

              case 'bottom':
                return matrix.translate(0, offset - tbox.bottom)
            }
          })
        },
        stack: function (nodes, axis, distance) {
          let me = this
          let position = 0
          distance =
            distance ||
            function (node, next, axis) {
              return (
                node.getStyle(
                  {
                    x: 'margin-right',
                    y: 'margin-bottom',
                  }[axis],
                ) +
                next.getStyle(
                  {
                    x: 'margin-left',
                    y: 'margin-top',
                  }[axis],
                )
              )
            }
          nodes.forEach(function (node, index, nodes) {
            let tbox = me.getTreeBox([node])
            let size = {
              x: tbox.width,
              y: tbox.height,
            }[axis]
            let offset = {
              x: tbox.left,
              y: tbox.top,
            }[axis]
            let matrix = node.getLayoutTransform()
            if (axis == 'x') {
              matrix.translate(position - offset, 0)
            } else {
              matrix.translate(0, position - offset)
            }
            position += size
            if (nodes[index + 1]) position += distance(node, nodes[index + 1], axis)
          })
          return position
        },
        move: function (nodes, dx, dy) {
          nodes.forEach(function (node) {
            node.getLayoutTransform().translate(dx, dy)
          })
        },
        /**
         * 工具方法：获取给点的节点所占的布局区域
         *
         * @param  {MinderNode[]} nodes 需要计算的节点
         *
         * @return {Box} 计算结果
         */
        getBranchBox: function (nodes) {
          let box = new kity.Box()
          let i, node, matrix, contentBox
          for (i = 0; i < nodes.length; i++) {
            node = nodes[i]
            matrix = node.getLayoutTransform()
            contentBox = node.getContentBox()
            box = box.merge(matrix.transformBox(contentBox))
          }
          return box
        },
        /**
         * 工具方法：计算给定的节点的子树所占的布局区域
         *
         * @param  {MinderNode} nodes 需要计算的节点
         *
         * @return {Box} 计算的结果
         */
        getTreeBox: function (nodes) {
          let i, node, matrix, treeBox
          let box = new kity.Box()
          if (!(nodes instanceof Array)) nodes = [nodes]
          for (i = 0; i < nodes.length; i++) {
            node = nodes[i]
            matrix = node.getLayoutTransform()
            treeBox = node.getContentBox()
            if (node.isExpanded() && node.children.length) {
              treeBox = treeBox.merge(this.getTreeBox(node.children))
            }
            box = box.merge(matrix.transformBox(treeBox))
          }
          return box
        },
        getOrderHint: function (node) {
          return []
        },
      })
      Layout.register = register
      Minder.registerInitHook(function (options) {
        this.refresh()
      })
      /**
       * 布局支持池子管理
       */
      utils.extend(Minder, {
        getLayoutList: function () {
          return _layouts
        },
        getLayoutInstance: function (name) {
          let LayoutClass = _layouts[name]
          if (!LayoutClass) throw new Error('Missing Layout: ' + name)
          let layout = new LayoutClass()
          return layout
        },
      })
      /**
       * MinderNode 上的布局支持
       */
      kity.extendClass(MinderNode, {
        /**
         * 获得当前节点的布局名称
         *
         * @return {String}
         */
        getLayout: function () {
          let layout = this.getData('layout')
          layout = layout || (this.isRoot() ? _defaultLayout : this.parent.getLayout())
          return layout
        },
        setLayout: function (name) {
          if (name) {
            if (name == 'inherit') {
              this.setData('layout')
            } else {
              this.setData('layout', name)
            }
          }
          return this
        },
        layout: function (name) {
          this.setLayout(name)
            .getMinder()
            .layout()
          return this
        },
        getLayoutInstance: function () {
          return Minder.getLayoutInstance(this.getLayout())
        },
        getOrderHint: function (refer) {
          return this.parent.getLayoutInstance().getOrderHint(this)
        },
        /**
         * 获取当前节点相对于父节点的布局变换
         */
        getLayoutTransform: function () {
          return this._layoutTransform || new kity.Matrix()
        },
        /**
         * 第一轮布局计算后，获得的全局布局位置
         *
         * @return {[type]} [description]
         */
        getGlobalLayoutTransformPreview: function () {
          let pMatrix = this.parent ? this.parent.getLayoutTransform() : new kity.Matrix()
          let matrix = this.getLayoutTransform()
          let offset = this.getLayoutOffset()
          if (offset) {
            matrix = matrix.clone().translate(offset.x, offset.y)
          }
          return pMatrix.merge(matrix)
        },
        getLayoutPointPreview: function () {
          return this.getGlobalLayoutTransformPreview().transformPoint(new kity.Point())
        },
        /**
         * 获取节点相对于全局的布局变换
         */
        getGlobalLayoutTransform: function () {
          if (this._globalLayoutTransform) {
            return this._globalLayoutTransform
          } else if (this.parent) {
            return this.parent.getGlobalLayoutTransform()
          } else {
            return new kity.Matrix()
          }
        },
        /**
         * 设置当前节点相对于父节点的布局变换
         */
        setLayoutTransform: function (matrix) {
          this._layoutTransform = matrix
          return this
        },
        /**
         * 设置当前节点相对于全局的布局变换（冗余优化）
         */
        setGlobalLayoutTransform: function (matrix) {
          this.getRenderContainer().setMatrix((this._globalLayoutTransform = matrix))
          return this
        },
        setVertexIn: function (p) {
          this._vertexIn = p
        },
        setVertexOut: function (p) {
          this._vertexOut = p
        },
        getVertexIn: function () {
          return this._vertexIn || new kity.Point()
        },
        getVertexOut: function () {
          return this._vertexOut || new kity.Point()
        },
        getLayoutVertexIn: function () {
          return this.getGlobalLayoutTransform().transformPoint(this.getVertexIn())
        },
        getLayoutVertexOut: function () {
          return this.getGlobalLayoutTransform().transformPoint(this.getVertexOut())
        },
        setLayoutVectorIn: function (v) {
          this._layoutVectorIn = v
          return this
        },
        setLayoutVectorOut: function (v) {
          this._layoutVectorOut = v
          return this
        },
        getLayoutVectorIn: function () {
          return this._layoutVectorIn || new kity.Vector()
        },
        getLayoutVectorOut: function () {
          return this._layoutVectorOut || new kity.Vector()
        },
        getLayoutBox: function () {
          let matrix = this.getGlobalLayoutTransform()
          return matrix.transformBox(this.getContentBox())
        },
        getLayoutPoint: function () {
          let matrix = this.getGlobalLayoutTransform()
          return matrix.transformPoint(new kity.Point())
        },
        getLayoutOffset: function () {
          if (!this.parent) return new kity.Point()
          // 影响当前节点位置的是父节点的布局
          let data = this.getData('layout_' + this.parent.getLayout() + '_offset')
          if (data) return new kity.Point(data.x, data.y)
          return new kity.Point()
        },
        setLayoutOffset: function (p) {
          if (!this.parent) return this
          this.setData(
            'layout_' + this.parent.getLayout() + '_offset',
            p
              ? {
                x: p.x,
                y: p.y,
              }
              : undefined,
          )
          return this
        },
        hasLayoutOffset: function () {
          return !!this.getData('layout_' + this.parent.getLayout() + '_offset')
        },
        resetLayoutOffset: function () {
          return this.setLayoutOffset(null)
        },
        getLayoutRoot: function () {
          if (this.isLayoutRoot()) {
            return this
          }
          return this.parent.getLayoutRoot()
        },
        isLayoutRoot: function () {
          return this.getData('layout') || this.isRoot()
        },
      })
      /**
       * Minder 上的布局支持
       */
      kity.extendClass(Minder, {
        layout: function () {
          let duration = this.getOption('layoutAnimationDuration')

          this.getRoot().traverse(function (node) {
            // clear last results
            node.setLayoutTransform(null)
          })

          function layoutNode(node, round) {
            // layout all children first
            // 剪枝：收起的节点无需计算
            if (node.isExpanded()) {
              node.children.forEach(function (child) {
                layoutNode(child, round)
              })
            }
            let layout = node.getLayoutInstance()
            // var childrenInFlow = node.getChildren().filter(function(child) {
            //     return !child.hasLayoutOffset();
            // });
            layout.doLayout(node, node.getChildren(), round)
          }
          
          // 第一轮布局
          layoutNode(this.getRoot(), 1)
          
          // 第二轮布局
          layoutNode(this.getRoot(), 2)
          
          let minder = this
          
          this.applyLayoutResult(this.getRoot(), duration, function () {
            /**
             * 当节点>200, 不使用动画时, 此处逻辑变为同步逻辑, 外部minder.on事件无法
             * 被提前录入, 因此增加setTimeout
             * @author Naixor
             */
            setTimeout(function () {
              minder.fire('layoutallfinish')
            }, 0)
          })
          return this.fire('layout')
        },
        refresh: function () {
          this.getRoot().renderTree()
          this.layout()
            .fire('contentchange')
            ._interactChange()
          return this
        },
        applyLayoutResult: function (root, duration, callback) {
          root = root || this.getRoot()
          let me = this
          
          // 性能优化：收集所有更新操作，批量执行
          let updates = []
          let updateCount = 0
          
          function applyMatrix(node, matrix) {
            node.setGlobalLayoutTransform(matrix)
            me.fire('layoutapply', {
              node: node,
              matrix: matrix,
            })
          }
          
          // 第一步：收集所有需要更新的节点和矩阵
          function collectUpdates(node, pMatrix) {
            let matrix = node.getLayoutTransform().merge(pMatrix.clone())
            let lastMatrix = node.getGlobalLayoutTransform() || new kity.Matrix()
            let offset = node.getLayoutOffset()
            matrix.translate(offset.x, offset.y)
            matrix.m.e = Math.round(matrix.m.e)
            matrix.m.f = Math.round(matrix.m.f)
            
            // 停止旧动画
            if (node._layoutTimeline) {
              node._layoutTimeline.stop()
              node._layoutTimeline = null
            }
            
            // 收集更新信息
            updates.push({
              node: node,
              matrix: matrix,
              lastMatrix: lastMatrix
            })
            updateCount++
            
            // 只递归展开的节点（性能优化）
            if (node.isExpanded()) {
              for (let i = 0; i < node.children.length; i++) {
                collectUpdates(node.children[i], matrix)
              }
            }
          }
          
          // 收集所有更新
          collectUpdates(root, root.parent ? root.parent.getGlobalLayoutTransform() : new kity.Matrix())
          
          // Bug修复：使用实际更新的节点数，而不是 getComplex()
          let complex = updateCount
          
          function consume() {
            if (!--complex) {
              if (callback) {
                callback()
              }
            }
          }
          
          // 节点复杂度大于 200，关闭动画
          if (updateCount > 200) duration = 0
          
          // 第二步：批量应用更新
          if (duration) {
            // 有动画：为每个节点创建动画
            updates.forEach(function(update) {
              update.node._layoutTimeline = new kity.Animator(update.lastMatrix, update.matrix, applyMatrix)
                .start(update.node, duration, 'ease')
                .on('finish', function () {
                  setTimeout(function () {
                    applyMatrix(update.node, update.matrix)
                    me.fire('layoutfinish', {
                      node: update.node,
                      matrix: update.matrix,
                    })
                    consume()
                  }, 150)
                })
            })
          } else {
            // 无动画：使用 requestAnimationFrame 批量更新
            // 性能优化：在一帧内批量应用所有DOM更新
            requestAnimationFrame(function() {
              // 批量应用所有矩阵变换
              updates.forEach(function(update) {
                applyMatrix(update.node, update.matrix)
                me.fire('layoutfinish', {
                  node: update.node,
                  matrix: update.matrix,
                })
                consume()
              })
            })
          }
          
          return this
        },
      })
      module.exports = Layout
    },
  }

  //src/core/minder.js
  /**
   * @fileOverview
   *
   * KityMinder 类，暴露在 window 上的唯一变量
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[19] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let _initHooks = []
      let Minder = kity.createClass('Minder', {
        constructor: function (options) {
          this._options = utils.extend({}, options)
          let initHooks = _initHooks.slice()
          let initHook
          while (initHooks.length) {
            initHook = initHooks.shift()
            if (typeof initHook == 'function') {
              initHook.call(this, this._options)
            }
          }
          this.fire('finishInitHook')
        },
      })
      Minder.version = '1.4.43'
      Minder.registerInitHook = function (hook) {
        _initHooks.push(hook)
      }
      module.exports = Minder
    },
  }

  //src/core/module.js
  _p[20] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      /* 已注册的模块 */
      let _modules = {}
      exports.register = function (name, module) {
        _modules[name] = module
      }
      /* 模块初始化 */
      Minder.registerInitHook(function () {
        this._initModules()
      })
      // 模块声明周期维护
      kity.extendClass(Minder, {
        _initModules: function () {
          let modulesPool = _modules
          let modulesToLoad = this._options.modules || utils.keys(modulesPool)
          this._commands = {}
          this._query = {}
          this._modules = {}
          this._rendererClasses = {}
          let i, name, type, module, moduleDeals, dealCommands, dealEvents, dealRenderers
          let me = this
          for (i = 0; i < modulesToLoad.length; i++) {
            name = modulesToLoad[i]
            if (!modulesPool[name]) continue
            // 执行模块初始化，抛出后续处理对象
            if (typeof modulesPool[name] == 'function') {
              moduleDeals = modulesPool[name].call(me)
            } else {
              moduleDeals = modulesPool[name]
            }
            this._modules[name] = moduleDeals
            if (!moduleDeals) continue
            if (moduleDeals.defaultOptions) {
              me.setDefaultOptions(moduleDeals.defaultOptions)
            }
            if (moduleDeals.init) {
              moduleDeals.init.call(me, this._options)
            }
            /**
             * @Desc: 判断是否支持原生clipboard事件，如果支持，则对pager添加其监听
             * @Editor: Naixor
             * @Date: 2015.9.20
             */
            /**
             * 由于当前脑图解构问题，clipboard暂时全权交由玩不托管
             * @Editor: Naixor
             * @Date: 2015.9.24
             */
            // if (name === 'ClipboardModule' && this.supportClipboardEvent  && !kity.Browser.gecko) {
            //     var on = function () {
            //         var clipBoardReceiver = this.clipBoardReceiver || document;
            //         if (document.addEventListener) {
            //             clipBoardReceiver.addEventListener.apply(this, arguments);
            //         } else {
            //             arguments[0] = 'on' + arguments[0];
            //             clipBoardReceiver.attachEvent.apply(this, arguments);
            //         }
            //     }
            //     for (var command in moduleDeals.clipBoardEvents) {
            //         on(command, moduleDeals.clipBoardEvents[command]);
            //     }
            // };
            // command加入命令池子
            dealCommands = moduleDeals.commands
            for (name in dealCommands) {
              this._commands[name.toLowerCase()] = new dealCommands[name]()
            }
            // 绑定事件
            dealEvents = moduleDeals.events
            if (dealEvents) {
              for (type in dealEvents) {
                me.on(type, dealEvents[type])
              }
            }
            // 渲染器
            dealRenderers = moduleDeals.renderers
            if (dealRenderers) {
              for (type in dealRenderers) {
                this._rendererClasses[type] = this._rendererClasses[type] || []
                if (utils.isArray(dealRenderers[type])) {
                  this._rendererClasses[type] = this._rendererClasses[type].concat(
                    dealRenderers[type],
                  )
                } else {
                  this._rendererClasses[type].push(dealRenderers[type])
                }
              }
            }
            //添加模块的快捷键
            if (moduleDeals.commandShortcutKeys) {
              this.addCommandShortcutKeys(moduleDeals.commandShortcutKeys)
            }
          }
        },
        _garbage: function () {
          this.clearSelect()
          while (this._root.getChildren().length) {
            this._root.removeChild(0)
          }
        },
        destroy: function () {
          let modules = this._modules
          this._resetEvents()
          this._garbage()
          for (let key in modules) {
            if (!modules[key].destroy) continue
            modules[key].destroy.call(this)
          }
        },
        reset: function () {
          let modules = this._modules
          this._garbage()
          for (let key in modules) {
            if (!modules[key].reset) continue
            modules[key].reset.call(this)
          }
        },
      })
    },
  }

  //src/core/node.js
  _p[21] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      /**
       * @class MinderNode
       *
       * 表示一个脑图节点
       */
      var MinderNode = kity.createClass('MinderNode', {
        /**
         * 创建一个游离的脑图节点
         *
         * @param {String|Object} textOrData
         *     节点的初始数据或文本
         */
        constructor: function (textOrData) {
          // 指针
          this.parent = null
          this.root = this
          this.children = []
          // 数据
          this.data = {
            id: utils.guid(),
            created: +new Date(),
          }
          // 绘图容器
          this.initContainers()
          if (utils.isString(textOrData)) {
            this.setText(textOrData)
          } else if (utils.isObject(textOrData)) {
            utils.extend(this.data, textOrData)
          }
        },
        initContainers: function () {
          this.rc = new kity.Group().setId(utils.uuid('minder_node'))
          this.rc.minderNode = this
        },
        /**
         * 判断节点是否根节点
         */
        isRoot: function () {
          return this.root === this
        },
        /**
         * 判断节点是否叶子
         */
        isLeaf: function () {
          return this.children.length === 0
        },
        /**
         * 获取节点的根节点
         */
        getRoot: function () {
          return this.root || this
        },
        /**
         * 获得节点的父节点
         */
        getParent: function () {
          return this.parent
        },
        getSiblings: function () {
          let children = this.parent.children
          let siblings = []
          let self = this
          children.forEach(function (child) {
            if (child != self) siblings.push(child)
          })
          return siblings
        },
        /**
         * 获得节点的深度
         */
        getLevel: function () {
          let level = 0,
            ancestor = this.parent
          while (ancestor) {
            level++
            ancestor = ancestor.parent
          }
          return level
        },
        /**
         * 获得节点的复杂度（即子树中节点的数量）
         */
        getComplex: function () {
          let complex = 0
          this.traverse(function () {
            complex++
          })
          return complex
        },
        /**
         * 获得节点的类型（root|main|sub）
         */
        getType: function (type) {
          this.type = ['root', 'main', 'sub'][Math.min(this.getLevel(), 2)]
          return this.type
        },
        /**
         * 判断当前节点是否被测试节点的祖先
         * @param  {MinderNode}  test 被测试的节点
         */
        isAncestorOf: function (test) {
          let ancestor = test.parent
          while (ancestor) {
            if (ancestor == this) return true
            ancestor = ancestor.parent
          }
          return false
        },
        getData: function (key) {
          return key ? this.data[key] : this.data
        },
        removeData: function (key) {
          delete this.data[key]
        },
        setData: function (key, value) {
          if (typeof key == 'object') {
            let data = key
            for (key in data)
              if (data.hasOwnProperty(key)) {
                this.data[key] = data[key]
              }
          } else {
            this.data[key] = value
          }
          return this
        },
        /**
         * 设置节点的文本数据
         * @param {String} text 文本数据
         */
        setText: function (text) {
          return (this.data.text = text)
        },
        /**
         * 获取节点的文本数据
         * @return {String}
         */
        getText: function () {
          return this.data.text || null
        },
        /**
         * 先序遍历当前节点树
         * @param  {Function} fn 遍历函数
         */
        preTraverse: function (fn, excludeThis) {
          let children = this.getChildren()
          if (!excludeThis) fn(this)
          for (let i = 0; i < children.length; i++) {
            children[i].preTraverse(fn)
          }
        },
        /**
         * 后序遍历当前节点树
         * @param  {Function} fn 遍历函数
         */
        postTraverse: function (fn, excludeThis) {
          let children = this.getChildren()
          for (let i = 0; i < children.length; i++) {
            children[i].postTraverse(fn)
          }
          if (!excludeThis) fn(this)
        },
        traverse: function (fn, excludeThis) {
          return this.postTraverse(fn, excludeThis)
        },
        getChildren: function () {
          return this.children
        },
        getIndex: function () {
          return this.parent ? this.parent.children.indexOf(this) : -1
        },
        insertChild: function (node, index) {
          if (index === undefined) {
            index = this.children.length
          }
          if (node.parent) {
            node.parent.removeChild(node)
          }
          node.parent = this
          node.root = this.root
          this.children.splice(index, 0, node)
        },
        appendChild: function (node) {
          return this.insertChild(node)
        },
        prependChild: function (node) {
          return this.insertChild(node, 0)
        },
        removeChild: function (elem) {
          let index = elem,
            removed
          if (elem instanceof MinderNode) {
            index = this.children.indexOf(elem)
          }
          if (index >= 0) {
            removed = this.children.splice(index, 1)[0]
            removed.parent = null
            removed.root = removed
          }
        },
        clearChildren: function () {
          this.children = []
        },
        getChild: function (index) {
          return this.children[index]
        },
        getRenderContainer: function () {
          return this.rc
        },
        getCommonAncestor: function (node) {
          return MinderNode.getCommonAncestor(this, node)
        },
        contains: function (node) {
          return this == node || this.isAncestorOf(node)
        },
        clone: function () {
          let cloned = new MinderNode()
          cloned.data = utils.clone(this.data)
          this.children.forEach(function (child) {
            cloned.appendChild(child.clone())
          })
          return cloned
        },
        compareTo: function (node) {
          if (!utils.comparePlainObject(this.data, node.data)) return false
          if (!utils.comparePlainObject(this.temp, node.temp)) return false
          if (this.children.length != node.children.length) return false
          let i = 0
          while (this.children[i]) {
            if (!this.children[i].compareTo(node.children[i])) return false
            i++
          }
          return true
        },
        getMinder: function () {
          return this.getRoot().minder
        },
      })
      MinderNode.getCommonAncestor = function (nodeA, nodeB) {
        if (nodeA instanceof Array) {
          return MinderNode.getCommonAncestor.apply(this, nodeA)
        }
        switch (arguments.length) {
          case 1:
            return nodeA.parent || nodeA

          case 2:
            if (nodeA.isAncestorOf(nodeB)) {
              return nodeA
            }
            if (nodeB.isAncestorOf(nodeA)) {
              return nodeB
            }
            var ancestor = nodeA.parent
            while (ancestor && !ancestor.isAncestorOf(nodeB)) {
              ancestor = ancestor.parent
            }
            return ancestor

          default:
            return Array.prototype.reduce.call(
              arguments,
              function (prev, current) {
                return MinderNode.getCommonAncestor(prev, current)
              },
              nodeA,
            )
        }
      }
      kity.extendClass(Minder, {
        getRoot: function () {
          return this._root
        },
        setRoot: function (root) {
          this._root = root
          root.minder = this
        },
        getAllNode: function () {
          let nodes = []
          this.getRoot().traverse(function (node) {
            nodes.push(node)
          })
          return nodes
        },
        getNodeById: function (id) {
          return this.getNodesById([id])[0]
        },
        getNodesById: function (ids) {
          let nodes = this.getAllNode()
          let result = []
          nodes.forEach(function (node) {
            if (ids.indexOf(node.getData('id')) != -1) {
              result.push(node)
            }
          })
          return result
        },
        createNode: function (textOrData, parent, index) {
          let node = new MinderNode(textOrData)
          this.fire('nodecreate', {
            node: node,
            parent: parent,
            index: index,
          })
          this.appendNode(node, parent, index)
          return node
        },
        appendNode: function (node, parent, index) {
          if (parent) parent.insertChild(node, index)
          this.attachNode(node)
          return this
        },
        removeNode: function (node) {
          if (node.parent) {
            node.parent.removeChild(node)
            this.detachNode(node)
            this.fire('noderemove', {
              node: node,
            })
          }
        },
        attachNode: function (node) {
          let rc = this.getRenderContainer()
          node.traverse(function (current) {
            current.attached = true
            rc.addShape(current.getRenderContainer())
          })
          rc.addShape(node.getRenderContainer())
          this.fire('nodeattach', {
            node: node,
          })
        },
        detachNode: function (node) {
          let rc = this.getRenderContainer()
          node.traverse(function (current) {
            current.attached = false
            rc.removeShape(current.getRenderContainer())
          })
          this.fire('nodedetach', {
            node: node,
          })
        },
        getMinderTitle: function () {
          return this.getRoot().getText()
        },
      })
      module.exports = MinderNode
    },
  }

  //src/core/option.js
  /**
   * @fileOverview
   *
   * 提供脑图选项支持
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[22] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      Minder.registerInitHook(function (options) {
        this._defaultOptions = {}
      })
      kity.extendClass(Minder, {
        setDefaultOptions: function (options) {
          utils.extend(this._defaultOptions, options)
          return this
        },
        getOption: function (key) {
          if (key) {
            return key in this._options ? this._options[key] : this._defaultOptions[key]
          } else {
            return utils.extend({}, this._defaultOptions, this._options)
          }
        },
        setOption: function (key, value) {
          this._options[key] = value
        },
      })
    },
  }

  //src/core/paper.js
  /**
   * @fileOverview
   *
   * 初始化渲染容器
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[23] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      Minder.registerInitHook(function () {
        this._initPaper()
      })
      kity.extendClass(Minder, {
        _initPaper: function () {
          this._paper = new kity.Paper()
          this._paper._minder = this
          this._paper.getNode().ondragstart = function (e) {
            e.preventDefault()
          }
          this._paper.shapeNode.setAttribute('transform', 'translate(0.5, 0.5)')
          this._addRenderContainer()
          this.setRoot(this.createNode())
          if (this._options.renderTo) {
            this.renderTo(this._options.renderTo)
          }
        },
        _addRenderContainer: function () {
          this._rc = new kity.Group().setId(utils.uuid('minder'))
          this._paper.addShape(this._rc)
        },
        renderTo: function (target) {
          if (typeof target == 'string') {
            target = document.querySelector(target)
          }
          if (target) {
            if (target.tagName.toLowerCase() == 'script') {
              let newTarget = document.createElement('div')
              newTarget.id = target.id
              newTarget.class = target.class
              target.parentNode.insertBefore(newTarget, target)
              target.parentNode.removeChild(target)
              target = newTarget
            }
            target.classList.add('km-view')
            this._paper.renderTo((this._renderTarget = target))
            this._bindEvents()
            this.fire('paperrender')
          }
          return this
        },
        getRenderContainer: function () {
          return this._rc
        },
        getPaper: function () {
          return this._paper
        },
        getRenderTarget: function () {
          return this._renderTarget
        },
      })
    },
  }

  //src/core/patch.js
  /**
   * @fileOverview
   *
   * 打补丁
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[24] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let Minder = _p.r(19)
      function insertNode(minder, info, parent, index) {
        parent = minder.createNode(info.data, parent, index)
        info.children.forEach(function (childInfo, index) {
          insertNode(minder, childInfo, parent, index)
        })
        return parent
      }
      function applyPatch(minder, patch) {
        // patch.op - 操作，包括 remove, add, replace
        // patch.path - 路径，如 '/root/children/1/data'
        // patch.value - 数据，如 { text: "思路" }
        let path = patch.path.split('/')
        path.shift()
        let changed = path.shift()
        let node
        if (changed == 'root') {
          let dataIndex = path.indexOf('data')
          if (dataIndex > -1) {
            changed = 'data'
            let dataPath = path.splice(dataIndex + 1)
            patch.dataPath = dataPath
          } else {
            changed = 'node'
          }
          node = minder.getRoot()
          let segment, index
          while ((segment = path.shift())) {
            if (segment == 'children') continue
            if (typeof index != 'undefined') node = node.getChild(index)
            index = +segment
          }
          patch.index = index
          patch.node = node
        }
        let express = (patch.express = [changed, patch.op].join('.'))
        switch (express) {
          case 'theme.replace':
            minder.fire('themechange', patch.value)
            minder.useTheme(patch.value)
            break

          case 'template.replace':
            minder.useTemplate(patch.value)
            break

          case 'node.add':
            insertNode(minder, patch.value, patch.node, patch.index).renderTree()
            minder.layout()
            break

          case 'node.remove':
            minder.removeNode(patch.node.getChild(patch.index))
            minder.layout()
            break

          case 'base.replace':
            minder.setBase(patch.value)
            break

          case 'data.add':
          case 'data.replace':
          case 'data.remove':
            var data = patch.node.data
            var field
            path = patch.dataPath.slice()
            while (data && path.length > 1) {
              field = path.shift()
              if (field in data) {
                data = data[field]
              } else if (patch.op != 'remove') {
                data = data[field] = {}
              }
            }
            if (data) {
              field = path.shift()
              if (patch.op == 'remove') {
                data[field] = null
              } else {
                data[field] = patch.value
              }
            }
            if (field == 'expandState') {
              node.renderTree()
            } else {
              node.render()
            }
            minder.layout()
        }
        minder.fire('patch', {
          patch: patch,
        })
      }
      kity.extendClass(Minder, {
        applyPatches: function (patches) {
          for (let i = 0; i < patches.length; i++) {
            applyPatch(this, patches[i])
          }
          // alert(88)
          this.fire('contentchange')
          return this
        },
      })
    },
  }

  //src/core/promise.js
  _p[25] = {
    value: function (require, exports, module) {
      /*!
       **  Thenable -- Embeddable Minimum Strictly-Compliant Promises/A+ 1.1.1 Thenable
       **  Copyright (c) 2013-2014 Ralf S. Engelschall <http://engelschall.com>
       **  Licensed under The MIT License <http://opensource.org/licenses/MIT>
       **  Source-Code distributed on <http://github.com/rse/thenable>
       */
      /*  promise states [Promises/A+ 2.1]  */
      let STATE_PENDING = 0
      /*  [Promises/A+ 2.1.1]  */
      let STATE_FULFILLED = 1
      /*  [Promises/A+ 2.1.2]  */
      let STATE_REJECTED = 2
      /*  [Promises/A+ 2.1.3]  */
      /*  promise object constructor  */
      var Promise = function (executor) {
        /*  optionally support non-constructor/plain-function call  */
        if (!(this instanceof Promise)) return new Promise(executor)
        /*  initialize object  */
        this.id = 'Thenable/1.0.7'
        this.state = STATE_PENDING
        /*  initial state  */
        this.fulfillValue = undefined
        /*  initial value  */
        /*  [Promises/A+ 1.3, 2.1.2.2]  */
        this.rejectReason = undefined
        /*  initial reason */
        /*  [Promises/A+ 1.5, 2.1.3.2]  */
        this.onFulfilled = []
        /*  initial handlers  */
        this.onRejected = []
        /*  initial handlers  */
        /*  support optional executor function  */
        if (typeof executor === 'function')
          executor.call(this, this.fulfill.bind(this), this.reject.bind(this))
      }
      /*  Promise API methods  */
      Promise.prototype = {
        /*  promise resolving methods  */
        fulfill: function (value) {
          return deliver(this, STATE_FULFILLED, 'fulfillValue', value)
        },
        reject: function (value) {
          return deliver(this, STATE_REJECTED, 'rejectReason', value)
        },
        /*  'The then Method' [Promises/A+ 1.1, 1.2, 2.2]  */
        then: function (onFulfilled, onRejected) {
          let curr = this
          let next = new Promise()
          /*  [Promises/A+ 2.2.7]  */
          curr.onFulfilled.push(resolver(onFulfilled, next, 'fulfill'))
          /*  [Promises/A+ 2.2.2/2.2.6]  */
          curr.onRejected.push(resolver(onRejected, next, 'reject'))
          /*  [Promises/A+ 2.2.3/2.2.6]  */
          execute(curr)
          return next
        },
      }
      Promise.all = function (arr) {
        return new Promise(function (resolve, reject) {
          let len = arr.length,
            i = 0,
            res = 0,
            results = []
          if (len === 0) {
            resolve(results)
          }
          while (i < len) {
            arr[i].then(
              function (result) {
                results.push(result)
                if (++res === len) {
                  resolve(results)
                }
              },
              function (val) {
                reject(val)
              },
            )
            i++
          }
        })
      }
      /*  deliver an action  */
      var deliver = function (curr, state, name, value) {
        if (curr.state === STATE_PENDING) {
          curr.state = state
          /*  [Promises/A+ 2.1.2.1, 2.1.3.1]  */
          curr[name] = value
          /*  [Promises/A+ 2.1.2.2, 2.1.3.2]  */
          execute(curr)
        }
        return curr
      }
      /*  execute all handlers  */
      var execute = function (curr) {
        if (curr.state === STATE_FULFILLED) execute_handlers(curr, 'onFulfilled', curr.fulfillValue)
        else if (curr.state === STATE_REJECTED)
          execute_handlers(curr, 'onRejected', curr.rejectReason)
      }
      /*  execute particular set of handlers  */
      var execute_handlers = function (curr, name, value) {
        /* global process: true */
        /* global setImmediate: true */
        /* global setTimeout: true */
        /*  short-circuit processing  */
        if (curr[name].length === 0) return
        /*  iterate over all handlers, exactly once  */
        let handlers = curr[name]
        curr[name] = []
        /*  [Promises/A+ 2.2.2.3, 2.2.3.3]  */
        let func = function () {
          for (let i = 0; i < handlers.length; i++) handlers[i](value)
        }
        /*  execute procedure asynchronously  */
        /*  [Promises/A+ 2.2.4, 3.1]  */
        if (typeof process === 'object' && typeof process.nextTick === 'function')
          process.nextTick(func)
        else if (typeof setImmediate === 'function') setImmediate(func)
        else setTimeout(func, 0)
      }
      /*  generate a resolver function */
      var resolver = function (cb, next, method) {
        return function (value) {
          if (typeof cb !== 'function')
            /*  [Promises/A+ 2.2.1, 2.2.7.3, 2.2.7.4]  */
            next[method].call(next, value)
          else {
            let result
            try {
              if (value instanceof Promise) {
                result = value.then(cb)
              } else result = cb(value)
            } catch (e) {
              /*  [Promises/A+ 2.2.2.1, 2.2.3.1, 2.2.5, 3.2]  */
              next.reject(e)
              /*  [Promises/A+ 2.2.7.2]  */
              return
            }
            resolve(next, result)
          }
        }
      }
      /*  'Promise Resolution Procedure'  */
      /*  [Promises/A+ 2.3]  */
      var resolve = function (promise, x) {
        /*  sanity check arguments  */
        /*  [Promises/A+ 2.3.1]  */
        if (promise === x) {
          promise.reject(new TypeError('cannot resolve promise with itself'))
          return
        }
        /*  surgically check for a 'then' method
            (mainly to just call the 'getter' of 'then' only once)  */
        let then
        if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
          try {
            then = x.then
          } catch (e) {
            /*  [Promises/A+ 2.3.3.1, 3.5]  */
            promise.reject(e)
            /*  [Promises/A+ 2.3.3.2]  */
            return
          }
        }
        /*  handle own Thenables    [Promises/A+ 2.3.2]
            and similar 'thenables' [Promises/A+ 2.3.3]  */
        if (typeof then === 'function') {
          let resolved = false
          try {
            /*  call retrieved 'then' method */
            /*  [Promises/A+ 2.3.3.3]  */
            then.call(
              x /*  resolvePromise  */,
              /*  [Promises/A+ 2.3.3.3.1]  */
              function (y) {
                if (resolved) return
                resolved = true
                /*  [Promises/A+ 2.3.3.3.3]  */
                if (y === x)
                  /*  [Promises/A+ 3.6]  */
                  promise.reject(new TypeError('circular thenable chain'))
                else resolve(promise, y)
              } /*  rejectPromise  */,
              /*  [Promises/A+ 2.3.3.3.2]  */
              function (r) {
                if (resolved) return
                resolved = true
                /*  [Promises/A+ 2.3.3.3.3]  */
                promise.reject(r)
              },
            )
          } catch (e) {
            if (!resolved) /*  [Promises/A+ 2.3.3.3.3]  */ promise.reject(e)
          }
          return
        }
        /*  handle other values  */
        promise.fulfill(x)
      }
      Promise.resolve = function (value) {
        return new Promise(function (resolve) {
          resolve(value)
        })
      }
      Promise.reject = function (reason) {
        return new Promise(function (resolve, reject) {
          reject(reason)
        })
      }
      /*  export API  */
      module.exports = Promise
    },
  }

  //src/core/readonly.js
  /**
   * @fileOverview
   *
   * 只读模式支持
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[26] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let Minder = _p.r(19)
      let MinderEvent = _p.r(13)
      Minder.registerInitHook(function (options) {
        if (options.readOnly) {
          this.setDisabled()
        }
      })
      kity.extendClass(Minder, {
        disable: function () {
          let me = this
          //禁用命令
          me.bkqueryCommandState = me.queryCommandState
          me.bkqueryCommandValue = me.queryCommandValue
          me.queryCommandState = function (type) {
            let cmd = this._getCommand(type)
            if (cmd && cmd.enableReadOnly) {
              return me.bkqueryCommandState.apply(me, arguments)
            }
            return -1
          }
          me.queryCommandValue = function (type) {
            let cmd = this._getCommand(type)
            if (cmd && cmd.enableReadOnly) {
              return me.bkqueryCommandValue.apply(me, arguments)
            }
            return null
          }
          this.setStatus('readonly')
          me._interactChange()
        },
        enable: function () {
          let me = this
          if (me.bkqueryCommandState) {
            me.queryCommandState = me.bkqueryCommandState
            delete me.bkqueryCommandState
          }
          if (me.bkqueryCommandValue) {
            me.queryCommandValue = me.bkqueryCommandValue
            delete me.bkqueryCommandValue
          }
          this.setStatus('normal')
          me._interactChange()
        },
      })
    },
  }

  //src/core/render.js
  _p[27] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Renderer = kity.createClass('Renderer', {
        constructor: function (node) {
          this.node = node
        },
        create: function (node) {
          throw new Error('Not implement: Renderer.create()')
        },
        shouldRender: function (node) {
          return true
        },
        watchChange: function (data) {
          let changed
          if (this.watchingData === undefined) {
            changed = true
          } else if (this.watchingData != data) {
            changed = true
          } else {
            changed = false
          }
          this.watchingData = data
        },
        shouldDraw: function (node) {
          return true
        },
        update: function (shape, node, box) {
          if (this.shouldDraw()) this.draw(shape, node)
          return this.place(shape, node, box)
        },
        draw: function (shape, node) {
          throw new Error('Not implement: Renderer.draw()')
        },
        place: function (shape, node, box) {
          throw new Error('Not implement: Renderer.place()')
        },
        getRenderShape: function () {
          return this._renderShape || null
        },
        setRenderShape: function (shape) {
          this._renderShape = shape
        },
      })
      function createMinderExtension() {
        function createRendererForNode(node, registered) {
          let renderers = []
            ;['center', 'left', 'right', 'top', 'bottom', 'outline', 'outside'].forEach(function (
              section,
            ) {
              let before = 'before' + section
              let after = 'after' + section
              if (registered[before]) {
                renderers = renderers.concat(registered[before])
              }
              if (registered[section]) {
                renderers = renderers.concat(registered[section])
              }
              if (registered[after]) {
                renderers = renderers.concat(registered[after])
              }
            })
          node._renderers = renderers.map(function (Renderer) {
            return new Renderer(node)
          })
        }
        return {
          renderNodeBatch: function (nodes) {
            let rendererClasses = this._rendererClasses
            let lastBoxes = []
            let rendererCount = 0
            let i, j, renderer, node
            if (!nodes.length) return
            for (j = 0; j < nodes.length; j++) {
              node = nodes[j]
              if (!node._renderers) {
                createRendererForNode(node, rendererClasses)
              }
              node._contentBox = new kity.Box()
              this.fire('beforerender', {
                node: node,
              })
            }
            // 所有节点渲染器数量是一致的
            rendererCount = nodes[0]._renderers.length
            for (i = 0; i < rendererCount; i++) {
              // 获取延迟盒子数据
              for (j = 0; j < nodes.length; j++) {
                if (typeof lastBoxes[j] == 'function') {
                  lastBoxes[j] = lastBoxes[j]()
                }
                if (!(lastBoxes[j] instanceof kity.Box)) {
                  lastBoxes[j] = new kity.Box(lastBoxes[j])
                }
              }
              for (j = 0; j < nodes.length; j++) {
                node = nodes[j]
                renderer = node._renderers[i]
                // 合并盒子
                if (lastBoxes[j]) {
                  node._contentBox = node._contentBox.merge(lastBoxes[j])
                  renderer.contentBox = lastBoxes[j]
                }
                // 判断当前上下文是否应该渲染
                if (renderer.shouldRender(node)) {
                  // 应该渲染，但是渲染图形没创建过，需要创建
                  if (!renderer.getRenderShape()) {
                    renderer.setRenderShape(renderer.create(node))
                    if (renderer.bringToBack) {
                      node.getRenderContainer().prependShape(renderer.getRenderShape())
                    } else {
                      node.getRenderContainer().appendShape(renderer.getRenderShape())
                    }
                  }
                  // 强制让渲染图形显示
                  renderer.getRenderShape().setVisible(true)
                  // 更新渲染图形
                  lastBoxes[j] = renderer.update(renderer.getRenderShape(), node, node._contentBox)
                } else if (renderer.getRenderShape()) {
                  renderer.getRenderShape().setVisible(false)
                  lastBoxes[j] = null
                }
              }
            }
            for (j = 0; j < nodes.length; j++) {
              this.fire('noderender', {
                node: nodes[j],
              })
            }
          },
          renderNode: function (node) {
            let rendererClasses = this._rendererClasses
            let i, latestBox, renderer
            if (!node._renderers) {
              createRendererForNode(node, rendererClasses)
            }
            this.fire('beforerender', {
              node: node,
            })
            node._contentBox = new kity.Box()
            node._renderers.forEach(function (renderer) {
              // 判断当前上下文是否应该渲染
              if (renderer.shouldRender(node)) {
                // 应该渲染，但是渲染图形没创建过，需要创建
                if (!renderer.getRenderShape()) {
                  renderer.setRenderShape(renderer.create(node))
                  if (renderer.bringToBack) {
                    node.getRenderContainer().prependShape(renderer.getRenderShape())
                  } else {
                    node.getRenderContainer().appendShape(renderer.getRenderShape())
                  }
                }
                // 强制让渲染图形显示
                renderer.getRenderShape().setVisible(true)
                // 更新渲染图形
                latestBox = renderer.update(renderer.getRenderShape(), node, node._contentBox)
                if (typeof latestBox == 'function') latestBox = latestBox()
                // 合并渲染区域
                if (latestBox) {
                  node._contentBox = node._contentBox.merge(latestBox)
                  renderer.contentBox = latestBox
                }
              } else if (renderer.getRenderShape()) {
                renderer.getRenderShape().setVisible(false)
              }
            })
            this.fire('noderender', {
              node: node,
            })
          },
        }
      }
      kity.extendClass(Minder, createMinderExtension())
      kity.extendClass(MinderNode, {
        render: function () {
          if (!this.attached) return
          this.getMinder().renderNode(this)
          return this
        },
        renderTree: function () {
          if (!this.attached) return
          let list = []
          this.traverse(function (node) {
            list.push(node)
          })
          this.getMinder().renderNodeBatch(list)
          return this
        },
        getRenderer: function (type) {
          let rs = this._renderers
          if (!rs) return null
          for (let i = 0; i < rs.length; i++) {
            if (rs[i].getType() == type) return rs[i]
          }
          return null
        },
        getContentBox: function () {
          //if (!this._contentBox) this.render();
          return this.parent && this.parent.isCollapsed()
            ? new kity.Box()
            : this._contentBox || new kity.Box()
        },
        getRenderBox: function (rendererType, refer) {
          let renderer = rendererType && this.getRenderer(rendererType)
          let contentBox = renderer ? renderer.contentBox : this.getContentBox()
          let ctm = kity.Matrix.getCTM(this.getRenderContainer(), refer || 'paper')
          return ctm.transformBox(contentBox)
        },
      })
      module.exports = Renderer
    },
  }

  //src/core/select.js
  _p[28] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      Minder.registerInitHook(function () {
        this._initSelection()
      })
      // 选区管理
      kity.extendClass(Minder, {
        _initSelection: function () {
          this._selectedNodes = []
        },
        renderChangedSelection: function (last) {
          let current = this.getSelectedNodes()
          let changed = []
          current.forEach(function (node) {
            if (last.indexOf(node) == -1) {
              changed.push(node)
            }
          })
          last.forEach(function (node) {
            if (current.indexOf(node) == -1) {
              changed.push(node)
            }
          })
          if (changed.length) {
            this._interactChange()
            this.fire('selectionchange')
          }
          while (changed.length) {
            changed.shift().render()
          }
        },
        getSelectedNodes: function () {
          //不能克隆返回，会对当前选区操作，从而影响querycommand
          return this._selectedNodes
        },
        getSelectedNode: function () {
          return this.getSelectedNodes()[0] || null
        },
        removeAllSelectedNodes: function () {
          let me = this
          let last = this._selectedNodes.splice(0)
          this._selectedNodes = []
          this.renderChangedSelection(last)
          return this.fire('selectionclear')
        },
        removeSelectedNodes: function (nodes) {
          let me = this
          let last = this._selectedNodes.slice(0)
          nodes = utils.isArray(nodes) ? nodes : [nodes]
          nodes.forEach(function (node) {
            let index
            if ((index = me._selectedNodes.indexOf(node)) === -1) return
            me._selectedNodes.splice(index, 1)
          })
          this.renderChangedSelection(last)
          return this
        },
        select: function (nodes, isSingleSelect) {
          let lastSelect = this.getSelectedNodes().slice(0)
          if (isSingleSelect) {
            this._selectedNodes = []
          }
          let me = this
          nodes = utils.isArray(nodes) ? nodes : [nodes]
          nodes.forEach(function (node) {
            if (me._selectedNodes.indexOf(node) !== -1) return
            me._selectedNodes.unshift(node)
          })
          this.renderChangedSelection(lastSelect)
          return this
        },
        selectById: function (ids, isSingleSelect) {
          ids = utils.isArray(ids) ? ids : [ids]
          let nodes = this.getNodesById(ids)
          return this.select(nodes, isSingleSelect)
        },
        //当前选区中的节点在给定的节点范围内的保留选中状态，
        //没在给定范围的取消选中，给定范围中的但没在当前选中范围的也做选中效果
        toggleSelect: function (node) {
          if (utils.isArray(node)) {
            node.forEach(this.toggleSelect.bind(this))
          } else {
            if (node.isSelected()) this.removeSelectedNodes(node)
            else this.select(node)
          }
          return this
        },
        isSingleSelect: function () {
          return this._selectedNodes.length == 1
        },
        getSelectedAncestors: function (includeRoot) {
          let nodes = this.getSelectedNodes().slice(0),
            ancestors = [],
            judge
          // 根节点不参与计算
          let rootIndex = nodes.indexOf(this.getRoot())
          if (~rootIndex && !includeRoot) {
            nodes.splice(rootIndex, 1)
          }
          // 判断 nodes 列表中是否存在 judge 的祖先
          function hasAncestor(nodes, judge) {
            for (let i = nodes.length - 1; i >= 0; --i) {
              if (nodes[i].isAncestorOf(judge)) return true
            }
            return false
          }
          // 按照拓扑排序
          nodes.sort(function (node1, node2) {
            return node1.getLevel() - node2.getLevel()
          })
          // 因为是拓扑有序的，所以只需往上查找
          while ((judge = nodes.pop())) {
            if (!hasAncestor(nodes, judge)) {
              ancestors.push(judge)
            }
          }
          return ancestors
        },
      })
      kity.extendClass(MinderNode, {
        isSelected: function () {
          let minder = this.getMinder()
          return minder && minder.getSelectedNodes().indexOf(this) != -1
        },
      })
    },
  }

  //src/core/shortcut.js
  /**
   * @fileOverview
   *
   * 添加快捷键支持
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[29] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let keymap = _p.r(15)
      let Minder = _p.r(19)
      let MinderEvent = _p.r(13)
      /**
       * 计算包含 meta 键的 keycode
       *
       * @param  {String|KeyEvent} unknown
       */
      function getMetaKeyCode(unknown) {
        let CTRL_MASK = 4096
        let ALT_MASK = 8192
        let SHIFT_MASK = 16384
        let metaKeyCode = 0
        if (typeof unknown == 'string') {
          // unknown as string
          unknown
            .toLowerCase()
            .split(/\+\s*/)
            .forEach(function (name) {
              switch (name) {
                case 'ctrl':
                case 'cmd':
                  metaKeyCode |= CTRL_MASK
                  break

                case 'alt':
                  metaKeyCode |= ALT_MASK
                  break

                case 'shift':
                  metaKeyCode |= SHIFT_MASK
                  break

                default:
                  metaKeyCode |= keymap[name]
              }
            })
        } else {
          // unknown as key event
          if (unknown.ctrlKey || unknown.metaKey) {
            metaKeyCode |= CTRL_MASK
          }
          if (unknown.altKey) {
            metaKeyCode |= ALT_MASK
          }
          if (unknown.shiftKey) {
            metaKeyCode |= SHIFT_MASK
          }
          metaKeyCode |= unknown.keyCode
        }
        return metaKeyCode
      }
      kity.extendClass(MinderEvent, {
        isShortcutKey: function (keyCombine) {
          let keyEvent = this.originEvent
          if (!keyEvent) return false
          return getMetaKeyCode(keyCombine) == getMetaKeyCode(keyEvent)
        },
      })
      Minder.registerInitHook(function () {
        this._initShortcutKey()
      })
      kity.extendClass(Minder, {
        _initShortcutKey: function () {
          this._bindShortcutKeys()
        },
        _bindShortcutKeys: function () {
          let map = (this._shortcutKeys = {})
          let has = 'hasOwnProperty'
          this.on('keydown', function (e) {
            for (let keys in map) {
              if (!map[has](keys)) continue
              if (e.isShortcutKey(keys)) {
                let fn = map[keys]
                if (fn.__statusCondition && fn.__statusCondition != this.getStatus()) return
                fn()
                e.preventDefault()
              }
            }
          })
        },
        addShortcut: function (keys, fn) {
          let binds = this._shortcutKeys
          keys.split(/\|\s*/).forEach(function (combine) {
            let parts = combine.split('::')
            let status
            if (parts.length > 1) {
              combine = parts[1]
              status = parts[0]
              fn.__statusCondition = status
            }
            binds[combine] = fn
          })
        },
        addCommandShortcutKeys: function (cmd, keys) {
          let binds = this._commandShortcutKeys || (this._commandShortcutKeys = {})
          let obj = {},
            km = this
          if (keys) {
            obj[cmd] = keys
          } else {
            obj = cmd
          }
          let minder = this
          utils.each(obj, function (keys, command) {
            binds[command] = keys
            minder.addShortcut(keys, function execCommandByShortcut() {
              /**
               * 之前判断有问题，由 === 0 改为 !== -1
               * @editor Naixor
               * @Date 2015-12-2
               */
              if (minder.queryCommandState(command) !== -1) {
                minder.execCommand(command)
              }
            })
          })
        },
        getCommandShortcutKey: function (cmd) {
          let binds = this._commandShortcutKeys
          return (binds && binds[cmd]) || null
        },
        /**
         * @Desc: 添加一个判断是否支持原生Clipboard的变量，用于对ctrl + v和ctrl + c的处理
         * @Editor: Naixor
         * @Date: 2015.9.20
         */
        supportClipboardEvent: (function (window) {
          return !!window.ClipboardEvent
        })(window),
      })
    },
  }

  //src/core/status.js
  /**
   * @fileOverview
   *
   * 状态切换控制
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[30] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let Minder = _p.r(19)
      let sf = ~window.location.href.indexOf('status')
      let tf = ~window.location.href.indexOf('trace')
      Minder.registerInitHook(function () {
        this._initStatus()
      })
      kity.extendClass(Minder, {
        _initStatus: function () {
          this._status = 'normal'
          this._rollbackStatus = 'normal'
        },
        setStatus: function (status, force) {
          // 在 readonly 模式下，只有 force 为 true 才能切换回来
          if (this._status == 'readonly' && !force) return this
          if (status != this._status) {
            this._rollbackStatus = this._status
            this._status = status
            this.fire('statuschange', {
              lastStatus: this._rollbackStatus,
              currentStatus: this._status,
            })
            if (sf) {
              /* global console: true */
              console.log(window.event.type, this._rollbackStatus, '->', this._status)
              if (tf) {
                console.trace()
              }
            }
          }
          return this
        },
        rollbackStatus: function () {
          this.setStatus(this._rollbackStatus)
        },
        getRollbackStatus: function () {
          return this._rollbackStatus
        },
        getStatus: function () {
          return this._status
        },
      })
    },
  }

  //src/core/template.js
  _p[31] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let Command = _p.r(9)
      let MinderNode = _p.r(21)
      let Module = _p.r(20)
      let _templates = {}
      function register(name, supports) {
        _templates[name] = supports
      }
      exports.register = register
      utils.extend(Minder, {
        getTemplateList: function () {
          return _templates
        },
      })
      kity.extendClass(
        Minder,
        (function () {
          let originGetTheme = Minder.prototype.getTheme
          return {
            useTemplate: function (name, duration) {
              this.setTemplate(name)
              setTimeout(() => {
                this.refresh(duration || 800)
              }, 300)
            },
            getTemplate: function () {
              return this._template || 'default'
            },
            setTemplate: function (name) {
              this._template = name || null
            },
            getTemplateSupport: function (method) {
              let supports = _templates[this.getTemplate()]
              return supports && supports[method]
            },
            getTheme: function (node) {
              let support = this.getTemplateSupport('getTheme') || originGetTheme
              return support.call(this, node)
            },
            getBase: function () {
              return this._base || 1
            },
            setBase: function (base) {
              this._base = base ? Number(base) : 0
            },
          }
        })(),
      )
      kity.extendClass(
        MinderNode,
        (function () {
          let originGetLayout = MinderNode.prototype.getLayout
          let originGetConnect = MinderNode.prototype.getConnect
          return {
            getLayout: function () {
              let support = this.getMinder().getTemplateSupport('getLayout') || originGetLayout
              return support.call(this, this)
            },
            getConnect: function () {
              let support =
                (this.getMinder() && this.getMinder().getTemplateSupport('getConnect')) ||
                originGetConnect
              return support.call(this, this)
            },
          }
        })(),
      )
      Module.register('TemplateModule', {
        /**
         * @command Template
         * @description 设置当前脑图的模板
         * @param {string} name 模板名称
         *    允许使用的模板可以使用 `kityminder.Minder.getTemplateList()` 查询
         * @state
         *   0: 始终可用
         * @return 返回当前的模板名称
         */
        commands: {
          template: kity.createClass('TemplateCommand', {
            base: Command,
            execute: function (minder, name) {
              minder.useTemplate(name)
              minder.execCommand('camera')
            },
            queryValue: function (minder) {
              return minder.getTemplate() || 'default'
            },
          }),
        },
      })
    },
  }

  //src/core/theme.js
  _p[32] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Module = _p.r(20)
      let Command = _p.r(9)
      let cssLikeValueMatcher = {
        left: function (value) {
          return (3 in value && value[3]) || (1 in value && value[1]) || value[0]
        },
        right: function (value) {
          return (1 in value && value[1]) || value[0]
        },
        top: function (value) {
          return value[0]
        },
        bottom: function (value) {
          return (2 in value && value[2]) || value[0]
        },
      }
      let _themes = {}
      /**
       * 注册一个主题
       *
       * @param  {String} name  主题的名称
       * @param  {Plain} theme 主题的样式描述
       *
       * @example
       *     Minder.registerTheme('default', {
       *         'root-color': 'red',
       *         'root-stroke': 'none',
       *         'root-padding': [10, 20]
       *     });
       */
      function register(name, theme) {
        _themes[name] = theme
      }
      exports.register = register
      utils.extend(Minder, {
        getThemeList: function () {
          return _themes
        },
      })
      kity.extendClass(Minder, {
        /**
         * 切换脑图实例上的主题
         * @param  {String} name 要使用的主题的名称
         */
        useTheme: function (name) {
          this.setTheme(name)
          setTimeout(() => {
            this.refresh(800)
          }, 300)
          return true
        },
        setTheme: function (name) {
          if (name && !_themes[name]) throw new Error('Theme ' + name + ' not exists!')
          let lastTheme = this._theme
          this._theme = name || null
          let container = this.getRenderTarget()
          if (container) {
            container.classList.remove('km-theme-' + lastTheme)
            if (name) {
              container.classList.add('km-theme-' + name)
            }
            container.style.background = this.getStyle('background')
          }
          this.fire('themechange', {
            theme: name,
          })
          return this
        },
        /**
         * 获取脑图实例上的当前主题
         * @return {[type]} [description]
         */
        getTheme: function (node) {
          return this._theme || this.getOption('defaultTheme') || 'fresh-blue'
        },
        getThemeItems: function (node) {
          let theme = this.getTheme(node)
          return _themes[this.getTheme(node)]
        },
        /**
         * 获得脑图实例上的样式
         * @param  {String} item 样式名称
         */
        getStyle: function (item, node) {
          let items = this.getThemeItems(node)
          let segment, dir, selector, value, matcher
          if (item in items) return items[item]
          // 尝试匹配 CSS 数组形式的值
          // 比如 item 为 'pading-left'
          // theme 里有 {'padding': [10, 20]} 的定义，则可以返回 20
          segment = item.split('-')
          if (segment.length < 2) return null
          dir = segment.pop()
          item = segment.join('-')
          if (item in items) {
            value = items[item]
            if (utils.isArray(value) && (matcher = cssLikeValueMatcher[dir])) {
              return matcher(value)
            }
            if (!isNaN(value)) return value
          }
          return null
        },
        /**
         * 获取指定节点的样式
         * @param  {String} name 样式名称，可以不加节点类型的前缀
         */
        getNodeStyle: function (node, name) {
          let value = this.getStyle(node.getType() + '-' + name, node)
          return value !== null ? value : this.getStyle(name, node)
        },
      })
      kity.extendClass(MinderNode, {
        getStyle: function (name) {
          return this.getMinder() ? this.getMinder().getNodeStyle(this, name) : null
        },
      })
      Module.register('Theme', {
        defaultOptions: {
          defaultTheme: 'fresh-blue',
        },
        commands: {
          /**
           * @command Theme
           * @description 设置当前脑图的主题
           * @param {string} name 主题名称
           *    允许使用的主题可以使用 `kityminder.Minder.getThemeList()` 查询
           * @state
           *   0: 始终可用
           * @return 返回当前的主题名称
           */
          theme: kity.createClass('ThemeCommand', {
            base: Command,
            execute: function (km, name) {
              return km.useTheme(name)
            },
            queryValue: function (km) {
              return km.getTheme() || 'default'
            },
          }),
        },
      })
      Minder.registerInitHook(function () {
        this.setTheme()
      })
    },
  }

  //src/core/utils.js
  _p[33] = {
    value: function (require, exports) {
      let kity = _p.r(17)
      let uuidMap = {}
      exports.extend = kity.Utils.extend.bind(kity.Utils)
      exports.each = kity.Utils.each.bind(kity.Utils)
      exports.uuid = function (group) {
        uuidMap[group] = uuidMap[group] ? uuidMap[group] + 1 : 1
        return group + uuidMap[group]
      }
      exports.guid = function () {
        //return (+new Date() * 1e6 + Math.floor(Math.random() * 1e6)).toString(36);
        //return Date.now().toString(36) + Math.random().toString(36).substring(2);
        //return uuid_short.generate();
        // return shortuid.rnd()

        return nanoid(10);

        //     return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        // (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        //);
      }
      exports.trim = function (str) {
        return str.replace(/(^[ \t\n\r]+)|([ \t\n\r]+$)/g, '')
      }
      exports.keys = function (plain) {
        let keys = []
        for (let key in plain) {
          if (plain.hasOwnProperty(key)) {
            keys.push(key)
          }
        }
        return keys
      }
      exports.clone = function (source) {
        return JSON.parse(JSON.stringify(source))
      }
      exports.comparePlainObject = function (a, b) {
        return JSON.stringify(a) == JSON.stringify(b)
      }
      exports.encodeHtml = function (str, reg) {
        return str
          ? str.replace(reg || /[&<">'](?:(amp|lt|quot|gt|#39|nbsp);)?/g, function (a, b) {
            if (b) {
              return a
            } else {
              return {
                '<': '&lt;',
                '&': '&amp;',
                '"': '&quot;',
                '>': '&gt;',
                "'": '&#39;',
              }[a]
            }
          })
          : ''
      }
      exports.clearWhiteSpace = function (str) {
        return str.replace(/[\u200b\t\r\n]/g, '')
      }
      exports.each(['String', 'Function', 'Array', 'Number', 'RegExp', 'Object'], function (v) {
        let toString = Object.prototype.toString
        exports['is' + v] = function (obj) {
          return toString.apply(obj) == '[object ' + v + ']'
        }
      })
    },
  }

  //src/expose-kityminder.js
  _p[34] = {
    value: function (require, exports, module) {
      module.exports = window.kityminder = _p.r(35)
    },
  }

  //src/kityminder.js
  /**
   * @fileOverview
   *
   * 默认导出（全部模块）
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[35] = {
    value: function (require, exports, module) {
      let kityminder = {
        version: _p.r(19).version,
      }
      // 核心导出，大写的部分导出类，小写的部分简单 require 一下
      // 这里顺序是有讲究的，调整前先弄清楚依赖关系。
      _p.r(33)

      kityminder.Minder = _p.r(19)
      kityminder.Command = _p.r(9)

      kityminder.Node = _p.r(21)

      _p.r(22)
      _p.r(8)
      kityminder.Event = _p.r(13)
      kityminder.data = _p.r(12)

      _p.r(10)
      kityminder.KeyMap = _p.r(15)

      _p.r(29)

      _p.r(30)
      _p.r(23)

      _p.r(28)
      _p.r(14)

      _p.r(16)

      kityminder.Module = _p.r(20)
      _p.r(26)
      kityminder.Render = _p.r(27)
      kityminder.Connect = _p.r(11)
      kityminder.Layout = _p.r(18)
      kityminder.Theme = _p.r(32)
      kityminder.Template = _p.r(31)
      kityminder.Promise = _p.r(25)

      _p.r(7)
      _p.r(24)
      // 模块依赖
      _p.r(42)
      _p.r(43)
      _p.r(44)
      _p.r(45)
      _p.r(46)
      _p.r(47)
      _p.r(48)
      _p.r(448)
      _p.r(50)
      _p.r(49)
      _p.r(51)
      _p.r(52)
      _p.r(53)
      _p.r(54)
      _p.r(55)
      _p.r(56)
      _p.r(57)
      _p.r(58)
      _p.r(59)
      _p.r(60)
      _p.r(61)
      _p.r(62)
      _p.r(63)
      _p.r(64)
      _p.r(68)
      _p.r(65)
      _p.r(67)
      _p.r(66)
      _p.r(40)
      _p.r(36)
      _p.r(37)
      _p.r(38)
      _p.r(39)
      _p.r(41)
      _p.r(75)
      _p.r(78)
      _p.r(77)
      _p.r(900)
      _p.r(901)
      _p.r(76)
      _p.r(78)
      _p.r(80)
      _p.r(79)
      _p.r(0)
      _p.r(1)
      _p.r(2)
      _p.r(3)
      _p.r(4)
      _p.r(5)
      _p.r(6)
      _p.r(69)
      _p.r(73)
      _p.r(70)
      _p.r(72)
      _p.r(71)
      _p.r(74)

      module.exports = kityminder
    },
  }

  //src/layout/btree.js
  _p[36] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let Layout = _p.r(18)
        ;['left', 'right', 'top', 'bottom'].forEach(registerLayoutForDirection)
      function registerLayoutForDirection(name) {
        let axis = name == 'left' || name == 'right' ? 'x' : 'y'
        let dir = name == 'left' || name == 'top' ? -1 : 1
        let oppsite = {
          left: 'right',
          right: 'left',
          top: 'bottom',
          bottom: 'top',
          x: 'y',
          y: 'x',
        }
        function getOrderHint(node) {
          let hint = []
          let box = node.getLayoutBox()
          let offset = 5
          if (axis == 'x') {
            hint.push({
              type: 'up',
              node: node,
              area: new kity.Box({
                x: box.x,
                y: box.top - node.getStyle('margin-top') - offset,
                width: box.width,
                height: node.getStyle('margin-top'),
              }),
              path: ['M', box.x, box.top - offset, 'L', box.right, box.top - offset],
            })
            hint.push({
              type: 'down',
              node: node,
              area: new kity.Box({
                x: box.x,
                y: box.bottom + offset,
                width: box.width,
                height: node.getStyle('margin-bottom'),
              }),
              path: ['M', box.x, box.bottom + offset, 'L', box.right, box.bottom + offset],
            })
          } else {
            hint.push({
              type: 'up',
              node: node,
              area: new kity.Box({
                x: box.left - node.getStyle('margin-left') - offset,
                y: box.top,
                width: node.getStyle('margin-left'),
                height: box.height,
              }),
              path: ['M', box.left - offset, box.top, 'L', box.left - offset, box.bottom],
            })
            hint.push({
              type: 'down',
              node: node,
              area: new kity.Box({
                x: box.right + offset,
                y: box.top,
                width: node.getStyle('margin-right'),
                height: box.height,
              }),
              path: ['M', box.right + offset, box.top, 'L', box.right + offset, box.bottom],
            })
          }
          return hint
        }
        Layout.register(
          name,
          kity.createClass({
            base: Layout,
            doLayout: function (parent, children) {
              let pbox = parent.getContentBox()
              if (axis == 'x') {
                parent.setVertexOut(new kity.Point(pbox[name], pbox.cy))
                parent.setLayoutVectorOut(new kity.Vector(dir, 0))
              } else {
                parent.setVertexOut(new kity.Point(pbox.cx, pbox[name]))
                parent.setLayoutVectorOut(new kity.Vector(0, dir))
              }
              if (!children.length) {
                return false
              }
              children.forEach(function (child) {
                let cbox = child.getContentBox()
                child.setLayoutTransform(new kity.Matrix())
                if (axis == 'x') {
                  child.setVertexIn(new kity.Point(cbox[oppsite[name]], cbox.cy))
                  child.setLayoutVectorIn(new kity.Vector(dir, 0))
                } else {
                  child.setVertexIn(new kity.Point(cbox.cx, cbox[oppsite[name]]))
                  child.setLayoutVectorIn(new kity.Vector(0, dir))
                }
              })
              this.align(children, oppsite[name])
              this.stack(children, oppsite[axis])
              let bbox = this.getBranchBox(children)
              let xAdjust = 0,
                yAdjust = 0
              if (axis == 'x') {
                xAdjust = pbox[name]
                xAdjust += dir * parent.getStyle('margin-' + name)
                xAdjust += dir * children[0].getStyle('margin-' + oppsite[name])
                yAdjust = pbox.bottom
                yAdjust -= pbox.height / 2
                yAdjust -= bbox.height / 2
                yAdjust -= bbox.y
              } else {
                xAdjust = pbox.right
                xAdjust -= pbox.width / 2
                xAdjust -= bbox.width / 2
                xAdjust -= bbox.x
                yAdjust = pbox[name]
                yAdjust += dir * parent.getStyle('margin-' + name)
                yAdjust += dir * children[0].getStyle('margin-' + oppsite[name])
              }
              this.move(children, xAdjust, yAdjust)
            },
            getOrderHint: getOrderHint,
          }),
        )
      }
    },
  }

  //src/layout/filetree.js
  _p[37] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let Layout = _p.r(18)
        ;[-1, 1].forEach(registerLayoutForDir)
      function registerLayoutForDir(dir) {
        let name = 'filetree-' + (dir > 0 ? 'down' : 'up')
        Layout.register(
          name,
          kity.createClass({
            base: Layout,
            doLayout: function (parent, children, round) {
              let pBox = parent.getContentBox()
              let indent = 20
              parent.setVertexOut(
                new kity.Point(pBox.left + indent, dir > 0 ? pBox.bottom : pBox.top),
              )
              parent.setLayoutVectorOut(new kity.Vector(0, dir))
              if (!children.length) return
              children.forEach(function (child) {
                let cbox = child.getContentBox()
                child.setLayoutTransform(new kity.Matrix())
                child.setVertexIn(new kity.Point(cbox.left, cbox.cy))
                child.setLayoutVectorIn(new kity.Vector(1, 0))
              })
              this.align(children, 'left')
              this.stack(children, 'y')
              let xAdjust = 0
              xAdjust += pBox.left
              xAdjust += indent
              xAdjust += children[0].getStyle('margin-left')
              let yAdjust = 0
              if (dir > 0) {
                yAdjust += pBox.bottom
                yAdjust += parent.getStyle('margin-bottom')
                yAdjust += children[0].getStyle('margin-top')
              } else {
                yAdjust -= this.getTreeBox(children).bottom
                yAdjust += pBox.top
                yAdjust -= parent.getStyle('margin-top')
                yAdjust -= children[0].getStyle('margin-bottom')
              }
              this.move(children, xAdjust, yAdjust)
            },
            getOrderHint: function (node) {
              let hint = []
              let box = node.getLayoutBox()
              let offset = node.getLevel() > 1 ? 3 : 5
              hint.push({
                type: 'up',
                node: node,
                area: new kity.Box({
                  x: box.x,
                  y: box.top - node.getStyle('margin-top') - offset,
                  width: box.width,
                  height: node.getStyle('margin-top'),
                }),
                path: ['M', box.x, box.top - offset, 'L', box.right, box.top - offset],
              })
              hint.push({
                type: 'down',
                node: node,
                area: new kity.Box({
                  x: box.x,
                  y: box.bottom + offset,
                  width: box.width,
                  height: node.getStyle('margin-bottom'),
                }),
                path: ['M', box.x, box.bottom + offset, 'L', box.right, box.bottom + offset],
              })
              return hint
            },
          }),
        )
      }
    },
  }

  //src/layout/fish-bone-master.js
  /**
   * @fileOverview
   *
   * 鱼骨图主骨架布局
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[38] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let Layout = _p.r(18)
      Layout.register(
        'fish-bone-master',
        kity.createClass('FishBoneMasterLayout', {
          base: Layout,
          doLayout: function (parent, children, round) {
            let upPart = [],
              downPart = []
            let child = children[0]
            let pBox = parent.getContentBox()
            parent.setVertexOut(new kity.Point(pBox.right, pBox.cy))
            parent.setLayoutVectorOut(new kity.Vector(1, 0))
            if (!child) return
            let cBox = child.getContentBox()
            let pMarginRight = parent.getStyle('margin-right')
            let cMarginLeft = child.getStyle('margin-left')
            let cMarginTop = child.getStyle('margin-top')
            let cMarginBottom = child.getStyle('margin-bottom')
            children.forEach(function (child, index) {
              child.setLayoutTransform(new kity.Matrix())
              let cBox = child.getContentBox()
              if (index % 2) {
                downPart.push(child)
                child.setVertexIn(new kity.Point(cBox.left, cBox.top))
                child.setLayoutVectorIn(new kity.Vector(1, 1))
              } else {
                upPart.push(child)
                child.setVertexIn(new kity.Point(cBox.left, cBox.bottom))
                child.setLayoutVectorIn(new kity.Vector(1, -1))
              }
            })
            this.stack(upPart, 'x')
            this.stack(downPart, 'x')
            this.align(upPart, 'bottom')
            this.align(downPart, 'top')
            let xAdjust = pBox.right + pMarginRight + cMarginLeft
            let yAdjustUp = pBox.cy - cMarginBottom - parent.getStyle('margin-top')
            let yAdjustDown = pBox.cy + cMarginTop + parent.getStyle('margin-bottom')
            this.move(upPart, xAdjust, yAdjustUp)
            this.move(downPart, xAdjust + cMarginLeft, yAdjustDown)
          },
        }),
      )
    },
  }

  //src/layout/fish-bone-slave.js
  /**
   * @fileOverview
   *
   *
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[39] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let Layout = _p.r(18)
      Layout.register(
        'fish-bone-slave',
        kity.createClass('FishBoneSlaveLayout', {
          base: Layout,
          doLayout: function (parent, children, round) {
            let layout = this
            let abs = Math.abs
            let GOLD_CUT = 1 - 0.618
            let pBox = parent.getContentBox()
            let vi = parent.getLayoutVectorIn()
            parent.setLayoutVectorOut(vi)
            let goldX = pBox.left + pBox.width * GOLD_CUT
            let pout = new kity.Point(goldX, vi.y > 0 ? pBox.bottom : pBox.top)
            parent.setVertexOut(pout)
            let child = children[0]
            if (!child) return
            let cBox = child.getContentBox()
            children.forEach(function (child, index) {
              child.setLayoutTransform(new kity.Matrix())
              child.setLayoutVectorIn(new kity.Vector(1, 0))
              child.setVertexIn(new kity.Point(cBox.left, cBox.cy))
            })
            this.stack(children, 'y')
            this.align(children, 'left')
            let xAdjust = 0,
              yAdjust = 0
            xAdjust += pout.x
            if (parent.getLayoutVectorOut().y < 0) {
              yAdjust -= this.getTreeBox(children).bottom
              yAdjust += parent.getContentBox().top
              yAdjust -= parent.getStyle('margin-top')
              yAdjust -= child.getStyle('margin-bottom')
            } else {
              yAdjust += parent.getContentBox().bottom
              yAdjust += parent.getStyle('margin-bottom')
              yAdjust += child.getStyle('margin-top')
            }
            this.move(children, xAdjust, yAdjust)
            if (round == 2) {
              children.forEach(function (child) {
                let m = child.getLayoutTransform()
                let cbox = child.getContentBox()
                let pin = m.transformPoint(new kity.Point(cbox.left, 0))
                layout.move([child], abs(pin.y - pout.y), 0)
              })
            }
          },
        }),
      )
    },
  }

  //src/layout/mind.js
  _p[40] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let Layout = _p.r(18)
      let Minder = _p.r(19)
      Layout.register(
        'mind',
        kity.createClass({
          base: Layout,
          doLayout: function (node, children) {
            let layout = this
            let half = Math.ceil(node.children.length / 2)
            let right = []
            let left = []
            children.forEach(function (child) {
              if (child.getIndex() < half) right.push(child)
              else left.push(child)
            })
            let leftLayout = Minder.getLayoutInstance('left')
            let rightLayout = Minder.getLayoutInstance('right')
            leftLayout.doLayout(node, left)
            rightLayout.doLayout(node, right)
            let box = node.getContentBox()
            node.setVertexOut(new kity.Point(box.cx, box.cy))
            node.setLayoutVectorOut(new kity.Vector(0, 0))
          },
          getOrderHint: function (node) {
            let hint = []
            let box = node.getLayoutBox()
            let offset = 5
            hint.push({
              type: 'up',
              node: node,
              area: new kity.Box({
                x: box.x,
                y: box.top - node.getStyle('margin-top') - offset,
                width: box.width,
                height: node.getStyle('margin-top'),
              }),
              path: ['M', box.x, box.top - offset, 'L', box.right, box.top - offset],
            })
            hint.push({
              type: 'down',
              node: node,
              area: new kity.Box({
                x: box.x,
                y: box.bottom + offset,
                width: box.width,
                height: node.getStyle('margin-bottom'),
              }),
              path: ['M', box.x, box.bottom + offset, 'L', box.right, box.bottom + offset],
            })
            return hint
          },
        }),
      )
    },
  }

  //src/layout/tianpan.js
  /**
   * @fileOverview
   *
   * 天盘模板
   *
   * @author: along
   * @copyright: bpd729@163.com, 2015
   */
  _p[41] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let Layout = _p.r(18)
      let Minder = _p.r(19)
      Layout.register(
        'tianpan',
        kity.createClass({
          base: Layout,
          doLayout: function (parent, children) {
            if (children.length == 0) return
            let layout = this
            let pbox = parent.getContentBox()
            let x, y, box
            let _theta = 5
            let _r = Math.max(pbox.width, 50)
            children.forEach(function (child, index) {
              child.setLayoutTransform(new kity.Matrix())
              box = layout.getTreeBox(child)
              _r = Math.max(Math.max(box.width, box.height), _r)
            })
            _r = _r / 1.5 / Math.PI
            children.forEach(function (child, index) {
              x = _r * (Math.cos(_theta) + Math.sin(_theta) * _theta)
              y = _r * (Math.sin(_theta) - Math.cos(_theta) * _theta)
              _theta += 0.9 - index * 0.02
              child.setLayoutVectorIn(new kity.Vector(1, 0))
              child.setVertexIn(new kity.Point(pbox.cx, pbox.cy))
              child.setLayoutTransform(new kity.Matrix())
              layout.move([child], x, y)
            })
          },
          getOrderHint: function (node) {
            let hint = []
            let box = node.getLayoutBox()
            let offset = 5
            hint.push({
              type: 'up',
              node: node,
              area: {
                x: box.x,
                y: box.top - node.getStyle('margin-top') - offset,
                width: box.width,
                height: node.getStyle('margin-top'),
              },
              path: ['M', box.x, box.top - offset, 'L', box.right, box.top - offset],
            })
            hint.push({
              type: 'down',
              node: node,
              area: {
                x: box.x,
                y: box.bottom + offset,
                width: box.width,
                height: node.getStyle('margin-bottom'),
              },
              path: ['M', box.x, box.bottom + offset, 'L', box.right, box.bottom + offset],
            })
            return hint
          },
        }),
      )
    },
  }

  //src/module/arrange.js
  _p[42] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      kity.extendClass(MinderNode, {
        arrange: function (index) {
          let parent = this.parent
          if (!parent) return
          let sibling = parent.children
          if (index < 0 || index >= sibling.length) return
          sibling.splice(this.getIndex(), 1)
          sibling.splice(index, 0, this)
          return this
        },
      })
      function asc(nodeA, nodeB) {
        return nodeA.getIndex() - nodeB.getIndex()
      }
      function desc(nodeA, nodeB) {
        return -asc(nodeA, nodeB)
      }
      function canArrange(km) {
        let selected = km.getSelectedNode()
        return selected && selected.parent && selected.parent.children.length > 1
      }
      /**
       * @command ArrangeUp
       * @description 向上调整选中节点的位置
       * @shortcut Alt + Up
       * @state
       *    0: 当前选中了具有相同父亲的节点
       *   -1: 其它情况
       */
      let ArrangeUpCommand = kity.createClass('ArrangeUpCommand', {
        base: Command,
        execute: function (km) {
          let nodes = km.getSelectedNodes()
          nodes.sort(asc)
          let lastIndexes = nodes.map(function (node) {
            return node.getIndex()
          })
          nodes.forEach(function (node, index) {
            node.arrange(lastIndexes[index] - 1)
          })
          km.layout(300)
        },
        queryState: function (km) {
          let selected = km.getSelectedNode()
          return selected ? 0 : -1
        },
      })
      /**
       * @command ArrangeDown
       * @description 向下调整选中节点的位置
       * @shortcut Alt + Down
       * @state
       *    0: 当前选中了具有相同父亲的节点
       *   -1: 其它情况
       */
      let ArrangeDownCommand = kity.createClass('ArrangeDownCommand', {
        base: Command,
        execute: function (km) {
          let nodes = km.getSelectedNodes()
          nodes.sort(desc)
          let lastIndexes = nodes.map(function (node) {
            return node.getIndex()
          })
          nodes.forEach(function (node, index) {
            node.arrange(lastIndexes[index] + 1)
          })
          km.layout(300)
        },
        queryState: function (km) {
          let selected = km.getSelectedNode()
          return selected ? 0 : -1
        },
      })
      /**
       * @command Arrange
       * @description 调整选中节点的位置
       * @param {number} index 调整后节点的新位置
       * @state
       *    0: 当前选中了具有相同父亲的节点
       *   -1: 其它情况
       */
      let ArrangeCommand = kity.createClass('ArrangeCommand', {
        base: Command,
        execute: function (km, index) {
          let nodes = km.getSelectedNodes().slice()
          if (!nodes.length) return
          let ancestor = MinderNode.getCommonAncestor(nodes)
          if (ancestor != nodes[0].parent) return
          let indexed = nodes.map(function (node) {
            return {
              index: node.getIndex(),
              node: node,
            }
          })
          let asc =
            Math.min.apply(
              Math,
              indexed.map(function (one) {
                return one.index
              }),
            ) >= index
          indexed.sort(function (a, b) {
            return asc ? b.index - a.index : a.index - b.index
          })
          indexed.forEach(function (one) {
            one.node.arrange(index)
          })
          km.layout(300)
        },
        queryState: function (km) {
          let selected = km.getSelectedNode()
          return selected ? 0 : -1
        },
      })
      Module.register('ArrangeModule', {
        commands: {
          arrangeup: ArrangeUpCommand,
          arrangedown: ArrangeDownCommand,
          arrange: ArrangeCommand,
        },
        contextmenu: [
          {
            command: 'arrangeup',
          },
          {
            command: 'arrangedown',
          },
          {
            divider: true,
          },
        ],
        commandShortcutKeys: {
          arrangeup: 'normal::alt+Up',
          arrangedown: 'normal::alt+Down',
        },
      })
    },
  }

  //src/module/basestyle.js
  _p[43] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let TextRenderer = _p.r(61)
      Module.register('basestylemodule', function () {
        let km = this
        function getNodeDataOrStyle(node, name) {
          return node.getData(name) || node.getStyle(name)
        }
        TextRenderer.registerStyleHook(function (node, textGroup) {
          let fontWeight = getNodeDataOrStyle(node, 'font-weight')
          let textDecoration = getNodeDataOrStyle(node, 'text-decoration')
          let fontStyle = getNodeDataOrStyle(node, 'font-style')
          let styleHash = [fontWeight, fontStyle].join('/')
          textGroup.eachItem(function (index, item) {
            item.setFont({
              weight: fontWeight,
              style: fontStyle,
            })
            item.setStyle('text-decoration', textDecoration)
          })
        })
        return {
          commands: {
            /**
             * @command Bold
             * @description 加粗选中的节点
             * @shortcut Ctrl + B
             * @state
             *   0: 当前有选中的节点
             *  -1: 当前没有选中的节点
             *   1: 当前已选中的节点已加粗
             */
            bold: kity.createClass('boldCommand', {
              base: Command,
              execute: function (km) {
                let nodes = km.getSelectedNodes()
                if (this.queryState('bold') == 1) {
                  nodes.forEach(function (n) {
                    n.setData('font-weight').render()
                  })
                } else {
                  nodes.forEach(function (n) {
                    n.setData('font-weight', 'bold').render()
                  })
                }
                km.layout()
              },
              queryState: function () {
                let nodes = km.getSelectedNodes(),
                  result = 0
                if (nodes.length === 0) {
                  return -1
                }
                nodes.forEach(function (n) {
                  if (n && n.getData('font-weight')) {
                    result = 1
                    return false
                  }
                })
                return result
              },
            }),
            /**
             * @command Italic
             * @description 加斜选中的节点
             * @shortcut Ctrl + I
             * @state
             *   0: 当前有选中的节点
             *  -1: 当前没有选中的节点
             *   1: 当前已选中的节点已加斜
             */
            italic: kity.createClass('italicCommand', {
              base: Command,
              execute: function (km) {
                let nodes = km.getSelectedNodes()
                if (this.queryState('italic') == 1) {
                  nodes.forEach(function (n) {
                    n.setData('font-style').render()
                  })
                } else {
                  nodes.forEach(function (n) {
                    n.setData('font-style', 'italic').render()
                  })
                }
                km.layout()
              },
              queryState: function () {
                let nodes = km.getSelectedNodes(),
                  result = 0
                if (nodes.length === 0) {
                  return -1
                }
                nodes.forEach(function (n) {
                  if (n && n.getData('font-style')) {
                    result = 1
                    return false
                  }
                })
                return result
              },
            }),
            /**
             * @command Del
             * @description 加删除线选中的节点
             * @shortcut Ctrl + D
             * @state
             *   0: 当前有选中的节点
             *  -1: 当前没有选中的节点
             *   1: 当前已选中的节点已删除
             */
            del: kity.createClass('delCommand', {
              base: Command,
              execute: function (km) {
                let nodes = km.getSelectedNodes()
                if (this.queryState('del') == 1) {
                  nodes.forEach(function (n) {
                    n.setData('text-decoration').render()
                  })
                } else {
                  nodes.forEach(function (n) {
                    n.setData('text-decoration', 'line-through').render()
                  })
                }
                km.layout()
              },
              queryState: function () {
                let nodes = km.getSelectedNodes(),
                  result = 0
                if (nodes.length === 0) {
                  return -1
                }
                nodes.forEach(function (n) {
                  if (n && n.getData('text-decoration')) {
                    result = 1
                    return false
                  }
                })
                return result
              },
            }),
          },
          commandShortcutKeys: {
            bold: 'ctrl+b',
            //bold
            italic: 'ctrl+i',
            del: 'ctrl+d',
          },
        }
      })
    },
  }

  //src/module/clipboard.js
  _p[44] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      Module.register('ClipboardModule', function () {
        let km = this,
          _clipboardNodes = [],
          _selectedNodes = []
        function appendChildNode(parent, child) {
          _selectedNodes.push(child)
          km.appendNode(child, parent)
          child.render()
          child.setLayoutOffset(null)
          let children = child.children.map(function (node) {
            return node.clone()
          })
          /*
           * fixed bug: Modified on 2015.08.05
           * 原因：粘贴递归 append 时没有清空原来父节点的子节点，而父节点被复制的时候，是连同子节点一起复制过来的
           * 解决办法：增加了下面这一行代码
           * by: @zhangbobell zhangbobell@163.com
           */
          child.clearChildren()
          for (var i = 0, ci; (ci = children[i]); i++) {
            // 下边代码在复制、剪切时更新id和创建时间
            let newNode = ci.clone()
            newNode.setData('id', utils.guid())
            newNode.setData('created', new Date().valueOf())
            appendChildNode(child, newNode)
          }
        }
        function sendToClipboard(nodes) {
          if (!nodes.length) return
          nodes.sort(function (a, b) {
            return a.getIndex() - b.getIndex()
          })
          _clipboardNodes = nodes.map(function (node) {
            return node.clone()
          })
        }
        /**
         * @command Copy
         * @description 复制当前选中的节点
         * @shortcut Ctrl + C
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         */
        let CopyCommand = kity.createClass('CopyCommand', {
          base: Command,
          execute: function (km) {
            
            sendToClipboard(km.getSelectedAncestors(true))
            this.setContentChanged(false)
          },
        })
        /**
         * @command Cut
         * @description 剪切当前选中的节点
         * @shortcut Ctrl + X
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         */
        let CutCommand = kity.createClass('CutCommand', {
          base: Command,
          execute: function (km) {
            let ancestors = km.getSelectedAncestors()
            if (ancestors.length === 0) return
            sendToClipboard(ancestors)
            km.select(MinderNode.getCommonAncestor(ancestors), true)
            ancestors.slice().forEach(function (node) {
              km.removeNode(node)
            })
            km.layout(300)
          },
        })
        /**
         * @command Paste
         * @description 粘贴已复制的节点到每一个当前选中的节点上
         * @shortcut Ctrl + V
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         */
        let PasteCommand = kity.createClass('PasteCommand', {
          base: Command,
          execute: function (km) {
            //console.log(_clipboardNodes)
            if (_clipboardNodes.length) {
              let nodes = km.getSelectedNodes()
              if (!nodes.length) return
              for (var i = 0, ni; (ni = _clipboardNodes[i]); i++) {
                for (var j = 0, node; (node = nodes[j]); j++) {
                  let newNode = ni.clone()
                  newNode.setData('id', utils.guid())
                  newNode.setData('created', new Date().valueOf())
                  appendChildNode(node, newNode)
                }
              }
              km.select(_selectedNodes, true)
              _selectedNodes = []
              km.layout(300)
            }
          },
          queryState: function (km) {
            return km.getSelectedNode() ? 0 : -1
          },
        })
        /**
         * @Desc: 若支持原生clipboadr事件则基于原生扩展，否则使用km的基础事件只处理节点的粘贴复制
         * @Editor: Naixor
         * @Date: 2015.9.20
         */
        if (km.supportClipboardEvent && !kity.Browser.gecko) {
          let Copy = function (e) {
            this.fire('beforeCopy', e)
          }
          let Cut = function (e) {
            this.fire('beforeCut', e)
          }
          let Paste = function (e) {
            this.fire('beforePaste', e)
          }
          return {
            commands: {
              copy: CopyCommand,
              cut: CutCommand,
              paste: PasteCommand,
            },
            clipBoardEvents: {
              copy: Copy.bind(km),
              cut: Cut.bind(km),
              paste: Paste.bind(km),
            },
            sendToClipboard: sendToClipboard,
          }
        } else {
          return {
            commands: {
              copy: CopyCommand,
              cut: CutCommand,
              paste: PasteCommand,
            },
            commandShortcutKeys: {
              copy: 'normal::ctrl+c|',
              cut: 'normal::ctrl+x',
              paste: 'normal::ctrl+v',
            },
            sendToClipboard: sendToClipboard,
          }
        }
      })
    },
  }

  //src/module/dragtree.js
  _p[45] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      // 矩形的变形动画定义
      let MoveToParentCommand = kity.createClass('MoveToParentCommand', {
        base: Command,
        execute: function (minder, nodes, parent) {
          let node
          for (let i = 0; i < nodes.length; i++) {
            node = nodes[i]
            if (node.parent) {
              node.parent.removeChild(node)
              parent.appendChild(node)
              node.render()
            }
          }
          parent.expand()
          minder.select(nodes, true)
        },
      })
      let DropHinter = kity.createClass('DropHinter', {
        base: kity.Group,
        constructor: function () {
          this.callBase()
          this.rect = new kity.Rect()
          this.addShape(this.rect)
        },
        render: function (target) {
          this.setVisible(!!target)
          if (target) {
            this.rect
              .setBox(target.getLayoutBox())
              .setRadius(target.getStyle('radius') || 0)
              .stroke(
                target.getStyle('drop-hint-color') || 'yellow',
                target.getStyle('drop-hint-width') || 2,
              )
            this.bringTop()
          }
        },
      })
      let OrderHinter = kity.createClass('OrderHinter', {
        base: kity.Group,
        constructor: function () {
          this.callBase()
          this.area = new kity.Rect()
          this.path = new kity.Path()
          this.addShapes([this.area, this.path])
        },
        render: function (hint) {
          this.setVisible(!!hint)
          if (hint) {
            this.area.setBox(hint.area)
            this.area.fill(hint.node.getStyle('order-hint-area-color') || 'rgba(0, 255, 0, .5)')
            this.path.setPathData(hint.path)
            this.path.stroke(
              hint.node.getStyle('order-hint-path-color') || '#0f0',
              hint.node.getStyle('order-hint-path-width') || 1,
            )
          }
        },
      })
      // 对拖动对象的一个替代盒子，控制整个拖放的逻辑，包括：
      //    1. 从节点列表计算出拖动部分
      //    2. 计算可以 drop 的节点，产生 drop 交互提示
      let TreeDragger = kity.createClass('TreeDragger', {
        constructor: function (minder) {
          this._minder = minder
          this._dropHinter = new DropHinter()
          this._orderHinter = new OrderHinter()
          minder.getRenderContainer().addShapes([this._dropHinter, this._orderHinter])
        },
        dragStart: function (position) {
          // 只记录开始位置，不马上开启拖放模式
          // 这个位置同时是拖放范围收缩时的焦点位置（中心）
          this._startPosition = position
        },
        dragMove: function (position) {
          // 启动拖放模式需要最小的移动距离
          let DRAG_MOVE_THRESHOLD = 10
          if (!this._startPosition) return
          let movement = kity.Vector.fromPoints(this._dragPosition || this._startPosition, position)
          let minder = this._minder
          this._dragPosition = position
          if (!this._dragMode) {
            // 判断拖放模式是否该启动
            if (
              kity.Vector.fromPoints(this._dragPosition, this._startPosition).length() <
              DRAG_MOVE_THRESHOLD
            ) {
              return
            }
            if (!this._enterDragMode()) {
              return
            }
          }
          for (let i = 0; i < this._dragSources.length; i++) {
            this._dragSources[i].setLayoutOffset(
              this._dragSources[i].getLayoutOffset().offset(movement),
            )
            minder.applyLayoutResult(this._dragSources[i])
          }
          if (!this._dropTest()) {
            this._orderTest()
          } else {
            this._renderOrderHint((this._orderSucceedHint = null))
          }
        },
        dragEnd: function () {
          this._startPosition = null
          this._dragPosition = null
          if (!this._dragMode) {
            return
          }
          this._fadeDragSources(1)
          if (this._dropSucceedTarget) {
            this._dragSources.forEach(function (source) {
              source.setLayoutOffset(null)
            })
            this._minder.layout(-1)
            this._minder.execCommand('movetoparent', this._dragSources, this._dropSucceedTarget)
          } else if (this._orderSucceedHint) {
            let hint = this._orderSucceedHint
            let index = hint.node.getIndex()
            let sourceIndexes = this._dragSources.map(function (source) {
              // 顺便干掉布局偏移
              source.setLayoutOffset(null)
              return source.getIndex()
            })
            let maxIndex = Math.max.apply(Math, sourceIndexes)
            let minIndex = Math.min.apply(Math, sourceIndexes)
            if (index < minIndex && hint.type == 'down') index++
            if (index > maxIndex && hint.type == 'up') index--
            hint.node.setLayoutOffset(null)
            this._minder.execCommand('arrange', index)
            this._renderOrderHint(null)
          } else {
            this._minder.fire('savescene')
          }
          this._minder.layout(300)
          this._leaveDragMode()
          this._minder.fire('contentchange')
        },
        // 进入拖放模式：
        //    1. 计算拖放源和允许的拖放目标
        //    2. 标记已启动
        _enterDragMode: function () {
          this._calcDragSources()
          if (!this._dragSources.length) {
            this._startPosition = null
            return false
          }
          this._fadeDragSources(0.5)
          this._calcDropTargets()
          this._calcOrderHints()
          this._dragMode = true
          this._minder.setStatus('dragtree')
          return true
        },
        // 从选中的节点计算拖放源
        //    并不是所有选中的节点都作为拖放源，如果选中节点中存在 A 和 B，
        //    并且 A 是 B 的祖先，则 B 不作为拖放源
        //
        //    计算过程：
        //       1. 将节点按照树高排序，排序后只可能是前面节点是后面节点的祖先
        //       2. 从后往前枚举排序的结果，如果发现枚举目标之前存在其祖先，
        //          则排除枚举目标作为拖放源，否则加入拖放源
        _calcDragSources: function () {
          this._dragSources = this._minder.getSelectedAncestors()
        },
        _fadeDragSources: function (opacity) {
          let minder = this._minder
          this._dragSources.forEach(function (source) {
            source.getRenderContainer().setOpacity(opacity, 200)
            source.traverse(function (node) {
              if (opacity < 1) {
                minder.detachNode(node)
              } else {
                minder.attachNode(node)
              }
            }, true)
          })
        },
        // 计算拖放目标可以释放的节点列表（释放意味着成为其子树），存在这条限制规则：
        //    - 不能拖放到拖放目标的子树上（允许拖放到自身，因为多选的情况下可以把其它节点加入）
        //
        //    1. 加入当前节点（初始为根节点）到允许列表
        //    2. 对于当前节点的每一个子节点：
        //       (1) 如果是拖放目标的其中一个节点，忽略（整棵子树被剪枝）
        //       (2) 如果不是拖放目标之一，以当前子节点为当前节点，回到 1 计算
        //    3. 返回允许列表
        //
        _calcDropTargets: function () {
          function findAvailableParents(nodes, root) {
            let availables = [],
              i
            availables.push(root)
            root.getChildren().forEach(function (test) {
              for (i = 0; i < nodes.length; i++) {
                if (nodes[i] == test) return
              }
              availables = availables.concat(findAvailableParents(nodes, test))
            })
            return availables
          }
          this._dropTargets = findAvailableParents(this._dragSources, this._minder.getRoot())
          this._dropTargetBoxes = this._dropTargets.map(function (source) {
            return source.getLayoutBox()
          })
        },
        _calcOrderHints: function () {
          let sources = this._dragSources
          let ancestor = MinderNode.getCommonAncestor(sources)
          // 只有一个元素选中，公共祖先是其父
          if (ancestor == sources[0]) ancestor = sources[0].parent
          if (sources.length === 0 || ancestor != sources[0].parent) {
            this._orderHints = []
            return
          }
          let siblings = ancestor.children
          this._orderHints = siblings.reduce(function (hint, sibling) {
            if (sources.indexOf(sibling) == -1) {
              hint = hint.concat(sibling.getOrderHint())
            }
            return hint
          }, [])
        },
        _leaveDragMode: function () {
          this._dragMode = false
          this._dropSucceedTarget = null
          this._orderSucceedHint = null
          this._renderDropHint(null)
          this._renderOrderHint(null)
          this._minder.rollbackStatus()
        },
        _drawForDragMode: function () {
          this._text.setContent(this._dragSources.length + ' items')
          this._text.setPosition(this._startPosition.x, this._startPosition.y + 5)
          this._minder.getRenderContainer().addShape(this)
        },
        /**
         * 通过 judge 函数判断 targetBox 和 sourceBox 的位置交叉关系
         * @param targets -- 目标节点
         * @param targetBoxMapper -- 目标节点与对应 Box 的映射关系
         * @param judge -- 判断函数
         * @returns {*}
         * @private
         */
        _boxTest: function (targets, targetBoxMapper, judge) {
          let sourceBoxes = this._dragSources.map(function (source) {
            return source.getLayoutBox()
          })
          let i, j, target, sourceBox, targetBox
          judge =
            judge ||
            function (intersectBox, sourceBox, targetBox) {
              return intersectBox && !intersectBox.isEmpty()
            }
          for (i = 0; i < targets.length; i++) {
            target = targets[i]
            targetBox = targetBoxMapper.call(this, target, i)
            for (j = 0; j < sourceBoxes.length; j++) {
              sourceBox = sourceBoxes[j]
              let intersectBox = sourceBox.intersect(targetBox)
              if (judge(intersectBox, sourceBox, targetBox)) {
                return target
              }
            }
          }
          return null
        },
        _dropTest: function () {
          this._dropSucceedTarget = this._boxTest(
            this._dropTargets,
            function (target, i) {
              return this._dropTargetBoxes[i]
            },
            function (intersectBox, sourceBox, targetBox) {
              function area(box) {
                return box.width * box.height
              }
              if (!intersectBox) return false
              /*
               * Added by zhangbobell, 2015.9.8
               *
               * 增加了下面一行判断，修复了循环比较中 targetBox 为折叠节点时，intersetBox 面积为 0，
               * 而 targetBox 的 width 和 height 均为 0
               * 此时造成了满足以下的第二个条件而返回 true
               * */
              if (!area(intersectBox)) return false
              // 面积判断，交叉面积大于其中的一半
              if (area(intersectBox) > 0.5 * Math.min(area(sourceBox), area(targetBox))) return true
              // 有一个边完全重合的情况，也认为两个是交叉的
              if (intersectBox.width + 1 >= Math.min(sourceBox.width, targetBox.width)) return true
              if (intersectBox.height + 1 >= Math.min(sourceBox.height, targetBox.height))
                return true
              return false
            },
          )
          this._renderDropHint(this._dropSucceedTarget)
          return !!this._dropSucceedTarget
        },
        _orderTest: function () {
          this._orderSucceedHint = this._boxTest(this._orderHints, function (hint) {
            return hint.area
          })
          this._renderOrderHint(this._orderSucceedHint)
          return !!this._orderSucceedHint
        },
        _renderDropHint: function (target) {
          this._dropHinter.render(target)
        },
        _renderOrderHint: function (hint) {
          this._orderHinter.render(hint)
        },
        preventDragMove: function () {
          this._startPosition = null
        },
      })
      Module.register('DragTree', function () {
        let dragger
        return {
          init: function () {
            dragger = new TreeDragger(this)
            window.addEventListener('mouseup', function () {
              dragger.dragEnd()
            })
          },
          events: {
            'normal.mousedown inputready.mousedown': function (e) {
              // 单选中根节点也不触发拖拽
              if (e.originEvent.button) return
              if (e.getTargetNode() && e.getTargetNode() != this.getRoot()) {
                dragger.dragStart(e.getPosition())
              }
            },
            'normal.mousemove dragtree.mousemove': function (e) {
              
              dragger.dragMove(e.getPosition())
            },
            'normal.mouseup dragtree.beforemouseup': function (e) {
              dragger.dragEnd()
              //e.stopPropagation();
              e.preventDefault()
            },
            statuschange: function (e) {
              if (e.lastStatus == 'textedit' && e.currentStatus == 'normal') {
                dragger.preventDragMove()
              }
            },
          },
          commands: {
            movetoparent: MoveToParentCommand,
          },
        }
      })
    },
  }

  //src/module/expand.js
  _p[46] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let keymap = _p.r(15)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      Module.register('Expand', function () {
        let minder = this
        let EXPAND_STATE_DATA = 'expandState',
          STATE_EXPAND = 'expand',
          STATE_COLLAPSE = 'collapse'
        // 将展开的操作和状态读取接口拓展到 MinderNode 上
        kity.extendClass(MinderNode, {
          /**
           * 展开节点
           * @param  {Policy} policy 展开的策略，默认为 KEEP_STATE
           */
          expand: function () {
            this.setData(EXPAND_STATE_DATA, STATE_EXPAND)
            return this
          },
          /**
           * 收起节点
           */
          collapse: function () {
            this.setData(EXPAND_STATE_DATA, STATE_COLLAPSE)
            return this
          },
          /**
           * 判断节点当前的状态是否为展开
           */
          isExpanded: function () {
            let expanded = this.getData(EXPAND_STATE_DATA) !== STATE_COLLAPSE
            return expanded && (this.isRoot() || this.parent.isExpanded())
          },
          /**
           * 判断节点当前的状态是否为收起
           */
          isCollapsed: function () {
            return !this.isExpanded()
          },
        })
        /**
         * @command Expand
         * @description 展开当前选中的节点，保证其可见
         * @param {bool} justParents 是否只展开到父亲
         *     * `false` - （默认）保证选中的节点以及其子树可见
         *     * `true` - 只保证选中的节点可见，不展开其子树
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         */
        let ExpandCommand = kity.createClass('ExpandCommand', {
          base: Command,
          execute: function (km, justParents) {
            let node = km.getSelectedNode()
            if (!node) return
            if (justParents) {
              node = node.parent
            }
            while (node.parent) {
              node.expand()
              node = node.parent
            }
            node.renderTree()
            km.layout(100)
          },
          queryState: function (km) {
            let node = km.getSelectedNode()
            return node && !node.isRoot() && !node.isExpanded() ? 0 : -1
          },
        })
        /**
         * @command ExpandToLevel
         * @description 展开脑图到指定的层级
         * @param {number} level 指定展开到的层级，最少值为 1。
         * @state
         *   0: 一直可用
         */
        let ExpandToLevelCommand = kity.createClass('ExpandToLevelCommand', {
          base: Command,
          execute: function (km, level) {
            km.getRoot().traverse(function (node) {
              if (node.getLevel() < level) node.expand()
              if (node.getLevel() == level && !node.isLeaf()) node.collapse()
            })
            setTimeout(() => {
              km.refresh(100)
            }, 300)
          },
          enableReadOnly: true,
        })
        /**
         * @command Collapse
         * @description 收起当前节点的子树
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         */
        let CollapseCommand = kity.createClass('CollapseCommand', {
          base: Command,
          execute: function (km) {
            let node = km.getSelectedNode()
            if (!node) return
            node.collapse()
            node.renderTree()
            km.layout()
          },
          queryState: function (km) {
            let node = km.getSelectedNode()
            return node && !node.isRoot() && node.isExpanded() ? 0 : -1
          },
        })
        let Expander = kity.createClass('Expander', {
          base: kity.Group,
          constructor: function (node) {
            this.callBase()
            this.radius = 6
            this.expanderColor='#1E90FF'
            this.expanderBgColor='white'
            

            this.outline = new kity.Circle(this.radius).stroke(this.expanderColor).fill(this.expanderBgColor)
            // this.outline = new kity.Rect(10, 10, -5, -5, 1).stroke('#ACACAC').fill('white')
            this.sign = new kity.Path().stroke(this.expanderColor)
            this.addShapes([this.outline, this.sign])
            this.initEvent(node)
            this.setId(utils.uuid('node_expander'))
            this.setStyle('cursor', 'pointer')


          },
          initEvent: function (node) {
            this.on('mousedown', function (e) {
              minder.select([node], true)
              if (node.isExpanded()) {
                node.collapse()
              } else {
                node.expand()
              }
              node
                .renderTree()
                .getMinder()
                .layout(100)
              node.getMinder().fire('contentchange')
              e.stopPropagation()
              e.preventDefault()
            })


            this.on('dblclick click mouseup', function (e) {
              e.stopPropagation()
              e.preventDefault()
            })
          },
           
          setState: function (state) {

            if (state == 'hide') {
              this.setVisible(false)
              return
            }
            
            this.setVisible(true)
            let pathData = ['M', 1.5 - this.radius, 0, 'L', this.radius - 1.5, 0]
            if (state == STATE_COLLAPSE) {
              pathData.push(['M', 0, 1.5 - this.radius, 'L', 0, this.radius - 1.5])
            }
            this.sign.setPathData(pathData)
          },
        })
        let ExpanderRenderer = kity.createClass('ExpanderRenderer', {
          base: Renderer,
          create: function (node) {
            if (node.isRoot()) return
            this.expander = new Expander(node)
            
            node.getRenderContainer().prependShape(this.expander)
            node.expanderRenderer = this
            this.node = node
            this.isShow = false
            return this.expander
          },

          shouldRender: function (node) {
            return !node.isRoot()
          },
          update: function (expander, node, box) {
            if (!this.isShow && node.isExpanded() && (node.getData(EXPAND_STATE_DATA) != 'collapse')) {
              this.expander.setState('hide')
              return
            }
            if (!node.parent) return
            let visible = node.parent.isExpanded()
            if(node.getStyle('expander-color') && node.getStyle('expander-bg-color')){
              this.expander.expanderColor=node.getStyle('expander-color')
              this.expander.expanderBgColor=node.getStyle('expander-bg-color')
              
            }else{
              this.expander.expanderColor='#1E90FF'
              this.expander.expanderBgColor='white'
            }
            this.expander.outline.stroke(this.expander.expanderColor).fill(this.expander.expanderBgColor)
            this.expander.sign.stroke(this.expander.expanderColor)

            expander.setState(
              visible && node.children.length ? node.getData(EXPAND_STATE_DATA) : 'hide',
            )

            let vector = node
              .getLayoutVectorIn()
              .normalize(expander.radius + node.getStyle('stroke-width'))
            var rev = vector.reverse()


            let position = node.getVertexIn().offset(rev)

             
            this.expander.setTranslate(position)
          },
        })
        return {
          commands: {
            expand: ExpandCommand,
            expandtolevel: ExpandToLevelCommand,
            collapse: CollapseCommand,
          },
          events: {
            layoutapply: function (e) {
              let r = e.node.getRenderer('ExpanderRenderer')
              if (r.getRenderShape()) {
                r.update(r.getRenderShape(), e.node)
              }
            },
            beforerender: function (e) {
              let node = e.node
              let visible = !node.parent || node.parent.isExpanded()
              let minder = this
              node.getRenderContainer().setVisible(visible)

              if (!visible) e.stopPropagation()
            },

            'normal.keydown': function (e) {
              //console.log(e)

              if (this.getStatus() == 'textedit') return
              if (e.originEvent.keyCode == keymap['/']) {
                let node = this.getSelectedNode()
                if (!node || node == this.getRoot()) return
                let expanded = node.isExpanded()
                this.getSelectedNodes().forEach(function (node) {
                  if (expanded) node.collapse()
                  else node.expand()
                  node.renderTree()
                })
                this.layout(100)
                this.fire('contentchange')
                e.preventDefault()
                e.stopPropagationImmediately()
              }
              if (e.isShortcutKey('Alt+`')) {
                this.execCommand('expandtolevel', 9999)
              }
              for (let i = 1; i < 6; i++) {
                if (e.isShortcutKey('Alt+' + i)) {
                  this.execCommand('expandtolevel', i)
                }
              }
            },
          },
          renderers: {
            outside: ExpanderRenderer,
          },
          contextmenu: [
            {
              command: 'expandtoleaf',
              query: function () {
                return !minder.getSelectedNode()
              },
              fn: function (minder) {
                minder.execCommand('expandtolevel', 9999)
              },
            },
            {
              command: 'expandtolevel1',
              query: function () {
                return !minder.getSelectedNode()
              },
              fn: function (minder) {
                minder.execCommand('expandtolevel', 1)
              },
            },
            {
              command: 'expandtolevel2',
              query: function () {
                return !minder.getSelectedNode()
              },
              fn: function (minder) {
                minder.execCommand('expandtolevel', 2)
              },
            },
            {
              command: 'expandtolevel3',
              query: function () {
                return !minder.getSelectedNode()
              },
              fn: function (minder) {
                minder.execCommand('expandtolevel', 3)
              },
            },
            {
              divider: true,
            },
          ],
        }
      })
    },
  }

  //src/module/font.js
  _p[47] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let TextRenderer = _p.r(61)
      function getNodeDataOrStyle(node, name) {
        return node.getData(name) || node.getStyle(name)
      }
      TextRenderer.registerStyleHook(function (node, textGroup) {
        let dataColor = node.getData('color')
        let selectedColor = node.getStyle('selected-color')
        let styleColor = node.getStyle('color')
        let foreColor =
          dataColor || (node.isSelected() && selectedColor ? selectedColor : styleColor)
        let fontFamily = getNodeDataOrStyle(node, 'font-family')
        let fontSize = getNodeDataOrStyle(node, 'font-size')
        textGroup.fill(foreColor)
        textGroup.eachItem(function (index, item) {
          item.setFont({
            family: fontFamily,
            size: fontSize,
          })
        })
      })
      Module.register('fontmodule', {
        commands: {
          /**
           * @command ForeColor
           * @description 设置选中节点的字体颜色
           * @param {string} color 表示颜色的字符串
           * @state
           *   0: 当前有选中的节点
           *  -1: 当前没有选中的节点
           * @return 如果只有一个节点选中，返回已选中节点的字体颜色；否则返回 'mixed'。
           */
          forecolor: kity.createClass('fontcolorCommand', {
            base: Command,
            execute: function (km, color) {
              let nodes = km.getSelectedNodes()
              nodes.forEach(function (n) {
                n.setData('color', color)
                n.render()
              })
            },
            queryState: function (km) {
              return km.getSelectedNodes().length === 0 ? -1 : 0
            },
            queryValue: function (km) {
              if (km.getSelectedNodes().length == 1) {
                return km.getSelectedNodes()[0].getData('color')
              }
              return 'mixed'
            },
          }),
          /**
           * @command Background
           * @description 设置选中节点的背景颜色
           * @param {string} color 表示颜色的字符串
           * @state
           *   0: 当前有选中的节点
           *  -1: 当前没有选中的节点
           * @return 如果只有一个节点选中，返回已选中节点的背景颜色；否则返回 'mixed'。
           */
          background: kity.createClass('backgroudCommand', {
            base: Command,
            execute: function (km, color) {
              let nodes = km.getSelectedNodes()
              nodes.forEach(function (n) {
                n.setData('background', color)
                n.render()
              })
            },
            queryState: function (km) {
              return km.getSelectedNodes().length === 0 ? -1 : 0
            },
            queryValue: function (km) {
              if (km.getSelectedNodes().length == 1) {
                return km.getSelectedNodes()[0].getData('background')
              }
              return 'mixed'
            },
          }),
          /**
           * @command FontFamily
           * @description 设置选中节点的字体
           * @param {string} family 表示字体的字符串
           * @state
           *   0: 当前有选中的节点
           *  -1: 当前没有选中的节点
           * @return 返回首个选中节点的字体
           */
          fontfamily: kity.createClass('fontfamilyCommand', {
            base: Command,
            execute: function (km, family) {
              let nodes = km.getSelectedNodes()
              nodes.forEach(function (n) {
                n.setData('font-family', family)
                n.render()
                km.layout()
              })
            },
            queryState: function (km) {
              return km.getSelectedNodes().length === 0 ? -1 : 0
            },
            queryValue: function (km) {
              let node = km.getSelectedNode()
              if (node) return node.getData('font-family')
              return null
            },
          }),
          /**
           * @command FontSize
           * @description 设置选中节点的字体大小
           * @param {number} size 字体大小（px）
           * @state
           *   0: 当前有选中的节点
           *  -1: 当前没有选中的节点
           * @return 返回首个选中节点的字体大小
           */
          fontsize: kity.createClass('fontsizeCommand', {
            base: Command,
            execute: function (km, size) {
              let nodes = km.getSelectedNodes()
              nodes.forEach(function (n) {
                n.setData('font-size', size)
                n.render()
                km.layout(300)
              })
            },
            queryState: function (km) {
              return km.getSelectedNodes().length === 0 ? -1 : 0
            },
            queryValue: function (km) {
              let node = km.getSelectedNode()
              if (node) return node.getData('font-size')
              return null
            },
          }),
        },
      })
    },
  }

  //src/module/hyperlink.js
  _p[48] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      // jscs:disable maximumLineLength
      let linkShapePath =
      "M6.40038 9.68576c-1.43262-1.51718-1.43262-3.9753 0-5.49346l2.89016-3.05536A3.55208 3.55208 0 0 1 11.889 0c0.98056 0 1.90288 0.4032 2.59644 1.13596 1.4336 1.51816 1.4336 3.9753 0 5.49248l-1.32104 1.39776c-0.14238 0.15428-0.57638 0.40026-1.05168-0.06174-0.32354-0.31458-0.36134-0.77854-0.05572-1.10908l1.32216-1.39678a2.3226 2.3226 0 0 0 0-3.15196 2.03784 2.03784 0 0 0-1.48932-0.65212c-0.5635 0-1.09134 0.232-1.4903 0.65212l-2.89114 3.05634c-0.82238 0.89198-0.66906 2.43614 0.15232 3.31912 0.28438 0.39326 0.15134 0.67396-0.15624 1.00352-0.41314 0.39424-0.9607 0.15428-1.10306 0zM1.57304 9.28354l1.35688-1.51326c0.14336-0.1533 0.57638-0.2996 1.03444 0.13734 0.29764 0.33544 0.34146 0.69986 0.03486 1.02942L2.67904 10.4534a2.3226 2.3226 0 0 0 0 3.151 2.03784 2.03784 0 0 0 1.48932 0.65212c0.64092 0 1.49186-0.65212 1.49186-0.65212l2.89016-3.05536c0.82236-0.89198 0.71974-2.39526-0.10248-3.28598-0.30826-0.37124-0.1674-0.77446 0.1793-1.03544 0.29888-0.27874 0.76588-0.39032 1.0423-0.11046 1.43262 1.51718 1.43262 4.08478 0 5.60196l-2.89016 3.05634a3.55306 3.55306 0 0 1-2.5984 1.138 3.55306 3.55306 0 0 1-2.59644-1.138c-1.4336-1.51718-1.4336-3.97432 0-5.4915z"
        //'M16.614,10.224h-1.278c-1.668,0-3.07-1.07-3.599-2.556h4.877c0.707,0,1.278-0.571,1.278-1.278V3.834 c0-0.707-0.571-1.278-1.278-1.278h-4.877C12.266,1.071,13.668,0,15.336,0h1.278c2.116,0,3.834,1.716,3.834,3.834V6.39 C20.448,8.508,18.73,10.224,16.614,10.224z M5.112,5.112c0-0.707,0.573-1.278,1.278-1.278h7.668c0.707,0,1.278,0.571,1.278,1.278 S14.765,6.39,14.058,6.39H6.39C5.685,6.39,5.112,5.819,5.112,5.112z M2.556,3.834V6.39c0,0.707,0.573,1.278,1.278,1.278h4.877 c-0.528,1.486-1.932,2.556-3.599,2.556H3.834C1.716,10.224,0,8.508,0,6.39V3.834C0,1.716,1.716,0,3.834,0h1.278 c1.667,0,3.071,1.071,3.599,2.556H3.834C3.129,2.556,2.556,3.127,2.556,3.834z'
      Module.register('hyperlink', {
        commands: {
          /**
           * @command HyperLink
           * @description 为选中的节点添加超链接
           * @param {string} url 超链接的 URL，设置为 null 移除
           * @param {string} title 超链接的说明
           * @state
           *   0: 当前有选中的节点
           *  -1: 当前没有选中的节点
           * @return 返回首个选中节点的超链接信息，JSON 对象： `{url: url, title: title}`
           */
          hyperlink: kity.createClass('hyperlink', {
            base: Command,
            execute: function (km, url, title) {
              let nodes = km.getSelectedNodes()
              nodes.forEach(function (n) {
                n.setData('hyperlink', url)
                n.setData('hyperlinkTitle', url && title)
                n.render()
              })
              km.layout()
            },
            queryState: function (km) {
              let nodes = km.getSelectedNodes(),
                result = 0
              if (nodes.length === 0) {
                return -1
              }
              nodes.forEach(function (n) {
                if (n && n.getData('hyperlink')) {
                  result = 0
                  return false
                }
              })
              return result
            },
            queryValue: function (km) {
              let node = km.getSelectedNode()
              return {
                url: node.getData('hyperlink'),
                title: node.getData('hyperlinkTitle'),
              }
            },
          }),
        },
        renderers: {
          right: kity.createClass('hyperlinkrender', {
            base: Renderer,
            create: function () {
              let link = new kity.HyperLink()
              let linkshape = new kity.Path()
              // let outline = new kity.Rect(24, 22, -2, -6, 4).fill('rgba(255, 255, 255, 0)')
              linkshape.setPathData(linkShapePath).fill('#1890ff')
              // link.addShape(outline)
              link.addShape(linkshape)
              link.setTarget('_blank')
              link.setStyle('cursor', 'pointer')
              // link
              //   .on('mouseover', function () {
              //     outline.fill('rgba(255, 255, 200, .8)')
              //   })
              //   .on('mouseout', function () {
              //     outline.fill('rgba(255, 255, 255, 0)')
              //   })
              return link
            },
            shouldRender: function (node) {
              return node.getData('hyperlink')
            },
            update: function (link, node, box) {
              let href = node.getData('hyperlink')
              link.setHref('#')
              let allowed = ['^http:', '^https:', '^ftp:', '^mailto:']
              for (let i = 0; i < allowed.length; i++) {
                let regex = new RegExp(allowed[i])
                if (regex.test(href)) {
                  link.setHref(href)
                  break
                }
              }
              let title = node.getData('hyperlinkTitle')
              if (title) {
                title = [title, '(', href, ')'].join('')
              } else {
                title = href
              }
              link.node.setAttributeNS('http://www.w3.org/1999/xlink', 'title', title)
              let spaceRight = node.getStyle('space-right')
              link.setTranslate(box.right + spaceRight + 2, -7)
              console.log('XXXX1')
              return new kity.Box({
                x: box.right + spaceRight,
                y: -11,
                width: 24,
                height: 22,
              })
            },
          }),
        },
      })
    },
  }

  _p[448] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      // jscs:disable maximumLineLength
    },
  }

  //src/module/image-viewer.js
  _p[49] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let keymap = _p.r(15)
      let Module = _p.r(20)
      let Command = _p.r(9)
      Module.register('ImageViewer', function () {
        function createEl(name, classNames, children) {
          let el = document.createElement(name)
          addClass(el, classNames)
          children &&
            children.length &&
            children.forEach(function (child) {
              el.appendChild(child)
            })
          return el
        }
        function on(el, event, handler) {
          el.addEventListener(event, handler)
        }
        function addClass(el, classNames) {
          classNames &&
            classNames.split(' ').forEach(function (className) {
              el.classList.add(className)
            })
        }
        function removeClass(el, classNames) {
          classNames &&
            classNames.split(' ').forEach(function (className) {
              el.classList.remove(className)
            })
        }
        let ImageViewer = kity.createClass('ImageViewer', {
          constructor: function () {
            let btnClose = createEl('button', 'km-image-viewer-btn km-image-viewer-close')
            let btnSource = createEl('button', 'km-image-viewer-btn km-image-viewer-source')
            let image = (this.image = createEl('img'))
            let toolbar = (this.toolbar = createEl('div', 'km-image-viewer-toolbar', [
              btnSource,
              btnClose,
            ]))
            let container = createEl('div', 'km-image-viewer-container', [image])
            let viewer = (this.viewer = createEl('div', 'km-image-viewer', [toolbar, container]))
            this.hotkeyHandler = this.hotkeyHandler.bind(this)
            on(btnClose, 'click', this.close.bind(this))
            on(btnSource, 'click', this.viewSource.bind(this))
            on(image, 'click', this.zoomImage.bind(this))
            on(viewer, 'contextmenu', this.toggleToolbar.bind(this))
            on(document, 'keydown', this.hotkeyHandler)
          },
          dispose: function () {
            this.close()
            document.removeEventListener('remove', this.hotkeyHandler)
          },
          hotkeyHandler: function (e) {
            if (!this.actived) {
              return
            }
            if (e.keyCode === keymap['esc']) {
              this.close()
            }
          },
          toggleToolbar: function (e) {
            e && e.preventDefault()
            this.toolbar.classList.toggle('hidden')
          },
          zoomImage: function (restore) {
            let image = this.image
            if (typeof restore === 'boolean') {
              restore && addClass(image, 'limited')
            } else {
              image.classList.toggle('limited')
            }
          },
          viewSource: function (src) {
            window.open(this.image.src)
          },
          open: function (src) {
            let input = document.querySelector('input')
            if (input) {
              input.focus()
              input.blur()
            }
            this.image.src = src
            this.zoomImage(true)
            document.body.appendChild(this.viewer)
            this.actived = true
          },
          close: function () {
            this.image.src = ''
            document.body.removeChild(this.viewer)
            this.actived = false
          },
        })
        return {
          init: function () {
            this.viewer = new ImageViewer()
          },
          events: {
            'normal.dblclick': function (e) {
              let shape = e.kityEvent.targetShape
              if (shape.__KityClassName === 'Image' && shape.url) {
                this.viewer.open(shape.url)
              }
            },
          },
        }
      })
    },
  }




  //src/module/image.js
  _p[50] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      Module.register('image', function () {
        function loadImageSize(url, callback) {
          let img = document.createElement('img')
          img.onload = function () {
            callback(img.width, img.height)
          }
          img.onerror = function () {
            callback(null)
          }
          img.src = url
        }
        function fitImageSize(width, height, maxWidth, maxHeight) {
          let ratio = width / height,
            fitRatio = maxWidth / maxHeight
          // 宽高比大于最大尺寸的宽高比，以宽度为标准适应
          if (width > maxWidth && ratio > fitRatio) {
            width = maxWidth
            height = width / ratio
          } else if (height > maxHeight) {
            height = maxHeight
            width = height * ratio
          }
          return {
            width: width | 0,
            height: height | 0,
          }
        }
        /**
         * @command Image
         * @description 为选中的节点添加图片
         * @param {string} url 图片的 URL，设置为 null 移除
         * @param {string} title 图片的说明
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         * @return 返回首个选中节点的图片信息，JSON 对象： `{url: url, title: title}`
         */

        let ImageCommand = kity.createClass('ImageCommand', {
          base: Command,
          execute: function (km, url, title, newWidth, newHeight) {
            let nodes = km.getSelectedNodes()
            loadImageSize(url, function (width, height) {
              nodes.forEach(function (n) {
                let size = fitImageSize(
                  width,
                  height,
                  km.getOption('maxImageWidth'),
                  km.getOption('maxImageHeight'),
                )
                if (newWidth) size.width = newWidth
                if (newHeight) size.height = newHeight

                n.setData('image', url)
                n.setData('imageTitle', url && title)
                n.setData('imageSize', url && size)

                n.render()
              })
              km.fire('saveScene')
              km.layout(300)

              setTimeout(() => {
                km.fire('contentchange')
              }, 300)
            })
          },
          queryState: function (km) {
            let nodes = km.getSelectedNodes(),
              result = 0
            if (nodes.length === 0) {
              return -1
            }
            nodes.forEach(function (n) {
              if (n && n.getData('image')) {
                result = 0
                return false
              }
            })
            return result
          },
          queryValue: function (km) {
            let node = km.getSelectedNode()
            return {
              url: node.getData('image'),
              title: node.getData('imageTitle'),
              imageSize: node.getData('imageSize'),
            }
          },
        })
       
        let ImageRenderer = kity.createClass('ImageRenderer', {
          base: Renderer,
          constructor() {
            this.callBase()
            this.dblClickListeners = new WeakMap() // 使用 WeakMap 跟踪每个节点的事件监听器状态
            // this.tooltip = document.createElement('div')
            // this.tooltip.style.display = 'none'
            // this.tooltip.style.position = 'absolute'
            // this.tooltip.style.backgroundColor = '#333'
            // this.tooltip.style.color = '#fff'
            // this.tooltip.style.padding = '5px'
            // this.tooltip.style.borderRadius = '5px'
            // this.tooltip.style.fontSize = '12px'
            // this.tooltip.style.zIndex = '1000'
            // this.tooltip.style.transition = 'left 0.1s ease-out, top 0.1s ease-out' // 添加平滑过渡
            // document.body.appendChild(this.tooltip)

            this.previewImage = document.createElement('img')
            this.previewImage.style.display = 'none'
            this.previewImage.style.position = 'fixed'
            this.previewImage.style.top = '50%'
            this.previewImage.style.left = '50%'
            this.previewImage.style.transform = 'translate(-50%, -50%)'
            this.previewImage.style.maxWidth = '90%'
            this.previewImage.style.maxHeight = '90%'
            this.previewImage.style.zIndex = '1000'
            this.previewImage.style.border = '5px solid #fff' // 增加边框
            this.previewImage.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)' // 增加阴影
            document.body.appendChild(this.previewImage)




          },

          updateHandlePosition: function (node) {
            const rect = node.getBoundingClientRect()

            this.resizeHandle.style.left = `${rect.right - 8}px`
            this.resizeHandle.style.top = `${rect.bottom + 2}px`

            //console.log(this.resizeHandle.style.left, this.resizeHandle.style.top)
          },
          create: function (node) {
            let img = new kity.Image(node.getData('image'))
            var self = this;
            let lastTimestamp = 0;
            // image.node.addEventListener('dblclick', this.handleEventWrapper(node))

            self.isDragging = false;
            var isDbClick = false;
            let timeoutId;
            self.startX = 0
            self.startY = 0;


            this.previewImage.addEventListener('click', function () {
              self.previewImage.style.display = 'none'
            })

            img.on('mouseenter', function (e) {

              var title = node.getData('imageTitle')
              if (title) {
                // 获取鼠标位置
                var mouseX = e.originEvent.clientX;
                var mouseY = e.originEvent.clientY;

                if (self.tooltipContainer == undefined) {
                  self.tooltipContainer = document.createElement('div');
                  self.tooltipContainer.style.position = 'absolute';
                  self.tooltipContainer.style.left = mouseX + 'px';
                  self.tooltipContainer.style.top = mouseY + 'px';
                  document.body.appendChild(self.tooltipContainer);

                  // 创建 Tooltip 实例
                  self.tooltipInstance = React.createElement(Tooltip, {
                    title: title,
                    visible: true,
                    overlayStyle: { width: '250px' },
                    getPopupContainer: () => self.tooltipContainer,
                  });

                }
                else {
                  self.tooltipContainer.style.left = mouseX + 'px';
                  self.tooltipContainer.style.top = mouseY + 'px';

                }
                ReactDOM.render(self.tooltipInstance, self.tooltipContainer);
                img.addEventListener('mouseleave', function () {
                  ReactDOM.unmountComponentAtNode(self.tooltipContainer);
                  // document.body.removeChild(tooltipContainer);
                });
              }

            })

            img.on('dblclick', function (e) {

              isDbClick = true;
              if (timeoutId) {
                clearTimeout(timeoutId);
              }

              if (self.previewImage.style.display === 'none') {
                self.previewImage.src = node.getData('image') // 假设 imageNode 是 <img> 元素
                self.previewImage.style.display = 'block'
              } else {
                self.previewImage.style.display = 'none'
              }
              isDbClick = false

              self.mouseupListener1 = document.addEventListener('mouseup', function (e) {
                self.previewImage.style.display = 'none'
                document.removeEventListener('mouseup', self.mouseupListener1);
              })
              e.stopPropagation()

            })
            img.on('click', function (e) {

              if (timeoutId) {
                clearTimeout(timeoutId);
              }


              timeoutId = setTimeout(function () {

                if (isDbClick) {
                  isDbClick = false;
                  return
                }

                if (self.imageObj) {
                  message.info('鼠标移动到十字按钮，按住拖拽即可缩放大小', 2);
                  // 创建拖拽手柄
                  if (self.resizeHandle != undefined) {
                    self.resizeHandle.style.display = 'block'
                    return
                  }
                  self.resizeHandle = document.createElement('div')

                  self.resizeHandle.style.width = '19px'
                  self.resizeHandle.style.height = '19px'
                  self.resizeHandle.style.display = 'none'
                  self.resizeHandle.style.backgroundColor = 'backgroundColor'
                  //this.resizeHandle.style.border = '1px solid #000';
                  self.resizeHandle.style.position = 'absolute'
                  self.resizeHandle.style.cursor = 'nwse-resize'
                  self.resizeHandle.style.userSelect = 'none';
                  self.resizeHandle.style.zIndex = '999' // 确保手柄在前面

                  self.resizeHandle.innerHTML = `
              <svg t="1724664154627" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4540" width="17" height="17"><path d="M598.08 512c0-7.04 2.72-13.76 7.84-18.72 4.96-4.96 11.68-7.84 18.72-7.84h201.28l-60.8-60.8-3.04-3.68a26.576 26.576 0 0 1 40.64-33.92l106.4 106.4c0.8 0.8 1.44 1.6 2.08 2.56l0.48 0.64c0.64 0.96 1.28 1.76 1.76 2.72l0.48 1.12 0.48 1.12c1.28 3.2 2.08 6.56 1.92 10.08l-0.16-2.4V513.12c-0.32 4.64-1.76 9.12-4.16 13.12l-1.6 2.08-1.92 2.4-106.08 106.08-3.52 3.2c-10.56 7.2-24.8 5.92-33.76-3.04l-3.04-3.68c-7.2-10.56-5.92-24.8 3.04-33.76l60.64-60.8H624.64l-4.8-0.48A27.04 27.04 0 0 1 598.08 512zM512 598.24c12.8 0 23.84 9.12 26.08 21.76l0.48 4.8v201.12l60.8-60.64c9.12-9.12 23.36-10.4 33.76-3.04l3.68 3.04c8.96 9.12 10.24 23.2 3.04 33.76l-3.04 3.68-106.08 106.08-2.4 2.08-2.08 1.6c-4.32 2.72-9.28 4.16-14.24 4.16h-2.24 1.12l-2.24-0.16 0.96 0.16h-0.48c-1.76-0.16-3.36-0.48-4.96-0.96l-2.08-0.8c-1.76-0.8-3.52-1.6-4.96-2.72l-0.8-0.48a17.12 17.12 0 0 1-2.56-2.24l-106.4-106.4a26.576 26.576 0 0 1 33.92-40.64l3.68 3.04 60.8 60.8V624.96A26.08 26.08 0 0 1 512 598.24zM221.44 387.2l3.68-3.2c10.56-7.36 24.8-5.92 33.76 3.04l3.04 3.68c7.2 10.56 5.92 24.8-3.04 33.76l-60.64 60.8h201.12l4.8 0.48c13.44 2.56 22.72 14.88 21.44 28.48-1.28 13.6-12.64 24-26.24 24.16l-201.28 0.16 60.8 60.8 3.04 3.68a26.576 26.576 0 0 1-40.64 33.92l-106.4-106.4c-0.8-0.8-1.6-1.76-2.24-2.56l-0.48-0.64c-0.64-0.96-1.28-1.76-1.76-2.88-1.92-3.84-3.04-8-3.04-12.32l0.16 2.4v0.48l-0.16-1.76v1.12-3.36c0.16-3.04 0.8-6.08 2.08-8.96l0.96-2.08c1.28-2.4 2.88-4.64 4.8-6.56l-1.76 1.92 0.32-0.32 0.64-0.8 107.04-107.04zM494.24 114.4l0.8-0.64 0.16-0.16c1.44-1.12 3.04-2.08 4.64-3.04l2.08-0.96 2.08-0.8 2.56-0.64c1.76-0.48 3.68-0.64 5.6-0.64h1.28l0.96 0.16h0.8l2.88 0.48c3.36 0.8 6.4 2.24 9.12 4.16l0.64 0.48c0.96 0.64 1.76 1.44 2.56 2.24l106.56 106.56c9.6 9.76 10.24 25.12 1.44 35.52-8.8 10.4-24 12.64-35.2 4.96l-3.68-3.04-60.8-60.8v201.12c0 13.76-10.4 25.28-24.16 26.4-13.76 1.28-26.08-8.16-28.48-21.76l-0.48-4.8V198.08l-60.8 60.64c-9.12 9.12-23.36 10.4-33.92 3.04l-3.68-3.04c-9.12-9.12-10.4-23.36-3.04-33.76l3.04-3.68 107.04-106.88z" fill="#d4237a" p-id="4541"></path></svg>
                `

                  document.body.appendChild(self.resizeHandle)
                  self.isDragging = false;
                  // 
                  self.resizeHandle.style.display = 'block'
                  self.updateHandlePosition(self.imageObj.node)

                  self.mousemoveListener = document.addEventListener('mousemove', function (e) {

                    self.updateHandlePosition(self.imageObj.node)
                    if (!self.isDragging) {

                      return;
                    }
                    // const currentTimestamp = Date.now();
                    // if (currentTimestamp - lastTimestamp < 50) {
                    //   return;
                    // }
                    // lastTimestamp = currentTimestamp;

                    const dx = e.clientX;
                    const dy = e.clientY;
                    const width = dx - self.startX;
                    const height = dy - self.startY;

                    // 更新 resizeHandle 的位置或大小
                    //this.resizeHandle.style.transform = `translate(${dx}px, ${dy}px)`;
                    self.resizeHandle.style.left = `${e.clientX}px`
                    self.resizeHandle.style.top = `${e.clientY}px`

                    let newsize = { width: width, height: height }
                    node.setData('imageSize', newsize)
                    node.render()

                  });

                  self.mousewheelListener = document.addEventListener('mousewheel', function (e) {

                    self.updateHandlePosition(self.imageObj.node)
                  });

                  self.mouseupListener = document.addEventListener('mouseup', function (e) {
                    var preDragging = self.isDragging;
                    self.isDragging = false;
                    self.resizeHandle.style.display = 'none'


                    document.removeEventListener('mousemove', self.mousemoveListener);
                    document.removeEventListener('mouseup', self.mouseupListener);
                    document.removeEventListener('mousewheel', self.mousewheelListener);
                    if (preDragging) {
                      let km = node.getMinder()

                      km.fire('saveScene')
                      km.layout(300)

                      setTimeout(() => {
                        km.fire('contentchange')
                      }, 220)
                    }
                  });


                  self.resizeHandle.addEventListener('mousedown', function (e) {
                    self.isDragging = true;
                    self.startX = self.imageObj.node.getBoundingClientRect().left;
                    self.startY = self.imageObj.node.getBoundingClientRect().top;
                    let lastTimestamp = 0;

                  })


                  // self.org_top = self.imageObj.node.getBoundingClientRect().top
                  // self.org_left = self.imageObj.node.getBoundingClientRect().left
                }
              }, 300)

            })


            return img
          },
          shouldRender: function (node) {
            return node.getData('image')
          },


          update: function (image, node, box) {
            let url = node.getData('image')
            let title = node.getData('imageTitle')
            let size = node.getData('imageSize')
            let spaceTop = node.getStyle('space-top')

            if (!size) return

          
           

            if (title) {
              image.node.setAttributeNS('http://www.w3.org/1999/xlink', 'title', title)

            }
            this.imageObj = image
            // if (!this.dblClickListeners.has(image.node)) {
            //   let tooltip = this.tooltip
            //   image.node.addEventListener('dblclick', this.handleEventWrapper(node))

            //   // image.node.addEventListener('dblclick', alert(123));

            //   let self = this
            //   document.addEventListener(
            //     'click',
            //     function(event) {
            //       if (
            //         self.previewImage.style.display === 'block' &&
            //         event.target !== self.previewImage
            //       ) {
            //         self.previewImage.style.display = 'none'
            //       }
            //     },
            //     true,
            //   )

            //   document.addEventListener('mousemove', function(event) {
            //     self.updateHandlePosition(image.node)
            //     if (self.isResizing) {
            //       const width = event.clientX - self.org_left
            //       const height = event.clientY - self.org_top
            //       console.log(event.clientY - image.node.getBoundingClientRect().top)
            //       if (width > 0 && height > 0) {
            //         let newsize = { width: width, height: height }
            //         node.setData('imageSize', newsize)
            //         node.render()
            //       }
            //     } else {
            //       if (
            //         !(
            //           event.clientY >= image.node.getBoundingClientRect().top &&
            //           event.clientY <= image.node.getBoundingClientRect().bottom + 50 &&
            //           event.clientX >= image.node.getBoundingClientRect().left &&
            //           event.clientX <= image.node.getBoundingClientRect().right + 50
            //         )
            //       )
            //         self.resizeHandle.style.display = 'none'
            //     }
            //   })

            //   document.addEventListener('mouseup', function() {
            //     if (self.isResizing) {
            //       self.isResizing = false
            //       self.resizeHandle.style.display = 'none'
            //       let km = node.getMinder()

            //       km.fire('saveScene')
            //       km.layout(300)

            //       setTimeout(() => {
            //         km.fire('contentchange')
            //       }, 300)
            //     }
            //   })

            //   image.node.addEventListener('click', function(event) {
            //     self.resizeHandle.style.display = 'block'

            //     self.org_top = image.node.getBoundingClientRect().top
            //     self.org_left = image.node.getBoundingClientRect().left

            //     self.updateHandlePosition(image.node)

            //     event.stopPropagation()
            //   })

            //   // 鼠标悬停事件
            //   if (title) {
            //     image.node.addEventListener('mouseenter', function(event) {
            //       tooltip.style.display = 'block'
            //       tooltip.innerText = title
            //       tooltip.style.left = event.pageX + 'px'
            //       tooltip.style.top = event.pageY + 'px'
            //     })

            //     // 鼠标移动事件
            //     // image.node.addEventListener('mousemove', function(event) {
            //     //   tooltip.style.left = event.pageX + 'px';
            //     //   tooltip.style.top = event.pageY + 'px';
            //     // });

            //     // 鼠标移出事件
            //     image.node.addEventListener('mouseout', function() {
            //       tooltip.style.display = 'none'
            //     })
            //   }

            //   this.dblClickListeners.set(image.node, true)
            // }

            let x = box.cx - size.width / 2
            let y = box.y - size.height - spaceTop
            image
              .setUrl(url)
              .setX(x | 0)
              .setY(y | 0)
              .setWidth(size.width | 0)
              .setHeight(size.height | 0)
            return new kity.Box(x | 0, y | 0, size.width | 0, size.height | 0)
          },
        })
        return {
          defaultOptions: {
            maxImageWidth: 800,
            maxImageHeight: 800,
          },
          commands: {
            image: ImageCommand,
          },
          renderers: {
            top: ImageRenderer,
          },
        }
      })
    },
  }

  //src/module/keynav.js
  _p[51] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let keymap = _p.r(15)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      Module.register('KeyboardModule', function () {
        let min = Math.min,
          max = Math.max,
          abs = Math.abs,
          sqrt = Math.sqrt,
          exp = Math.exp
        function buildPositionNetwork(root) {
          let pointIndexes = [],
            p
          root.traverse(function (node) {
            p = node.getLayoutBox()
            // bugfix: 不应导航到收起的节点（判断其尺寸是否存在）
            if (p.width && p.height) {
              pointIndexes.push({
                left: p.x,
                top: p.y,
                right: p.x + p.width,
                bottom: p.y + p.height,
                width: p.width,
                height: p.height,
                node: node,
              })
            }
          })
          for (let i = 0; i < pointIndexes.length; i++) {
            findClosestPointsFor(pointIndexes, i)
          }
        }
        // 这是金泉的点子，赞！
        // 求两个不相交矩形的最近距离
        function getCoefedDistance(box1, box2) {
          let xMin, xMax, yMin, yMax, xDist, yDist, dist, cx, cy
          xMin = min(box1.left, box2.left)
          xMax = max(box1.right, box2.right)
          yMin = min(box1.top, box2.top)
          yMax = max(box1.bottom, box2.bottom)
          xDist = xMax - xMin - box1.width - box2.width
          yDist = yMax - yMin - box1.height - box2.height
          if (xDist < 0) dist = yDist
          else if (yDist < 0) dist = xDist
          else dist = sqrt(xDist * xDist + yDist * yDist)
          let node1 = box1.node
          let node2 = box2.node
          // sibling
          if (node1.parent == node2.parent) {
            dist /= 10
          }
          // parent
          if (node2.parent == node1) {
            dist /= 5
          }
          return dist
        }
        function findClosestPointsFor(pointIndexes, iFind) {
          let find = pointIndexes[iFind]
          let most = {},
            quad
          let current, dist
          for (let i = 0; i < pointIndexes.length; i++) {
            if (i == iFind) continue
            current = pointIndexes[i]
            dist = getCoefedDistance(current, find)
            // left check
            if (current.right < find.left) {
              if (!most.left || dist < most.left.dist) {
                most.left = {
                  dist: dist,
                  node: current.node,
                }
              }
            }
            // right check
            if (current.left > find.right) {
              if (!most.right || dist < most.right.dist) {
                most.right = {
                  dist: dist,
                  node: current.node,
                }
              }
            }
            // top check
            if (current.bottom < find.top) {
              if (!most.top || dist < most.top.dist) {
                most.top = {
                  dist: dist,
                  node: current.node,
                }
              }
            }
            // bottom check
            if (current.top > find.bottom) {
              if (!most.down || dist < most.down.dist) {
                most.down = {
                  dist: dist,
                  node: current.node,
                }
              }
            }
          }
          find.node._nearestNodes = {
            right: (most.right && most.right.node) || null,
            top: (most.top && most.top.node) || null,
            left: (most.left && most.left.node) || null,
            down: (most.down && most.down.node) || null,
          }
        }
        function navigateTo(km, direction) {
          let referNode = km.getSelectedNode()
          if (!referNode) {
            km.select(km.getRoot())
            buildPositionNetwork(km.getRoot())
            return
          }
          if (!referNode._nearestNodes) {
            buildPositionNetwork(km.getRoot())
          }
          let nextNode = referNode._nearestNodes[direction]
          if (nextNode) {
            km.select(nextNode, true)
          }
        }
        // 稀释用
        //导航上下左右
        let lastFrame

        return {
          events: {
            layoutallfinish: function () {
              let root = this.getRoot()
              buildPositionNetwork(root)
            },

            'normal.keydown readonly.keydown': function (e) {
              let minder = this
                //alert(88888)
                ;['left', 'right', 'up', 'down'].forEach(function (key) {
                  if (e.isShortcutKey(key)) {
                    navigateTo(minder, key == 'up' ? 'top' : key)
                    e.preventDefault()
                  }
                })
            },
          },
        }
      })
    },
  }

  //src/module/layout.js
  /**
   * @fileOverview
   *
   * 布局模块
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[52] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let Command = _p.r(9)
      let Module = _p.r(20)
      /**
       * @command Layout
       * @description 设置选中节点的布局
       *     允许使用的布局可以使用 `kityminder.Minder.getLayoutList()` 查询
       * @param {string} name 布局的名称，设置为 null 则使用继承或默认的布局
       * @state
       *   0: 当前有选中的节点
       *  -1: 当前没有选中的节点
       * @return 返回首个选中节点的布局名称
       */
      let LayoutCommand = kity.createClass('LayoutCommand', {
        base: Command,
        execute: function (minder, name) {
          let nodes = minder.getSelectedNodes()
          nodes.forEach(function (node) {
            node.layout(name)
          })
        },
        queryValue: function (minder) {
          let node = minder.getSelectedNode()
          if (node) {
            return node.getData('layout')
          }
        },
        queryState: function (minder) {
          return minder.getSelectedNode() ? 0 : -1
        },
      })
      /**
       * @command ResetLayout
       * @description 重设选中节点的布局，如果当前没有选中的节点，重设整个脑图的布局
       * @state
       *   0: 始终可用
       * @return 返回首个选中节点的布局名称
       */
      let ResetLayoutCommand = kity.createClass('ResetLayoutCommand', {
        base: Command,
        execute: function (minder) {
          let nodes = minder.getSelectedNodes()
          if (!nodes.length) nodes = [minder.getRoot()]
          nodes.forEach(function (node) {
            node.traverse(function (child) {
              child.resetLayoutOffset()
              if (!child.isRoot()) {
                child.setData('layout', null)
              }
            })
          })
          minder.layout(300)
        },
        enableReadOnly: true,
      })
      Module.register('LayoutModule', {
        commands: {
          layout: LayoutCommand,
          resetlayout: ResetLayoutCommand,
        },
        contextmenu: [
          {
            command: 'resetlayout',
          },
          {
            divider: true,
          },
        ],
        commandShortcutKeys: {
          resetlayout: 'Ctrl+Shift+L',
        },
      })
    },
  }

  //src/module/node.js
  _p[53] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      /**
       * @command AppendChildNode
       * @description 添加子节点到选中的节点中
       * @param {string|object} textOrData 要插入的节点的文本或数据
       * @state
       *    0: 当前有选中的节点
       *   -1: 当前没有选中的节点
       */
      let AppendChildCommand = kity.createClass('AppendChildCommand', {
        base: Command,
        execute: function (km, text) {
          let parent = km.getSelectedNode()
          if (!parent) {
            return null
          }
          let node = km.createNode(text, parent)
          km.select(node, true)
          if (parent.isExpanded()) {
            node.render()
          } else {
            parent.expand()
            parent.renderTree()
          }
          
          // 使用 RAF 等待节点渲染完成后触发自定义事件
          requestAnimationFrame(() => {
            km.fire('newNodeRendered', { node: node })
          })
          
          km.layout(600)
        },
        queryState: function (km) {
          let selectedNode = km.getSelectedNode()
          return selectedNode ? 0 : -1
        },
      })
      /**
       * @command AppendSiblingNode
       * @description 添加选中的节点的兄弟节点
       * @param {string|object} textOrData 要添加的节点的文本或数据
       * @state
       *    0: 当前有选中的节点
       *   -1: 当前没有选中的节点
       */
      let AppendSiblingCommand = kity.createClass('AppendSiblingCommand', {
        base: Command,
        execute: function (km, text) {
          let sibling = km.getSelectedNode()
          let parent = sibling.parent
          if (!parent) {
            return km.execCommand('AppendChildNode', text)
          }
          let node = km.createNode(text, parent, sibling.getIndex() + 1)
          node.setGlobalLayoutTransform(sibling.getGlobalLayoutTransform())
          km.select(node, true)
          node.render()
          
          // 使用 RAF 等待节点渲染完成后触发自定义事件
          requestAnimationFrame(() => {
            km.fire('newNodeRendered', { node: node })
          })
          
          km.layout(600)
        },
        queryState: function (km) {
          let selectedNode = km.getSelectedNode()
          return selectedNode ? 0 : -1
        },
      })
      /**
       * @command RemoveNode
       * @description 移除选中的节点
       * @state
       *    0: 当前有选中的节点
       *   -1: 当前没有选中的节点
       */
      let RemoveNodeCommand = kity.createClass('RemoverNodeCommand', {
        base: Command,
        execute: function (km) {
          let nodes = km.getSelectedNodes()
          let ancestor = MinderNode.getCommonAncestor.apply(null, nodes)
          let index = nodes[0].getIndex()
          nodes.forEach(function (node) {
            if (!node.isRoot()) km.removeNode(node)
          })
          if (nodes.length == 1) {
            let selectBack = ancestor.children[index - 1] || ancestor.children[index]
            km.select(selectBack || ancestor || km.getRoot(), true)
          } else {
            km.select(ancestor || km.getRoot(), true)
          }
          km.layout(600)
        },
        queryState: function (km) {
          let selectedNode = km.getSelectedNode()
          return selectedNode && !selectedNode.isRoot() ? 0 : -1
        },
      })
      let AppendParentCommand = kity.createClass('AppendParentCommand', {
        base: Command,
        execute: function (km, text) {
          let nodes = km.getSelectedNodes()
          nodes.sort(function (a, b) {
            return a.getIndex() - b.getIndex()
          })
          let parent = nodes[0].parent
          let newParent = km.createNode(text, parent, nodes[0].getIndex())
          nodes.forEach(function (node) {
            newParent.appendChild(node)
          })
          newParent.setGlobalLayoutTransform(nodes[nodes.length >> 1].getGlobalLayoutTransform())
          km.select(newParent, true)
          
          // 使用 RAF 等待节点渲染完成后触发自定义事件
          requestAnimationFrame(() => {
            km.fire('newNodeRendered', { node: newParent })
          })
          
          km.layout(600)
        },
        queryState: function (km) {
          let nodes = km.getSelectedNodes()
          if (!nodes.length) return -1
          let parent = nodes[0].parent
          if (!parent) return -1
          for (let i = 1; i < nodes.length; i++) {
            if (nodes[i].parent != parent) return -1
          }
          return 0
        },
      })
      Module.register('NodeModule', function () {
        return {
          commands: {
            AppendChildNode: AppendChildCommand,
            AppendSiblingNode: AppendSiblingCommand,
            RemoveNode: RemoveNodeCommand,
            AppendParentNode: AppendParentCommand,
          },
          commandShortcutKeys: {
            appendsiblingnode: 'normal::Enter',
            appendchildnode: 'normal::Insert|Tab',
            appendparentnode: 'normal::Shift+Tab|normal::Shift+Insert',
            removenode: 'normal::Del|Backspace',
          },
        }
      })
    },
  }

  //src/module/note.js
  /**
   * @fileOverview
   *
   * 支持节点详细信息（HTML）格式
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[54] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      Module.register('NoteModule', function () {
        let NOTE_PATH =
          'M9,9H3V8h6L9,9L9,9z M9,7H3V6h6V7z M9,5H3V4h6V5z M8.5,11H2V2h8v7.5 M9,12l2-2V1H1v11'
        /**
         * @command Note
         * @description 设置节点的备注信息
         * @param {string} note 要设置的备注信息，设置为 null 则移除备注信息
         * @state
         *    0: 当前有选中的节点
         *   -1: 当前没有选中的节点
         */
        let NoteCommand = kity.createClass('NoteCommand', {
          base: Command,
          execute: function (minder, note) {
            let node = minder.getSelectedNode()
            node.setData('note', note)
            node.render()
            node.getMinder().layout(300)
          },
          queryState: function (minder) {
            return minder.getSelectedNodes().length === 1 ? 0 : -1
          },
          queryValue: function (minder) {
            let node = minder.getSelectedNode()
            return node && node.getData('note')
          },
        })
        let NoteIcon = kity.createClass('NoteIcon', {
          base: kity.Group,
          constructor: function () {
            this.callBase()
            this.width = 20
            this.height = 21
            this.rect = new kity.Rect(16, 17, 0.5, -8.5, 2).fill('transparent')
            this.path = new kity.Path().setPathData(NOTE_PATH).setTranslate(2.5, -10.5).setScale(1.5)
            this.addShapes([this.rect, this.path])
            this.on('mouseover', function () {
              this.rect.fill('rgba(255, 255, 200, .8)')
            }).on('mouseout', function () {
              this.rect.fill('transparent')
            })
            this.setStyle('cursor', 'pointer')
          },
        })
        let NoteIconRenderer = kity.createClass('NoteIconRenderer', {
          base: Renderer,
          create: function (node) {
            let icon = new NoteIcon()
            icon.on('mousedown', function (e) {
              e.preventDefault()
              node.getMinder().fire('editnoterequest')
            })
            icon.on('mouseover', function () {
              node.getMinder().fire('shownoterequest', {
                node: node,
                icon: icon,
              })
            })
            icon.on('mouseout', function () {
              node.getMinder().fire('hidenoterequest', {
                node: node,
                icon: icon,
              })
            })
            return icon
          },
          shouldRender: function (node) {
            return node.getData('note')
          },
          update: function (icon, node, box) {
            let x = box.right + node.getStyle('space-left')
            let y = box.cy
            // icon.path.fill(node.getStyle('color'))
            icon.path.fill('#1890ff')
            icon.setTranslate(x, y)
            return new kity.Box(x, Math.round(y - icon.height / 2), icon.width, icon.height)
          },
        })
        return {
          renderers: {
            right: NoteIconRenderer,
          },
          commands: {
            note: NoteCommand,
          },
        }
      })
    },
  }

  //src/module/outline.js
  _p[55] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      let OutlineRenderer = kity.createClass('OutlineRenderer', {
        base: Renderer,
        create: function (node) {

          let outline = new kity.Rect().setId(utils.uuid('node_outline'))

          this.bringToBack = true


          outline.on('mousedown', function (e) {
            console.log("outline mousedown")
          })

          return outline
        },



        update: function (outline, node, box) {
          let shape = node.getStyle('shape')
          let paddingLeft = node.getStyle('padding-left'),
            paddingRight = node.getStyle('padding-right'),
            paddingTop = node.getStyle('padding-top'),
            paddingBottom = node.getStyle('padding-bottom')

          let outlineBox = {
            x: box.x - paddingLeft,
            y: box.y - paddingTop,
            width: box.width + paddingLeft + paddingRight,
            height: box.height + paddingTop + paddingBottom,
          }
          let radius = node.getStyle('radius')
          // 天盘图圆形的情况
          if (shape && shape == 'circle') {
            let p = Math.pow
            let r = Math.round
            radius = r(Math.sqrt(p(outlineBox.width, 2) + p(outlineBox.height, 2)) / 2)
            outlineBox.x = box.cx - radius
            outlineBox.y = box.cy - radius
            outlineBox.width = 2 * radius
            outlineBox.height = 2 * radius
          }
          let prefix = node.isSelected()
            ? node.getMinder().isFocused()
              ? 'selected-'
              : 'blur-selected-'
            : ''
          outline
            .setPosition(outlineBox.x, outlineBox.y)
            .setSize(outlineBox.width, outlineBox.height)
            .setRadius(radius)
            .fill(
              node.getData('background') ||
              node.getStyle(prefix + 'background') ||
              node.getStyle('background'),
            )
            .stroke(
              node.getStyle(prefix + 'stroke' || node.getStyle('stroke')),
              node.getStyle(prefix + 'stroke-width'),
            )


          return new kity.Box(outlineBox)
        },
      })
      let ShadowRenderer = kity.createClass('ShadowRenderer', {
        base: Renderer,
        create: function (node) {
          this.bringToBack = true
          return new kity.Rect()
        },
        shouldRender: function (node) {
          return node.getStyle('shadow')
        },
        update: function (shadow, node, box) {
          shadow.setPosition(box.x + 4, box.y + 5).fill(node.getStyle('shadow'))
          let shape = node.getStyle('shape')
          if (!shape) {
            shadow.setSize(box.width, box.height)
            shadow.setRadius(node.getStyle('radius'))
          } else if (shape == 'circle') {
            let width = Math.max(box.width, box.height)
            shadow.setSize(width, width)
            shadow.setRadius(width / 2)
          }
        },
      })
      let marker = new kity.Marker()
      marker.setWidth(10)
      marker.setHeight(12)
      marker.setRef(0, 0)
      marker.setViewBox(-6, -4, 8, 10)
      marker.addShape(new kity.Path().setPathData('M-5-3l5,3,-5,3').stroke('#33ffff'))
      let wireframeOption = /wire/.test(window.location.href)
      let WireframeRenderer = kity.createClass('WireframeRenderer', {
        base: Renderer,
        create: function () {
          let wireframe = new kity.Group()
          let oxy = (this.oxy = new kity.Path()
            .stroke('#f6f')
            .setPathData('M0,-50L0,50M-50,0L50,0'))
          let box = (this.wireframe = new kity.Rect().stroke('lightgreen'))
          let vectorIn = (this.vectorIn = new kity.Path().stroke('#66ffff'))
          let vectorOut = (this.vectorOut = new kity.Path().stroke('#66ffff'))
          vectorIn.setMarker(marker, 'end')
          vectorOut.setMarker(marker, 'end')
          return wireframe.addShapes([oxy, box, vectorIn, vectorOut])
        },
        shouldRender: function () {
          return wireframeOption
        },
        update: function (created, node, box) {
          this.wireframe.setPosition(box.x, box.y).setSize(box.width, box.height)
          let pin = node.getVertexIn()
          let pout = node.getVertexOut()
          let vin = node.getLayoutVectorIn().normalize(30)
          let vout = node.getLayoutVectorOut().normalize(30)
          this.vectorIn.setPathData(['M', pin.offset(vin.reverse()), 'L', pin])
          this.vectorOut.setPathData(['M', pout, 'l', vout])
        },
      })
      Module.register('OutlineModule', function () {
        return {
          events: !wireframeOption
            ? null
            : {
              ready: function () {
                this.getPaper().addResource(marker)
              },
              layoutallfinish: function () {
                this.getRoot().traverse(function (node) {
                  node.getRenderer('WireframeRenderer').update(null, node, node.getContentBox())
                })
              },

            },
          renderers: {
            outline: OutlineRenderer,
            outside: [ShadowRenderer, WireframeRenderer],
          },
        }
      })
    },
  }

  //src/module/priority.js
  _p[56] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      Module.register('PriorityModule', function () {
        let minder = this
        // Designed by Akikonata
        // [MASK, BACK]
        let PRIORITY_COLORS = [
          null,
          ['#FF1200', '#840023'], // 1 - red
          ['#0074FF', '#01467F'], // 2 - blue
          ['#8A2BE2', '#1e0138'], // 3 - purple
          ['#FF962E', '#B25000'], // 4 - orange
          ['#A464FF', '#4720C4'], // 5 - purple
          ['#A3A3A3', '#515151'], // 6,7,8,9 - gray
          ['#A3A3A3', '#515151'],
          ['#A3A3A3', '#515151'],
          ['#A3A3A3', '#515151'],
        ]
        // hue from 1 to 5
        // jscs:disable maximumLineLength
        let BACK_PATH = 'M0,13c0,3.866,3.134,7,7,7h6c3.866,0,7-3.134,7-7V7H0V13z'
        let MASK_PATH =
          'M20,10c0,3.866-3.134,7-7,7H7c-3.866,0-7-3.134-7-7V7c0-3.866,3.134-7,7-7h6c3.866,0,7,3.134,7,7V10z'
        let PRIORITY_DATA = 'priority'
        // 优先级图标的图形
        let PriorityIcon = kity.createClass('PriorityIcon', {
          base: kity.Group,
          constructor: function () {
            this.callBase()
            this.setSize(20)
            this.create()
            this.setId(utils.uuid('node_priority'))
          },
          setSize: function (size) {
            this.width = this.height = size
          },
          create: function () {
            let white, back, mask, number
            // 4 layer
            //white = new kity.Path().setPathData(MASK_PATH).fill('white')
            // back = new kity.Path().setPathData(BACK_PATH).setTranslate(0.5, 0.5)
            // mask = new kity.Path()
            //   .setPathData(MASK_PATH)
            //   .setOpacity(0.8)
            //   .setTranslate(0.5, 2.5)
            //back=new kity.Circle(13).setTranslate(10, 12).fill('white')
            mask = new kity.Circle(11).setTranslate(10, 12)
            number = new kity.Text()
              .setX(this.width / 2 - 0)
              .setY(this.height / 2 + 2)
              .setTextAnchor('middle')
              .setVerticalAlign('middle')
              .setFontBold('bold')
              // .setFontItalic(true)
              .setFontSize(12)
              .fill('white')
            this.addShapes([mask, number])
            this.mask = mask
            //this.back = back
            this.number = number
          },
          setValue: function (value) {
            // let back = this.back,
            let mask = this.mask,
              number = this.number
            let color = PRIORITY_COLORS[value]
            if (color) {
              //back.fill(color[1])
              mask.fill(color[0])
            }
            // number.setContent('P' + (value - 1))
            number.setContent('P' + (value - 1))
          },
        })
        /**
         * @command Priority
         * @description 设置节点的优先级信息
         * @param {number} value 要设置的优先级（添加一个优先级小图标）
         *     取值为 0 移除优先级信息；
         *     取值为 1 - 9 设置优先级，超过 9 的优先级不渲染
         * @state
         *    0: 当前有选中的节点
         *   -1: 当前没有选中的节点
         */
        let PriorityCommand = kity.createClass('SetPriorityCommand', {
          base: Command,
          execute: function (km, value) {
            let nodes = km.getSelectedNodes()
            for (let i = 0; i < nodes.length; i++) {
              nodes[i].setData(PRIORITY_DATA, value || null).render()
            }
            km.layout()
          },
          queryValue: function (km) {
            let nodes = km.getSelectedNodes()
            let val
            for (let i = 0; i < nodes.length; i++) {
              val = nodes[i].getData(PRIORITY_DATA)
              if (val) break
            }
            return val || null
          },
          queryState: function (km) {
            return km.getSelectedNodes().length ? 0 : -1
          },
        })
        return {
          commands: {
            priority: PriorityCommand,
          },
          renderers: {
            left: kity.createClass('PriorityRenderer', {
              base: Renderer,
              create: function (node) {
                return new PriorityIcon()
              },
              shouldRender: function (node) {
                return node.getData(PRIORITY_DATA)
              },
              update: function (icon, node, box) {
                let data = node.getData(PRIORITY_DATA)
                let spaceLeft = node.getStyle('space-left'),
                  x,
                  y
                icon.setValue(data)
                x = box.left - icon.width - spaceLeft
                y = -icon.height / 2
                icon.setTranslate(x, y)
                return new kity.Box({
                  x: x,
                  y: y,
                  width: icon.width,
                  height: icon.height,
                })
              },
            }),
          },
        }
      })
    },
  }

  //src/module/progress.js
  _p[57] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      Module.register('ProgressModule', function () {
        let minder = this
        let PROGRESS_DATA = 'progress'
        // Designed by Akikonata
        let BG_COLOR = '#FFED83'
        let PIE_COLOR = '#43BC00'
        let SHADOW_PATH =
          'M10,3c4.418,0,8,3.582,8,8h1c0-5.523-3.477-10-9-10S1,5.477,1,11h1C2,6.582,5.582,3,10,3z'
        let SHADOW_COLOR = '#8E8E8E'
        // jscs:disable maximumLineLength
        let FRAME_PATH =
          'M10,0C4.477,0,0,4.477,0,10c0,5.523,4.477,10,10,10s10-4.477,10-10C20,4.477,15.523,0,10,0zM10,18c-4.418,0-8-3.582-8-8s3.582-8,8-8s8,3.582,8,8S14.418,18,10,18z'
        let FRAME_GRAD = new kity.LinearGradient().pipe(function (g) {
          g.setStartPosition(0, 0)
          g.setEndPosition(0, 1)
          g.addStop(0, '#fff')
          g.addStop(1, '#ccc')
        })
        let CHECK_PATH =
          'M15.812,7.896l-6.75,6.75l-4.5-4.5L6.25,8.459l2.812,2.803l5.062-5.053L15.812,7.896z'
        let CHECK_COLOR = '#EEE'
        let FAIL_PATH =
          'M5,5l.7,-.7l4.3,4.3l4.3,-4.3l1.4,1.4l-4.3,4.3l4.3,4.3l-1.4,1.4l-4.3,-4.3l-4.3,4.3l-1.4,-1.4l4.3,-4.3l-4.3,-4.3l.7,-.7z'
        let FAIL_COLOR = '#d81e06'

        let BG_CIRCLE_PATH =
          'M512 10.64215c-276.491256 0-501.409014 224.917758-501.409014 501.409014s224.917758 501.409014 501.409014 501.409014 501.409014-224.917758 501.409014-501.409014S788.491256 10.64215 512 10.64215z'
        let BG_CIRCLE_COLOR = '#FFED83'
        let FAIL_ANDROID_PATH =
          'M640 384a42.666667 42.666667 0 0 1-42.666667-42.666667 42.666667 42.666667 0 0 1 42.666667-42.666666 42.666667 42.666667 0 0 1 42.666667 42.666666 42.666667 42.666667 0 0 1-42.666667 42.666667M384 384a42.666667 42.666667 0 0 1-42.666667-42.666667 42.666667 42.666667 0 0 1 42.666667-42.666666 42.666667 42.666667 0 0 1 42.666667 42.666666 42.666667 42.666667 0 0 1-42.666667 42.666667m303.786667-197.546667l89.6-89.6-34.986667-35.413333-98.56 98.56C604.16 139.946667 559.36 128 512 128c-47.786667 0-92.16 11.946667-131.84 32L281.6 61.44l-34.986667 35.413333 89.6 89.6C261.973333 240.64 213.333333 327.68 213.333333 426.666667v42.666666h597.333334v-42.666666c0-98.986667-48.64-186.026667-122.88-240.213334M213.333333 682.666667c0 164.693333 133.546667 298.666667 298.666667 298.666666a298.666667 298.666667 0 0 0 298.666667-298.666666v-170.666667H213.333333v170.666667z'
        let FAIL_ANDROID_COLOR = '#d81e06'
        let PASS_ANDROID_COLOR = '#31AF0F'
        let FAIL_IOS_PATH =
          'M644.021338 205.212802c49.216935-57.32152 44.753273-142.220119 44.753273-142.220119s-84.010369 7.80578-133.229351 65.196885c-49.220005 57.245795-44.763506 142.295843-44.763506 142.295843S594.798263 262.60493 644.021338 205.212802L644.021338 205.212802zM750.783897 536.112164c0-72.330352 39.921221-135.445832 98.731652-168.162978-41.111327-59.400878-113.451912-92.257194-163.709549-92.257194-60.45079 0-143.715169 42.670845-167.876452 42.670845-25.663496 0-79.492472-38.58683-151.162792-39.628556-59.178821-0.886183-158.653393 33.530674-193.45399 135.605467-34.791387 102.075817-33.156144 249.569032 39.626509 386.586662 58.369386 109.73117 109.962437 154.191778 159.851685 154.191778 49.958832 0 108.839871-38.138622 155.7646-38.138622 46.835701 0 90.707908 38.138622 139.103128 38.138622 48.325635 0 98.215906-39.702234 134.49518-94.488001 36.284391-54.875818 69.596078-140.148947 69.596078-140.148947s0.213871-2.301416 0.662079-5.499248C801.263591 687.105087 750.783897 617.593943 750.783897 536.112164L750.783897 536.112164zM750.783897 536.112164'
        let FAIL_IOS_COLOR = '#d81e06'
        let PASS_IOS_COLOR = '#31AF0F'
        let FAIL_WEB_PATH =
          'M544.938667 115.04c0 0-91.530667-12.437333-230.197333 90.912 0-0.010667-124.106667 114.826667-133.034667 201.802667C181.706667 407.765333 315.605333 225.738667 544.938667 115.04zM941.024 320.810667c25.429333-23.808 32.565333-108.170667 32.565333-108.170667C981.578667 123.84 940.330667 87.04 940.330667 87.04 871.093333 16.64 703.413333 74.090667 703.413333 74.090667c-211.637333 67.210667-387.285333 232.64-387.285333 232.64C37.973333 550.24 16.693333 799.125333 16.693333 799.125333c-11.946667 170.890667 135.754667 172.16 135.754667 172.16 152.64 7.573333 224.266667-46.858667 233.216-54.272 96.234667 50.656 183.381333 47.594667 183.381333 47.594667C907.050667 943.157333 974.613333 674.122667 974.613333 674.122667l-224.64 0c-50.581333 121.066667-200.938667 96.864-200.938667 96.864-147.733333-29.642667-149.077333-187.04-149.077333-187.04l596.181333 0 0.010667-0.042667C1003.210667 470.474667 977.898667 384.810667 941.024 320.810667zM753.568 158.784C529.088 290.56 475.861333 354.154667 475.861333 354.154667c53.354667-45.312 126.176-41.941333 126.176-41.941333 166.592 18.4 161.162667 158.144 161.28 158.741333L399.936 470.954667c13.578667-56.885333 33.877333-81.162667 42.197333-89.130667-153.802667 130.442667-247.573333 324.490667-247.573333 324.490667 28.202667 84.629333 105.312 159.477333 169.450667 198.464-48.053333 31.648-103.776 36.96-103.776 36.96-135.754667 16.117333-131.765333-90.165333-131.765333-90.165333C132.384 741.226667 242.890667 569.173333 242.890667 569.173333c101.12-144.042667 240.544-265.077333 240.544-265.077333 137.749333-114.005333 256.522667-169.472 256.522667-169.472 124.736-62.56 182.666667-14.154667 182.666667-14.154667l0-0.010667 0.032 0c73.621333 55.402667 22.016 166.368 11.029333 187.989333C859.552 190.24 753.568 158.784 753.568 158.784z'
        let FAIL_WEB_COLOR = '#d81e06'
        let PASS_WEB_COLOR = '#31AF0F'
        let FAIL_SERVER_PATH =
          'M953.685695 0H86.749184A86.960734 86.960734 0 0 0 0.000001 86.696296V202.295764a86.960734 86.960734 0 0 0 86.696295 86.696295h866.989399A86.960734 86.960734 0 0 0 1040.381991 202.295764V86.696296A86.960734 86.960734 0 0 0 953.685695 0z m-784.061358 218.003435a73.500794 73.500794 0 1 1 73.500794-73.500794 73.500794 73.500794 0 0 1-73.447906 73.500794zM953.685695 367.517192H86.749184A86.947512 86.947512 0 0 0 0.000001 454.200266v115.599468a86.960734 86.960734 0 0 0 86.696295 86.696296h866.989399a86.960734 86.960734 0 0 0 86.696296-86.696296v-115.599468a86.947512 86.947512 0 0 0-86.696296-86.683074z m-784.061358 217.990213a73.500794 73.500794 0 1 1 73.500794-73.500794 73.500794 73.500794 0 0 1-73.447906 73.500794zM953.685695 735.021163H86.749184A86.947512 86.947512 0 0 0 0.000001 821.717458v115.586246a86.960734 86.960734 0 0 0 86.696295 86.696296h866.989399a86.960734 86.960734 0 0 0 86.696296-86.696296v-115.586246a86.947512 86.947512 0 0 0-86.696296-86.696295z m-784.061358 217.990213a73.500794 73.500794 0 1 1 73.553682-73.514017 73.500794 73.500794 0 0 1-73.500794 73.514017z'
        let FAIL_SERVER_COLOR = '#d81e06'
        let PASS_SERVER_COLOR = '#31AF0F'

        let PassAndroid_FailIOS_1 =
          'M 289.76268,82.422577 C 318.66084,49.252515 316.02231,0 316.02231,0 c 0,0 -49.37816,4.52319 -78.27632,37.818896 -28.89816,33.170061 -26.25963,82.422574 -26.25963,82.422574 0,0 49.25252,-4.52319 78.27632,-37.818893 z m 62.69644,191.858653 c 0,-41.96516 23.49546,-78.52761 58.04761,-97.49988 -24.12368,-34.4265 -66.71706,-53.52442 -96.24344,-53.52442 -35.5573,0 -84.43288,24.7519 -98.75631,24.7519 -15.07731,0 -46.73964,-22.36466 -88.83043,-22.99288 -34.803444,-0.50258 -93.227984,19.47485 -113.707984,78.65325 -20.4799995,59.17841 -19.4748465,144.61644 23.244171,224.02356 34.300859,63.57595 64.706753,89.33301 93.981843,89.33301 29.40074,0 63.95289,-22.11338 91.5946,-22.11338 27.51608,0 53.27313,22.11338 81.79436,22.11338 28.39558,0 57.79632,-22.99289 79.03018,-54.78086 21.35951,-31.78798 40.96,-81.29178 40.96,-81.29178 0,0 0.12565,-1.38209 0.37694,-3.14111 -41.83951,-16.08245 -71.49154,-56.28858 -71.49154,-103.53079 z'
        let PassAndroid_FailIOS_COLOR_1 = '#ff0000'
        let PassAndroid_FailIOS_2 =
          'M 289.76268,82.422577 m 62.69644,191.858653 m 598.82013,394.39705 c -17.46454,0 -31.78798,14.57473 -31.78798,32.29055 v 129.16221 c 0,17.71583 14.32344,32.29056 31.78798,32.29056 17.46453,0 31.78797,-14.57473 31.78797,-32.29056 V 700.96883 c 0,-17.84147 -14.32344,-32.29055 -31.78797,-32.29055 z m -381.33007,0 c -17.46454,0 -31.78797,14.57473 -31.78797,32.29055 v 129.16221 c 0,17.71583 14.32343,32.29056 31.78797,32.29056 17.46454,0 31.78798,-14.57473 31.78798,-32.29056 V 700.96883 c 0,-17.84147 -14.32344,-32.29055 -31.78798,-32.29055 z m 47.61914,209.95141 c 0,26.76221 21.35951,48.49865 47.61915,48.49865 h 15.83116 v 64.58111 c 0,17.71585 14.32344,32.29055 31.78798,32.29055 17.46454,0 31.78797,-14.5747 31.78797,-32.29055 v -64.58111 h 31.78798 v 64.58111 c 0,17.71585 14.32343,32.29055 31.78797,32.29055 17.46454,0 31.78798,-14.5747 31.78798,-32.29055 v -64.58111 h 15.83116 c 26.38528,0 47.61914,-21.73644 47.61914,-48.49865 V 700.96883 H 617.56832 Z m 201.91019,-326.29791 20.10307,-39.32663 c 1.00515,-2.0103 0.25128,-4.39754 -1.63338,-5.4027 -1.88466,-1.00515 -4.39754,-0.25128 -5.27705,1.75902 l -20.48,39.8292 c -15.95681,-6.2822 -33.42135,-9.80024 -51.51411,-9.80024 -18.21841,0 -35.55731,3.51804 -51.51411,9.6746 l -20.48,-39.8292 c -1.00516,-2.01031 -3.3924,-2.76417 -5.27706,-1.75902 -1.88466,1.00515 -2.63853,3.51804 -1.63337,5.4027 l 20.10306,39.32663 c -45.10625,20.73128 -77.77374,64.45546 -83.42773,116.3465 H 902.65495 C 897.12661,616.6616 864.45912,572.93742 819.47851,552.33178 Z m -122.37743,91.21767 c -12.69006,0 -22.99288,-10.55411 -22.99288,-23.36982 0,-12.8157 10.30282,-23.36981 22.99288,-23.36981 12.69007,0 22.99289,10.55411 22.99289,23.36981 0,12.94135 -10.30282,23.36982 -22.99289,23.36982 z m 127.02626,0 c -12.69006,0 -22.99288,-10.55411 -22.99288,-23.36982 0,-12.8157 10.30282,-23.36981 22.99288,-23.36981 12.69006,0 22.99289,10.55411 22.99289,23.36981 0.12564,12.94135 -10.30283,23.36982 -22.99289,23.36982 z'
        let PassAndroid_FailIOS_COLOR_2 = '#00ff00'
        let PassAndroid_FailIOS_3 =
          'M 227.69446,941.70307 c -2.01031,0 -4.02061,-0.62822 -5.77963,-1.75902 -4.77448,-3.1411 -6.03092,-9.54896 -2.88982,-14.32344 L 767.58747,108.05399 c 3.1411,-4.77448 9.6746,-6.03092 14.32343,-2.88982 4.77448,3.14111 6.03092,9.54896 2.88982,14.32344 L 236.23826,937.17988 c -1.88466,2.88981 -5.15141,4.52319 -8.5438,4.52319 z'
        let PassAndroid_FailIOS_COLOR_3 = '#000'

        let PassIOS_FailAndroid_1 =
          'M 289.76268,82.422577 C 318.66084,49.252515 316.02231,0 316.02231,0 c 0,0 -49.37816,4.52319 -78.27632,37.818896 -28.89816,33.170061 -26.25963,82.422574 -26.25963,82.422574 0,0 49.25252,-4.52319 78.27632,-37.818893 z m 62.69644,191.858653 c 0,-41.96516 23.49546,-78.52761 58.04761,-97.49988 -24.12368,-34.4265 -66.71706,-53.52442 -96.24344,-53.52442 -35.5573,0 -84.43288,24.7519 -98.75631,24.7519 -15.07731,0 -46.73964,-22.36466 -88.83043,-22.99288 -34.803444,-0.50258 -93.227984,19.47485 -113.707984,78.65325 -20.4799995,59.17841 -19.4748465,144.61644 23.244171,224.02356 34.300859,63.57595 64.706753,89.33301 93.981843,89.33301 29.40074,0 63.95289,-22.11338 91.5946,-22.11338 27.51608,0 53.27313,22.11338 81.79436,22.11338 28.39558,0 57.79632,-22.99289 79.03018,-54.78086 21.35951,-31.78798 40.96,-81.29178 40.96,-81.29178 0,0 0.12565,-1.38209 0.37694,-3.14111 -41.83951,-16.08245 -71.49154,-56.28858 -71.49154,-103.53079 z'
        let PassIOS_FailAndroid_COLOR_1 = '#00ff00'
        let PassIOS_FailAndroid_2 =
          'M 289.76268,82.422577 m 62.69644,191.858653 m 598.82013,394.39705 c -17.46454,0 -31.78798,14.57473 -31.78798,32.29055 v 129.16221 c 0,17.71583 14.32344,32.29056 31.78798,32.29056 17.46453,0 31.78797,-14.57473 31.78797,-32.29056 V 700.96883 c 0,-17.84147 -14.32344,-32.29055 -31.78797,-32.29055 z m -381.33007,0 c -17.46454,0 -31.78797,14.57473 -31.78797,32.29055 v 129.16221 c 0,17.71583 14.32343,32.29056 31.78797,32.29056 17.46454,0 31.78798,-14.57473 31.78798,-32.29056 V 700.96883 c 0,-17.84147 -14.32344,-32.29055 -31.78798,-32.29055 z m 47.61914,209.95141 c 0,26.76221 21.35951,48.49865 47.61915,48.49865 h 15.83116 v 64.58111 c 0,17.71585 14.32344,32.29055 31.78798,32.29055 17.46454,0 31.78797,-14.5747 31.78797,-32.29055 v -64.58111 h 31.78798 v 64.58111 c 0,17.71585 14.32343,32.29055 31.78797,32.29055 17.46454,0 31.78798,-14.5747 31.78798,-32.29055 v -64.58111 h 15.83116 c 26.38528,0 47.61914,-21.73644 47.61914,-48.49865 V 700.96883 H 617.56832 Z m 201.91019,-326.29791 20.10307,-39.32663 c 1.00515,-2.0103 0.25128,-4.39754 -1.63338,-5.4027 -1.88466,-1.00515 -4.39754,-0.25128 -5.27705,1.75902 l -20.48,39.8292 c -15.95681,-6.2822 -33.42135,-9.80024 -51.51411,-9.80024 -18.21841,0 -35.55731,3.51804 -51.51411,9.6746 l -20.48,-39.8292 c -1.00516,-2.01031 -3.3924,-2.76417 -5.27706,-1.75902 -1.88466,1.00515 -2.63853,3.51804 -1.63337,5.4027 l 20.10306,39.32663 c -45.10625,20.73128 -77.77374,64.45546 -83.42773,116.3465 H 902.65495 C 897.12661,616.6616 864.45912,572.93742 819.47851,552.33178 Z m -122.37743,91.21767 c -12.69006,0 -22.99288,-10.55411 -22.99288,-23.36982 0,-12.8157 10.30282,-23.36981 22.99288,-23.36981 12.69007,0 22.99289,10.55411 22.99289,23.36981 0,12.94135 -10.30282,23.36982 -22.99289,23.36982 z m 127.02626,0 c -12.69006,0 -22.99288,-10.55411 -22.99288,-23.36982 0,-12.8157 10.30282,-23.36981 22.99288,-23.36981 12.69006,0 22.99289,10.55411 22.99289,23.36981 0.12564,12.94135 -10.30283,23.36982 -22.99289,23.36982 z'
        let PassIOS_FailAndroid_COLOR_2 = '#ff0000'
        let PassIOS_FailAndroid_3 =
          'M 227.69446,941.70307 c -2.01031,0 -4.02061,-0.62822 -5.77963,-1.75902 -4.77448,-3.1411 -6.03092,-9.54896 -2.88982,-14.32344 L 767.58747,108.05399 c 3.1411,-4.77448 9.6746,-6.03092 14.32343,-2.88982 4.77448,3.14111 6.03092,9.54896 2.88982,14.32344 L 236.23826,937.17988 c -1.88466,2.88981 -5.15141,4.52319 -8.5438,4.52319 z'
        let PassIOS_FailAndroid_COLOR_3 = '#000'

        let SKIP_PATH =
          'M747.3152 415.6416a256.0512 256.0512 0 0 0-489.472 96.768H341.504a170.6496 170.6496 0 0 1 327.6288-58.624l-115.0976 20.9408 227.84 116.736 48.2816-251.392-82.8416 75.5712zM0 512C0 229.2224 229.1712 0 512 0c282.7776 0 512 229.1712 512 512 0 282.7776-229.1712 512-512 512-282.7776 0-512-229.1712-512-512z'
        let SKIP_COLOR = '#BE96F9'
        minder.getPaper().addResource(FRAME_GRAD)
        // 进度图标的图形
        let ProgressIcon = kity.createClass('ProgressIcon', {
          base: kity.Group,
          constructor: function (value) {
            this.callBase()
            this.setSize(20)
            this.create()
            this.setValue(value)
            this.setId(utils.uuid('node_progress'))
            this.translate(0.5, 0.5)
          },
          setSize: function (size) {
            this.width = this.height = size
          },
          create: function () {
            let bg,
              pie,
              shadow,
              frame,
              check,
              fail,
              bg_cicle,
              android_pass_ios_fail_1,
              android_pass_ios_fail_2,
              android_pass_ios_fail_3,
              ios_pass_android_fail_1,
              ios_pass_android_fail_2,
              ios_pass_android_fail_3,
              android_fail,
              android_pass,
              ios_fail,
              web_fail,
              server_fail,
              block,
              skip
            bg = new kity.Circle(9).fill(BG_COLOR)
            pie = new kity.Pie(9, 0).fill(PIE_COLOR)
            shadow = new kity.Path()
              .setPathData(SHADOW_PATH)
              .setTranslate(-10, -10)
              .fill(SHADOW_COLOR)
            frame = new kity.Path()
              .setTranslate(-10, -10)
              .setPathData(FRAME_PATH)
              .fill(FRAME_GRAD)
            check = new kity.Path()
              .setTranslate(-10, -10)
              .setPathData(CHECK_PATH)
              .fill(CHECK_COLOR)
            fail = new kity.Path()
              .setTranslate(-10, -10)
              .setPathData(FAIL_PATH)
              .fill(FAIL_COLOR)
            android_fail = new kity.Path()
              .setTranslate(-8, -8)
              .setScale(0.016)
              .setPathData(FAIL_ANDROID_PATH)
              .fill(FAIL_ANDROID_COLOR)
            android_pass = new kity.Path()
              .setTranslate(-8, -8)
              .setScale(0.016)
              .setPathData(FAIL_ANDROID_PATH)
              .fill(PASS_ANDROID_COLOR)
            ios_fail = new kity.Path()
              .setTranslate(-9, -9)
              .setScale(0.017)
              .setPathData(FAIL_IOS_PATH)
              .fill(FAIL_IOS_COLOR)
            ios_pass = new kity.Path()
              .setTranslate(-9, -9)
              .setScale(0.017)
              .setPathData(FAIL_IOS_PATH)
              .fill(PASS_IOS_COLOR)
            web_fail = new kity.Path()
              .setTranslate(-9, -9)
              .setScale(0.016)
              .setPathData(FAIL_WEB_PATH)
              .fill(FAIL_WEB_COLOR)
            web_pass = new kity.Path()
              .setTranslate(-9, -9)
              .setScale(0.016)
              .setPathData(FAIL_WEB_PATH)
              .fill(PASS_WEB_COLOR)
            server_fail = new kity.Path()
              .setTranslate(-6, -6)
              .setScale(0.012)
              .setPathData(FAIL_SERVER_PATH)
              .fill(FAIL_SERVER_COLOR)
            server_pass = new kity.Path()
              .setTranslate(-6, -6)
              .setScale(0.012)
              .setPathData(FAIL_SERVER_PATH)
              .fill(PASS_SERVER_COLOR)
            bg_cicle = new kity.Path()
              .setTranslate(-10, -10)
              .setScale(0.02)
              .setPathData(BG_CIRCLE_PATH)
              .fill(BG_CIRCLE_COLOR)

            android_pass_ios_fail_1 = new kity.Path()
              .setTranslate(-8, -7)
              .setScale(0.017)
              .setPathData(PassAndroid_FailIOS_1)
              .fill(PassAndroid_FailIOS_COLOR_1)
            android_pass_ios_fail_2 = new kity.Path()
              .setTranslate(-8, -11)
              .setScale(0.017)
              .setPathData(PassAndroid_FailIOS_2)
              .fill(PassAndroid_FailIOS_COLOR_2)
            android_pass_ios_fail_3 = new kity.Path()
              .setTranslate(-8, -10)
              .setScale(0.018)
              .setPathData(PassAndroid_FailIOS_3)
              .fill(PassAndroid_FailIOS_COLOR_3)

            ios_pass_android_fail_1 = new kity.Path()
              .setTranslate(-8, -7)
              .setScale(0.017)
              .setPathData(PassIOS_FailAndroid_1)
              .fill(PassIOS_FailAndroid_COLOR_1)
            ios_pass_android_fail_2 = new kity.Path()
              .setTranslate(-8, -11)
              .setScale(0.017)
              .setPathData(PassIOS_FailAndroid_2)
              .fill(PassIOS_FailAndroid_COLOR_2)
            ios_pass_android_fail_3 = new kity.Path()
              .setTranslate(-8, -10)
              .setScale(0.018)
              .setPathData(PassIOS_FailAndroid_3)
              .fill(PassIOS_FailAndroid_COLOR_3)

            block = new kity.Pie(9, 0).fill('red')
            skip = new kity.Path()
              .setTranslate(-10, -10)
              .setScale(0.02)
              .setPathData(SKIP_PATH)
              .fill(SKIP_COLOR)
            this.addShapes([
              bg,
              pie,
              shadow,
              skip,
              check,
              fail,
              bg_cicle,
              ios_pass_android_fail_1,
              ios_pass_android_fail_2,
              ios_pass_android_fail_3,
              android_pass_ios_fail_1,
              android_pass_ios_fail_2,
              android_pass_ios_fail_3,
              android_fail,
              android_pass,
              ios_fail,
              ios_pass,
              web_fail,
              web_pass,
              server_fail,
              server_pass,
              block,
              frame,
            ])
            this.pie = pie
            this.check = check
            this.fail = fail
            this.block = block
            this.skip = skip
            this.android_fail = android_fail
            this.android_pass = android_pass

            this.android_pass_ios_fail_1 = android_pass_ios_fail_1
            this.android_pass_ios_fail_2 = android_pass_ios_fail_2
            this.android_pass_ios_fail_3 = android_pass_ios_fail_3

            this.ios_pass_android_fail_1 = ios_pass_android_fail_1
            this.ios_pass_android_fail_2 = ios_pass_android_fail_2
            this.ios_pass_android_fail_3 = ios_pass_android_fail_3

            this.ios_fail = ios_fail
            this.ios_pass = ios_pass
            this.web_fail = web_fail
            this.web_pass = web_pass
            this.server_fail = server_fail
            this.server_pass = server_pass
            this.bg_cicle = bg_cicle
            this.frame = frame
          },
          setValue: function (value) {
            //alert(value)
            if (value !== 4) {
              this.pie.setAngle((-360 * (value - 1)) / 8).fill(PIE_COLOR)
            } else {
              this.pie.setAngle(360).fill('#fff')
            }
            this.check.setVisible(value == 9)
            this.fail.setVisible(value == 1)
            this.android_fail.setVisible(value == 2)

            this.android_pass_ios_fail_1.setVisible(value == 20)
            this.android_pass_ios_fail_2.setVisible(value == 20)
            this.android_pass_ios_fail_3.setVisible(value == 20)

            this.ios_pass_android_fail_1.setVisible(value == 21)
            this.ios_pass_android_fail_2.setVisible(value == 21)
            this.ios_pass_android_fail_3.setVisible(value == 21)

            this.android_pass.setVisible(value == 12)
            this.ios_fail.setVisible(value == 3)
            this.ios_pass.setVisible(value == 13)
            this.web_fail.setVisible(value == 6)
            this.web_pass.setVisible(value == 16)
            this.server_fail.setVisible(value == 7)
            this.server_pass.setVisible(value == 17)
            this.bg_cicle.setVisible(
              value == 2 ||
              value == 12 ||
              value == 3 ||
              value == 13 ||
              value == 6 ||
              value == 16 ||
              value == 7 ||
              value == 17 ||
              value == 20 ||
              value == 21,
            )
            this.block.setVisible(value == 5)
            this.skip.setVisible(value == 4)
            this.frame.setVisible(value != 20 && value != 21)

            if (value == 5) {
              this.block.setAngle(-180)
            }
          },
        })
        /**
         * @command Progress
         * @description 设置节点的进度信息（添加一个进度小图标）
         * @param {number} value 要设置的进度
         *     取值为 0 移除进度信息；
         *     取值为 1 表示未开始；
         *     取值为 2 表示完成 1/8；
         *     取值为 3 表示完成 2/8；
         *     取值为 4 表示完成 3/8；
         *     其余类推，取值为 9 表示全部完成
         * @state
         *    0: 当前有选中的节点
         *   -1: 当前没有选中的节点
         */
        let ProgressCommand = kity.createClass('ProgressCommand', {
          base: Command,
          execute: function (km, value) {
            let nodes = km.getSelectedNodes()
            for (let i = 0; i < nodes.length; i++) {
              nodes[i].setData(PROGRESS_DATA, value || null).render()
            }
            km.layout()
          },
          queryValue: function (km) {
            let nodes = km.getSelectedNodes()
            let val
            for (let i = 0; i < nodes.length; i++) {
              val = nodes[i].getData(PROGRESS_DATA)
              if (val) break
            }
            return val || null
          },
          queryState: function (km) {
            return km.getSelectedNodes().length ? 0 : -1
          },
        })
        return {
          commands: {
            progress: ProgressCommand,
          },
          renderers: {
            left: kity.createClass('ProgressRenderer', {
              base: Renderer,
              create: function (node) {
                return new ProgressIcon()
              },
              shouldRender: function (node) {
                return node.getData(PROGRESS_DATA)
              },
              update: function (icon, node, box) {
                let data = node.getData(PROGRESS_DATA)
                let spaceLeft = node.getStyle('space-left')
                let x, y
                icon.setValue(data)
                x = box.left - icon.width - spaceLeft
                y = -icon.height / 2
                icon.setTranslate(x + icon.width / 2, y + icon.height / 2)
                return new kity.Box(x, y, icon.width, icon.height)
              },
            }),
          },
        }
      })
    },
  }

  //src/module/resource.js
  _p[58] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      Module.register('Resource', function () {
        // String Hash
        // https://github.com/drostie/sha3-js/edit/master/blake32.min.js
        let blake32 = (function () {
          let k, g, r, l, m, o, p, q, t, w, x
          x = 4 * (1 << 30)
          k = [
            1779033703,
            3144134277,
            1013904242,
            2773480762,
            1359893119,
            2600822924,
            528734635,
            1541459225,
          ]
          m = [
            608135816,
            2242054355,
            320440878,
            57701188,
            2752067618,
            698298832,
            137296536,
            3964562569,
            1160258022,
            953160567,
            3193202383,
            887688300,
            3232508343,
            3380367581,
            1065670069,
            3041331479,
          ]
          w = function (i) {
            if (i < 0) {
              i += x
            }
            return ('00000000' + i.toString(16)).slice(-8)
          }
          o = [
            [16, 50, 84, 118, 152, 186, 220, 254],
            [174, 132, 249, 109, 193, 32, 123, 53],
            [139, 12, 37, 223, 234, 99, 23, 73],
            [151, 19, 205, 235, 98, 165, 4, 143],
            [9, 117, 66, 250, 30, 203, 134, 211],
            [194, 166, 176, 56, 212, 87, 239, 145],
            [92, 241, 222, 164, 112, 54, 41, 184],
            [189, 231, 28, 147, 5, 79, 104, 162],
            [246, 158, 59, 128, 44, 125, 65, 90],
            [42, 72, 103, 81, 191, 233, 195, 13],
          ]
          p = function (a, b, n) {
            let s = q[a] ^ q[b]
            q[a] = (s >>> n) | (s << (32 - n))
          }
          g = function (i, a, b, c, d) {
            let u = l + (o[r][i] % 16),
              v = l + (o[r][i] >> 4)
            a %= 4
            b = 4 + (b % 4)
            c = 8 + (c % 4)
            d = 12 + (d % 4)
            q[a] += q[b] + (t[u] ^ m[v % 16])
            p(d, a, 16)
            q[c] += q[d]
            p(b, c, 12)
            q[a] += q[b] + (t[v] ^ m[u % 16])
            p(d, a, 8)
            q[c] += q[d]
            p(b, c, 7)
          }
          return function (a, b) {
            if (!(b instanceof Array && b.length === 4)) {
              b = [0, 0, 0, 0]
            }
            let c, d, e, L, f, h, j, i
            d = k.slice(0)
            c = m.slice(0, 8)
            for (r = 0; r < 4; r += 1) {
              c[r] ^= b[r]
            }
            e = a.length * 16
            f = e % 512 > 446 || e % 512 === 0 ? 0 : e
            if (e % 512 === 432) {
              a += '老'
            } else {
              a += '耀'
              while (a.length % 32 !== 27) {
                a += '\0'
              }
              a += ''
            }
            t = []
            for (i = 0; i < a.length; i += 2) {
              t.push(a.charCodeAt(i) * 65536 + a.charCodeAt(i + 1))
            }
            t.push(0)
            t.push(e)
            h = t.length - 16
            j = 0
            for (l = 0; l < t.length; l += 16) {
              j += 512
              L = l === h ? f : Math.min(e, j)
              q = d.concat(c)
              q[12] ^= L
              q[13] ^= L
              for (r = 0; r < 10; r += 1) {
                for (i = 0; i < 8; i += 1) {
                  if (i < 4) {
                    g(i, i, i, i, i)
                  } else {
                    g(i, i, i + 1, i + 2, i + 3)
                  }
                }
              }
              for (i = 0; i < 8; i += 1) {
                d[i] ^= b[i % 4] ^ q[i] ^ q[i + 8]
              }
            }
            return d.map(w).join('')
          }
        })()
        /**
         * 自动使用的颜色序列
         */
        let RESOURCE_COLOR_SERIES = [51, 303, 75, 200, 157, 0, 26, 254, 171, 22, 99, 140, 66, 220, 190, 80, 180 ].map(
          function (h) {
            if (h === 75) {
              return kity.Color.createHSL(h, 100 - 75, 85)
            } else {
              return kity.Color.createHSL(h, 100, 85)
            }
          },
        )
        /**
         * 在 Minder 上拓展一些关于资源的支持接口
         */
        kity.extendClass(Minder, {
          /**
           * 获取字符串的哈希值
           *
           * @param {String} str
           * @return {Number} hashCode
           */
          getHashCode: function (str) {
            str = blake32(str)
            let hash = 1315423911,
              i,
              ch
            for (i = str.length - 1; i >= 0; i--) {
              ch = str.charCodeAt(i)
              hash ^= (hash << 5) + ch + (hash >> 2)
            }
            return hash & 2147483647
          },
          /**
           * 获取脑图中某个资源对应的颜色
           *
           * 如果存在同名资源，则返回已经分配给该资源的颜色，否则分配给该资源一个颜色，并且返回
           *
           * 如果资源数超过颜色序列数量，返回哈希颜色
           *
           * @param {String} resource 资源名称
           * @return {Color}
           */
          getResourceColor: function (resource) {
            let colorMapping = this._getResourceColorIndexMapping()
            let nextIndex
            if (!Object.prototype.hasOwnProperty.call(colorMapping, resource)) {
              // 找不到找下个可用索引
              nextIndex = this._getNextResourceColorIndex()
              colorMapping[resource] = nextIndex
            }
            // 资源过多，找不到可用索引颜色，统一返回哈希函数得到的颜色
            return (
              RESOURCE_COLOR_SERIES[colorMapping[resource]] ||
              kity.Color.createHSL(
                Math.floor((this.getHashCode(resource) / 2147483647) * 359),
                100,
                85,
              )
            )
          },
          /**
           * 获得已使用的资源的列表
           *
           * @return {Array}
           */
          getUsedResource: function () {
            let mapping = this._getResourceColorIndexMapping()
            let used = [],
              resource
            for (resource in mapping) {
              if (Object.prototype.hasOwnProperty.call(mapping, resource)) {
                used.push(resource)
              }
            }
            return used
          },
          /**
           * 获取脑图下一个可用的资源颜色索引
           *
           * @return {int}
           */
          _getNextResourceColorIndex: function () {
            // 获取现有颜色映射
            //     resource => color_index
            let colorMapping = this._getResourceColorIndexMapping()
            let resource, used, i
            used = []
            // 抽取已经使用的值到 used 数组
            for (resource in colorMapping) {
              if (Object.prototype.hasOwnProperty.call(colorMapping, resource)) {
                used.push(colorMapping[resource])
              }
            }
            // 枚举所有的可用值，如果还没被使用，返回
            for (i = 0; i < RESOURCE_COLOR_SERIES.length; i++) {
              if (!~used.indexOf(i)) return i
            }
            // 没有可用的颜色了
            return -1
          },
          // 获取现有颜色映射
          //     resource => color_index
          _getResourceColorIndexMapping: function () {
           
            return this._resourceColorMapping || (this._resourceColorMapping = {})
          },
        })
        /**
         * @class 设置资源的命令
         *
         * @example
         *
         * // 设置选中节点资源为 "张三"
         * minder.execCommand('resource', ['张三']);
         *
         * // 添加资源 "李四" 到选中节点
         * var resource = minder.queryCommandValue();
         * resource.push('李四');
         * minder.execCommand('resource', resource);
         *
         * // 清除选中节点的资源
         * minder.execCommand('resource', null);
         */
        let ResourceCommand = kity.createClass('ResourceCommand', {
          base: Command,
          execute: function (minder, resource) {
            let nodes = minder.getSelectedNodes()
            if (typeof resource == 'string') {
              resource = [resource]
            }
            nodes.forEach(function (node) {
              node.setData('resource', resource).render()
            })
            minder.layout(200)
          },
          queryValue: function (minder) {
            let nodes = minder.getSelectedNodes()
            let resource = []
            nodes.forEach(function (node) {
              let nodeResource = node.getData('resource')
              if (!nodeResource) return
              nodeResource.forEach(function (name) {
                if (!~resource.indexOf(name)) {
                  resource.push(name)
                }
              })
            })
            return resource
          },
          queryState: function (km) {
            return km.getSelectedNode() ? 0 : -1
          },
        })
        /**
         * @class 资源的覆盖图形
         *
         * 该类为一个资源以指定的颜色渲染一个动态的覆盖图形
         */
        let ResourceOverlay = kity.createClass('ResourceOverlay', {
          base: kity.Group,
          constructor: function () {
            this.callBase()
            let text, rect
            rect = this.rect = new kity.Rect().setRadius(4)
            text = this.text = new kity.Text().setFontSize(11).setVerticalAlign('middle')
            this.addShapes([rect, text])
          },
          setValue: function (resourceName, color) {
            let paddingX = 8,
              paddingY = 4,
              borderRadius = 4
            let text, box, rect
            text = this.text
            if (resourceName == this.lastResourceName) {
              box = this.lastBox
            } else {
              text.setContent(resourceName)
              box = text.getBoundaryBox()
              this.lastResourceName = resourceName
              this.lastBox = box
            }
            text.setX(paddingX).fill(color.dec('l', 70))

            //text.setY(3)
            rect = this.rect
            rect.setPosition(0, box.y - paddingY)
            this.width = Math.round(box.width + paddingX * 2)
            this.height = Math.round(box.height + paddingY * 2)
            rect.setSize(this.width, this.height)
            rect.fill(color)
            rect.setRadius(8)
          },
        })
        /**
         * @class 资源渲染器
         */
        let ResourceRenderer = kity.createClass('ResourceRenderer', {
          base: Renderer,
          create: function (node) {
            this.overlays = []
            return new kity.Group()
          },
          shouldRender: function (node) {
            return node.getData('resource') && node.getData('resource').length
          },
          update: function (container, node, box) {
            let spaceRight = node.getStyle('space-right')
            let overlays = this.overlays
            /*  修复 resource 数组中出现 null或undefined 的 bug
             *  @Author zhangbobell
             *  @date 2016-01-15
             */
            let resource = node.getData('resource').filter(function (ele) {
              return ele !== null && ele !== undefined
            })
            if (resource.length === 0) {
              return
            }
            let minder = node.getMinder()
            let i, overlay, x
            x = 0
            for (i = 0; i < resource.length; i++) {
              x += spaceRight
              overlay = overlays[i]
              if (!overlay) {
                overlay = new ResourceOverlay()
                overlays.push(overlay)
                container.addShape(overlay)
              }
              overlay.setVisible(true)
              overlay.setValue(resource[i], minder.getResourceColor(resource[i]))
              overlay.setTranslate(x, -1)
              x += overlay.width
            }
            while ((overlay = overlays[i++])) overlay.setVisible(false)
            container.setTranslate(box.right, 0)
            return new kity.Box({
              x: box.right,
              y: Math.round(-overlays[0].height / 2),
              width: x,
              height: overlays[0].height,
            }
            )



          },
        })
        return {
          commands: {
            resource: ResourceCommand,
          },
          renderers: {
            right: ResourceRenderer,
          },
        }
      })
    },
  }

  //src/module/select.js
  _p[59] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      Module.register('Select', function () {
        let minder = this
        let rc = minder.getRenderContainer()
        // 在实例上渲染框选矩形、计算框选范围的对象
        let marqueeActivator = (function () {
          // 记录选区的开始位置（mousedown的位置）
          let startPosition = null
          // 选区的图形
          let marqueeShape = new kity.Path()
          // 标记是否已经启动框选状态
          //    并不是 mousedown 发生之后就启动框选状态，而是检测到移动了一定的距离（MARQUEE_MODE_THRESHOLD）之后
          let marqueeMode = false
          let MARQUEE_MODE_THRESHOLD = 10
          // 自动滚动相关变量
          let autoScrollTimer = null
          let currentMousePosition = null
          let lastClientPosition = null // 保存鼠标的客户端坐标
          let SCROLL_EDGE_SIZE = 50 // 触发自动滚动的边缘区域大小（像素）
          let SCROLL_SPEED = 10 // 滚动速度（像素/帧）
          
          // 执行选区更新的函数（从selectMove中提取出来）
          function updateMarquee() {
            if (!startPosition || !currentMousePosition || !marqueeMode) return
            
            let p1 = startPosition,
              p2 = currentMousePosition
            let marquee = new kity.Box(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y),
              selectedNodes = []
            // 使其犀利
            marquee.left = Math.round(marquee.left)
            marquee.top = Math.round(marquee.top)
            marquee.right = Math.round(marquee.right)
            marquee.bottom = Math.round(marquee.bottom)
            // 选区形状更新
            marqueeShape.getDrawer().pipe(function () {
              this.clear()
              this.moveTo(marquee.left, marquee.top)
              this.lineTo(marquee.right, marquee.top)
              this.lineTo(marquee.right, marquee.bottom)
              this.lineTo(marquee.left, marquee.bottom)
              this.close()
            })
            // 计算选中范围
            minder.getRoot().traverse(function (node) {
              let renderBox = node.getLayoutBox()
              if (!renderBox.intersect(marquee).isEmpty()) {
                selectedNodes.push(node)
              }
            })
            // 应用选中范围
            minder.select(selectedNodes, true)
            // 清除多余的东西
            window.getSelection().removeAllRanges()
          }
          
          // 检测是否需要自动滚动，并执行滚动
          function checkAndScroll(clientX, clientY) {
            let paperElement = minder.getPaper().container
            let viewRect = paperElement.getBoundingClientRect()
            let scrollX = 0
            let scrollY = 0
            
            // 检测水平方向
            if (clientX - viewRect.left < SCROLL_EDGE_SIZE) {
              // 接近左边缘，画布向右移动以显示左边内容
              scrollX = SCROLL_SPEED
            } else if (viewRect.right - clientX < SCROLL_EDGE_SIZE) {
              // 接近右边缘，画布向左移动以显示右边内容
              scrollX = -SCROLL_SPEED
            }
            
            // 检测垂直方向
            if (clientY - viewRect.top < SCROLL_EDGE_SIZE) {
              // 接近上边缘，画布向下移动以显示上面内容
              scrollY = SCROLL_SPEED
            } else if (viewRect.bottom - clientY < SCROLL_EDGE_SIZE) {
              // 接近下边缘，画布向上移动以显示下面内容
              scrollY = -SCROLL_SPEED
            }
            
            // 如果需要滚动
            if (scrollX !== 0 || scrollY !== 0) {
              // 获取当前视图位置
              let currentTranslate = rc.transform.translate
              let currentPosition = currentTranslate ? currentTranslate[0] : new kity.Point(0, 0)
              
              // 计算新位置
              let newPosition = new kity.Point(
                currentPosition.x + scrollX,
                currentPosition.y + scrollY
              )
              
              // 更新视图位置
              rc.setTranslate(newPosition)
              
              // 不更新 currentMousePosition，因为在框选模式下
              // selectionchange 的自动视图调整已被禁用
              // 框选区域会保持正确
              
              // 更新框选区域
              updateMarquee()
              
              return true // 表示发生了滚动
            }
            
            return false // 没有滚动
          }
          
          // 启动自动滚动
          function startAutoScroll(clientX, clientY) {
            if (autoScrollTimer) return // 已经在运行
            
            autoScrollTimer = setInterval(function () {
              if (!marqueeMode || !currentMousePosition) {
                stopAutoScroll()
                return
              }
              
              // 获取最新的客户端坐标（使用保存的位置）
              checkAndScroll(clientX, clientY)
            }, 16) // 约60fps
          }
          
          // 停止自动滚动
          function stopAutoScroll() {
            if (autoScrollTimer) {
              clearInterval(autoScrollTimer)
              autoScrollTimer = null
            }
          }
          
          return {
            selectStart: function (e) {
              // 只接受左键
              if (e.originEvent.button || e.originEvent.altKey) return
              // 清理不正确状态
              if (startPosition) {
                return this.selectEnd()
              }
              startPosition = e.getPosition(rc).round()
              currentMousePosition = null
            },
            selectMove: function (e) {
              if (minder.getStatus() == 'textedit') {
                return
              }
              if (!startPosition) return
              
              let p1 = startPosition,
                p2 = e.getPosition(rc)
              
              // 保存当前鼠标位置和客户端坐标
              currentMousePosition = p2
              lastClientPosition = {
                x: e.originEvent.clientX,
                y: e.originEvent.clientY
              }
              
              // 获取客户端坐标（用于边界检测）
              let clientX = e.originEvent.clientX
              let clientY = e.originEvent.clientY
              
              // 检测是否要进入选区模式
              if (!marqueeMode) {
                // 距离没达到阈值，退出
                if (kity.Vector.fromPoints(p1, p2).length() < MARQUEE_MODE_THRESHOLD) {
                  return
                }
                // 已经达到阈值，记录下来并且重置选区形状
                marqueeMode = true
                // 设置框选标记，阻止自动调整视图
                minder._isMarqueeSelecting = true
                rc.addShape(marqueeShape)
                marqueeShape
                  .fill(minder.getStyle('marquee-background'))
                  .stroke(minder.getStyle('marquee-stroke'))
                  .setOpacity(0.8)
                  .getDrawer()
                  .clear()
              }
              
              // 更新框选区域
              updateMarquee()
              
              // 检测是否需要自动滚动
              let paperElement = minder.getPaper().container
              let viewRect = paperElement.getBoundingClientRect()
              let needScroll = false
              
              // 检测是否接近边缘
              if (clientX - viewRect.left < SCROLL_EDGE_SIZE ||
                  viewRect.right - clientX < SCROLL_EDGE_SIZE ||
                  clientY - viewRect.top < SCROLL_EDGE_SIZE ||
                  viewRect.bottom - clientY < SCROLL_EDGE_SIZE) {
                needScroll = true
              }
              
              if (needScroll) {
                // 立即执行一次滚动
                checkAndScroll(clientX, clientY)
                // 启动自动滚动定时器
                startAutoScroll(clientX, clientY)
              } else {
                // 停止自动滚动
                stopAutoScroll()
              }
            },
            selectEnd: function (e) {
              // 停止自动滚动
              stopAutoScroll()
              
              // 清除框选标记，恢复自动调整视图功能
              minder._isMarqueeSelecting = false
              
              if (startPosition) {
                startPosition = null
              }
              if (marqueeMode) {
                marqueeShape.fadeOut(200, 'ease', 0, function () {
                  if (marqueeShape.remove) marqueeShape.remove()
                })
                marqueeMode = false
              }
              
              // 清理鼠标位置
              currentMousePosition = null
              lastClientPosition = null
            },
          }
        })()
        let lastDownNode = null,
          lastDownPosition = null
        return {
          init: function () {
            window.addEventListener('mouseup', function () {
              marqueeActivator.selectEnd()
            })
          },
          events: {
            mousedown: function (e) {
              let downNode = e.getTargetNode()
              // 没有点中节点：
              //     清除选中状态，并且标记选区开始位置
              if (!downNode) {
                this.removeAllSelectedNodes()
                marqueeActivator.selectStart(e)
                
                this.setStatus('normal')
              } else if (e.isShortcutKey('Ctrl')) {
                this.toggleSelect(downNode)
              } else if (!downNode.isSelected()) {
                this.select(downNode, true)
              } else if (!this.isSingleSelect()) {
                lastDownNode = downNode
                lastDownPosition = e.getPosition()
              }
            },
            mousemove: marqueeActivator.selectMove,
            mouseup: function (e) {
              let upNode = e.getTargetNode()
              // 如果 mouseup 发生在 lastDownNode 外，是无需理会的
              if (upNode && upNode == lastDownNode) {
                let upPosition = e.getPosition()
                let movement = kity.Vector.fromPoints(lastDownPosition, upPosition)
                if (movement.length() < 1) this.select(lastDownNode, true)
                lastDownNode = null
              }
              // 清理一下选择状态
              marqueeActivator.selectEnd(e)
            },
            //全选操作
            'normal.keydown': function (e) {
              if (e.isShortcutKey('ctrl+a')) {
                let selectedNodes = []
                this.getRoot().traverse(function (node) {
                  selectedNodes.push(node)
                })
                this.select(selectedNodes, true)
                e.preventDefault()
              }
            },
          },
        }
      })
    },
  }

  //src/module/style.js
  _p[60] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      Module.register('StyleModule', function () {
        let styleNames = [
          'font-size',
          'font-family',
          'font-weight',
          'font-style',
          'background',
          'color',
          'text-decoration',
        ]
        let styleClipBoard = null
        function hasStyle(node) {
          let data = node.getData()
          for (let i = 0; i < styleNames.length; i++) {
            if (styleNames[i] in data) return true
          }
        }
        return {
          commands: {
            /**
             * @command CopyStyle
             * @description 拷贝选中节点的当前样式，包括字体、字号、粗体、斜体、背景色、字体色
             * @state
             *   0: 当前有选中的节点
             *  -1: 当前没有选中的节点
             */
            copystyle: kity.createClass('CopyStyleCommand', {
              base: Command,
              execute: function (minder) {
                let node = minder.getSelectedNode()
                let nodeData = node.getData()
                styleClipBoard = {}
                styleNames.forEach(function (name) {
                  if (name in nodeData) styleClipBoard[name] = nodeData[name]
                  else {
                    styleClipBoard[name] = null
                    delete styleClipBoard[name]
                  }
                })
                return styleClipBoard
              },
              queryState: function (minder) {
                let nodes = minder.getSelectedNodes()
                if (nodes.length !== 1) return -1
                return hasStyle(nodes[0]) ? 0 : -1
              },
            }),
            /**
             * @command PasteStyle
             * @description 粘贴已拷贝的样式到选中的节点上，包括字体、字号、粗体、斜体、背景色、字体色
             * @state
             *   0: 当前有选中的节点，并且已经有复制的样式
             *  -1: 当前没有选中的节点，或者没有复制的样式
             */
            pastestyle: kity.createClass('PastStyleCommand', {
              base: Command,
              execute: function (minder) {
                minder.getSelectedNodes().forEach(function (node) {
                  for (let name in styleClipBoard) {
                    if (styleClipBoard.hasOwnProperty(name))
                      node.setData(name, styleClipBoard[name])
                  }
                })
                minder.renderNodeBatch(minder.getSelectedNodes())
                minder.layout(300)
                return styleClipBoard
              },
              queryState: function (minder) {
                return styleClipBoard && minder.getSelectedNodes().length ? 0 : -1
              },
            }),
            /**
             * @command ClearStyle
             * @description 移除选中节点的样式，包括字体、字号、粗体、斜体、背景色、字体色
             * @state
             *   0: 当前有选中的节点，并且至少有一个设置了至少一种样式
             *  -1: 其它情况
             */
            clearstyle: kity.createClass('ClearStyleCommand', {
              base: Command,
              execute: function (minder) {
                minder.getSelectedNodes().forEach(function (node) {
                  styleNames.forEach(function (name) {
                    node.setData(name)
                  })
                })
                minder.renderNodeBatch(minder.getSelectedNodes())
                minder.layout(300)
                return styleClipBoard
              },
              queryState: function (minder) {
                let nodes = minder.getSelectedNodes()
                if (!nodes.length) return -1
                for (let i = 0; i < nodes.length; i++) {
                  if (hasStyle(nodes[i])) return 0
                }
                return -1
              },
            }),
          },
        }
      })
    },
  }

  //src/module/text.js
  _p[61] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      /**
       * 针对不同系统、不同浏览器、不同字体做居中兼容性处理
       * 暂时未增加Linux的处理
       */
      let FONT_ADJUST = {
        safari: {
          '微软雅黑,Microsoft YaHei': -0.17,
          '楷体,楷体_GB2312,SimKai': -0.1,
          '隶书, SimLi': -0.1,
          'comic sans ms': -0.23,
          'impact,chicago': -0.15,
          'times new roman': -0.1,
          'arial black,avant garde': -0.17,
          default: 0,
        },
        ie: {
          10: {
            '微软雅黑,Microsoft YaHei': -0.17,
            'comic sans ms': -0.17,
            'impact,chicago': -0.08,
            'times new roman': 0.04,
            'arial black,avant garde': -0.17,
            default: -0.15,
          },
          11: {
            '微软雅黑,Microsoft YaHei': -0.17,
            'arial,helvetica,sans-serif': -0.17,
            'comic sans ms': -0.17,
            'impact,chicago': -0.08,
            'times new roman': 0.04,
            'sans-serif': -0.16,
            'arial black,avant garde': -0.17,
            default: -0.15,
          },
        },
        edge: {
          '微软雅黑,Microsoft YaHei': -0.15,
          'arial,helvetica,sans-serif': -0.17,
          'comic sans ms': -0.17,
          'impact,chicago': -0.08,
          'sans-serif': -0.16,
          'arial black,avant garde': -0.17,
          default: -0.15,
        },
        sg: {
          '微软雅黑,Microsoft YaHei': -0.15,
          'arial,helvetica,sans-serif': -0.05,
          'comic sans ms': -0.22,
          'impact,chicago': -0.16,
          'times new roman': -0.03,
          'arial black,avant garde': -0.22,
          default: -0.15,
        },
        chrome: {
          Mac: {
            'andale mono': -0.05,
            'comic sans ms': -0.3,
            'impact,chicago': -0.13,
            'times new roman': -0.1,
            'arial black,avant garde': -0.17,
            default: 0,
          },
          Win: {
            '微软雅黑,Microsoft YaHei': -0.15,
            'arial,helvetica,sans-serif': -0.02,
            'arial black,avant garde': -0.2,
            'comic sans ms': -0.2,
            'impact,chicago': -0.12,
            'times new roman': -0.02,
            default: -0.15,
          },
          Lux: {
            'andale mono': -0.05,
            'comic sans ms': -0.3,
            'impact,chicago': -0.13,
            'times new roman': -0.1,
            'arial black,avant garde': -0.17,
            default: 0,
          },
        },
        firefox: {
          Mac: {
            '微软雅黑,Microsoft YaHei': -0.2,
            '宋体,SimSun': 0.05,
            'comic sans ms': -0.2,
            'impact,chicago': -0.15,
            'arial black,avant garde': -0.17,
            'times new roman': -0.1,
            default: 0.05,
          },
          Win: {
            '微软雅黑,Microsoft YaHei': -0.16,
            'andale mono': -0.17,
            'arial,helvetica,sans-serif': -0.17,
            'comic sans ms': -0.22,
            'impact,chicago': -0.23,
            'times new roman': -0.22,
            'sans-serif': -0.22,
            'arial black,avant garde': -0.17,
            default: -0.16,
          },
          Lux: {
            '宋体,SimSun': -0.2,
            '微软雅黑,Microsoft YaHei': -0.2,
            '黑体, SimHei': -0.2,
            '隶书, SimLi': -0.2,
            '楷体,楷体_GB2312,SimKai': -0.2,
            'andale mono': -0.2,
            'arial,helvetica,sans-serif': -0.2,
            'comic sans ms': -0.2,
            'impact,chicago': -0.2,
            'times new roman': -0.2,
            'sans-serif': -0.2,
            'arial black,avant garde': -0.2,
            default: -0.16,
          },
        },
      }
      var TextRenderer = kity.createClass('TextRenderer', {
        base: Renderer,
        create: function () {

          var mytext = new kity.Group().setId(utils.uuid('node_text'))

          let timeoutId;

          // mytext.on('mousedown',function(e){

          //   console.log('mousedown')  
          //   if (timeoutId) {
          //     clearTimeout(timeoutId);
          //   }   

          //   var render=mytext.container.minderNode.getRenderer('ExpanderRenderer')
          //   var expander=render.expander

          //   if(expander){
          //     render.isShow=true
          //     expander.setState(true)
          //     render.update(render.getRenderShape(),mytext.container.minderNode)
          //   }

          // });

          // mytext.on('mouseout',function(e){

          //   if (timeoutId) {
          //     clearTimeout(timeoutId);
          //   }
          //   timeoutId = setTimeout(function() {
          //     console.log('mouseenter')            
          //     var render=mytext.container.minderNode.getRenderer('ExpanderRenderer')
          //     var expander=render.expander

          //     if(expander){
          //       render.isShow=false
          //       expander.setState('hide')
          //       render.update(render.getRenderShape(),mytext.container.minderNode)
          //     }

          //   },3000)        
          // });

          return mytext;
        },
        update: function (textGroup, node) {
          function getDataOrStyle(name) {
            return node.getData(name) || node.getStyle(name)
          }
          let nodeText = node.getText()
          let textArr = nodeText ? nodeText.split('\n') : [' ']
          let lineHeight = node.getStyle('line-height')
          let fontSize = getDataOrStyle('font-size')
          let fontFamily = getDataOrStyle('font-family') || 'default'
          let height = lineHeight * fontSize * textArr.length - (lineHeight - 1) * fontSize
          let yStart = -height / 2
          let Browser = kity.Browser
          let adjust
          if (Browser.chrome || Browser.opera || Browser.bd || Browser.lb === 'chrome') {
            adjust = FONT_ADJUST['chrome'][Browser.platform][fontFamily]
          } else if (Browser.gecko) {
            adjust = FONT_ADJUST['firefox'][Browser.platform][fontFamily]
          } else if (Browser.sg) {
            adjust = FONT_ADJUST['sg'][fontFamily]
          } else if (Browser.safari) {
            adjust = FONT_ADJUST['safari'][fontFamily]
          } else if (Browser.ie) {
            adjust = FONT_ADJUST['ie'][Browser.version][fontFamily]
          } else if (Browser.edge) {
            adjust = FONT_ADJUST['edge'][fontFamily]
          } else if (Browser.lb) {
            // 猎豹浏览器的ie内核兼容性模式下
            adjust = 0.9
          }
          textGroup.setTranslate(0, (adjust || 0) * fontSize)
          let rBox = new kity.Box(),
            r = Math.round
          this.setTextStyle(node, textGroup)
          let textLength = textArr.length
          let textGroupLength = textGroup.getItems().length
          let i, ci, textShape, text
          if (textLength < textGroupLength) {
            for (i = textLength, ci; (ci = textGroup.getItem(i));) {
              textGroup.removeItem(i)
            }
          } else if (textLength > textGroupLength) {
            let growth = textLength - textGroupLength
            while (growth--) {
              textShape = new kity.Text().setAttr('text-rendering', 'inherit')
              if (kity.Browser.ie || kity.Browser.edge) {
                textShape.setVerticalAlign('top')
              } else {
                textShape.setAttr('dominant-baseline', 'text-before-edge')
              }
              textGroup.addItem(textShape)
            }
          }
          for (
            i = 0, text, textShape;
            (text = textArr[i]), (textShape = textGroup.getItem(i));
            i++
          ) {
            textShape.setContent(text)

            if (kity.Browser.ie || kity.Browser.edge) {
              textShape.fixPosition()
            }
          }
          this.setTextStyle(node, textGroup)
          let textHash =
            node.getText() +
            ['font-size', 'font-name', 'font-weight', 'font-style', 'text-decoration']
              .map(getDataOrStyle)
              .join('/')
          if (node._currentTextHash == textHash && node._currentTextGroupBox)
            return node._currentTextGroupBox
          node._currentTextHash = textHash
          return function () {
            textGroup.eachItem(function (i, textShape) {
              let y = yStart + i * fontSize * lineHeight
              textShape.setY(y)
              let bbox = textShape.getBoundaryBox()
              rBox = rBox.merge(new kity.Box(0, y, (bbox.height && bbox.width) || 1, fontSize))
            })
            let nBox = new kity.Box(r(rBox.x), r(rBox.y), r(rBox.width), r(rBox.height))
            node._currentTextGroupBox = nBox
            return nBox
          }
        },
        setTextStyle: function (node, text) {
          let hooks = TextRenderer._styleHooks
          hooks.forEach(function (hook) {
            hook(node, text)
          })
        },
      })
      let TextCommand = kity.createClass({
        base: Command,
        execute: function (minder, text) {
          let node = minder.getSelectedNode()
          if (node) {
            node.setText(text)
            node.render()
            minder.layout()
          }
        },
        queryState: function (minder) {
          return minder.getSelectedNodes().length == 1 ? 0 : -1
        },
        queryValue: function (minder) {
          let node = minder.getSelectedNode()
          return node ? node.getText() : null
        },
      })
      utils.extend(TextRenderer, {
        _styleHooks: [],
        registerStyleHook: function (fn) {
          TextRenderer._styleHooks.push(fn)
        },
      })
      kity.extendClass(MinderNode, {
        getTextGroup: function () {
          return this.getRenderer('TextRenderer').getRenderShape()
        },
      })
      Module.register('text', {
        commands: {
          text: TextCommand,
        },
        renderers: {
          center: TextRenderer,
        },
      })
      module.exports = TextRenderer
    },
  }

  //src/module/view.js
  _p[62] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
       
      let ViewDragger = kity.createClass('ViewDragger', {
        constructor: function (minder) {
          this._minder = minder
          this._enabled = false
          this._bind()
          let me = this
          this._minder.getViewDragger = function () {
            return me
          }
          this.setEnabled(false)
        },
        isEnabled: function () {
          return this._enabled
        },
        setEnabled: function (value) {
          let paper = this._minder.getPaper()
          paper.setStyle('cursor', value ? 'pointer' : 'default')
          paper.setStyle('cursor', value ? '-webkit-grab' : 'default')
          this._enabled = value
        },
        timeline: function () {
          return this._moveTimeline
        },
        move: function (offset, duration) {
          let minder = this._minder
          let targetPosition = this.getMovement().offset(offset)
          this.moveTo(targetPosition, duration)
        },
        moveTo: function (position, duration) {
          if (duration) {
            let dragger = this
            if (this._moveTimeline) this._moveTimeline.stop()
            this._moveTimeline = this._minder
              .getRenderContainer()
              .animate(
                new kity.Animator(this.getMovement(), position, function (target, value) {
                  dragger.moveTo(value)
                }),
                duration,
                'easeOutCubic',
              )
              .timeline()
            this._moveTimeline.on('finish', function () {
              dragger._moveTimeline = null
            })
            return this
          }
          this._minder.getRenderContainer().setTranslate(position.round())
          this._minder.fire('viewchange')
        },
        getMovement: function () {
          let translate = this._minder.getRenderContainer().transform.translate
          return translate ? translate[0] : new kity.Point()
        },
        getView: function () {
          let minder = this._minder
          let c = minder._lastClientSize || {
            width: minder.getRenderTarget().clientWidth,
            height: minder.getRenderTarget().clientHeight,
          }
          let m = this.getMovement()
          let box = new kity.Box(0, 0, c.width, c.height)
          let viewMatrix = minder.getPaper().getViewPortMatrix()
          return viewMatrix
            .inverse()
            .translate(-m.x, -m.y)
            .transformBox(box)
        },
        _bind: function () {
          let dragger = this,
            isTempDrag = false,
            lastPosition = null,
            currentPosition = null
          function dragEnd(e) {
            if (!lastPosition) return
            lastPosition = null
            e.stopPropagation()

            window.isSpaceDown = false
            // 临时拖动需要还原状态
            if (isTempDrag) {
              dragger.setEnabled(false)
              isTempDrag = false
              if (dragger._minder.getStatus() == 'hand') dragger._minder.rollbackStatus()
            }
            let paper = dragger._minder.getPaper()
            paper.setStyle(
              'cursor',
              dragger._minder.getStatus() == 'hand' ? '-webkit-grab' : 'default',
            )
            dragger._minder.fire('viewchanged')
          }
          this._minder
            .on(
              'normal.mousedown normal.touchstart ' +
              'inputready.mousedown inputready.touchstart ' +
              'readonly.mousedown readonly.touchstart',
              function (e) {
                if (e.originEvent.button == 2) {
                  e.originEvent.preventDefault()
                }
                 
                // 点击未选中的根节点临时开启
                if (
                  e.getTargetNode() == this.getRoot() ||
                  e.originEvent.button == 2 ||
                  e.originEvent.altKey ||
                  window.isSpaceDown === true
                ) {
                  lastPosition = e.getPosition('view')
                  isTempDrag = true
                }
              },
            )
            .on(
              'normal.mousemove normal.touchmove ' +
              'readonly.mousemove readonly.touchmove ' +
              'inputready.mousemove inputready.touchmove',
              function (e) {
                
                if (e.type == 'touchmove') {
                  e.preventDefault()
                }


              
                if (!isTempDrag) return

                 
                let offset = kity.Vector.fromPoints(lastPosition, e.getPosition('view'))
                if (offset.length() > 10) {
                  this.setStatus('hand', true)
                  let paper = dragger._minder.getPaper()
                  paper.setStyle('cursor', '-webkit-grabbing')
                }
              },
            )
            .on('hand.beforemousedown hand.beforetouchstart', function (e) {
              // 已经被用户打开拖放模式
              if (dragger.isEnabled()) {
                lastPosition = e.getPosition('view')
                e.stopPropagation()
                let paper = dragger._minder.getPaper()
                paper.setStyle('cursor', '-webkit-grabbing')
              }
            })
            .on('hand.beforemousemove hand.beforetouchmove', function (e) {
              
              if (lastPosition) {
                currentPosition = e.getPosition('view')
                // 当前偏移加上历史偏移
                let offset = kity.Vector.fromPoints(lastPosition, currentPosition)
                dragger.move(offset)
                e.stopPropagation()
                e.preventDefault()
                e.originEvent.preventDefault()
                lastPosition = currentPosition
              }
            })
            .on('mouseup touchend', dragEnd)
             
          window.addEventListener('mouseup', dragEnd)
          this._minder.on('contextmenu', function (e) {
            e.preventDefault()
          })
        },
      })
      Module.register('View', function () {
        let km = this
        /**
         * @command Hand
         * @description 切换抓手状态，抓手状态下，鼠标拖动将拖动视野，而不是创建选区
         * @state
         *   0: 当前不是抓手状态
         *   1: 当前是抓手状态
         */
        let ToggleHandCommand = kity.createClass('ToggleHandCommand', {
          base: Command,
          execute: function (minder) {
            if (minder.getStatus() != 'hand') {
              minder.setStatus('hand', true)
            } else {
              minder.rollbackStatus()
            }
            this.setContentChanged(false)
          },
          queryState: function (minder) {
            return minder.getStatus() == 'hand' ? 1 : 0
          },
          enableReadOnly: true,
        })
        /**
         * @command Camera
         * @description 设置当前视野的中心位置到某个节点上
         * @param {kityminder.MinderNode} focusNode 要定位的节点
         * @param {number} duration 设置视野移动的动画时长（单位 ms），设置为 0 不使用动画
         * @state
         *   0: 始终可用
         */
        let CameraCommand = kity.createClass('CameraCommand', {
          base: Command,
          execute: function (km, focusNode) {
            focusNode = focusNode || km.getRoot()
            let viewport = km.getPaper().getViewPort()
            let offset = focusNode.getRenderContainer().getRenderBox('view')
            let dx = viewport.center.x - offset.x - offset.width / 2,
              dy = viewport.center.y - offset.y
            let dragger = km._viewDragger
            let duration = km.getOption('viewAnimationDuration')
            dragger.move(new kity.Point(dx, dy), duration)
            this.setContentChanged(false)
          },
          enableReadOnly: true,
        })
        /**
         * @command Move
         * @description 指定方向移动当前视野
         * @param {string} dir 移动方向
         *    取值为 'left'，视野向左移动一半
         *    取值为 'right'，视野向右移动一半
         *    取值为 'up'，视野向上移动一半
         *    取值为 'down'，视野向下移动一半
         * @param {number} duration 视野移动的动画时长（单位 ms），设置为 0 不使用动画
         * @state
         *   0: 始终可用
         */
        let MoveCommand = kity.createClass('MoveCommand', {
          base: Command,
          execute: function (km, dir) {
            let dragger = km._viewDragger
            let size = km._lastClientSize
            let duration = km.getOption('viewAnimationDuration')
            switch (dir) {
              case 'up':
                dragger.move(new kity.Point(0, size.height / 2), duration)
                break

              case 'down':
                dragger.move(new kity.Point(0, -size.height / 2), duration)
                break

              case 'left':
                dragger.move(new kity.Point(size.width / 2, 0), duration)
                break

              case 'right':
                dragger.move(new kity.Point(-size.width / 2, 0), duration)
                break
            }
          },
          enableReadOnly: true,
        })
        let MoveCommandV2 = kity.createClass('MoveCommandV2', {
          base: Command,
          execute: function (km, x,y) {
            let dragger = km._viewDragger
            let duration = km.getOption('viewAnimationDuration')
            

            dragger.move({
              x: x,
              y: y,
            })
            let me = this
            clearTimeout(this._mousewheeltimer)
            this._mousewheeltimer = setTimeout(function () {
              km.fire('viewchanged')
            }, 100)
             
          },
          enableReadOnly: true,
        })
        return {
          init: function () {
            this._viewDragger = new ViewDragger(this)
          },
          commands: {
            hand: ToggleHandCommand,
            camera: CameraCommand,
            move: MoveCommand,
            moveV2: MoveCommandV2,
          },
          events: {
            statuschange: function (e) {
              this._viewDragger.setEnabled(e.currentStatus == 'hand')
            },
            mousewheel: function (e) {
              
              let dx, dy
              e = e.originEvent
              if (e.ctrlKey || e.shiftKey) return
              if ('wheelDeltaX' in e) {
                dx = e.wheelDeltaX || 0
                dy = e.wheelDeltaY || 0
              } else {
                dx = 0
                dy = e.wheelDelta
              }
              this._viewDragger.move({
                x: dx / 2.5,
                y: dy / 2.5,
              })
              let me = this
              clearTimeout(this._mousewheeltimer)
              this._mousewheeltimer = setTimeout(function () {
                me.fire('viewchanged')
              }, 100)
              e.preventDefault()
            },
            'normal.dblclick readonly.dblclick': function (e) {
              if (e.kityEvent.targetShape instanceof kity.Paper) {
                //关闭双击回到默认视图
                // this.execCommand('camera', this.getRoot(), 800);
              }
            },
            'paperrender finishInitHook': function () {
              if (!this.getRenderTarget()) {
                return
              }
              this.execCommand('camera', null, 0)
              this._lastClientSize = {
                width: this.getRenderTarget().clientWidth,
                height: this.getRenderTarget().clientHeight,
              }
            },
            resize: function (e) {
              let a = {
                width: this.getRenderTarget().clientWidth,
                height: this.getRenderTarget().clientHeight,
              },
                b = this._lastClientSize
              this._viewDragger.move(
                new kity.Point(((a.width - b.width) / 2) | 0, ((a.height - b.height) / 2) | 0),
              )
              this._lastClientSize = a
            },
            'selectionchange layoutallfinish': function (e) {
              let selected = this.getSelectedNode()
              let minder = this
              /*
               * Added by zhangbobell 2015.9.9
               * windows 10 的 edge 浏览器在全部动画停止后，优先级图标不显示 text，
               * 因此再次触发一次 render 事件，让浏览器重绘
               * */
              if (kity.Browser.edge) {
                this.fire('paperrender')
              }
              if (!selected) return
              
              // 如果正在框选中，跳过自动调整视图，避免干扰框选操作
              if (this._isMarqueeSelecting) return
              
              let dragger = this._viewDragger
              let timeline = dragger.timeline()
              /*
               * Added by zhangbobell 2015.09.25
               * 如果之前有动画，那么就先暂时返回，等之前动画结束之后再次执行本函数
               * 以防止 view 动画变动了位置，导致本函数执行的时候位置计算不对
               *
               * fixed bug : 初始化的时候中心节点位置不固定（有的时候在左上角，有的时候在中心）
               * */
              if (timeline) {
                timeline.on('finish', function () {
                  minder.fire('selectionchange')
                })
                return
              }
              let view = dragger.getView()
              let focus = selected.getLayoutBox()
              let space = 50
              let dx = 0,
                dy = 0
              if (focus.right > view.right) {
                dx += view.right - focus.right - space
              } else if (focus.left < view.left) {
                dx += view.left - focus.left + space
              }
              if (focus.bottom > view.bottom) {
                dy += view.bottom - focus.bottom - space
              }
              if (focus.top < view.top) {
                dy += view.top - focus.top + space
              }
              if (dx || dy) dragger.move(new kity.Point(dx, dy), 100)
            },
          },
        }
      })
    },
  }

  //src/module/zoom.js
  _p[63] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let utils = _p.r(33)
      let Minder = _p.r(19)
      let MinderNode = _p.r(21)
      let Command = _p.r(9)
      let Module = _p.r(20)
      let Renderer = _p.r(27)
      Module.register('Zoom', function () {
        let me = this
        let timeline
        function setTextRendering() {
          let value = me._zoomValue >= 100 ? 'optimize-speed' : 'geometricPrecision'
          me.getRenderContainer().setAttr('text-rendering', value)
        }
        function fixPaperCTM(paper) {
          let node = paper.shapeNode
          let ctm = node.getCTM()
          let matrix = new kity.Matrix(
            ctm.a,
            ctm.b,
            ctm.c,
            ctm.d,
            (ctm.e | 0) + 0.5,
            (ctm.f | 0) + 0.5,
          )
          node.setAttribute('transform', 'matrix(' + matrix.toString() + ')')
        }
        kity.extendClass(Minder, {
          zoom: function (value) {
            let paper = this.getPaper()
            let viewport = paper.getViewPort()
            viewport.zoom = value / 100
            viewport.center = {
              x: viewport.center.x,
              y: viewport.center.y,
            }
            paper.setViewPort(viewport)
            if (value == 100) fixPaperCTM(paper)
          },
          getZoomValue: function () {
            return this._zoomValue
          },
        })
        function zoomMinder(minder, value) {
          let paper = minder.getPaper()
          let viewport = paper.getViewPort()
          if (!value) return
          setTextRendering()
          let duration = minder.getOption('zoomAnimationDuration')
          if (minder.getRoot().getComplex() > 200 || !duration) {
            minder._zoomValue = value
            minder.zoom(value)
            minder.fire('viewchange')
          } else {
            let animator = new kity.Animator({
              beginValue: minder._zoomValue,
              finishValue: value,
              setter: function (target, value) {
                target.zoom(value)
              },
            })
            minder._zoomValue = value
            if (timeline) {
              timeline.pause()
            }
            timeline = animator.start(minder, duration, 'easeInOutSine')
            timeline.on('finish', function () {
              minder.fire('viewchange')
            })
          }
          minder.fire('zoom', {
            zoom: value,
          })
        }
        /**
         * @command Zoom
         * @description 缩放当前的视野到一定的比例（百分比）
         * @param {number} value 设置的比例，取值 100 则为原尺寸
         * @state
         *   0: 始终可用
         */
        let ZoomCommand = kity.createClass('Zoom', {
          base: Command,
          execute: zoomMinder,
          queryValue: function (minder) {
            return minder._zoomValue
          },
        })
        /**
         * @command ZoomIn
         * @description 放大当前的视野到下一个比例等级（百分比）
         * @shortcut =
         * @state
         *   0: 如果当前脑图的配置中还有下一个比例等级
         *  -1: 其它情况
         */
        let ZoomInCommand = kity.createClass('ZoomInCommand', {
          base: Command,
          execute: function (minder) {
            zoomMinder(minder, this.nextValue(minder))
          },
          queryState: function (minder) {
            return +!this.nextValue(minder)
          },
          nextValue: function (minder) {
            let stack = minder.getOption('zoom'),
              i
            for (i = 0; i < stack.length; i++) {
              if (stack[i] > minder._zoomValue) return stack[i]
            }
            return 0
          },
          enableReadOnly: true,
        })
        /**
         * @command ZoomOut
         * @description 缩小当前的视野到上一个比例等级（百分比）
         * @shortcut -
         * @state
         *   0: 如果当前脑图的配置中还有上一个比例等级
         *  -1: 其它情况
         */
        let ZoomOutCommand = kity.createClass('ZoomOutCommand', {
          base: Command,
          execute: function (minder) {
            zoomMinder(minder, this.nextValue(minder))
          },
          queryState: function (minder) {
            return +!this.nextValue(minder)
          },
          nextValue: function (minder) {
            let stack = minder.getOption('zoom'),
              i
            for (i = stack.length - 1; i >= 0; i--) {
              if (stack[i] < minder._zoomValue) return stack[i]
            }
            return 0
          },
          enableReadOnly: true,
        })
        return {
          init: function () {
            this._zoomValue = 100
            this.setDefaultOptions({
              zoom: [10, 20, 50, 100, 200],
            })
            setTextRendering()
          },
          commands: {
            zoomin: ZoomInCommand,
            zoomout: ZoomOutCommand,
            zoom: ZoomCommand,
          },
          events: {
            'normal.mousewheel readonly.mousewheel': function (e) {
              if (!e.originEvent.ctrlKey && !e.originEvent.metaKey) return
              let delta = e.originEvent.wheelDelta
              let me = this

              if (kity.Browser.mac || navigator.userAgent.indexOf('Window') > 0) {
                delta = -delta
              }
              // 稀释
              if (Math.abs(delta) > 100) {
                clearTimeout(this._wheelZoomTimeout)
              } else {
                return
              }
              this._wheelZoomTimeout = setTimeout(function () {
                let value
                let lastValue = me.getPaper()._zoom || 1

                if (delta < 0) {
                  me.execCommand('zoomin')
                } else if (delta > 0) {
                  me.execCommand('zoomout')
                }
              }, 5)
              e.originEvent.preventDefault()
            },
          },
          commandShortcutKeys: {
            zoomin: 'ctrl+=',
            zoomout: 'ctrl+-',
          },
        }
      })
    },
  }

  //src/protocol/json.js
  _p[64] = {
    value: function (require, exports, module) {
      let data = _p.r(12)
      data.registerProtocol(
        'json',
        (module.exports = {
          fileDescription: 'KityMinder 格式',
          fileExtension: '.km',
          dataType: 'text',
          mineType: 'application/json',
          encode: function (json) {
            return JSON.stringify(json)
          },
          decode: function (local) {
            return JSON.parse(local)
          },
        }),
      )
    },
  }

  //src/protocol/markdown.js
  _p[65] = {
    value: function (require, exports, module) {
      let data = _p.r(12)
      let LINE_ENDING_SPLITER = /\r\n|\r|\n/
      let EMPTY_LINE = ''
      let NOTE_MARK_START = '\x3c!--Note--\x3e'
      let NOTE_MARK_CLOSE = '\x3c!--/Note--\x3e'
      function encode(json) {
        return _build(json, 1).join('\n')
      }
      function _build(node, level) {
        let lines = []
        level = level || 1
        let sharps = _generateHeaderSharp(level)
        lines.push(sharps + ' ' + node.data.text)
        lines.push(EMPTY_LINE)
        let note = node.data.note
        if (note) {
          let hasSharp = /^#/.test(note)
          if (hasSharp) {
            lines.push(NOTE_MARK_START)
            note = note.replace(/^#+/gm, function ($0) {
              return sharps + $0
            })
          }
          lines.push(note)
          if (hasSharp) {
            lines.push(NOTE_MARK_CLOSE)
          }
          lines.push(EMPTY_LINE)
        }
        if (node.children)
          node.children.forEach(function (child) {
            lines = lines.concat(_build(child, level + 1))
          })
        return lines
      }
      function _generateHeaderSharp(level) {
        let sharps = ''
        while (level--) sharps += '#'
        return sharps
      }
      function decode(markdown) {
        let json,
          parentMap = {},
          lines,
          line,
          lineInfo,
          level,
          node,
          parent,
          noteProgress,
          codeBlock
        // 一级标题转换 `{title}\n===` => `# {title}`
        markdown = markdown.replace(/^(.+)\n={3,}/, function ($0, $1) {
          return '# ' + $1
        })
        lines = markdown.split(LINE_ENDING_SPLITER)
        // 按行分析
        for (let i = 0; i < lines.length; i++) {
          line = lines[i]
          lineInfo = _resolveLine(line)
          // 备注标记处理
          if (lineInfo.noteClose) {
            noteProgress = false
            continue
          } else if (lineInfo.noteStart) {
            noteProgress = true
            continue
          }
          // 代码块处理
          codeBlock = lineInfo.codeBlock ? !codeBlock : codeBlock
          // 备注条件：备注标签中，非标题定义，或标题越位
          if (noteProgress || codeBlock || !lineInfo.level || lineInfo.level > level + 1) {
            if (node) _pushNote(node, line)
            continue
          }
          // 标题处理
          level = lineInfo.level
          node = _initNode(lineInfo.content, parentMap[level - 1])
          parentMap[level] = node
        }
        _cleanUp(parentMap[1])
        return parentMap[1]
      }
      function _initNode(text, parent) {
        let node = {
          data: {
            text: text,
            note: '',
          },
        }
        if (parent) {
          if (parent.children) parent.children.push(node)
          else parent.children = [node]
        }
        return node
      }
      function _pushNote(node, line) {
        node.data.note += line + '\n'
      }
      function _isEmpty(line) {
        return !/\S/.test(line)
      }
      function _resolveLine(line) {
        let match = /^(#+)?\s*(.*)$/.exec(line)
        return {
          level: (match[1] && match[1].length) || null,
          content: match[2],
          noteStart: line == NOTE_MARK_START,
          noteClose: line == NOTE_MARK_CLOSE,
          codeBlock: /^\s*```/.test(line),
        }
      }
      function _cleanUp(node) {
        if (!/\S/.test(node.data.note)) {
          node.data.note = null
          delete node.data.note
        } else {
          let notes = node.data.note.split('\n')
          while (notes.length && !/\S/.test(notes[0])) notes.shift()
          while (notes.length && !/\S/.test(notes[notes.length - 1])) notes.pop()
          node.data.note = notes.join('\n')
        }
        if (node.children) node.children.forEach(_cleanUp)
      }
      data.registerProtocol(
        'markdown',
        (module.exports = {
          fileDescription: 'Markdown/GFM 格式',
          fileExtension: '.md',
          mineType: 'text/markdown',
          dataType: 'text',
          encode: function (json) {
            return encode(json.root)
          },
          decode: function (markdown) {
            return decode(markdown)
          },
        }),
      )
    },
  }

  //src/protocol/png.js
  _p[66] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let data = _p.r(12)
      let Promise = _p.r(25)
      let DomURL = window.URL || window.webkitURL || window
      function loadImage(info, callback) {
        return new Promise(function (resolve, reject) {
          let image = document.createElement('img')
          image.onload = function () {
            
            resolve({
              element: this,
              x: info.x,
              y: info.y,
              width: info.width,
              height: info.height,
            })
          }
          image.onerror = function (err) {
            reject(err)
          }
          image.crossOrigin = 'anonymous'
          image.src = info.url
        })
      }
      /**
       * xhrLoadImage: 通过 xhr 加载保存在 BOS 上的图片
       * @note: BOS 上的 CORS 策略是取 headers 里面的 Origin 字段进行判断
       *        而通过 image 的 src 的方式是无法传递 origin 的，因此需要通过 xhr 进行
       */
      function xhrLoadImage(info, callback) {
        return Promise(function (resolve, reject) {
          let xmlHttp = new XMLHttpRequest()
          
          xmlHttp.open('POST',  getEnvUrlbyKey('proxyurl')+"/api/proxy/img", true)
          
          xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
          var username = getWebCookie('username');
          if (username) {
            xmlHttp.setRequestHeader('Username', username);
          }

          // 定义请求体
          var requestBody = JSON.stringify({ 'url': info.url });
          xmlHttp.responseType = 'blob'
          xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
              let blob = xmlHttp.response
              let image = document.createElement('img')
              image.src = DomURL.createObjectURL(blob)
              image.onload = function () {
                DomURL.revokeObjectURL(image.src)
                resolve({
                  element: image,
                  x: info.x,
                  y: info.y,
                  width: info.width,
                  height: info.height,
                })
              }
            }
          }
          xmlHttp.send(requestBody)
        })
      }
      function getSVGInfo(minder) {
        let paper = minder.getPaper(),
          paperTransform,
          domContainer = paper.container,
          svgXml,
          svgContainer,
          svgDom,
          renderContainer = minder.getRenderContainer(),
          renderBox = renderContainer.getRenderBox(),
          width = renderBox.width + 1,
          height = renderBox.height + 1,
          blob,
          svgUrl,
          img
        // 保存原始变换，并且移动到合适的位置
        paperTransform = paper.shapeNode.getAttribute('transform')
        paper.shapeNode.setAttribute('transform', 'translate(0.5, 0.5)')
        renderContainer.translate(-renderBox.x, -renderBox.y)
        // 获取当前的 XML 代码
        svgXml = paper.container.innerHTML
        // 回复原始变换及位置
        renderContainer.translate(renderBox.x, renderBox.y)
        paper.shapeNode.setAttribute('transform', paperTransform)
        // 过滤内容
        svgContainer = document.createElement('div')
        svgContainer.innerHTML = svgXml
        svgDom = svgContainer.querySelector('svg')
        svgDom.setAttribute('width', renderBox.width + 1)
        svgDom.setAttribute('height', renderBox.height + 1)
        svgDom.setAttribute('style', 'font-family: Arial, "Microsoft Yahei","Heiti SC";')
        svgContainer = document.createElement('div')
        svgContainer.appendChild(svgDom)
        svgXml = svgContainer.innerHTML
        // Dummy IE
        svgXml = svgXml.replace(
          ' xmlns="http://www.w3.org/2000/svg" ' +
          'xmlns:NS1="" NS1:ns1:xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:NS2="" NS2:xmlns:ns1=""',
          '',
        )
        // svg 含有 &nbsp; 符号导出报错 Entity 'nbsp' not defined ,含有控制字符触发Load Image 会触发报错
        svgXml = svgXml.replace(/&nbsp;|[\x00-\x1F\x7F-\x9F]/g, '')
        // fix title issue in safari
        // @ http://stackoverflow.com/questions/30273775/namespace-prefix-ns1-for-href-on-tagelement-is-not-defined-setattributens
        svgXml = svgXml.replace(/NS\d+:title/gi, 'xlink:title')
        blob = new Blob([svgXml], {
          type: 'image/svg+xml',
        })
        svgUrl = DomURL.createObjectURL(blob)
        //svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgXml);
        let imagesInfo = []
        // 遍历取出图片信息
        traverse(minder.getRoot())
        function traverse(node) {
          var nodeData = node.data
          if (nodeData.image) {
            minder.renderNode(node)
            var nodeData = node.data
            let imageUrl = nodeData.image
            let imageSize = nodeData.imageSize
            let imageRenderBox = node.getRenderBox('ImageRenderer', minder.getRenderContainer())
            let imageInfo = {
              url: imageUrl,
              width: imageSize.width,
              height: imageSize.height,
              x: -renderContainer.getBoundaryBox().x + imageRenderBox.x,
              y: -renderContainer.getBoundaryBox().y + imageRenderBox.y,
            }
            imagesInfo.push(imageInfo)
          }
          // 若节点折叠，则直接返回
          if (nodeData.expandState === 'collapse') {
            return
          }
          let children = node.getChildren()
          for (let i = 0; i < children.length; i++) {
            traverse(children[i])
          }
        }
        return {
          width: width,
          height: height,
          dataUrl: svgUrl,
          xml: svgXml,
          imagesInfo: imagesInfo,
        }
      }
      function encode(json, minder, option) {
        let resultCallback
        /* 绘制 PNG 的画布及上下文 */
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        /* 尝试获取背景图片 URL 或背景颜色 */
        let bgDeclare = minder.getStyle('background').toString()
        let bgUrl = /url\(\"(.+)\"\)/.exec(bgDeclare)
        let bgColor = kity.Color.parse(bgDeclare)
        /* 获取 SVG 文件内容 */
        let svgInfo = getSVGInfo(minder)
        let width =
          option && option.width && option.width > svgInfo.width ? option.width : svgInfo.width
        let height =
          option && option.height && option.height > svgInfo.height ? option.height : svgInfo.height
        let offsetX =
          option && option.width && option.width > svgInfo.width
            ? (option.width - svgInfo.width) / 2
            : 0
        let offsetY =
          option && option.height && option.height > svgInfo.height
            ? (option.height - svgInfo.height) / 2
            : 0
        let svgDataUrl = svgInfo.dataUrl
        let imagesInfo = svgInfo.imagesInfo
        /* 画布的填充大小 */
        let padding = 20
        canvas.width = width + padding * 2
        canvas.height = height + padding * 2
        function fillBackground(ctx, style) {
          ctx.save()
          ctx.fillStyle = style
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.restore()
        }
        function drawImage(ctx, image, x, y, width, height) {


          if (width && height) {
            ctx.drawImage(image, x + padding, y + padding, width, height)
          } else {
            ctx.drawImage(image, x + padding, y + padding)
          }
        }
        function generateDataUrl(canvas) {
          return canvas.toDataURL('image/png')
        }
        // 加载节点上的图片
        function loadImages(imagesInfo) {
          let imagePromises = imagesInfo.map(function (imageInfo) {
            return xhrLoadImage(imageInfo)
          })
          return Promise.all(imagePromises)
        }
        function drawSVG() {
          let svgData = {
            url: svgDataUrl,
          }
          return loadImage(svgData)
            .then(function ($image) {
              drawImage(ctx, $image.element, offsetX, offsetY, $image.width, $image.height)
              return loadImages(imagesInfo)
            })
            .then(
              function ($images) {
                for (let i = 0; i < $images.length; i++) {
                  drawImage(
                    ctx,
                    $images[i].element,
                    $images[i].x + offsetX,
                    $images[i].y + offsetY,
                    $images[i].width,
                    $images[i].height,
                  )
                }
                DomURL.revokeObjectURL(svgDataUrl)
                document.body.appendChild(canvas)
                let pngBase64 = generateDataUrl(canvas)
                document.body.removeChild(canvas)
                return pngBase64
              },
              function (err) {
                // 这里处理 reject，出错基本上是因为跨域，
                // 出错后依然导出，只不过没有图片。
                alert(
                  '脑图的节点中包含跨域图片，导出的 png 中节点图片不显示，你可以替换掉这些跨域的图片并重试。',
                )
                DomURL.revokeObjectURL(svgDataUrl)
                document.body.appendChild(canvas)
                let pngBase64 = generateDataUrl(canvas)
                document.body.removeChild(canvas)
                return pngBase64
              },
            )
        }
        if (bgUrl) {
          let bgInfo = {
            url: bgUrl[1],
          }
          return loadImage(bgInfo).then(function ($image) {
            fillBackground(ctx, ctx.createPattern($image.element, 'repeat'))
            return drawSVG()
          })
        } else {
          fillBackground(ctx, bgColor.toString())
          return drawSVG()
        }
      }
      data.registerProtocol(
        'png',
        (module.exports = {
          fileDescription: 'PNG 图片',
          fileExtension: '.png',
          mineType: 'image/png',
          dataType: 'base64',
          encode: encode,
        }),
      )
    },
  }

  //src/protocol/svg.js
  _p[67] = {
    value: function (require, exports, module) {
      let data = _p.r(12)
      /**
       * 导出svg时删除全部svg元素中的transform
       * @auth Naixor
       * @method removeTransform
       * @param  {[type]}        svgDom [description]
       * @return {[type]}               [description]
       */
      function cleanSVG(svgDom, x, y) {
        function getTransformToElement(target, source) {
          let matrix
          try {
            matrix = source.getScreenCTM().inverse()
          } catch (e) {
            throw new Error("Can not inverse source element' ctm.")
          }
          return matrix.multiply(target.getScreenCTM())
        }
        function dealWithPath(d, dealWithPattern) {
          if (!(dealWithPattern instanceof Function)) {
            dealWithPattern = function () { }
          }
          let strArr = [],
            pattern = [],
            cache = []
          for (let i = 0, l = d.length; i < l; i++) {
            switch (d[i]) {
              case 'M':
              case 'L':
              case 'T':
              case 'S':
              case 'A':
              case 'C':
              case 'H':
              case 'V':
              case 'Q': {
                if (cache.length) {
                  pattern.push(cache.join(''))
                  cache = []
                }
                // 脑图的path格式真奇怪...偶尔就给我蹦出来一个"..V123 C..", 那空格几个意思 - -
                if (pattern[pattern.length - 1] === ',') {
                  pattern.pop()
                }
                if (pattern.length) {
                  dealWithPattern(pattern)
                  strArr.push(pattern.join(''))
                  pattern = []
                }
                pattern.push(d[i])
                break
              }

              case 'Z':
              case 'z': {
                pattern.push(cache.join(''), d[i])
                dealWithPattern(pattern)
                strArr.push(pattern.join(''))
                cache = []
                pattern = []
                break
              }

              case '.':
              case 'e': {
                cache.push(d[i])
                break
              }

              case '-': {
                if (d[i - 1] !== 'e') {
                  if (cache.length) {
                    pattern.push(cache.join(''), ',')
                  }
                  cache = []
                }
                cache.push('-')
                break
              }

              case ' ':
              case ',': {
                if (cache.length) {
                  pattern.push(cache.join(''), ',')
                  cache = []
                }
                break
              }

              default: {
                if (/\d/.test(d[i])) {
                  cache.push(d[i])
                } else {
                  // m a c s q h v l t z情况
                  if (cache.length) {
                    pattern.push(cache.join(''), d[i])
                    cache = []
                  } else {
                    // 脑图的path格式真奇怪...偶尔就给我蹦出来一个"..V123 c..", 那空格几个意思 - -
                    if (pattern[pattern.length - 1] === ',') {
                      pattern.pop()
                    }
                    pattern.push(d[i])
                  }
                }
                if (i + 1 === l) {
                  if (cache.length) {
                    pattern.push(cache.join(''))
                  }
                  dealWithPattern(pattern)
                  strArr.push(pattern.join(''))
                  cache = null
                  pattern = null
                }
              }
            }
          }
          return strArr.join('')
        }
        function replaceWithNode(svgNode, parentX, parentY) {
          if (!svgNode) {
            return
          }
          if (svgNode.tagName === 'defs') {
            return
          }
          if (svgNode.getAttribute('fill') === 'transparent') {
            svgNode.setAttribute('fill', 'none')
          }
          if (svgNode.getAttribute('marker-end')) {
            svgNode.removeAttribute('marker-end')
          }
          parentX = parentX || 0
          parentY = parentY || 0
          if (svgNode.getAttribute('transform')) {
            let ctm = getTransformToElement(svgNode, svgNode.parentElement)
            parentX -= ctm.e
            parentY -= ctm.f
            svgNode.removeAttribute('transform')
          }
          switch (svgNode.tagName.toLowerCase()) {
            case 'g':
              break

            case 'path': {
              let d = svgNode.getAttribute('d')
              if (d) {
                d = dealWithPath(d, function (pattern) {
                  switch (pattern[0]) {
                    case 'V': {
                      pattern[1] = +pattern[1] - parentY
                      break
                    }

                    case 'H': {
                      pattern[1] = +pattern[1] - parentX
                      break
                    }

                    case 'M':
                    case 'L':
                    case 'T': {
                      pattern[1] = +pattern[1] - parentX
                      pattern[3] = +pattern[3] - parentY
                      break
                    }

                    case 'Q':
                    case 'S': {
                      pattern[1] = +pattern[1] - parentX
                      pattern[3] = +pattern[3] - parentY
                      pattern[5] = +pattern[5] - parentX
                      pattern[7] = +pattern[7] - parentY
                      break
                    }

                    case 'A': {
                      pattern[11] = +pattern[11] - parentX
                      pattern[13] = +pattern[13] - parentY
                      break
                    }

                    case 'C': {
                      pattern[1] = +pattern[1] - parentX
                      pattern[3] = +pattern[3] - parentY
                      pattern[5] = +pattern[5] - parentX
                      pattern[7] = +pattern[7] - parentY
                      pattern[9] = +pattern[9] - parentX
                      pattern[11] = +pattern[11] - parentY
                    }
                  }
                })
                svgNode.setAttribute('d', d)
                svgNode.removeAttribute('transform')
              }
              return
            }

            case 'image':
            case 'text': {
              if (parentX && parentY) {
                let x = +svgNode.getAttribute('x') || 0,
                  y = +svgNode.getAttribute('y') || 0
                svgNode.setAttribute('x', x - parentX)
                svgNode.setAttribute('y', y - parentY)
              }
              if (svgNode.getAttribute('dominant-baseline')) {
                svgNode.removeAttribute('dominant-baseline')
                svgNode.setAttribute('dy', '.8em')
              }
              svgNode.removeAttribute('transform')
              return
            }
          }
          if (svgNode.children) {
            for (let i = 0, l = svgNode.children.length; i < l; i++) {
              replaceWithNode(svgNode.children[i], parentX, parentY)
            }
          }
        }
        svgDom.style.visibility = 'hidden'
        replaceWithNode(svgDom, x || 0, y || 0)
        svgDom.style.visibility = 'visible'
      }
      data.registerProtocol(
        'svg',
        (module.exports = {
          fileDescription: 'SVG 矢量图',
          fileExtension: '.svg',
          mineType: 'image/svg+xml',
          dataType: 'text',
          encode: function (json, minder) {
            let paper = minder.getPaper(),
              paperTransform = paper.shapeNode.getAttribute('transform'),
              svgXml,
              svgContainer,
              svgDom,
              renderContainer = minder.getRenderContainer(),
              renderBox = renderContainer.getRenderBox(),
              transform = renderContainer.getTransform(),
              width = renderBox.width,
              height = renderBox.height,
              padding = 20
            paper.shapeNode.setAttribute('transform', 'translate(0.5, 0.5)')
            svgXml = paper.container.innerHTML
            paper.shapeNode.setAttribute('transform', paperTransform)
            svgContainer = document.createElement('div')
            document.body.appendChild(svgContainer)
            svgContainer.innerHTML = svgXml
            svgDom = svgContainer.querySelector('svg')
            svgDom.setAttribute('width', (width + padding * 2) | 0)
            svgDom.setAttribute('height', (height + padding * 2) | 0)
            svgDom.setAttribute('style', 'background: ' + minder.getStyle('background'))
            //"font-family: Arial, Microsoft Yahei, Heiti SC; " +
            svgDom.setAttribute(
              'viewBox',
              [0, 0, (width + padding * 2) | 0, (height + padding * 2) | 0].join(' '),
            )
            tempSvgContainer = document.createElement('div')
            cleanSVG(svgDom, (renderBox.x - padding) | 0, (renderBox.y - padding) | 0)
            document.body.removeChild(svgContainer)
            tempSvgContainer.appendChild(svgDom)
            // need a xml with width and height
            svgXml = tempSvgContainer.innerHTML
            // svg 含有 &nbsp; 符号导出报错 Entity 'nbsp' not defined
            svgXml = svgXml.replace(/&nbsp;/g, '&#xa0;')
            // svg 含有 &nbsp; 符号导出报错 Entity 'nbsp' not defined
            return svgXml
          },
        }),
      )
    },
  }

  //src/protocol/text.js
  _p[68] = {
    value: function (require, exports, module) {
      let data = _p.r(12)
      let Browser = _p.r(17).Browser
      /**
       * @Desc: 增加对不容浏览器下节点中文本\t匹配的处理，不同浏览器下\t无法正确匹配，导致无法使用TAB来批量导入节点
       * @Editor: Naixor
       * @Date: 2015.9.17
       */
      let LINE_ENDING = '\r',
        LINE_ENDING_SPLITER = /\r\n|\r|\n/,
        TAB_CHAR = (function (Browser) {
          if (Browser.gecko) {
            return {
              REGEXP: new RegExp('^(\t|' + String.fromCharCode(160, 160, 32, 160) + ')'),
              DELETE: new RegExp('^(\t|' + String.fromCharCode(160, 160, 32, 160) + ')+'),
            }
          } else if (Browser.ie || Browser.edge) {
            // ie系列和edge比较特别，\t在div中会被直接转义成SPACE故只好使用SPACE来做处理
            return {
              REGEXP: new RegExp(
                '^(' + String.fromCharCode(32) + '|' + String.fromCharCode(160) + ')',
              ),
              DELETE: new RegExp(
                '^(' + String.fromCharCode(32) + '|' + String.fromCharCode(160) + ')+',
              ),
            }
          } else {
            return {
              REGEXP: /^(\t|\x20{4})/,
              DELETE: /^(\t|\x20{4})+/,
            }
          }
        })(Browser)
      function repeat(s, n) {
        let result = ''
        while (n--) result += s
        return result
      }
      /**
       * 对节点text中的换行符进行处理
       * @method encodeWrap
       * @param  {String}   nodeText MinderNode.data.text
       * @return {String}            \n -> '\n'; \\n -> '\\n'
       */
      function encodeWrap(nodeText) {
        if (!nodeText) {
          return ''
        }
        let textArr = [],
          WRAP_TEXT = ['\\', 'n']
        for (let i = 0, j = 0, l = nodeText.length; i < l; i++) {
          if (nodeText[i] === '\n' || nodeText[i] === '\r') {
            textArr.push('\\n')
            j = 0
            continue
          }
          if (nodeText[i] === WRAP_TEXT[j]) {
            j++
            if (j === 2) {
              j = 0
              textArr.push('\\\\n')
            }
            continue
          }
          switch (j) {
            case 0: {
              textArr.push(nodeText[i])
              break
            }

            case 1: {
              textArr.push(nodeText[i - 1], nodeText[i])
            }
          }
          j = 0
        }
        return textArr.join('')
      }
      /**
       * 将文本内容中的'\n'和'\\n'分别转换成\n和\\n
       * @method decodeWrap
       * @param  {[type]}   text [description]
       * @return {[type]}        [description]
       */
      function decodeWrap(text) {
        if (!text) {
          return ''
        }
        let textArr = [],
          WRAP_TEXT = ['\\', '\\', 'n']
        for (let i = 0, j = 0, l = text.length; i < l; i++) {
          if (text[i] === WRAP_TEXT[j]) {
            j++
            if (j === 3) {
              j = 0
              textArr.push('\\n')
            }
            continue
          }
          switch (j) {
            case 0: {
              textArr.push(text[i])
              j = 0
              break
            }

            case 1: {
              if (text[i] === 'n') {
                textArr.push('\n')
              } else {
                textArr.push(text[i - 1], text[i])
              }
              j = 0
              break
            }

            case 2: {
              textArr.push(text[i - 2])
              if (text[i] !== '\\') {
                j = 0
                textArr.push(text[i - 1], text[i])
              }
              break
            }
          }
        }
        return textArr.join('')
      }
      function encode(json, level) {
        let local = ''
        level = level || 0
        local += repeat('\t', level)
        local += encodeWrap(json.data.text) + LINE_ENDING
        if (json.children) {
          json.children.forEach(function (child) {
            local += encode(child, level + 1)
          })
        }
        return local
      }
      function isEmpty(line) {
        return !/\S/.test(line)
      }
      function getLevel(line) {
        let level = 0
        while (TAB_CHAR.REGEXP.test(line)) {
          line = line.replace(TAB_CHAR.REGEXP, '')
          level++
        }
        return level
      }
      function getNode(line) {
        return {
          data: {
            text: decodeWrap(line.replace(TAB_CHAR.DELETE, '')),
          },
        }
      }
      function decode(local) {
        let json,
          parentMap = {},
          lines = local.split(LINE_ENDING_SPLITER),
          line,
          level,
          node
        function addChild(parent, child) {
          let children = parent.children || (parent.children = [])
          children.push(child)
        }
        for (let i = 0; i < lines.length; i++) {
          line = lines[i]
          if (isEmpty(line)) continue
          level = getLevel(line)
          node = getNode(line)
          if (level === 0) {
            if (json) {
              throw new Error('Invalid local format')
            }
            json = node
          } else {
            if (!parentMap[level - 1]) {
              throw new Error('Invalid local format')
            }
            addChild(parentMap[level - 1], node)
          }
          parentMap[level] = node
        }
        return json
      }
      /**
       * @Desc: 增加一个将当前选中节点转换成text的方法
       * @Editor: Naixor
       * @Date: 2015.9.21
       */
      function Node2Text(node) {
        function exportNode(node) {
          let exported = {}
          exported.data = node.getData()
          let childNodes = node.getChildren()
          exported.children = []
          for (let i = 0; i < childNodes.length; i++) {
            exported.children.push(exportNode(childNodes[i]))
          }
          return exported
        }
        if (!node) return
        if (/^\s*$/.test(node.data.text)) {
          node.data.text = '分支主题'
        }
        return encode(exportNode(node))
      }
      data.registerProtocol(
        'text',
        (module.exports = {
          fileDescription: '大纲文本',
          fileExtension: '.txt',
          dataType: 'text',
          mineType: 'text/plain',
          encode: function (json) {
            return encode(json.root, 0)
          },
          decode: function (local) {
            return decode(local)
          },
          Node2Text: function (node) {
            return Node2Text(node)
          },
        }),
      )
    },
  }

  //src/template/default.js
  /**
   * @fileOverview
   *
   * 默认模板 - 脑图模板
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[69] = {
    value: function (require, exports, module) {
      let template = _p.r(31)
      template.register('default', {
        getLayout: function (node) {
          if (node.getData('layout')) return node.getData('layout')
          let level = node.getLevel()
          // 根节点
          if (level === 0) {
            return 'mind'
          }
          // 一级节点
          if (level === 1) {
            return node.getLayoutPointPreview().x > 0 ? 'right' : 'left'
          }
          return node.parent.getLayout()
        },
        getConnect: function (node) {
          if (node.getLevel() == 1) return 'arc'
          return 'under'
        },
      })
    },
  }

  //src/template/filetree.js
  /**
   * @fileOverview
   *
   * 文件夹模板
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[70] = {
    value: function (require, exports, module) {
      let template = _p.r(31)
      template.register('filetree', {
        getLayout: function (node) {
          if (node.getData('layout')) return node.getData('layout')
          if (node.isRoot()) return 'bottom'
          return 'filetree-down'
        },
        getConnect: function (node) {
          if (node.getLevel() == 1) {
            return 'poly'
          }
          return 'l'
        },
      })
    },
  }

  //src/template/fish-bone.js
  /**
   * @fileOverview
   *
   * 默认模板 - 鱼骨头模板
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[71] = {
    value: function (require, exports, module) {
      let template = _p.r(31)
      template.register('fish-bone', {
        getLayout: function (node) {
          if (node.getData('layout')) return node.getData('layout')
          let level = node.getLevel()
          // 根节点
          if (level === 0) {
            return 'fish-bone-master'
          }
          // 一级节点
          if (level === 1) {
            return 'fish-bone-slave'
          }
          return node.getLayoutPointPreview().y > 0 ? 'filetree-up' : 'filetree-down'
        },
        getConnect: function (node) {
          switch (node.getLevel()) {
            case 1:
              return 'fish-bone-master'

            case 2:
              return 'line'

            default:
              return 'l'
          }
        },
      })
    },
  }

  //src/template/right.js
  /**
   * @fileOverview
   *
   * 往右布局结构模板
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[72] = {
    value: function (require, exports, module) {
      let template = _p.r(31)
      template.register('right', {
        getLayout: function (node) {
          return node.getData('layout') || 'right'
        },
        getConnect: function (node) {
          if (node.getLevel() == 1) return 'arc'
          return 'bezier'
        },
      })
    },
  }

  //src/template/structure.js
  /**
   * @fileOverview
   *
   * 组织结构图模板
   *
   * @author: techird
   * @copyright: Baidu FEX, 2014
   */
  _p[73] = {
    value: function (require, exports, module) {
      let template = _p.r(31)
      template.register('structure', {
        getLayout: function (node) {
          return node.getData('layout') || 'bottom'
        },
        getConnect: function (node) {
          return 'poly'
        },
      })
    },
  }

  //src/template/tianpan.js
  /**
   * @fileOverview
   *
   * 天盘模板
   *
   * @author: along
   * @copyright: bpd729@163.com, 2015
   */
  _p[74] = {
    value: function (require, exports, module) {
      let template = _p.r(31)
      template.register('tianpan', {
        getLayout: function (node) {
          if (node.getData('layout')) return node.getData('layout')
          let level = node.getLevel()
          // 根节点
          if (level === 0) {
            return 'tianpan'
          }
          return node.parent.getLayout()
        },
        getConnect: function (node) {
          return 'arc_tp'
        },
      })
    },
  }

  //src/theme/default.js
  _p[75] = {
    value: function (require, exports, module) {
      let theme = _p.r(32)
        ;['classic', 'classic-compact'].forEach(function (name) {
          let compact = name == 'classic-compact'
          /* jscs:disable maximumLineLength */
          theme.register(name, {
            background:
              '#3A4144 url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowQzg5QTQ0NDhENzgxMUUzOENGREE4QTg0RDgzRTZDNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowQzg5QTQ0NThENzgxMUUzOENGREE4QTg0RDgzRTZDNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkMwOEQ1NDRGOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkMwOEQ1NDUwOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+e9P33AAAACVJREFUeNpisXJ0YUACTAyoAMr/+eM7EGGRZ4FQ7BycEAZAgAEAHbEGtkoQm/wAAAAASUVORK5CYII=") repeat',
            'root-color': '#430',
            'root-background': '#e9df98',
            'root-stroke': '#e9df98',
            'root-font-size': 24,
            'root-padding': compact ? [10, 25] : [15, 25],
            'root-margin': compact ? [15, 25] : [30, 100],
            'root-radius': 30,
            'root-space': 10,
            'root-shadow': 'rgba(0, 0, 0, .25)',
            'main-color': '#333',
            'main-background': '#a4c5c0',
            'main-stroke': '#a4c5c0',
            'main-font-size': 16,
            'main-padding': compact ? [5, 15] : [6, 20],
            'main-margin': compact ? [5, 10] : 20,
            'main-radius': 10,
            'main-space': 5,
            'main-shadow': 'rgba(0, 0, 0, .25)',
            'sub-color': 'white',
            'sub-background': 'transparent',
            'sub-stroke': 'none',
            'sub-font-size': 12,
            'sub-padding': [5, 10],
            'sub-margin': compact ? [5, 10] : [15, 20],
            'sub-tree-margin': 30,
            'sub-radius': 5,
            'sub-space': 5,
            'connect-color': 'white',
            'connect-width': 2,
            'main-connect-width': 3,
            'connect-radius': 5,
            'selected-background': 'rgb(254, 219, 0)',
            'selected-stroke': 'rgb(254, 219, 0)',
            'selected-color': 'black',
            'marquee-background': 'rgba(255,255,255,.3)',
            'marquee-stroke': 'white',
            'drop-hint-color': 'yellow',
            'sub-drop-hint-width': 2,
            'main-drop-hint-width': 4,
            'root-drop-hint-width': 4,
            'order-hint-area-color': 'rgba(0, 255, 0, .5)',
            'order-hint-path-color': '#0f0',
            'order-hint-path-width': 1,
            'text-selection-color': 'rgb(27,171,255)',
            'line-height': 1.5,
          })
        })
    },
  }

  //src/theme/fish.js
  _p[76] = {
    value: function (require, exports, module) {
      let theme = _p.r(32)
      theme.register('fish', {
        background:
          '#3A4144 url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowQzg5QTQ0NDhENzgxMUUzOENGREE4QTg0RDgzRTZDNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowQzg5QTQ0NThENzgxMUUzOENGREE4QTg0RDgzRTZDNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkMwOEQ1NDRGOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkMwOEQ1NDUwOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+e9P33AAAACVJREFUeNpisXJ0YUACTAyoAMr/+eM7EGGRZ4FQ7BycEAZAgAEAHbEGtkoQm/wAAAAASUVORK5CYII=") repeat',
        'root-color': '#430',
        'root-background': '#e9df98',
        'root-stroke': '#e9df98',
        'root-font-size': 24,
        'root-padding': [35, 35],
        'root-margin': 30,
        'root-radius': 100,
        'root-space': 10,
        'root-shadow': 'rgba(0, 0, 0, .25)',
        'main-color': '#333',
        'main-background': '#a4c5c0',
        'main-stroke': '#a4c5c0',
        'main-font-size': 16,
        'main-padding': [6, 20],
        'main-margin': [20, 20],
        'main-radius': 5,
        'main-space': 5,
        'main-shadow': 'rgba(0, 0, 0, .25)',
        'sub-color': 'black',
        'sub-background': 'white',
        'sub-stroke': 'white',
        'sub-font-size': 12,
        'sub-padding': [5, 10],
        'sub-margin': [10],
        'sub-radius': 5,
        'sub-space': 5,
        'connect-color': 'white',
        'connect-width': 3,
        'main-connect-width': 3,
        'connect-radius': 5,
        'selected-background': 'rgb(254, 219, 0)',
        'selected-stroke': 'rgb(254, 219, 0)',
        'marquee-background': 'rgba(255,255,255,.3)',
        'marquee-stroke': 'white',
        'drop-hint-color': 'yellow',
        'drop-hint-width': 4,
        'order-hint-area-color': 'rgba(0, 255, 0, .5)',
        'order-hint-path-color': '#0f0',
        'order-hint-path-width': 1,
        'text-selection-color': 'rgb(27,171,255)',
        'line-height': 1.5,
      })
    },
  }
  _p[900]={
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let theme = _p.r(32)
      function hsl(h, s, l) {
        return kity.Color.createHSL(h, s, l)
      }
      function generate(h, compat) {
        return {
          //background: '#3A4144 url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowQzg5QTQ0NDhENzgxMUUzOENGREE4QTg0RDgzRTZDNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowQzg5QTQ0NThENzgxMUUzOENGREE4QTg0RDgzRTZDNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkMwOEQ1NDRGOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkMwOEQ1NDUwOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+e9P33AAAACVJREFUeNpisXJ0YUACTAyoAMr/+eM7EGGRZ4FQ7BycEAZAgAEAHbEGtkoQm/wAAAAASUVORK5CYII=") repeat',
          background:'#2d2d2d',
          'root-color': '#fff',
          'root-background': '#F0A635',
          'root-stroke': '#F0A635',
          'root-font-size': 17,
          'root-padding': compat ? [6, 12] : [9, 24, 12, 24],
          'root-margin': compat ? 10 : [20, 30],
          'root-radius': 10,
          'root-space': 10,
          'main-color': '#d5d5d5',
          'main-background': 'transparent', //hsl(h, 33, 95),
          'main-stroke': h == 204 ? 'orange' : hsl(h, 37, 60),
          'main-stroke-width': 0.6,
          'main-font-size': 14.5,
          'main-padding': [5, 20, 7, 20],
          'main-margin': compat ? 8 : 16,
          'main-radius': 10,
          'main-space': 5,
          'sub-color': '#d5d5d5',
          'sub-background': 'transparent',
          'sub-stroke': 'none',
          'sub-font-size': 13,
          'sub-padding': compat ? [3, 5] : [4, 10, 6, 10],
          'sub-margin': compat ? [4, 8] : [6, 12],
          'sub-radius': 6,
          'sub-space': 5,
          'connect-color': '#F0A635',
          'connect-width': 1,
          'connect-radius': 5,
          'selected-stroke':'rgb(255, 244, 179)',
          'selected-stroke-width': '2',
          'expander-color': 'orange',
          'expander-bg-color': 'black',
          'blur-selected-stroke': hsl(h, 10, 60),
          'marquee-background': hsl(h, 100, 80).set('a', 0.1),
          'marquee-stroke': hsl(h, 37, 60),
          'drop-hint-color': 'orange',
          'drop-hint-width': 5,
          'order-hint-area-color': hsl(39, 100, 50).set('a', 0.5),
          'order-hint-path-color': hsl(39, 100, 50),
          'order-hint-path-width': 1,
          'text-selection-color': 'orange',
          'line-height': 1.5,
        }
      }
      
      theme.register('fresh-black' , generate(204))
      
    },
  }

  _p[901]={
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let theme = _p.r(32)
      function hsl(h, s, l) {
        return kity.Color.createHSL(h, s, l)
      }
      function generate(h, compat) {
        return {
          //background: '#3A4144 url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowQzg5QTQ0NDhENzgxMUUzOENGREE4QTg0RDgzRTZDNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowQzg5QTQ0NThENzgxMUUzOENGREE4QTg0RDgzRTZDNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkMwOEQ1NDRGOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkMwOEQ1NDUwOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+e9P33AAAACVJREFUeNpisXJ0YUACTAyoAMr/+eM7EGGRZ4FQ7BycEAZAgAEAHbEGtkoQm/wAAAAASUVORK5CYII=") repeat',
          background:'#FEF9E4',
          'root-color': '#fff',
          'root-background': '#FE5457',
          'root-stroke': '#FE5457',
          'root-font-size': 17,
          'root-padding': compat ? [6, 12] : [9, 24, 12, 24],
          'root-margin': compat ? 10 : [20, 30],
          'root-radius': 10,
          'root-space': 10,
          'main-color': '#457C35',
          'main-background': '#C7E9AA', //hsl(h, 33, 95),
          'main-stroke': 'transparent',
          'main-stroke-width': 0.6,
          'main-font-size': 14.5,
          'main-padding': [5, 20, 7, 20],
          'main-margin': compat ? 8 : 16,
          'main-radius': 10,
          'main-space': 5,
          'sub-color': '#232322',
          'sub-background': 'transparent',
          'sub-stroke': 'none',
          'sub-font-size': 13,
          'sub-padding': compat ? [3, 5] : [4, 10, 6, 10],
          'sub-margin': compat ? [4, 8] : [6, 12],
          'sub-radius': 6,
          'sub-space': 5,
          'connect-color': '#5D9B4C',
          'connect-width': 1,
          'connect-radius': 5,
          'expander-color': '#5D9B4C',
          'expander-bg-color': 'white',
          'selected-stroke':'#3DC0F2',
          'selected-stroke-width': '2',
          'blur-selected-stroke': hsl(h, 10, 60),
          'marquee-background': hsl(h, 100, 80).set('a', 0.1),
          'marquee-stroke': hsl(h, 37, 60),
          'drop-hint-color': 'orange',
          'drop-hint-width': 5,
          'order-hint-area-color': hsl(39, 100, 50).set('a', 0.5),
          'order-hint-path-color': hsl(39, 100, 50),
          'order-hint-path-width': 1,
          'text-selection-color': 'orange',
          'line-height': 1.5,
        }
      }
      
      theme.register('fresh-forest' , generate(204))
      
    },
  }

  //src/theme/fresh.js
  _p[77] = {
    value: function (require, exports, module) {
      let kity = _p.r(17)
      let theme = _p.r(32)
      function hsl(h, s, l) {
        return kity.Color.createHSL(h, s, l)
      }
      function generate(h, compat) {
        return {
          background: '#fbfbfb',
          'root-color': 'white',
          'root-background': h == 204 ? '#1890ff' : hsl(h, 37, 60),
          'root-stroke': h == 204 ? '#1890ff' : hsl(h, 37, 60),
          'root-font-size': 17,
          'root-padding': compat ? [6, 12] : [9, 24, 12, 24],
          'root-margin': compat ? 10 : [20, 30],
          'root-radius': 10,
          'root-space': 10,
          'main-color': 'black',
          'main-background': 'transparent', //hsl(h, 33, 95),
          'main-stroke': h == 204 ? '#1890ff' : hsl(h, 37, 60),
          'main-stroke-width': 0.6,
          'main-font-size': 14.5,
          'main-padding': [5, 20, 7, 20],
          'main-margin': compat ? 8 : 16,
          'main-radius': 10,
          'main-space': 5,
          'sub-color': 'black',
          'sub-background': 'transparent',
          'sub-stroke': 'none',
          'sub-font-size': 13,
          'sub-padding': compat ? [3, 5] : [4, 10, 6, 10],
          'sub-margin': compat ? [4, 8] : [6, 12],
          'sub-radius': 6,
          'sub-space': 5,
          'connect-color': h == 204 ? '#1E90FF' : hsl(h, 37, 60),
          'connect-width': 0.5,
          'connect-radius': 5,
          'selected-stroke': hsl(h, 26, 30),
          'selected-stroke-width': '3',
          'blur-selected-stroke': hsl(h, 10, 60),
          'marquee-background': hsl(h, 100, 80).set('a', 0.1),
          'marquee-stroke': hsl(h, 37, 60),
          'drop-hint-color': hsl(h, 26, 35),
          'drop-hint-width': 5,
          'order-hint-area-color': hsl(h, 100, 30).set('a', 0.5),
          'order-hint-path-color': hsl(h, 100, 25),
          'order-hint-path-width': 1,
          'text-selection-color': hsl(h, 100, 20),
          'line-height': 1.5,
        }
      }
      let plans = {
        red: 0,
        soil: 25,
        green: 122,
        blue: 204,
        purple: 246,
        pink: 334,
      }
      let name
      for (name in plans) {
        theme.register('fresh-' + name, generate(plans[name]))
        theme.register('fresh-' + name + '-compat', generate(plans[name], true))
      }
    },
  }

  //src/theme/snow.js
  _p[78] = {
    value: function (require, exports, module) {
      let theme = _p.r(32)
        ;['snow', 'snow-compact'].forEach(function (name) {
          let compact = name == 'snow-compact'
          /* jscs:disable maximumLineLength */
          theme.register(name, {
            background:
              '#3A4144 url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowQzg5QTQ0NDhENzgxMUUzOENGREE4QTg0RDgzRTZDNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowQzg5QTQ0NThENzgxMUUzOENGREE4QTg0RDgzRTZDNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkMwOEQ1NDRGOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkMwOEQ1NDUwOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+e9P33AAAACVJREFUeNpisXJ0YUACTAyoAMr/+eM7EGGRZ4FQ7BycEAZAgAEAHbEGtkoQm/wAAAAASUVORK5CYII=") repeat',
            'root-color': '#430',
            'root-background': '#e9df98',
            'root-stroke': '#e9df98',
            'root-font-size': 24,
            'root-padding': compact ? [5, 10] : [15, 25],
            'root-margin': compact ? 15 : 30,
            'root-radius': 5,
            'root-space': 10,
            'root-shadow': 'rgba(0, 0, 0, .25)',
            'main-color': '#333',
            'main-background': '#a4c5c0',
            'main-stroke': '#a4c5c0',
            'main-font-size': 16,
            'main-padding': compact ? [4, 10] : [6, 20],
            'main-margin': compact ? [5, 10] : [20, 40],
            'main-radius': 5,
            'main-space': 5,
            'main-shadow': 'rgba(0, 0, 0, .25)',
            'sub-color': 'black',
            'sub-background': 'white',
            'sub-stroke': 'white',
            'sub-font-size': 12,
            'sub-padding': [5, 10],
            'sub-margin': compact ? [5, 10] : [10, 20],
            'sub-radius': 5,
            'sub-space': 5,
            'connect-color': 'white',
            'connect-width': 2,
            'main-connect-width': 3,
            'connect-radius': 5,
            'selected-background': 'rgb(254, 219, 0)',
            'selected-stroke': 'rgb(254, 219, 0)',
            'marquee-background': 'rgba(255,255,255,.3)',
            'marquee-stroke': 'white',
            'drop-hint-color': 'yellow',
            'drop-hint-width': 4,
            'order-hint-area-color': 'rgba(0, 255, 0, .5)',
            'order-hint-path-color': '#0f0',
            'order-hint-path-width': 1,
            'text-selection-color': 'rgb(27,171,255)',
            'line-height': 1.5,
          })
        })
    },
  }

  //src/theme/tianpan.js
  _p[79] = {
    value: function (require, exports, module) {
      let theme = _p.r(32)
        ;['tianpan', 'tianpan-compact'].forEach(function (name) {
          let compact = name == 'tianpan-compact'
          theme.register(name, {
            background:
              '#3A4144 url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowQzg5QTQ0NDhENzgxMUUzOENGREE4QTg0RDgzRTZDNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowQzg5QTQ0NThENzgxMUUzOENGREE4QTg0RDgzRTZDNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkMwOEQ1NDRGOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkMwOEQ1NDUwOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+e9P33AAAACVJREFUeNpisXJ0YUACTAyoAMr/+eM7EGGRZ4FQ7BycEAZAgAEAHbEGtkoQm/wAAAAASUVORK5CYII=") repeat',
            'root-color': '#430',
            'root-background': '#e9df98',
            'root-stroke': '#e9df98',
            'root-font-size': 25,
            'root-padding': compact ? 15 : 20,
            'root-margin': compact ? [15, 25] : 100,
            'root-radius': 30,
            'root-space': 10,
            'root-shadow': 'rgba(0, 0, 0, .25)',
            'root-shape': 'circle',
            'main-color': '#333',
            'main-background': '#a4c5c0',
            'main-stroke': '#a4c5c0',
            'main-font-size': 15,
            'main-padding': compact ? 10 : 12,
            'main-margin': compact ? 10 : 12,
            'main-radius': 10,
            'main-space': 5,
            'main-shadow': 'rgba(0, 0, 0, .25)',
            'main-shape': 'circle',
            'sub-color': '#333',
            'sub-background': '#99ca6a',
            'sub-stroke': '#a4c5c0',
            'sub-font-size': 13,
            'sub-padding': 5,
            'sub-margin': compact ? 6 : 10,
            'sub-tree-margin': 30,
            'sub-radius': 5,
            'sub-space': 5,
            'sub-shadow': 'rgba(0, 0, 0, .25)',
            'sub-shape': 'circle',
            'connect-color': 'white',
            'connect-width': 2,
            'main-connect-width': 3,
            'connect-radius': 5,
            'selected-background': 'rgb(254, 219, 0)',
            'selected-stroke': 'rgb(254, 219, 0)',
            'selected-color': 'black',
            'marquee-background': 'rgba(255,255,255,.3)',
            'marquee-stroke': 'white',
            'drop-hint-color': 'yellow',
            'sub-drop-hint-width': 2,
            'main-drop-hint-width': 4,
            'root-drop-hint-width': 4,
            'order-hint-area-color': 'rgba(0, 255, 0, .5)',
            'order-hint-path-color': '#0f0',
            'order-hint-path-width': 1,
            'text-selection-color': 'rgb(27,171,255)',
            'line-height': 1.4,
          })
        })
    },
  }

  //src/theme/wire.js
  _p[80] = {
    value: function (require, exports, module) {
      let theme = _p.r(32)
      theme.register('wire', {
        background: 'black',
        color: '#999',
        stroke: 'none',
        padding: 10,
        margin: 20,
        'font-size': 14,
        'connect-color': '#999',
        'connect-width': 1,
        'selected-background': '#999',
        'selected-color': 'black',
        'marquee-background': 'rgba(255,255,255,.3)',
        'marquee-stroke': 'white',
        'drop-hint-color': 'yellow',
        'sub-drop-hint-width': 2,
        'main-drop-hint-width': 4,
        'root-drop-hint-width': 4,
        'order-hint-area-color': 'rgba(0, 255, 0, .5)',
        'order-hint-path-color': '#0f0',
        'order-hint-path-width': 1,
        'text-selection-color': 'rgb(27,171,255)',
        'line-height': 1.5,
      })
    },
  }

  let moduleMapping = {
    'expose-kityminder': 34,
  }

  function use(name) {
    _p.r([moduleMapping[name]])
  }
  use('expose-kityminder')
})()
