import { parse } from "./parse.js"
import { generate } from "./generate.js"

/**
 * 将模版字符串编译成ast
 * @param {模版字符串} template 
 */
export function compileToFunctions(template, options) {
  // 生成ast树
  const ast = parse(template.trim(), options)
  console.log('ast', ast)
	const code = generate(ast, options)
  return {
    render: createFunction(`with(this){return ${code}}`),
  }
}


export function createFunction(code){
  try {
    return new Function(code)
  } catch (err) {
    console.log(err)
    return function(){}
  }
}