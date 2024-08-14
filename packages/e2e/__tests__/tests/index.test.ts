import {_electron as electron, ElectronApplication, Page} from "playwright";
import {test, expect} from "@playwright/test";
// import { scheduler } from "timers/promises";
// import ClickSystemMenu from '../common/utils';

let electronApp: ElectronApplication;

test.beforeAll(async () => {

  electronApp = await electron.launch({args: ["../../packages/neuron-wallet/dist/main.js"]});
  await new Promise((resolve) => {
    electronApp.once("window", async (page) => {
      resolve(page)
    });
  })
  electronApp.on("window", async (page) => {
    const filename = page.url()?.split("/").pop();
    console.log(`Window opened: ${filename}`);

    page.on("pageerror", (error) => {
      console.error(error);
    });
    page.on("console", (msg) => {
      console.log(msg.text());
    });
  });
});

test.afterAll(async() => {
  await electronApp.close()
})

let page: Page;


test("Launch Neuron", async () => {
  const appName = await electronApp.evaluate(async ({app}) => {
    // This runs in Electron's main process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.name;
  });
  console.log('应用名称:', appName);

  page = await electronApp.firstWindow();
  console.log("window title" + await page.title());

  // await page.screenshot({path: "./test-results/intro.png"});

  const title = await page.title();
  expect(title).toBe("Neuron");

  // await page.waitForSelector('text="总览"');
  // await page.waitForTimeout(20000);
});

test("Create Wallet", async () => {
  page = await electronApp.firstWindow();
  // await page.screenshot({path: "./test-results/Wallet 1.png"});

  let createWallet = await page.getByText('Wallet 1').isVisible();
  console.log("createWallet"+createWallet);
  if (!createWallet) {
    await page.screenshot({path: "./test-results/createWallet.png"});
    await page.getByLabel("Import Wallet Seed").click();
    await page.locator("div").filter({hasText: /^1$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^1$/}).getByRole("textbox").fill("verb");
    await page.locator("div").filter({hasText: /^2$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^2$/}).getByRole("textbox").fill("prize");
    await page.locator("div").filter({hasText: /^3$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^3$/}).getByRole("textbox").fill("broken");
    await page.locator("div").filter({hasText: /^4$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^4$/}).getByRole("textbox").fill("tobacco");
    await page.locator("div").filter({hasText: /^5$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^5$/}).getByRole("textbox").fill("plate");
    await page.locator("div").filter({hasText: /^6$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^6$/}).getByRole("textbox").fill("suspect");
    await page.locator("div").filter({hasText: /^7$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^7$/}).getByRole("textbox").fill("flip");
    await page.locator("div").filter({hasText: /^8$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^8$/}).getByRole("textbox").fill("surface");
    await page.locator("div").filter({hasText: /^9$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^9$/}).getByRole("textbox").fill("circle");
    await page.locator("div").filter({hasText: /^10$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^10$/}).getByRole("textbox").fill("light");
    await page.locator("div").filter({hasText: /^11$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^11$/}).getByRole("textbox").fill("portion");
    await page.locator("div").filter({hasText: /^12$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^12$/}).getByRole("textbox").fill("hero");
    await page.getByLabel("Next").click();
    // await page.screenshot({path: "./test-results/createWallet.png"});
    await page.getByPlaceholder("Please set a strong password to protect your wallet").fill("Aa111111");
    await page.getByPlaceholder("Repeat Password").click();
    await page.getByPlaceholder("Repeat Password").fill("Aa111111");
    await page.getByLabel("Finish Creating").click();
    await page.getByRole('button', {name: 'Start Sync'}).click({ delay: 1_000 });
    console.log('主网环境已进入！');

    // await page.waitForTimeout(20000);

    //切换到测试网
     /*let dialogShow= await page.getByLabel('Add Network').isVisible();
     if (dialogShow){
       await page.getByLabel('Add Network').click();
       // await page.locator("id=url").fill("http://127.0.0.1:8114");
       await page.locator("id=name").fill("testnet");
       await page.getByRole('button', {name: 'Ok'}).click();
       await page.getByRole('button', {name: 'Ok'}).click();
     }else {
       await page.getByTitle('Settings').click();
       await page.getByRole('button', {name: 'Add Network'}).first().click();
       await page.locator("id=url").fill("http://127.0.0.1:8114");
       await page.locator("id=name").fill("testnet");
       await page.getByRole('button', {name: 'Ok'}).click();
       // await page.getByRole('button', {name: '确认'}).click();
       await page.getByText('testnet').click();
     }*/


    // await page.screenshot({path: "./test-results/createWallet.png"});
    console.log('钱包创建成功！');

  } else {
    console.log('钱包已创建！')
  }
});

