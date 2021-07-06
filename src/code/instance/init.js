import { initState } from "./state.js"
import { mountComponent } from "./lifecycle.js"
import { compileToFunctions } from "../../compiler/compileToFunctions.js"

export function initMixin(Vue){
  Vue.prototype._init = function(options){
    // 第一步劫持数据，转化成响应式数据
    // 第二步编译模版，并且渲染UI


    const vm = this
    vm.$options = options || {}

    // 初始数据，进行劫持，转换成响应式数据
    initState(vm)

    // 判断是否存在el属性
    if(vm.$options.el) {
      // 存在则编译模版挂载
      vm.$mount(vm.$options.el)
    }
  }




  // 挂载方法
  Vue.prototype.$mount = function(el){
    // 判断el
    if(typeof el === 'string') {
      // 字符串形式，比如 #app
      el = document.querySelector(el)
      // 判断是否存在dom节点，不存在直接创建一共div
      el = el ? el: document.createElement('div')
    }
    const options = this.$options

    // 编译模版生成render函数
    const template = el.outerHTML
    const {render} = compileToFunctions(template, {
      expectHTML:true,
      outputSourceRange: true
    })

    options.render = render

    return mountComponent(this, el)
  }
}

