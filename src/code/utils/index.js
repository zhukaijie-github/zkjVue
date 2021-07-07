
/**
 * 
 * @param {对象} target 
 * @param {属性键值} key 
 * @param {值} value 
 * @param {是否可以枚举} enumerable 
 */
export function def(target, key, value,enumerable){
  Object.defineProperty(target, key, {
    value,
    enumerable:!!enumerable,
    configurable: true,
    writable: true
  })
}