test.describe('overview page tests', () => {
  test("send transaction", async () => {
    //等待同步100%才能操作发送交易
    // await page.waitForTimeout(60000);
    //切换到轻节点，并确定同步到100%
    test.setTimeout(480*1000);
    await page.screenshot({path: "./test-results/send_transaction_1.png"});
    await page.getByTitle('Settings').click();
    console.log('点击设置成功');
    // await page.locator('dialog').filter({ hasText: /^Confirm$/ }).getByLabel('Confirm')
    //   .click();
    await page.getByText('Light Client (http://127.0.0.1:9000)').click({ delay: 2_000 });
    console.log('点击轻节点成功');
    //CI 环境轻节点需要从主网到测试网
    await page.getByText('Light Client (http://127.0.0.1:9000)').hover({ timeout: 2_000 });
    await page.locator('//*[@id="root"]/div/div/div[2]/div/div[3]/div[2]/div/div/div[2]/div/div/div/div/button/*[name()="svg"]').click();
    console.log('轻节点主网切换到测试网成功');
    await page.waitForTimeout(20000);
    // await page.screenshot({path: "./test-results/send_transaction.png"});
    await page.locator('.syncStatus_syncing__LiW3Q').click()
    // await page.waitForTimeout(10000);
    await page.screenshot({path: "./test-results/send_transaction_2.png"});
    await page.getByText('Set start block number').click();
    console.log('点击设置区块数成功');
    // await page.keyboard.press("Delete");
    await page.locator('id=startBlockNumber').fill('14175000');
    page.waitForTimeout(6000);
    await page.screenshot({path: "./test-results/set_block_number.png"});
    await page.getByRole('button', {name: 'Confirm'}).click();
    console.log('区块设置成功');
    await page.locator('.syncStatus_syncing__LiW3Q').click()
    console.log('查看设置的起始区块数是否成功');
    page.waitForTimeout(60000);
    await page.screenshot({path: "./test-results/watch_block_number.png"});
    await page.getByTitle('Overview').click();
    await page.screenshot({path: "./test-results/send_transaction_3.png"});
    await page.getByRole('button', {name: 'Send'}).click();
    console.log('点击交易发送按钮成功');
    await page.waitForTimeout(120000);
    await page.locator("id=address").fill("ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2glcd40rclyg8zmv6a9uzun0stz5rzp9q4jzxqs");
    console.log('输入地址成功');
    await page.locator("id=amount").fill("103.5");
    console.log('输入金额成功');
    await page.screenshot({path: "./test-results/send_transaction_4.png"});
    // await page.waitForTimeout(120000);
    // await page.locator("id=amount").fill("103.4");
    await page.screenshot({path: "./test-results/2min-sync.png"});
    // await page.getByTitle('History').click();
    // await page.screenshot({path: "./test-results/history.png"});
    await page.getByRole('button', {name: 'Send'}).click();
    console.log('输入金额后发送成功');
    await page.locator("id=password").fill('Aa111111');
    console.log('输入密码成功');
    await page.getByRole('button', {name: 'Confirm'}).click();
    console.log('点击确认成功');
    await page.screenshot({path: "./test-results/after_confirm.png"});
    await page.waitForTimeout(10000);
    await page.screenshot({path: "./test-results/after_8min.png"});
    await expect(page.getByText('Success').first()).toBeVisible({timeout:480000});
    console.log('发送交易成功！');
  });


  /*test("amend transaction ", async () => {
    await page.locator('//!*[@id="root"]/div/div/div[2]/div[1]/table/tbody/tr[1]/td[7]').click();
    await page.getByRole('button', {name: 'Amend'}).click();
    await page.getByTitle('Send').click();
    await page.locator("id=password").fill('Aa111111');
    await page.getByRole('button', {name: 'Confirm'}).click();
    await expect(page.getByText('Confirming').first()).toBeVisible();
    console.log('amend交易成功！');
  });
//suggestion:this case is run whenwallet balance is large,or you need to increase balance after this case
  test("one cell consume", async () => {
    await page.getByTitle('总览',{exact:true}).click();
    console.log('已点击总览！');
    // await page.locator('//!*[@id="root"]/div/div/div[2]/div[1]/div/div[1]/div[2]/button[3]//!*[name()="svg"]').click();
    await page.locator('//!*[@id="root"]/div/div/div[2]/div[1]/div/div[1]/div[2]/button[3]/!*[name()="svg"]').click();
    console.log('已点击cell management 图标！');
    await expect(page.getByTitle('Cell管理')).toBeVisible();
    await page.waitForTimeout(5000);
    await page.locator('//!*[@id="root"]/div/div/div[2]/div[1]/div/table/tbody/tr[1]/td[1]/label/span').click();
    console.log('已选中cell');
    // await page.getByLabel('0x2cd04468e9a4c968ca43f404d217ffd86fc5664bf1f2f7574649718939f49807_2').check();
    await page.getByRole('button', {name: '花费'}).click();
    await page.getByRole('button', {name: '确认'}).click();
    await page.locator("id=address").fill('ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqt6q3xq73zw456d5me5d3gxpjyqu6wtvvsrvay5z');
    await page.getByRole('button', {name: '发送'}).click();
    await page.locator("id=password").fill('Aa111111');
    await page.getByRole('button', {name: '确认'}).click();
    console.log('消费cell成功！');

  });*/

});



