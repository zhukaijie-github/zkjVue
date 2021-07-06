/**
 * 将html字符串 转换成 ast 树
 * @param {模版字符串} template
 */
/* 
  ast {
    type 就是nodeType
    tag  元素标签
    children 
    attrs
    attrsList
    attrsMap
    parent
    rawAttrsMap 
  }



*/

// Regular Expressions for parsing tags and attributes
//匹配标签的属性, 在html中，有四种书写属性的方式
// 1、使用双引号把值引起来：`class="some-class"`
// 2、使用单引号把值引起来：`class='some-class'`
// 3、不使用引号：`class=some-class`
// 4、单独的属性名：`disabled`
var unicodeRegExp =
  /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

const attribute =
  /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;

//匹配动态属性比如
//:name='张三'
//v-bind:name='张三'
//@click='event'
//v-on:click='event'
const dynamicArgAttribute =
  /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;

//匹配一些特殊规则的命名
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`;

//匹配： 前缀+ 冒号 + 名称 这种格式，然后匹配到名称
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;

//匹配< + qnameCapture的规则
const startTagOpen = new RegExp(`^<${qnameCapture}`);

//匹配: >  />
const startTagClose = /^\s*(\/?)>/;

//匹配结束标签
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);

//这个正则用来匹配文档的 `DOCTYPE` 标签，没有捕获组
const doctype = /^<!DOCTYPE [^>]+>/i;

// #7298: escape - to avoid being passed as HTML comment when inlined in page
//避免在页面内联时作为HTML注释传递
const comment = /^<!\--/;

const conditionalComment = /^<!\[/;

// 检测给定的标签名字是不是纯文本标签
// export const isPlainTextElement = makeMap('script,style,textarea', true)
const reCache = {};

//特殊字符解码
const decodingMap = {
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&amp;": "&",
  "&#10;": "\n",
  "&#9;": "\t",
  "&#39;": "'",
};
const encodedAttr = /&(?:lt|gt|quot|amp|#39);/g;
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g;

const isIgnoreNewlineTag = makeMap("pre,textarea", true);
const shouldIgnoreFirstNewline = (tag, html) =>
  tag && isIgnoreNewlineTag(tag) && html[0] === "\n";

var div;
function getShouldDecode(href) {
  div = div || document.createElement("div");
  div.innerHTML = href ? '<a href="\n"/>' : '<div a="\n"/>';
  return div.innerHTML.indexOf("&#10;") > 0;
}
var inBrowser = typeof window !== 'undefined';
// #3663: IE在属性值中编码换行符，而其他浏览器不这样做
var shouldDecodeNewlines = inBrowser ? getShouldDecode(false) : false;
// #6828: Chrome在a[href]中编码内容
var shouldDecodeNewlinesForHref = inBrowser ? getShouldDecode(true) : false;

function makeMap(str, expectsLowerCase) {
  var map = Object.create(null);
  var list = str.split(",");
  for (var i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase
    ? function (val) {
        return map[val.toLowerCase()];
      }
    : function (val) {
        return map[val];
      };
}

function decodeAttr(value, shouldDecodeNewlines) {
  var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
  return value.replace(re, function (match) {
    return decodingMap[match];
  });
}

// 创建ast 元素
function createASTElement(tag, attrs, parent) {
  return {
    type: 1,
    tag: tag,
    attrsList: attrs,
    attrsMap: makeAttrsMap(attrs),
    rawAttrsMap: {},
    parent: parent,
    children: [],
  };
}

function makeAttrsMap(attrs) {
  var map = {};
  
  for (var i = 0, l = attrs.length; i < l; i++) {
    map[attrs[i].name] = attrs[i].value;
  }
  return map;
}



var isPlainTextElement = makeMap('script,style,textarea', true);
  console.log('isPlainTextElement',isPlainTextElement)

export function parse(template, options) {
  debugger

  var stack = [];
  let root; //根标签Ast
  let currentParent; //当前正在解析的，且内容是标签，不是字符串文本的引用，提供给下一次解析时需要引用父类标签时用到
  let inVPre = false;
  let inPre = false;
  let warned = false;

  function closeElement(element) {
    //因为匹配到了闭合标签，因此当前算是一个回路结束了、
    //trimEndingWhitespace把当前标签的子类查看一下有没有一些空格子元素，然后去掉
    trimEndingWhitespace(element);
  }

  function trimEndingWhitespace(el) {
    // remove trailing whitespace node
    if (!inPre) {
      var lastNode;
      while (
        (lastNode = el.children[el.children.length - 1]) &&
        lastNode.type === 3 &&
        lastNode.text === " "
      ) {
        el.children.pop();
      }
    }
  }

  parseHTML(template, {
    expectHTML: options.expectHTML,
    start: function (tag, attrs, unary, start$1, end) {
      // console.log(attrs)
      var element = createASTElement(tag, attrs, currentParent);

      if (options.outputSourceRange) {
        // 生成rawAttrsMap
        element.start = start$1;
        element.end = end;
        element.rawAttrsMap = element.attrsList.reduce(function (
          cumulated,
          attr
        ) {
          cumulated[attr.name] = attr;
          return cumulated;
        },
        {});
      }

      if (!root) {
        root = element;
      }

      if (!unary) {
        currentParent = element;
        stack.push(element);
      } else {
        //是一元元素，直接进行闭合操作
        closeElement(element);
      }

      console.log('start--',currentParent)
    },

    end: function end(tag, start, end$1) {
      var element = stack[stack.length - 1];
      // pop stack
      stack.length -= 1;
      currentParent = stack[stack.length - 1];
      if (options.outputSourceRange) {
        element.end = end$1;
      }
      closeElement(element);

      console.log('end--',currentParent)
    },

    chars: function chars (text, start, end) {
      // console.log(currentParent)
      var children = currentParent.children;
      // console.log('children', children)
      // if (inPre || text.trim()) {
      //   text = isTextTag(currentParent) ? text : decodeHTMLCached(text);
      // } else if (!children.length) {
      //   // remove the whitespace-only node right after an opening tag
      //   text = '';
      // } else if (whitespaceOption) {
      //   if (whitespaceOption === 'condense') {
      //     // in condense mode, remove the whitespace node if it contains
      //     // line break, otherwise condense to a single space
      //     text = lineBreakRE.test(text) ? '' : ' ';
      //   } else {
      //     text = ' ';
      //   }
      // } else {
      //   text = preserveWhitespace ? ' ' : '';
      // }
      // if (text) {
      //   if (!inPre && whitespaceOption === 'condense') {
      //     // condense consecutive whitespaces into single space
      //     text = text.replace(whitespaceRE$1, ' ');
      //   }
      //   var res;
      //   var child;
      //   if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
      //     child = {
      //       type: 2,
      //       expression: res.expression,
      //       tokens: res.tokens,
      //       text: text
      //     };
      //   } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
      //     child = {
      //       type: 3,
      //       text: text
      //     };
      //   }
      //   if (child) {
      //     if (options.outputSourceRange) {
      //       child.start = start;
      //       child.end = end;
      //     }
      //     children.push(child);
      //   }
      // }
    },
  });
}

// 解析html字符串
export function parseHTML(html, options) {
  var stack = [];
  // 期望是html字符串
  var expectHTML = options.expectHTML;
  //
  var isUnaryTag$$1 = options.isUnaryTag;
  var index = 0;
  var last, lastTag;

  while (html) {
    last = html;
    if (!lastTag || !isPlainTextElement(lastTag)) {
      var textEnd = html.indexOf("<");
      if (textEnd === 0) {
        // 一开始就是标签 比如<div>

        // 开始标签
        var startTagMatch = parseStartTag();
        console.log(startTagMatch);
        if (startTagMatch) {
          handleStartTag(startTagMatch);
          if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
            advance(1);
          }
          continue
        }

        // 结束标签
        var endTagMatch = html.match(endTag);
        if (endTagMatch) {
          var curIndex = index;
          advance(endTagMatch[0].length);
          parseEndTag(endTagMatch[1], curIndex, index);
          continue
        }
      }

      /**
       * 这里解析的内容是开始标签和结束标签之间的内容，分几种情况
       * 1.可能是空字符串
       * 2.可能是单行注释
       * 3.可能是多行注释
       * 4.可能是字符串内容
       * 5.也有可能是另一个标签的开始
       */
      let text, rest, next; //text表示的文本内容，也有可能是一个不为空的字符串
      if (textEnd >= 0) {
        //去掉多余的空格，获取内容
        rest = html.slice(textEnd);
        while (
          !endTag.test(rest) && //是否符合结束标签</
          !startTagOpen.test(rest) && //是否符合开始标签<
          !comment.test(rest) && //是否是多行注释
          !conditionalComment.test(rest) //是否是当行注释
        ) {
          // 一直循环知道获取到<括号位置的索引，然后结束循环，开始解析内容到<为止的内容
          next = rest.indexOf("<", 1);
          if (next < 0) break; //解析到是另一个标签是开始，直接停止当前本次循环开始进入下一次while
          textEnd += next;
          rest = html.slice(textEnd);
        }
        text = html.substring(0, textEnd);
      }

      if (textEnd < 0) {
        text = html;
      }

      //获取到需要解析的内容，然后设置一下步进结束的index和剩余的解析内容last
      if (text) {
        advance(text.length);
      }
      //开始解析字符串内容
      if (options.chars && text) {
        //参数一： 字符串的内容
        //参数二： 开始的索引
        //参数三： 结束的索引
        options.chars(text, index - text.length, index);
      }
    } else {
      var endTagLength = 0;
      var stackedTag = lastTag.toLowerCase();
      var reStackedTag =
        reCache[stackedTag] ||
        (reCache[stackedTag] = new RegExp(
          "([\\s\\S]*?)(</" + stackedTag + "[^>]*>)",
          "i"
        ));
      var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
        endTagLength = endTag.length;
        if (shouldIgnoreFirstNewline(stackedTag, text)) {
          text = text.slice(1);
        }
        if (options.chars) {
          options.chars(text);
        }
        return "";
      });
      index += html.length - rest$1.length;
      html = rest$1;
      parseEndTag(stackedTag, index - endTagLength, index);
    }

    if (html === last) {
      options.chars && options.chars(html);
      break;
    }
  }

  parseEndTag();

  // 截取剩下的字符串
  function advance(n) {
    index += n;
    html = html.substring(n);
  }

  //解析开始标签
  function parseStartTag() {
    var start = html.match(startTagOpen);

    if (start) {
      // 存在
      var match = {
        tagName: start[1], // 开始标签名称
        attrs: [], // 标签上的属性
        start: index, // 开始位置
      };

      advance(start[0].length);
      var end, attr;

      /**
       * 循环判断，是否移动到了开始标签的结束符号 > 或者 />
       * 依次匹配标签属性
       */
      while (
        !(end = html.match(startTagClose)) &&
        (attr = html.match(dynamicArgAttribute) || html.match(attribute))
      ) {
        // 给当前匹配到的属性添加start和end属性
        attr.start = index;
        // 从匹配到的字符串的末尾截取html,继续操作
        advance(attr[0].length);
        attr.end = index;
        match.attrs.push(attr);
      }

      if (end) {
        match.unarySlash = end[1];
        advance(end[0].length);
        match.end = index;
        return match;
      }
    }
  }

  // 处理开始标签下匹配到的match
  function handleStartTag(match) {
    var tagName = match.tagName;
    var unarySlash = match.unarySlash;

    // var unary = isUnaryTag$$1(tagName) || !!unarySlash;
    var unary = false;

    // 处理属性
    var l = match.attrs.length;

    var attrs = new Array(l);

    for (let i = 0; i < l; i++) {
      var args = match.attrs[i];
      var value = args[3] || args[4] || args[5] || "";

      // 处理a标签的href属性
      var shouldDecodeNewlines =
        tagName === "a" && args[1] === "href"
          ? options.shouldDecodeNewlinesForHref
          : options.shouldDecodeNewlines;

      attrs[i] = {
        name: args[1],
        value: decodeAttr(value, shouldDecodeNewlines),
      };

      if (true /*options.outputSourceRange*/) {
        attrs[i].start = args.start + args[0].match(/^\s*/).length;
        attrs[i].end = args.end;
      }
      
    }

    if (!unary) {
      // 不是一元标签 比如<img />
      stack.push({
        tag: tagName,
        lowerCasedTag: tagName.toLowerCase(),
        attrs: attrs,
        start: match.start,
        end: match.end,
      });
      lastTag = tagName;
    }

    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end);
    }
  }

  // 处理结束标签
  function parseEndTag(tagName, start, end) {
    var pos, lowerCasedTagName;
    if (start == null) {
      start = index;
    }
    if (end == null) {
      end = index;
    }

    // Find the closest opened tag of the same type
    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase();
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break;
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0;
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (var i = stack.length - 1; i >= pos; i--) {
        if (i > pos || (!tagName && options.warn)) {
          options.warn("tag <" + stack[i].tag + "> has no matching end tag.", {
            start: stack[i].start,
            end: stack[i].end,
          });
        }
        if (options.end) {
          options.end(stack[i].tag, start, end);
        }
      }

      // Remove the open elements from the stack
      stack.length = pos;
      lastTag = pos && stack[pos - 1].tag;
    } else if (lowerCasedTagName === "br") {
      if (options.start) {
        options.start(tagName, [], true, start, end);
      }
    } else if (lowerCasedTagName === "p") {
      if (options.start) {
        options.start(tagName, [], false, start, end);
      }
      if (options.end) {
        options.end(tagName, start, end);
      }
    }
  }
}
