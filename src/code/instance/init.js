import { initState } from "./state.js";
import { mountComponent } from "./lifecycle.js";
import { compileToFunctions } from "../../compiler/compileToFunctions.js";
import { initRender } from "./render.js";
import { makeMap } from "../../shared/util.js";

var initProxy;

var allowedGlobals = makeMap(
  'Infinity,undefined,NaN,isFinite,isNaN,' +
  'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
  'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt,' +
  'require' // for Webpack/Browserify
);

var warnNonPresent = function (target, key) {
  warn(
    "Property or method \"" + key + "\" is not defined on the instance but " +
    'referenced during render. Make sure that this property is reactive, ' +
    'either in the data option, or for class-based components, by ' +
    'initializing the property. ' +
    'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
    target
  );
};

var warnReservedPrefix = function (target, key) {
  warn(
    "Property \"" + key + "\" must be accessed with \"$data." + key + "\" because " +
    'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
    'prevent conflicts with Vue internals. ' +
    'See: https://vuejs.org/v2/api/#data',
    target
  );
};

var hasProxy = typeof Proxy !== "undefined" && isNative(Proxy);
function isNative(Ctor) {
  return typeof Ctor === "function" && /native code/.test(Ctor.toString());
}

var hasHandler = {
  has: function has (target, key) {
    var has = key in target;
    var isAllowed = allowedGlobals(key) ||
      (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data));
    if (!has && !isAllowed) {
      if (key in target.$data) { warnReservedPrefix(target, key); }
      else { warnNonPresent(target, key); }
    }
    return has || !isAllowed
  }
};

initProxy = function initProxy (vm) {
  if (hasProxy) {
    // determine which proxy handler to use
    var options = vm.$options;
    var handlers = options.render && options.render._withStripped
      ? getHandler
      : hasHandler;
    vm._renderProxy = new Proxy(vm, handlers);
  } else {
    vm._renderProxy = vm;
  }
};

export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    // 第一步劫持数据，转化成响应式数据
    // 第二步编译模版，并且渲染UI

    const vm = this;
    vm.$options = options || {};

    initProxy(vm);

    initRender(vm);

    // 初始数据，进行劫持，转换成响应式数据
    initState(vm);

    // 判断是否存在el属性
    if (vm.$options.el) {
      // 存在则编译模版挂载
      vm.$mount(vm.$options.el);
    }
  };

  // 挂载方法
  Vue.prototype.$mount = function (el) {
    // 判断el
    if (typeof el === "string") {
      // 字符串形式，比如 #app
      el = document.querySelector(el);
      // 判断是否存在dom节点，不存在直接创建一共div
      el = el ? el : document.createElement("div");
    }
    const options = this.$options;

    // 编译模版生成render函数
    const template = el.outerHTML;
    const { render } = compileToFunctions(template, {
      expectHTML: true,
      outputSourceRange: true,
    });
    options.render = render;

    return mountComponent(this, el);
  };
}