// 等待同步进度到100%
test("nervos dao deposit", async () => {
//   await page.waitForFunction(
//     'document.querySelector("selector").getAttribute("data-field") === "success"',
//     {
//       "selector": '#root > div > div > div.pageContainer_body__Bat68 > div.table_tableRoot__8fn05 > table > thead > tr > th:nth-child(6) > div'
// }
// )

  await page.getByTitle('Nervos Dao').click();
  // await page.waitForTimeout(30000);
  await page.getByRole('button', {name: 'Deposit'}).click();
  await page.locator("id=depositValue").fill("104");
  await page.getByRole('button', {name: 'Proceed'}).click();
  await page.locator("id=password").fill('Aa111111');
  await page.getByRole('button', {name: 'Confirm'}).click();
  // await expect(page.getByText('Deposit in progress')).toBeVisible();
  console.log('nervos dao deposit 成功！');
});


test("check transaction history", async () => {
  await page.getByTitle('History').click();
  await page.screenshot({path: "./test-results/history_record.png"});
  await page.getByPlaceholder('Search tx hash, address or date (yyyy-mm-dd)').fill('2024-08-14');
  let EnterKey = "Enter";
  await page.keyboard.press(EnterKey);
  await page.screenshot({path: "./test-results/0814history_record.png"});
  // await expect(page.getByText('1 - 7 of 7')).toBeVisible();
/*await page.getByRole('button', {name: '导出交易历史'}).click();
  await ClickSystemMenu.clickMenu('./__tests__/script/', 'dialogClick.scpt');
  await page.waitForSelector('//!*[@id="root"]/div/dialog[1]/div/button');
  await page.getByRole('button', {name: '确认'}).click();*/
  console.log('查历史记录成功！');

});

//所有交易完成才能执行以下操作
test.describe('实验性功能', () => {
  test("create account in asset accounts", async () => {
    // await page.getByTitle('交易历史').click();
    // await page.getByText('已提交').isHidden();
    await page.waitForTimeout(60000);
    await page.getByTitle('Experimental').click();
    await page.getByTitle('Asset Accounts').click();
    await page.getByRole('button', {name: 'Create Asset Account'}).click();
    const tp: number = Date.parse(new Date().toString());
    console.log('时间戳是:' + tp);
    await page.locator("id=accountName").fill("te" + tp);
    await page.getByRole('button', {name: 'Next'}).click();
    await page.locator("id=tokenId").fill("0xb1718e7c0175d8a6428a6ddca708b765803e3131d07c8e0046a94be310f1722b");
    await page.locator("id=tokenName").fill("tk01");
    await page.locator("id=symbol").fill("sy01");
    await page.locator("id=decimal").fill("4");
    await page.getByRole('button', {name: 'Next'}).click();
    await page.locator("id=password").fill("Aa111111");
    await page.getByRole('button', {name: 'Confirm'}).click();
    await page.waitForTimeout(20000);
    await expect(page.getByText('te' + tp, {exact: true})).toBeVisible();
    console.log('创建sudt账号成功！');
    await page.waitForTimeout(360000);
  });


  test("receive ", async () => {
    await page.getByRole('button', {name: 'Receive'}).first().click();
    await page.screenshot({path: "./test-results/account_receive.png"});
    console.log('点击收款成功！');
    await page.locator('//*[@id="root"]/div/div/div[2]/div/dialog/div[2]/div/div[2]/div[2]/div').click();
    console.log('点击地址成功！');
    await expect(page.getByText('Copied')).toBeVisible();
//关闭窗口
    await page.locator('//*[@id="root"]/div/div/div[2]/div/dialog/div[1]/*[name()="svg"]').click();
    console.log('sudt账号复制成功！');
    await page.waitForTimeout(10000);
  });


  test("send ", async () => {
    //上笔记录为完成状态
    await page.getByRole('button', {name: 'Send'}).first().click();
    console.log('account 点击发送成功');
    await page.locator("id=address").fill("ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqggcska5fafwdlfw9g0cttk5uzdcvuqj4qqz5d7q");
    console.log('account 填写地址成功');
    await page.locator("id=amount").fill("0.001");
    console.log('account 填写数量成功');
    await page.screenshot({path: "./test-results/account_send.png"});
    await page.getByRole('button', {name: 'Submit'}).click();
    console.log('accout submit成功');
    await page.locator("id=password").fill('Aa111111');
    console.log('account 填写密码成功');
    await page.getByRole('button', {name: 'Confirm'}).click();
    console.log('sudt账号发送交易成功！');
  });


 /* test("claim in customized page ", async () => {
    await page.getByTitle('Experimental').click();
    await page.getByTitle('Customized Assets').click();
    await page.getByRole('button', {name: 'Claim'}).first().isEnabled();
    await page.getByRole('button', {name: 'Claim'}).first().click();
    await page.locator("id=password").fill('Aa111111');
    await page.getByRole('button', {name: 'Confirm'}).click();
    console.log('领取自定义资产成功！');


  });
*/

});


