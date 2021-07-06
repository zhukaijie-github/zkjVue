import { def } from "../utils/index.js";

/**
 * 观察数据
 * @param {观察的数据} data
 */
export function observe(data) {
  if (typeof data !== "object") {
    return;
  }

  let ob;

  // 检测data上是否含有__ob__属性,
  if (Object.prototype.hasOwnProperty.call(data, "__ob__")) {
    // 如果有说明已经观察过了，就赋值ob
    ob = data.__ob__;
  } else {
    // 没有则添加
    ob = new Observer(data);
  }

  return ob;
}

export class Observer {
  constructor(value) {
    this.value = value;
    // 对象上添加 __ob__属性
    def(value, "__ob__", this);
    
    // 判断对象是否是数组
    if(Array.isArray(value)) {
      // 处理数组情况
    }else {
      // 处理对象
      this.walk(value)
    }
  }

  walk(obj) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }
}

/**
 * 劫持数据，响应式原理核心代码，对属性绑定get和set
 */
export function defineReactive(obj, key, val) {
  
  if(arguments.length === 2) {
    val = obj[key]
  }

  // obj的属性也可能是一个对象， 所以深度观察
  observe(val)

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function(){
      console.log(`获取属性${key}的值:${val}`)
      return val
    },
    set: function(newValue) {
      if(val !== newValue) {
        
        val = newValue

        console.log(`更新属性${key}的值：${val}`)
      }
    }
  })
}
