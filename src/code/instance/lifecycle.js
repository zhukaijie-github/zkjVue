/**
 * 连接视图AST语法和render表达式之间的桥梁，为什么数据能够响应式，
 * 就是当前方法将两者连接起来了
 * @param {} vm 
 * @param {*} el 
 * @param {*} hydrating 
 */
 export function mountComponent (vm, el) {
   vm.$el = el
  return vm
 }