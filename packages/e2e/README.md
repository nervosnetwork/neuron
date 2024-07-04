*Do the following before running the use case:
1.download the code--git clone
2.Install dependencies--yarn install 
3.Run the package:e2e command 
4.Run start to complete 100% synchronization
5.Run the test:e2e  command (You can click neuron icon manually if Launch Neuron is slow)

*Regression use cases are divided into ordinary wallets and hardware wallets, and the two chunks need to be operated separately, especially hardware wallets, which involve manually synchronizing the operation of hardware wallets.
【ordinary wallets】的test cases
1.send transaction success

2.amend transaction success

3.one cell consume success（(Due to the probability that this function needs to consume a large amount of money, resulting in the wallet amount is not enough for the following use cases, so the use case even run down to the annotation state, need to run special to open, need to go to the browser faucet recharge after running)）
4.nervos dao deposit success

5.check transaction history success

6.create sudt account in asset accounts success（(Pre-operation - last transaction completed)）

7.asset account receive success

8.asset account send success(Pre-operation - Ensure that the first account of the asset account has money)

9.claim in customized page success

*MacOs menu bar operation involves interaction with the system, the response time is slightly longer. If there is no response for a long time, you can manually click, and the process will automatically continue
10.single sign success
11.multisigSign success
12.offlineSign success（Pre-operation-export transaction）
13.broadcastTransaction success（Pre-operation-sign and export transaction）


【hardware wallets】
testcases：
1.create hard wallet success
2.receive  success
3.send success

*Prerequisites for  cases run-through:
1.Manually switch the wallet from the ordinary wallet  to the hardware wallet
2.Comment out  create ordinary wallet to  case
3.ledger open the ckb application

*When the neuron program is throw exception like (database lock/output dead/network abnormal/garbage data generated when the program is abnormal, etc.), the automation will automatically exit.
![img.png](img.png)


