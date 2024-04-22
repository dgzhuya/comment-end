import * as vscode from 'vscode'

const findCommentPosition = (
	text: string,
	line: number,
	tabLine: string | number | undefined
): vscode.Range | undefined => {
	if (!text.includes('//')) {
		return
	}
	if (text.startsWith('/// ')) {
		return new vscode.Range(line, 0, line, 4)
	}
	const tabSize = tabLine
		? typeof tabLine === 'string'
			? parseInt(tabLine)
			: tabLine
		: 2
	const len = text.length
	let i = 0
	const stack: string[] = []
	while (i < len) {
		const char = text[i]
		if (['"', "'", '`'].includes(char)) {
			if (stack[stack.length - 1] === char) {
				stack.pop()
			} else {
				stack.push(char)
			}
		}
		if (char === '/' && text[i + 1] === '/' && stack.length === 0) {
			const start = text[i - 1] === ' ' ? i - 1 : i
			const end = text[i + 2] === ' ' ? i + 3 : i + 2
			return new vscode.Range(line, start, line, end)
		}
		if (char === '\t') {
			i += tabSize
		} else {
			i++
		}
	}
	return
}

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand(
		'comment-end.comment',
		async () => {
			let editor = vscode.window.activeTextEditor
			if (!editor) {
				return
			}
			const postion = editor.selection.active
			const line = editor.document.lineAt(postion)
			if (!line.isEmptyOrWhitespace) {
				const range = findCommentPosition(
					line.text,
					postion.line,
					editor.options.tabSize
				)
				if (range) {
					editor.edit(editBulder => {
						editBulder.delete(range)
					})
				} else {
					editor.edit(editBulder => {
						editBulder.insert(
							postion,
							postion.character === 0 ? '/// ' : ' // '
						)
					})
				}
			} else {
				editor.edit(editBulder => {
					editBulder.insert(
						new vscode.Position(postion.line, 0),
						'/// '
					)
				})
			}
		}
	)

	context.subscriptions.push(disposable)
}

// This method is called when your extension is deactivated
export function deactivate() {}
