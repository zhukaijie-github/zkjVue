/**
 * 连接视图AST语法和render表达式之间的桥梁，为什么数据能够响应式，
 * 就是当前方法将两者连接起来了
 * @param {} vm
 * @param {*} el
 * @param {*} hydrating
 */
export function mountComponent(vm, el) {
  vm.$el = el;

  var updateComponent;
  updateComponent = function () {
    console.log(vm._render());
    vm._update(vm._render(), false);
  };

  updateComponent()

  return vm;
}

var activeInstance = null;
var isUpdatingChildComponent = false;

function setActiveInstance(vm) {
  var prevActiveInstance = activeInstance;
  activeInstance = vm;
  return function () {
    activeInstance = prevActiveInstance;
  }
}

var patch = createPatchFunction({ nodeOps: nodeOps, modules: modules });


export function lifecycleMixin(Vue) {
  Vue.prototype.__patch__ = patch
  Vue.prototype._update = function (vnode, hydrating) {
    var vm = this;
    var prevEl = vm.$el;
    var prevVnode = vm._vnode;
    var restoreActiveInstance = setActiveInstance(vm);
    vm._vnode = vnode;
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode);
    }
    restoreActiveInstance();
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null;
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm;
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el;
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  };
}