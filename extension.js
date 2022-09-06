// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const axios = require('axios')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  // 注册命令：根据选中的文本执行翻译的操作
  let disposable = vscode.commands.registerTextEditorCommand('escook-translate.translate', function (editor) {
    const { selection, selections } = editor
    // 如果选中了多行代码，或者不是单行，则退出流程
    if (selections.length > 1 || !selection.isSingleLine) return
    let value = editor.document.getText(editor.selection)
    if (!value || value.trim().length === 0) return

    value = value.trim()
    let transResult
    if (/[\u4e00-\u9fa5]/.test(value)) {
      // 中文 → 英文
      transResult = showTranslateResult(value, 'zh-cn', 'en')
    } else {
      // 英文 → 中文
      transResult = showTranslateResult(value, 'en', 'zh-cn')
    }

    // 获取到转换的结果
    transResult
      .then((result) => {
        // 通过 executeCommand 函数，可以触发指定的命令
        result && vscode.commands.executeCommand('escook-translate.replace', result)
      })
      .catch((err) => vscode.window.showErrorMessage('escook-translate:ERROR_2 ' + err.message))
  })

  // 注册命令：替换文本
  let replaceDisposable = vscode.commands.registerTextEditorCommand('escook-translate.replace', function (editor, edit, targetText) {
    edit.replace(editor.selection, targetText)
  })

  context.subscriptions.push(disposable, replaceDisposable)
}

// this method is called when your extension is deactivated
function deactivate() {}

// 翻译单词，并展示翻译的结果
async function showTranslateResult(kw, sourceLang, targetLang) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURI(kw)}`
    const { data: res } = await axios.get(url)

    const transResult = res[0][0][0]
    // 要展示的结果
    const items = []

    if (/[\u4e00-\u9fa5]/.test(transResult)) {
      // 中文，直接添加
      items.push(transResult)
    } else {
      // 分割的结果(小写)
      const splitArr = transResult.split(' ').map((item) => item.toLowerCase())
      // 分割的结果(首字母大写)
      const splitArrCap = splitArr.map((item) => item[0].toUpperCase() + item.slice(1))

      if (splitArr.length === 1) {
        // 全小写
        items.push(splitArr[0])
        // 首字母大写
        items.push(splitArrCap[0])
        // 全大写
        items.push(splitArr[0].toUpperCase())
      } else if (splitArr.length > 1) {
        // 小驼峰
        items.push(splitArr[0] + splitArrCap.filter((x, i) => i !== 0).join(''))
        // 大驼峰
        items.push(splitArrCap.join(''))
        // 全小写，连字符
        items.push(splitArr.join('-'))
        // 全小写，下划线
        items.push(splitArr.join('_'))
        // 全小写，带空格
        items.push(splitArr.join(' '))
        // 首字母大写，带空格
        items.push(splitArrCap.join(' '))
        // 全大写，带空格
        items.push(splitArrCap.join(' ').toUpperCase())
        // 全大写，连字符
        items.push(splitArrCap.join('-').toUpperCase())
        // 全大写，下划线
        items.push(splitArrCap.join('_').toUpperCase())
      }
    }

    // 展示可选项，并通过 .then 获取到用户选中项
    return vscode.window.showQuickPick(items)
  } catch (err) {
    vscode.window.showErrorMessage('escook-translate:ERROR_1 ' + err.message)
  }
}

module.exports = {
  activate,
  deactivate
}