/*test.describe('menu-tool', () => {
  test("单签", async () => {
    // AppleScript 文件的路径
    await ClickSystemMenu.clickMenu('./__tests__/script/', 'singleSign.scpt');
    await expect(page.getByText('签名/验签信息')).toBeVisible();
    await page.getByPlaceholder('请输入信息').fill('just a test');
    await page.getByPlaceholder('请输入或选择地址').click();
    await page.locator('.signAndVerify_wrap__c3LFQ').first().click();
    await page.getByRole('button', {name: '签名'}).click();
    await expect(page.getByText('签名')).toBeVisible();
    await page.getByPlaceholder("输入密码").fill('Aa111111');
    await page.getByRole('button', {name: '确认'}).click();
    await page.getByRole('button', {name: '验证'}).click();
    await expect(page.locator('.toast_content__U4vEI')).toHaveText('验证成功');
    //关闭弹窗
    await page.locator('//!*[@id="root"]/div/div[2]/dialog/div[1]/!*[name()="svg"]').click();

    console.log('单签成功！');


  });

  test("多签", async () => {
    await ClickSystemMenu.clickMenu('./__tests__/script/', 'multisigSign.scpt');
    //删除已创建的数据
    await page.locator('div.multisigAddress_hoverBtn__Ra5xG').click();
    await page.getByRole('button', {name: '删除'}).click()
    await page.getByRole('button', {name: '确认'}).click();
    await page.getByTitle('多签地址').isVisible();
    await page.getByRole('button', {name: '创建'}).click();
    await page.getByPlaceholder('输入m的数值(1-255)').fill('1');
    await page.getByPlaceholder('输入n的数值(1-255)').fill('2');
    await page.locator('id=0_address').fill('ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqdujss6wxctltkx6ep027q8p7em04yghysmy4rlq');
    await page.locator('id=1_address').fill('ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqws75yet4agaph4ry44hh3lr80e6fz3rtqmcf2td');
    await page.getByRole('button', {name: '生成地址'}).click();
    await page.getByRole('button', {name: '确认'}).click();
    await page.waitForSelector('div.multisigAddress_hoverBtn__Ra5xG');
    await page.locator('div.multisigAddress_hoverBtn__Ra5xG').click();
    await page.getByRole('button', {name: '详情'}).click();
    await page.getByTitle('多签地址详情').isVisible();
    await page.getByRole('button', {name: '确定'}).click();
    await page.locator('div.multisigAddress_hoverBtn__Ra5xG').click();
    await page.getByRole('dialog').getByRole('button', {name: '转账'}).click();
    await page.getByTitle('多签地址转账').isVisible();
    await page.locator('id=address').fill('ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqd54pah0drq8tpe0w6lkqry8x03ss8ac9gxp7edv');
    await page.locator('id=amount').fill('102');
    await page.getByRole('button', {name: '导出交易'}).click();
    await page.waitForTimeout(10000);
    await ClickSystemMenu.clickMenu('./__tests__/script/', 'dialogClick.scpt');
    //关闭窗口
    await page.locator('//!*[@id="root"]/div/div[2]/dialog[3]/div[1]/!*[name()="svg"]').click();
    await page.locator('//!*[@id="root"]/div/div[2]/dialog[1]/div[1]/!*[name()="svg"]').click();
    console.log('多签成功！');

  });
  test("导出交易", async () => {
    await page.getByTitle('总览').click();
    await page.getByRole('button', {name: '转账'}).click();
    await page.locator("id=address").fill("ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2glcd40rclyg8zmv6a9uzun0stz5rzp9q4jzxqs");
    await page.locator("id=amount").fill("103");
    await page.getByRole('button', {name: '发送'}).click();
    await page.locator('//!*[@id="root"]/dialog/div[2]/div/div[3]/button[1]/!*[name()="svg"]').click();
    // await page.locator('//!*[@id="root"]/dialog/div[2]/div/div[3]/button[1]').click();
    console.log('点击导出交易按钮成功！');
    await ClickSystemMenu.clickMenu('./__tests__/script/', 'dialogClick.scpt');
    // await page.waitForTimeout(10000);
    await page.getByText('交易导出至').isVisible();
    await page.getByRole('button', {name: '确认'}).click();
    console.log('导出交易成功！');

  });

  test("离线签", async () => {
    await ClickSystemMenu.clickMenu('./__tests__/script/', 'offlineSign.scpt');
    //点击打开按钮不稳定,时间过长时手动点击click
    await ClickSystemMenu.clickMenu('./__tests__/script/', 'dialogClick.scpt');
    await page.getByRole('button', {name: '签名并导出'}).click();
    await page.locator('id=password').fill('Aa111111');
    await page.getByRole('button', {name: '确认'}).click();
    await ClickSystemMenu.clickMenu('./__tests__/script/', 'dialogClick.scpt');
    await page.locator('dialog').filter({hasText: '交易已被导出至'}).getByLabel('确认').click();
    console.log('离线签成功！');

  });

  test("签名并导出", async () => {
    await page.getByTitle('总览').click();
    await page.getByRole('button', {name: '转账'}).click();
    await page.locator("id=address").fill("ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2glcd40rclyg8zmv6a9uzun0stz5rzp9q4jzxqs");
    await page.locator("id=amount").fill("103");
    await page.getByRole('button', {name: '发送'}).click();
    await page.getByPlaceholder("输入钱包密码").fill('Aa111111');
    await page.getByRole('button', {name: '签名并导出交易'}).click();
    await ClickSystemMenu.clickMenu('./__tests__/script/', 'dialogClick.scpt');
    await page.getByRole('button', {name: '确认'}).click();
    console.log('签名并导出交易成功！');


  });

  test("广播交易", async () => {
    await ClickSystemMenu.clickMenu('./__tests__/script/', 'broadcastTransaction.scpt');
    await ClickSystemMenu.clickMenu('./__tests__/script/', 'dialogClick.scpt');
    console.log('广播交易成功！');

  });
});*/

