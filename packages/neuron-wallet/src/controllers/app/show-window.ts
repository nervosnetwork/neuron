import { BrowserWindow } from 'electron'
import path from 'path'

const showWindow = (url: string, title: string): BrowserWindow => {
	const win = new BrowserWindow({
		width: 1200,
		show: false,
		webPreferences: {
			preload: path.join(__dirname, './preload.js'),
		},
	})
	win.loadURL(url)
	win.on('ready-to-show', () => {
		win.setTitle(title)
		win.show()
		win.focus()
	})

	return win
}

export { showWindow }
