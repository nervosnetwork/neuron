import { BrowserWindow } from 'electron'
import path from 'path'
import env from 'env'

const showWindow = (url: string, title: string): BrowserWindow => {
	const win = new BrowserWindow({
		width: 1200,
		show: false,
		webPreferences: {
			preload: path.join(__dirname, './preload.js'),
		},
	})
	const fmtUrl = url.startsWith('http') || url.startsWith('file:') ? url : env.mainURL + url
	win.loadURL(fmtUrl)
	win.on('ready-to-show', () => {
		win.setTitle(title)
		win.show()
		win.focus()
	})

	return win
}

export { showWindow }
