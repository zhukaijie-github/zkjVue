import { observe } from "../observer/index.js";

/* 
  在原型上添加$data, $watch 等属性

*/

export function stateMixin(Vue) {
  const dataDef = {};
  dataDef.get = function () {
    return this._data;
  };
  Object.defineProperty(Vue.prototype, "$data", dataDef);
}

// 初始数据，进行劫持，转换成响应式数据
export function initState(vm) {
  const opts = vm.$options;

  if (opts.data) {
    // 存在data就，初始化data
    initData(vm);
  } else {
    // 不存在就默认一个空对象进行数据劫持
    observe((vm._data = {}), true /* asRootData */);
  }
}

export function initData(vm) {
  let data = vm.$options.data;
  const keys = Object.keys(data);
  data = vm._data = data || {}
  let i = keys.length;

  while (i--) {
    /* 
      这里检测属性名与 props 和 methods 重名 ....  之后做处理
    */
    const key = keys[i];
    // 做一层代理，实现实例上挂载属性， 比如： this.name
    proxy(vm, `_data`, key);
  }

  // 劫持数据
  observe(data);
}

/**
 *
 * @param {实例对象} target
 * @param {源key} sourceKey
 * @param {代理的key} key
 */
export function proxy(target, sourceKey, key) {
  Object.defineProperty(target, key, {
    enumerable: true,
    configurable: true,
    get: function () {
      // this就是target
      // console.log("proxy", this);
      return this[sourceKey][key];
    },
    set: function (val) {
      this[sourceKey][key] = val;
    },
  });
}
