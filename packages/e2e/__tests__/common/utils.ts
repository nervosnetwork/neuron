/**
 * @description:
 *
 * @author: Sily
 *
 * @create: 2024-06-21 14:45
 **/
const {exec} = require('child_process');
const path = require('path');


export default class ClickSystemMenu {
  public static async clickMenu(a: string, b: string) {
    const scriptPath = path.resolve(a, b);

// 执行 AppleScript
    exec(`osascript ${scriptPath}`, (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error(`执行错误: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });

  }

}

