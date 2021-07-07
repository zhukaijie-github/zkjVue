import { initMixin } from "./init.js";
import { stateMixin } from "./state.js";
import { renderMixin } from "./render.js";
import { lifecycleMixin } from "./lifecycle.js";

function ZkjVue(options) {
  // 初始化
  this._init(options);
}

/* 
  主要目的在原型上添加_init 属性
*/
initMixin(ZkjVue);

/* 
  主要目的在原型上面添加$data,$watch 相关属性

*/
stateMixin(ZkjVue);

lifecycleMixin(ZkjVue)
renderMixin(ZkjVue)

export default ZkjVue;
