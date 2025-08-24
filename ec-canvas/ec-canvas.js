// ec-canvas/ec-canvas.js
import * as echarts from './echarts';

const ctx = wx.createCanvasContext || wx.createContext;

Component({
  properties: {
    canvasId: {
      type: String,
      value: 'ec-canvas'
    },

    ec: {
      type: Object
    },

    forceUseOldCanvas: {
      type: Boolean,
      value: false
    }
  },

  data: {

  },

  ready: function () {
    if (!this.properties.ec) {
      console.warn('组件需要 ec 对象');
      return;
    }

    if (!this.properties.ec.lazyLoad) {
      this.init();
    }
  },

  methods: {
    init: function (callback) {
      const version = wx.getSystemInfoSync().SDKVersion;

      const canUseNewCanvas = compareVersion(version, '2.9.0') >= 0;
      const forceUseOldCanvas = this.properties.forceUseOldCanvas;
      const isUseNewCanvas = canUseNewCanvas && !forceUseOldCanvas;

      if (forceUseOldCanvas && canUseNewCanvas) {
        console.warn('开发者强制使用旧canvas,建议关闭');
      }

      if (isUseNewCanvas) {
        this.initByNewWay(callback);
      } else {
        const isValid = compareVersion(version, '1.9.91') >= 0;
        if (!isValid) {
          console.error('微信基础库版本过低，需要使用1.9.91以上的版本才支持');
          return;
        }
        this.initByOldWay(callback);
      }
    },

    initByOldWay(callback) {
      const ctx = wx.createCanvasContext(this.properties.canvasId, this);
      const canvas = new WxCanvas(ctx, this.properties.canvasId, false);

      echarts.setCanvasCreator(() => {
        return canvas;
      });

      var query = wx.createSelectorQuery().in(this);
      query.select('.ec-canvas').boundingClientRect(res => {
        if (typeof callback === 'function') {
          this.chart = callback(canvas, res.width, res.height, 1);
        } else if (this.properties.ec && typeof this.properties.ec.onInit === 'function') {
          this.chart = this.properties.ec.onInit(canvas, res.width, res.height, 1);
        } else {
          this.triggerEvent('init', {
            canvas: canvas,
            width: res.width,
            height: res.height,
            dpr: 1
          });
        }
      }).exec();
    },

    initByNewWay(callback) {
      const query = wx.createSelectorQuery().in(this);
      query
        .select('.ec-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvasNode = res[0].node;
          const canvasContext = canvasNode.getContext('2d');

          const canvas = new WxCanvas(canvasContext, this.properties.canvasId, true, canvasNode);
          echarts.setCanvasCreator(() => {
            return canvas;
          });

          if (typeof callback === 'function') {
            this.chart = callback(canvas, res[0].width, res[0].height, wx.getSystemInfoSync().pixelRatio);
          } else if (this.properties.ec && typeof this.properties.ec.onInit === 'function') {
            this.chart = this.properties.ec.onInit(canvas, res[0].width, res[0].height, wx.getSystemInfoSync().pixelRatio);
          } else {
            this.triggerEvent('init', {
              canvas: canvas,
              width: res[0].width,
              height: res[0].height,
              dpr: wx.getSystemInfoSync().pixelRatio
            });
          }
        });
    },

    canvasToTempFilePath(opt) {
      const version = wx.getSystemInfoSync().SDKVersion;

      const canUseNewCanvas = compareVersion(version, '2.9.0') >= 0;
      const forceUseOldCanvas = this.properties.forceUseOldCanvas;
      const isUseNewCanvas = canUseNewCanvas && !forceUseOldCanvas;

      if (isUseNewCanvas) {
        const query = wx.createSelectorQuery().in(this);
        query
          .select('.ec-canvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            const canvasNode = res[0].node;
            opt.canvas = canvasNode;
            wx.canvasToTempFilePath(opt);
          });
      } else {
        if (!opt.canvasId) {
          opt.canvasId = this.properties.canvasId;
        }
        ctx(opt, this);
      }
    },

    touchStart(e) {
      if (this.chart && e.touches.length > 0) {
        var touch = e.touches[0];
        var handler = this.chart.getZr().handler;
        handler.dispatch('mousedown', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.dispatch('mousemove', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.processGesture(wrapTouch(e), 'start');
      }
    },

    touchMove(e) {
      if (this.chart && e.touches.length > 0) {
        var touch = e.touches[0];
        var handler = this.chart.getZr().handler;
        handler.dispatch('mousemove', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.processGesture(wrapTouch(e), 'change');
      }
    },

    touchEnd(e) {
      if (this.chart) {
        const touch = e.changedTouches ? e.changedTouches[0] : {};
        var handler = this.chart.getZr().handler;
        handler.dispatch('mouseup', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.dispatch('click', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.processGesture(wrapTouch(e), 'end');
      }
    }
  }
});

function compareVersion(v1, v2) {
  v1 = v1.split('.');
  v2 = v2.split('.');
  const len = Math.max(v1.length, v2.length);

  while (v1.length < len) {
    v1.push('0');
  }
  while (v2.length < len) {
    v2.push('0');
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i]);
    const num2 = parseInt(v2[i]);

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }

  return 0;
}

function wrapTouch(event) {
  for (let i = 0; i < event.touches.length; ++i) {
    const touch = event.touches[i];
    touch.offsetX = touch.x;
    touch.offsetY = touch.y;
  }
  return event;
}

class WxCanvas {
  constructor(ctx, canvasId, isNew, canvasNode) {
    this.ctx = ctx;
    this.canvasId = canvasId;
    this.chart = null;
    this.isNew = isNew;

    if (isNew) {
      this.canvasNode = canvasNode;
    } else {
      this._initStyle(ctx);
    }

    this._initCanvas(ctx, canvasId);
  }

  getContext(contextType) {
    if (contextType === '2d') {
      return this.ctx;
    }
  }

  setChart(chart) {
    this.chart = chart;
  }

  attachEvent() {
    // noop
  }

  detachEvent() {
    // noop
  }

  _initCanvas(zrDom, zrDomId) {
    zrDom.width = 0;
    zrDom.height = 0;
    zrDom.widthFix = 0;
    zrDom.heightFix = 0;
    zrDom.canvasId = zrDomId;
  }

  _initStyle(ctx) {
    ctx.createRadialGradient = () => {
      return ctx.createCircularGradient(arguments);
    };
  }
}

export { WxCanvas };