/*test.describe('menu-hard wallet', () => {
  test("创建硬件钱包", async () => {
    await page.waitForTimeout(10000);
    let createHardwallet = await page.getByText('LN-test').isVisible();
    if (!createHardwallet) {
      ClickSystemMenu.clickMenu('/Users/chllp/Desktop/', 'hardWallet.scpt');
      await page.getByRole('button', {name: '其他型号'}).click();
      await page.getByRole('button', {name: '下一步'}).click();
      await page.locator('.button_button__wmqYv').click();
      await page.locator("id=wallet-name").fill('LN-test');
      await page.getByRole('button', {name: '完成创建'}).click();
      console.log('创建硬件钱包成功！');

    } else {
      console.log('钱包已创建！');
    }

  });


  test("收款", async () => {
    await page.getByRole('button', {name: '收款'}).click();
    await page.getByRole('button', {name: '验证地址'}).click();
    await expect(page.getByText('地址验证通过')).toBeVisible();
    await page.getByRole('button', {name: '取消'}).click();
    console.log('硬件钱包收款成功！');


  });

  test("转账", async () => {
    await page.getByRole('button', {name: '转账'}).click();
    await page.locator("id=address").fill("ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw539axnad36dwf45je32w7su70pqp8g6qh7r60q");
    await page.locator("id=amount").fill("106");
    await page.getByRole('button', {name: '发送'}).click();
    await page.locator('//!*[@id="root"]/dialog/div[3]/form/button[2]').click();
    await expect(page.getByText('已连接，等待确认...')).toBeVisible();
    console.log('硬件钱包转账成功！');

  });


});*/


/*test("change  to light node ", async () => {
  await page.getByTitle('设置').click();
  await page.locator('[value="light_client_testnet"]').check();
});*/












