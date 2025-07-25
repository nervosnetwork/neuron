# 0.202.1 (2025-07-02)

### CKB Node & Light Client

- [CKB@v0.202.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.202.0) was released on Jun. 12th, 2025. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.5.1](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.5.1) was released on Jul. 1st, 2025. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0x49d2e56c7b595ebb61d1fee94b2814e83942064ce3ff91a175adbec0c14d26f7`(at height `16,588,228`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3384)

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.202.0...v0.202.1


# 0.202.0 (2025-06-25)

### Caveat

The [CKB 2023](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0051-ckb2023/0051-ckb2023.md) Hardfork will be activated at **Epoch 12,293**(estimated 2025-07-01) and requires **CKB@v0.200.0** or **Light Client@v0.5.0** and above.

To ensure synchronization after the hardfork, please upgrade Neuron to [v0.201.0](https://github.com/nervosnetwork/neuron/releases/tag/v0.201.0) or later for full node users, and to [v0.202.0](https://github.com/nervosnetwork/neuron/releases/tag/v0.202.0) or later for light client users.

Visit https://explorer.nervos.org/hardfork for more information about the hardfork.

### CKB Node & Light Client

- [CKB@v0.202.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.202.0) was released on Jun. 12th, 2025. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.5.0](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.5.0) was released on Jun. 19th, 2025. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0x6676e2c4ef75afd8ef00a61d21a230fbe83c672e6a89dc60dcb41879884979a1`(at height `16,517,698`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3376)

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.201.0...v0.202.0


# 0.201.0 (2025-05-30)

### Caveat

The [CKB 2023](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0051-ckb2023/0051-ckb2023.md) Hardfork will be activated at **Epoch 12,293**(estimated 2025-07-01) and requires **CKB@v0.200.0** or **Light Client@v0.4.0** and above.

To ensure synchronization after the hardfork, please upgrade Neuron to [v0.201.0](https://github.com/nervosnetwork/neuron/releases/tag/v0.201.0) or later for full node users, and to [v0.119.0](https://github.com/nervosnetwork/neuron/releases/tag/v0.119.0) or later for light client users.

Visit https://explorer.nervos.org/hardfork for more information about the hardfork.

### CKB Node & Light Client

- [CKB@v0.201.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.201.0) was released on Apr. 3rd, 2025. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.4.1](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.4.1) was released on Nov. 13th, 2024. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0x8d98cc0af11e54e7c66b10d188cea7bd1ec33acee624eb0fddd9bb6951cf720e`(at height `16,284,813`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3357)

---

[![Neuron@v0.201.0](https://github.com/user-attachments/assets/0195090e-b178-4a23-9068-fc0df9d615cd)](https://youtu.be/JFe0Pwr4Io0)

YouTube: https://youtu.be/JFe0Pwr4Io0

---

## New features

- #3323: Support UDT destruction.(@devchenyan)
- #3329, #3347: Introduce new Multisig Script, and support Nervos DAO with it.(@devchenyan)

## Bug fixes

- #3317: Hide 'View Private Key' when it's a hardware wallet.(@devchenyan)
- #3332: Better note for external node running without the indexer module enabled.(@devchenyan)
- #3352: Fix screen flicker when connecting to external nodes running new versions.(@devchenyan)


**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.121.1...v0.201.0


# 0.121.1 (2025-02-13)

### CKB Node & Light Client

- [CKB@v0.121.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.121.0) was released on Jan. 23rd, 2025. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.4.1](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.4.1) was released on Nov. 13th, 2024. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0x53dd03a0420b68e082d660cb2e86f167aa8f1bd95c637228285bf36f5caa9e1d`(at height `15,361,857`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3310)

---

## New features

- #3291: Support complex transaction with multisig account.(@devchenyan)
- #3298: Support Nervos DAO with multisig account.(@devchenyan)


**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.121.0...v0.121.1


# 0.121.0 (2025-01-16)

### CKB Node & Light Client

- [CKB@v0.121.0-rc1](https://github.com/nervosnetwork/ckb/releases/tag/v0.121.0-rc1) was released on Jan. 9th, 2025. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.4.1](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.4.1) was released on Nov. 13th, 2024. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0x1381f9e4f70ce521256c4095fa536d11165488171a8a2cbac687f8cf53907afa`(at height `15,119,157`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3300)

---

## New features

- #3290: Support inspecting and exporting private key for specific addresses.(@devchenyan)
- #3293: Refine interaction of Sign and Verify Message.(@devchenyan)


**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.120.0...v0.121.0


# 0.120.0 (2024-12-13)

### CKB Node & Light Client

- [CKB@v0.120.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.120.0) was released on Dec. 12th, 2024. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.4.1](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.4.1) was released on Nov. 13th, 2024. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0xe1085c7ce8f4e8461ea75afe63ef21d2c1ce6a5d0bf0f0170042bebdd2fbde04`(at height `14,817,366`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3282)

---

## New features

- #3271: Support Arabic, FrCanadian/Belgian in User Interface.(@Natixe)

## New Contributors

- @Natixe made their first contribution in https://github.com/nervosnetwork/neuron/pull/3271

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.119.0...v0.120.0


# 0.119.0 (2024-12-02)

### CKB Node & Light Client

- [CKB@v0.119.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.119.0) was released on Oct. 25th, 2024. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.4.1](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.4.1) was released on Nov. 13th, 2024. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0x7488acf2280ebf5b83c805a517f766eab77f45cd51f61476811d1ce96a60ea71`(at height `14,687,217`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3268)

---

## Bug fixes

- #3239: Fix abnormal display of remaining time of Nervos DAO.(@devchenyan)
- #3246: Use the median fee rate instead of the average as a more appropriate reference for fee rate.(@yanguoyu)


**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.117.0...v0.119.0


# 0.117.0 (2024-08-12)

### CKB Node & Light Client

- [CKB@v0.117.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.117.0) was released on Jul. 29th, 2024. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.3.7](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.3.7) was released on Apr. 13th, 2024. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0xca44ae8f7bc12ba8eab3224cbe3156c913e2284693e36dc1d01e4d30f362f3c2`(at height `13,705,152`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3227)

---

[![Neuron@v0.117.0](https://github.com/user-attachments/assets/7d2eba67-e33e-4fca-a714-7ba1709d8bd3)](https://youtu.be/zf78Y094m60)

YouTube: https://youtu.be/zf78Y094m60

---

## New features

- #3206: Support XUDT asset management.(@yanguoyu)
- #3207: Support connecting to an external light client.(@devchenyan)
- #3167: Support cells consolidation.(@devchenyan)
- #3199: Validate pending transactions periodically.(@devchenyan)
- #3200: Optimize the process of generating a wallet.(@devchenyan)
- #3176: Support setting start block numbers of multisig addresses.(@yanguoyu)
- #3160: Optimize synchronization in light client mode for multiple wallets.(@yanguoyu)
- #3169: Be compatible with multisig transaction JSON file exported from CKB CLI.(@devchenyan)
- #3197: Support resetting pin code for window lock.(@yanguoyu)
- #3194: Add a tip for multisig addresses.(@yanguoyu)

## Bug fixes

- #3195: Fix the synchronization status check.(@yanguoyu)

## New Contributors

- @tcpdumppy made their first contribution in https://github.com/nervosnetwork/neuron/pull/3182

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.116.2...v0.117.0

# 0.116.2 (2024-05-29)

### CKB Node & Light Client

- [CKB@v0.116.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.116.1) was released on May. 11st, 2024. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.3.7](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.3.7) was released on Apr. 13th, 2024. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0x6dd077b407d019a0bce0cbad8c34e69a524ae4b2599b9feda2c7491f3559d32c`(at height `13,007,704`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3157)

---

## Bug fixes

- 3179: Remove the display of the ledger firmware version because it causes the Nervos app to crash on the ledger device.(@yanguoyu)

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.116.1...v0.116.2

# 0.116.1 (2024-05-28)

### CKB Node & Light Client

- [CKB@v0.116.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.116.1) was released on May. 11st, 2024. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.3.7](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.3.7) was released on Apr. 13th, 2024. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0x6dd077b407d019a0bce0cbad8c34e69a524ae4b2599b9feda2c7491f3559d32c`(at height `13,007,704`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3157)

---

## Bug fixes

- 3173: Fix importing an account from a hardware wallet.(@yanguoyu)

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.116.0...v0.116.1

# 0.116.0 (2024-05-24)

### CKB Node & Light Client

- [CKB@v0.116.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.116.1) was released on May. 11st, 2024. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.3.7](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.3.7) was released on Apr. 13th, 2024. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0x6dd077b407d019a0bce0cbad8c34e69a524ae4b2599b9feda2c7491f3559d32c`(at height `13,007,704`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3157)

---

[![Neuron@v0.116.0](https://github.com/Magickbase/neuron-public-issues/assets/7271329/ec10aa01-47fe-47a3-9636-3d4e86fc6c9b)](https://youtu.be/QXv8by2C8zU)

YouTube: https://youtu.be/QXv8by2C8zU

---

## New features

- #3134: Support 'replace-by-fee' nervos dao transactions and sudt transactions.(@devchenyan)
- #3144: Reduce size of light client log in debug information and reveal start-block-number in log.(@yanguoyu)
- #3064: Support locking window by pin code.(@yanguoyu)
- #3131: Add detailed result for nervos dao transaction.(@devchenyan)

## Bug fixes

- #3121: Locate the first transaction on Explorer directly when users want to set the start-block-number for light client.(@yanguoyu)
- #3101: Show migration instruction properly.(@devchenyan)
- #3062: Migrate legacy ACP to active ACP account(@yanguoyu)
- #3141: Fix some issues about light client synchronizaiton.(@yanguoyu)
- #3120: Remove all sync data when start-block-number is set less than before.(@yanguoyu)

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.114.3...v0.116.0

# 0.114.3 (2024-04-16)

### CKB Node & Light Client

- [CKB@v0.115.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.115.0) was released on Apr. 1st, 2024. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.3.7](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.3.7) was released on Apr. 13th, 2024. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0x9443ad8da9172d484367bc5467988cba7a0c46028398309edfdda7d2d79be897`(at height `12,703,957`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3123)

---

## New features

- #3054: Displaying DAO rewards.(@devchenyan)
- #3066: Support keeping screen awake.(@yanguoyu)

## Bug fixes

- #3055: Fix sending sudt to a new acp cell with extra 142 CKB by offline sign.(@yanguoyu)
- #3103: Handle MacOS crash properly on quitting.(@devchenyan)

## New Contributors

- @twhy made their first contribution in https://github.com/nervosnetwork/neuron/pull/3110

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.114.2...v0.114.3

# 0.114.2 (2024-03-15)

### CKB Node & Light Client

- [CKB@v0.114.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.114.0) was released on Feb. 29st, 2024. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.3.6](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.3.6) was released on Feb. 8th, 2024. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0x397d7d41167051cab2bf1610e334ad3aa5cf612e2cd442f71b91422e0361141e`(at height `12,450,084`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3077)

---

Good day, good Neuron, packed with exciting new features and enhancements to elevate your transaction experience!

With support for Cell Management, Chained Transactions, and detailed viewing options, managing your transactions has never been easier.

We're also thrilled to announce multilingual support, with French and Spanish interfaces now available, thanks to the contributions of our dedicated community members.

Plus, enjoy enhanced guidance features like remaining time estimation and the ability to amend pending transactions for added flexibility.

With optimizations to settings and transaction overviews, Neuron continues to prioritize efficiency and user satisfaction.

Upgrade now and experience seamless transaction management with Neuron.

[![Neuron@v0.114.2](https://github.com/nervosnetwork/neuron/assets/7271329/883aba6e-ceb0-402d-9de0-d46609c528b7)](https://youtu.be/df29-EUZG0Y)

---

## Bug fixes

- #3081: fix start-sync confirmation in light client mode.(@yanguoyu)

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.114.0...v0.114.2

# 0.114.0 (2024-03-15)

### CKB Node & Light Client

- [CKB@v0.114.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.114.0) was released on Feb. 29st, 2024. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.3.6](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.3.6) was released on Feb. 8th, 2024. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0x397d7d41167051cab2bf1610e334ad3aa5cf612e2cd442f71b91422e0361141e`(at height `12,450,084`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/3077)

---

Good day, good Neuron, packed with exciting new features and enhancements to elevate your transaction experience!

With support for Cell Management, Chained Transactions, and detailed viewing options, managing your transactions has never been easier.

We're also thrilled to announce multilingual support, with French and Spanish interfaces now available, thanks to the contributions of our dedicated community members.

Plus, enjoy enhanced guidance features like remaining time estimation and the ability to amend pending transactions for added flexibility.

With optimizations to settings and transaction overviews, Neuron continues to prioritize efficiency and user satisfaction.

Upgrade now and experience seamless transaction management with Neuron.

[![Neuron@v0.114.0](https://github.com/nervosnetwork/neuron/assets/7271329/883aba6e-ceb0-402d-9de0-d46609c528b7)](https://youtu.be/df29-EUZG0Y)

---

## New features

- #2859: Support Cell Management.(@yanguoyu)
- #2963: Support chained transactions.(@yanguoyu)
- #2986: Support viewing chained transaction detail.(@yanguoyu)
- #3012: Support French in User Interface.(Special thanks to @Natixe)
- #3024: Support Spanish in User Interface.(Special thanks to @Natixe)
- #3014: Support remaining time estimation.(@yanguoyu)
- #3045: Support "amend a pending transaction".(@devchenyan)
- #3005: Show tip for first sync and show warning when disk is not enough for full-node mode.(@yanguoyu)
- #2994: Optimize setting of light client.(@yanguoyu)
- #3040: Optimize transaction overview.(@yanguoyu)

## Bug fixes

- #2951: Fix error on creating multisig address.(@devchenyan)
- #2992: Fix transaction lost in light client mode.(@yanguoyu)
- #3010: Fix storage of multisig configuration.(@yanguoyu)
- #3020: Disable nervos dao unlock button when balance is not enough as transaction fee.(@yanguoyu)

## New Contributors

- @Natixe made their first contribution in https://github.com/nervosnetwork/neuron/pull/3012

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.112.0...v0.114.0

# 0.112.0 (2023-12-07)

### CKB Node & Light Client

- [CKB@v0.112.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.112.1) was released on Nov. 21st, 2023. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.3.2](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.3.2) was released on Dec. 5th, 2023. This version of CKB Light Client is now bundled and preconfigured in Neuron

### Assumed valid target

Block before `0x1d46fe5bb62d19a004eadd7ba40564c45620905ab260d8a546a9e4b9d7cc0f85`(at height `11,511,944`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/2968)

---

## New features

- #2810: Support Spore Protocol.(@homura)
- #2916: Add light client in compatibility table.(@yanguoyu)
- #2926: Refactor switch between light client mainnet and light client testnet to make it more intuitive.(@yanguoyu)

## Bug fixes

- #2928: Fix condition of compatibility alert.(@yanguoyu)
- #2935: Fix migration settings.(@yanguoyu)
- #2945: Fix Nervos DAO withdrawal on light client mode.(@homura)
- #2944: Fix requests jam when a synced transaction includes cellbase cells.(@yanguoyu)
- #2965: Fix transaction type recognition on light client mode.(@yanguoyu)

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.111.1...v0.112.0

# 0.111.1 (2023-11-08)

### CKB Node & Light Client

- [CKB@v0.111.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.111.0) was released on Sep. 14nd, 2023. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.3.0](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.3.0) was released on Nov. 2nd, 2023. This version of CKB Light Client is now bundled and preconfigured in Neuron

#### Important

◆ **CKB Light Client on Mainnet** is active and available in Neuron 👏. See how to enable Light Client on Mainnet on YouTube: https://www.youtube.com/watch?v=Vl2LGRNqnvk

[![Light Client on Mainnet](https://github.com/nervosnetwork/neuron/assets/7271329/97fb7848-350d-4d45-ab2d-1e79dd3c9716)](https://www.youtube.com/watch?v=Vl2LGRNqnvk)

#### Caveat

◆ "Internal Node" network option is reserved for the built-in CKB node for clarity, and won't be connected to an external CKB node anymore.

### Assumed valid target

Block before `0x79cecdd6f41361e2474290224751284312a018528d1d92f4e18dd6d542feddfe`(at height `11,204,206`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/2923)

---

## New features

- #2913: Use KeyLocker to sign Neuron for Windows, conforming to the new industry standards effective since June 1, 2023.(@keith-cy)
- #2921: Add network option of "Light Client(Mainnet)", and reserve "Internal Node" for built-in CKB Node only.(@yanguoyu)

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.111.0...v0.111.1

# 0.111.0 (2023-10-19)

### CKB Node & Light Client

- [CKB@v0.111.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.111.0) was released on Sep. 14nd, 2023. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.2.4](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.2.4) was released on May. 28th, 2023. This version of CKB Light Client is now bundled and preconfigured in Neuron

#### Caveat

◆ **CKB Light Client** is only activated on testnet, thus only `light testnet` is enabled in Neuron. **CKB Light Client on Mainnet** requires an activation on the mainnet, the timetable can be found at https://github.com/nervosnetwork/ckb/releases/tag/v0.110.1.

### Assumed valid target

Block before `0xd5e25ad24400f237aa5f72f3738a9ae77fe082a89937e75143fcc8ef5b009383`(at height `11,204,855`) will be skipped in validation.(https://github.com/nervosnetwork/neuron/pull/2881)

---

## Bug fixes

- #2869: Add a dialog for migration.(@yanguoyu)
- #2870: Fix width of navbar.(@yanguoyu)
- #2873: Fix fallback font on Linux.(@yanguoyu)

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.110.3...v0.111.0

# 0.110.3 (2023-10-11)

### CKB Node & Light Client

- [CKB@v0.110.2](https://github.com/nervosnetwork/ckb/releases/tag/v0.110.2) was released on Sep. 12nd, 2023. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.2.4](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.2.4) was released on May. 28th, 2023. This version of CKB Light Client is now bundled and preconfigured in Neuron

#### Caveat

◆ **CKB Light Client** is only activated on testnet, thus only `light testnet` is enabled in Neuron. **CKB Light Client on Mainnet** requires an activation on the mainnet, the timetable can be found at https://github.com/nervosnetwork/ckb/releases/tag/v0.110.1.
◆ **default node** has been renamed to **Internal Node** for clarity.

### Assumed valid target

Block before `0x6b6db6bb23e6e98f63b88e6cd38fa49f46980e5b816f620c71c6c9c74633ee54`(at height `10,985,048`) will be skipped in validation.(257c06eb95062e8ef3bf53179668965fc743b10f)

---

We are so excited to announce this new release of Neuron that has been completely revamped with modernizaed user interface and also enhanced your overall user experience.

Say goodbye to clunky interface and hello to a smoother, more intuitive user experience. Neuron's new version is designed to make managing your assets on CKB effortless.

Curious to see the magic of the new Neuron in action? Checkout our demo video on YouTube: https://youtu.be/MRuXmTLcXFo

[![Brand-new Neuron](https://github.com/nervosnetwork/neuron/assets/7271329/77618118-4524-46c8-bf56-789b3e9d3206)](https://youtu.be/MRuXmTLcXFo)

---

## New features

- Adopt brand new User Interface.(@yanguoyu, @devchenyan, @WhiteMinds, @jeffreyma597, @zhangyouxin, @homura)
- #2672: Optimize storage of transactions to boost searching and reduce disk usage.(@yanguoyu)
- #2783: Check new versions actively.(@yanguoyu)
- #2786: Support synchronization from a specified block number in light client mode.(@yanguoyu)
- #2808: Optimize compatibility checking of CKB NODE.(@yanguoyu)
- #2813: Rename `default node` to `Internal node` for clarity.(@yanguoyu)
- #2839: Update Ckb client versions(@github-actions)

## Bug fixes

- #2711: Fix exit of synchronization with exception and multisig balance.(@yanguoyu)
- #2722: Automatically pad decimal places when the deposit dialog automatically provides a maximum value with decimals by(@WhiteMinds)
- #2772: Fix generating transaction when deposit all without balance.(@yanguoyu)

## New Contributors

- @zhangyouxin made their first contribution in https://github.com/nervosnetwork/neuron/pull/2775

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.110.2...v0.110.3

# 0.110.2 (2023-07-07)

### CKB Node & Light Client

- [CKB@v0.110.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.110.0) was released on May. 17th, 2023. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.2.4](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.2.4) was released on May. 28th, 2023. This version of CKB Light Client is now bundled and preconfigured in Neuron

#### Caveat

◆ **CKB Light Client** is only activated on testnet, thus only `light testnet` is enabled in Neuron. **CKB Light Client on Mainnet** requires a hardfork on the mainnet in the future.
◆ **CKB@v0.110** requires data migration, which is irreversible. Be cautious to start the migration without a backup. [How to back up data of ckb node](https://github.com/nervosnetwork/neuron/issues/2557#issue-1512510978)

> On the other hand, we strongly recommend you to back up the old data before migrating, the **ckb node data path** can be found by clicking **preference -> Data -> CKB Node Config & Storage**. Because once the migration starts, the data will be no longer compatible with all older versions of CKB.

### Assumed valid target

Block before `0xc0c532e10c708852d9586be46a5ed8317b2aa0835c721aa691abffb9bf4a26cd`(at height `10,004,892`) will be skipped in validation.(#2689)

## Bug fixes

- #2760: Avoid generating deposit DAO when the dialog is not visible.(@yanguoyu)

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.110.1...v0.110.2

# 0.110.1 (2023-05-31)

### CKB Node & Light Client

- [CKB@v0.110.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.110.0) was released on May. 17th, 2023. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.2.4](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.2.4) was released on May. 28th, 2023. This version of CKB Light Client is now bundled and preconfigured in Neuron

#### Caveat

◆ **CKB Light Client** is only activated on testnet, thus only `light testnet` is enabled in Neuron. **CKB Light Client on Mainnet** requires a hardfork on the mainnet in the future.
◆ **CKB@v0.110** requires data migration, which is irreversible. Be cautious to start the migration without a backup. [How to back up data of ckb node](https://github.com/nervosnetwork/neuron/issues/2557#issue-1512510978)

> On the other hand, we strongly recommend you to back up the old data before migrating, the **ckb node data path** can be found by clicking **preference -> Data -> CKB Node Config & Storage**. Because once the migration starts, the data will be no longer compatible with all older versions of CKB.

### Assumed valid target

Block before `0xc0c532e10c708852d9586be46a5ed8317b2aa0835c721aa691abffb9bf4a26cd`(at height `10,004,892`) will be skipped in validation.(#2689)

---

### Light Client Mode

[![Light client guide](https://github.com/Magickbase/neuron-public-issues/assets/7271329/eeed68ac-5f1b-457f-8203-c5d7b341b6b0)](https://youtu.be/tQm9YvgG7iE)

YouTube: https://youtu.be/tQm9YvgG7iE

---

We are thrilled to introduce our new feature: **Light Client Mode**. This feature makes Neuron more practical and convenient, allowing you to manage your digital assets more easily. Please note that it is currently only available on the testnet, as activation on the mainnet will require a hardfork.

#### What is the light client model?

**Light Client Mode** is a connection mode of Neuron that connects to a built-in **CKB Light Client**. Compared to a full node, it downloads a portion of the blockchain data to obtain necessary information. This allows Neuron to access the CKB blockchain faster.

#### Light Client Mode Advantages

1. **Higher synchronization speed**: Light Client Mode enables faster synchronization of blockchain data, saving users' time and network bandwidth.
2. **Less disk usage**: Light Client Mode requires only a fraction of the blockchain data to be stored, resulting in less storage space requirement compared to a full node.

Using a **MacBook Pro (13-inch, M1, 2020)** device as an example, we conducted a realistic test of synchronization from **block 0 to the latest block 9,380,828** (2023/05/22 Pudge network data):

- Light Client Mode: The synchronization process consumed about **5.5 hours** and approximately **45MB** of disk space during running. (The disk usage is related to the transaction count, and this test included 782 transactions.)
- Full Node Mode: It took about **36 hours** to synchronize **107.8GB** of data. (Excluding the time to find an assumed valid target block.)

In the above test scenario, using a light node compared to a full node **reduced synchronization time by 84.7% and disk usage by 99.9%**. (Please note that these numbers are for reference only and may vary depending on different equipment, network conditions, and account data.)

#### Light Client Mode Usage Scenarios

Compared to full nodes, light nodes require less disk space and network bandwidth, making them suitable for users who want to quickly access blockchain information without needing the full blockchain data. However, please note that for transactions containing time locks, Cheque contracts, or other operations that require full node data verification, you will need to switch to full nodes.

---

## New features

- #2615: Adapt ckb light node.(@yanguoyu)
- #2599: Implement dynamic fee rate based on fee rate statistics.(@jeffreyma597)
- #2689: Upgrade ckb node to v0.110.0.(@Keith-CY)
- #2627: Download ckb_aarch64 for neuron-arm64.(@Keith-CY)
- #2651: Add dialog warn for migrate date to 0.108.(@yanguoyu)
- #2567,#2568: Set allowToChangeInstallationDirectory for windows.(@yanguoyu)
- #2674: Improve the interaction design of the DatetimePicker component.(@WhiteMinds)

## Bug fixes

- #2530: Batch request to improve performance of nervos dao records.(@yanguoyu)
- #2574: Improve heart beating check of built-in ckb node.(@yanguoyu)
- #2565: Remove obsolete indexer data.(@yanguoyu)
- #2581: Skip password requirement when interact with a hardware wallet.(@yanguoyu)
- #2609: Upgrade leveldown to fix SQLITE_MISUSE.(@devchenyan)
- #2595: Fix latency of switching networks.(@yanguoyu)
- #2629: Fix crash when enter over 8 decimal.(@yanguoyu)
- #2696: Fix path of CKB binary on MacOS.(@yanguoyu)

## New Contributors

- @Kuzirashi made their first contribution in https://github.com/nervosnetwork/neuron/pull/2559
- @mortoys made their first contribution in https://github.com/nervosnetwork/neuron/pull/2592
- @devchenyan made their first contribution in https://github.com/nervosnetwork/neuron/pull/2609
- @WhiteMinds made their first contribution in https://github.com/nervosnetwork/neuron/pull/2652
- @homura made their first contribution in https://github.com/nervosnetwork/neuron/pull/2657

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.106.0...v0.110.1

# 0.110.0 (2023-05-31)

### CKB Node & Light Client

- [CKB@v0.110.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.110.0) was released on May. 17th, 2023. This version of CKB node is now bundled and preconfigured in Neuron.
- [CKB Light Client@v0.2.4](https://github.com/nervosnetwork/ckb-light-client/releases/tag/v0.2.4) was released on May. 28th, 2023. This version of CKB Light Client is now bundled and preconfigured in Neuron

#### Caveat

◆ **CKB Light Client** is only activated on testnet, thus only `light testnet` is enabled in Neuron. **CKB Light Client on Mainnet** requires a hardfork on the mainnet in the future.
◆ **CKB@v0.110** requires data migration, which is irreversible. Be cautious to start the migration without a backup. [How to back up data of ckb node](https://github.com/nervosnetwork/neuron/issues/2557#issue-1512510978)

> On the other hand, we strongly recommend you to back up the old data before migrating, the **ckb node data path** can be found by clicking **preference -> Data -> CKB Node Config & Storage**. Because once the migration starts, the data will be no longer compatible with all older versions of CKB.

### Assumed valid target

Block before `0xc0c532e10c708852d9586be46a5ed8317b2aa0835c721aa691abffb9bf4a26cd`(at height `10,004,892`) will be skipped in validation.(#2689)

---

### Light Client Mode

[![Light client guide](https://github.com/Magickbase/neuron-public-issues/assets/7271329/eeed68ac-5f1b-457f-8203-c5d7b341b6b0)](https://youtu.be/tQm9YvgG7iE)

YouTube: https://youtu.be/tQm9YvgG7iE

---

We are thrilled to introduce our new feature: **Light Client Mode**. This feature makes Neuron more practical and convenient, allowing you to manage your digital assets more easily. Please note that it is currently only available on the testnet, as activation on the mainnet will require a hardfork.

#### What is the light client model?

**Light Client Mode** is a connection mode of Neuron that connects to a built-in **CKB Light Client**. Compared to a full node, it downloads a portion of the blockchain data to obtain necessary information. This allows Neuron to access the CKB blockchain faster.

#### Light Client Mode Advantages

1. **Higher synchronization speed**: Light Client Mode enables faster synchronization of blockchain data, saving users' time and network bandwidth.
2. **Less disk usage**: Light Client Mode requires only a fraction of the blockchain data to be stored, resulting in less storage space requirement compared to a full node.

Using a **MacBook Pro (13-inch, M1, 2020)** device as an example, we conducted a realistic test of synchronization from **block 0 to the latest block 9,380,828** (2023/05/22 Pudge network data):

- Light Client Mode: The synchronization process consumed about **5.5 hours** and approximately **45MB** of disk space during running. (The disk usage is related to the transaction count, and this test included 782 transactions.)
- Full Node Mode: It took about **36 hours** to synchronize **107.8GB** of data. (Excluding the time to find an assumed valid target block.)

In the above test scenario, using a light node compared to a full node **reduced synchronization time by 84.7% and disk usage by 99.9%**. (Please note that these numbers are for reference only and may vary depending on different equipment, network conditions, and account data.)

#### Light Client Mode Usage Scenarios

Compared to full nodes, light nodes require less disk space and network bandwidth, making them suitable for users who want to quickly access blockchain information without needing the full blockchain data. However, please note that for transactions containing time locks, Cheque contracts, or other operations that require full node data verification, you will need to switch to full nodes.

---

## New features

- #2615: Adapt ckb light node.(@yanguoyu)
- #2599: Implement dynamic fee rate based on fee rate statistics.(@jeffreyma597)
- #2689: Upgrade ckb node to v0.110.0.(@Keith-CY)
- #2627: Download ckb_aarch64 for neuron-arm64.(@Keith-CY)
- #2651: Add dialog warn for migrate date to 0.108.(@yanguoyu)
- #2567,#2568: Set allowToChangeInstallationDirectory for windows.(@yanguoyu)
- #2674: Improve the interaction design of the DatetimePicker component.(@WhiteMinds)

## Bug fixes

- #2530: Batch request to improve performance of nervos dao records.(@yanguoyu)
- #2574: Improve heart beating check of built-in ckb node.(@yanguoyu)
- #2565: Remove obsolete indexer data.(@yanguoyu)
- #2581: Skip password requirement when interact with a hardware wallet.(@yanguoyu)
- #2609: Upgrade leveldown to fix SQLITE_MISUSE.(@devchenyan)
- #2595: Fix latency of switching networks.(@yanguoyu)
- #2629: Fix crash when enter over 8 decimal.(@yanguoyu)

## New Contributors

- @Kuzirashi made their first contribution in https://github.com/nervosnetwork/neuron/pull/2559
- @mortoys made their first contribution in https://github.com/nervosnetwork/neuron/pull/2592
- @devchenyan made their first contribution in https://github.com/nervosnetwork/neuron/pull/2609
- @WhiteMinds made their first contribution in https://github.com/nervosnetwork/neuron/pull/2652
- @homura made their first contribution in https://github.com/nervosnetwork/neuron/pull/2657

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.106.0...v0.110.0

# 0.106.0 (2022-12-28)

### CKB

[CKB v0.106.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.106.0) was released on Dec. 23rd, 2022. This version of CKB node is now bundled and preconfigured in Neuron.

### Assumed valid target

Block before `0x076ffa81f8c6f2e1f22a778a1aa5d48531cc33bfd9b302e0d73fb2ce6fa4de3b` will be skipped in validation.

### New features

- #2442: Make multisig import and export config compatible with ckb-cli.(@yanguoyu)
- #2454: Add 'contact us' in the menu -> help submenu.(@Keith-CY)
- #2461: Remove 4 epochs maturity requirement of header deps.(@yanguoyu)
- #2465: Adapt new UAN.(@yanguoyu)
- #2508: Use undici, an official http client, to replace axios.(@yanguoyu)
- #2515, #2542: Support Apple silicon chip.(@JeffreyMa597, @yanguoyu)
- #2518: Bump node.js from 16 to 18.(@JeffreyMa597)
- #2519: Bump react.js from 16 to 18.(@JeffreyMa597)
- #2555: Upgrade ckb node to v0.106.0.(@Keith-CY)

### Bug fixes

- #2447: Prevent from importing the same multisig configuration repeatedly.(@yanguoyu)
- #2451: Refine the input field component.(@yanguoyu)
- #2464, #2478: Optimize setting data path.(@yanguoyu)
- #2467: Fix ckb process killed unexpectedly.(@yanguoyu)
- #2483: Fix ckb node not working with Apple silicon chip.(@yanguoyu)
- #2488: Create a new instance for every test case to avoid side effect.(@yanguoyu)
- #2531: Handle uncaughtException and output it in the log.(@yanguoyu)
- #2541: Remove CKB Indexer module and set a specified version of usb module.(@yanguoyu)

## New contributors

- @JeffreyMa597 made their first contribution in #2515

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.103.3...v0.106.0

# 0.103.3 (2022-12-21)

### Certificate

We've updated the certificate of Neuron for windows, which is issued by **DigiCert** and distributed to [Magickbase](https://github.com/Magickbase/), the active developer team of Neuron. With this update, a warning may appear on updating Neuron by `check for update` inside Neuron, please don't worry and download Neuron from [GitHub Release](https://github.com/nervosnetwork/neuron/releases) to adopt the new certificate.

### Bug Fixes

- #2551: Fix sending multisig tx when input cell's length is greater than 1.(@yanguoyu)

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.103.2...v0.103.3

# 0.103.2 (2022-07-09)

### New features

- #2422: Add heart beat and retry closed ckb/ckb-indexer process(@yanguoyu)
- #2433: Add ckb node/indexer data path config in setting(@yanguoyu)
- #2434: Adapt to ledger nano s plus(@yanguoyu)
- #2441: Verify short and long address for hard wallet(@yanguoyu)

### Bug fixes

- #2425: Fix dialog route error after importing seed(@yanguoyu)
- #2436: Fix link to Nervos DAO rule(@Keith-CY)
- #2438: Fix duplicated addressd(@yanguoyu)

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.103.1...v0.103.2

# 0.103.1 (2022-06-11)

### New features

- #2375: Adapt new testnet URL(@yanguoyu)
- #2400: Support send acp/sudt to any address.(@yanguoyu)
- #2406: Refine export tx(@yanguoyu)
- #2408: add address format toggle in receive tabs(@Keith-CY)

### Bug fixes

- #2344: Delete unnecessary conditions. Retry should await.(@yanguoyu)
- #2390: Fix unmatched cheque lockHash(@yanguoyu)
- #2405: Remove covering above `update` button(@yanguoyu)
- #2409: Remove scroll(@yanguoyu)
- #2410: style of release note(@Keith-CY)

### Refactor

- #2368: Use blake160 replace addresse. Rename 'multi-sign' to 'multisig'(@yanguoyu)
- #2373, #2412: improve neuron-ui typescript, tests, deps and bundle(@qiweiii)

**Full Changelog**: https://github.com/nervosnetwork/neuron/compare/v0.103.0...v0.103.1

# 0.103.0 (2022-05-10)

### Hardfork

Neuron adopts new RFCs introduced by [HARDFORK 2021](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0037-ckb2021/0037-ckb2021.md), prominents are as follows,

1. adopt the new address format and deprecate the short version of addresses #2346

### CKB

[CKB v0.103.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.103.0) was released on Apr. 11th, 2022. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

- #2280: add a balance-not-reserved checkbox in Nervos DAO deposit dialog(@Keith-CY)
- #2291: add a sudt detail link in creating asset account dialog (@yanguoyu)
- #2296, #2320: add address lock script detail in transaction detail window (@Lester-xie, @Keith-CY)
- #2300, #2352: add options of ckb node to boost synchronization (@Keith-CY)
- #2302, #2333: allow ACP account to transfer to secp256k1 addresses (@Lester-xie)
- #2303, #2310, #2313, #2323, #2324, #2332, #2340, #2357, #2363: add multisig address management (@yanguoyu, @Keith-CY)
- #2307: disable some functions when current wallet is an xpub wallet (@yanguoyu)
- #2309: check checksums after publishment (@Keith-CY)
- #2315: add new sign tips and add old sign notice in sign/verify window (@yanguoyu)
- #2330: allow sudt/secp256k1 assets to be migrated to an asset account (@yanguoyu)
- #2331: upgrade bundled ckb version to v0.103.0 (@Keith-CY)
- #2337: allow asset account to be destroied when balance is 0 (@yanguoyu)
- #2341: support syncing cells those have script of hash type 'data1' (@Keith-CY)
- #2342, #2361: mark create and destroy asset account in transaction history (@qiweiii)
- #2346: use new foramt of addresses by default (@Keith-CY)
- #2359: allow secp256k1 address to be timelocked (@Keith-CY)

### Bug fixes

- #2304: fix error message of creating sudt/acp account (@Keith-CY)
- #2335: fix parsers (@Keith-CY)
- #2351: avoid saving duplicate blake160 for one wallet (@yanguoyu)
- #2362: ignore rejected transaction by (@Keith-CY)

### Refactor

- #2277: remove grommet icons (@yanguoyu)
- #2289: format code (@Lester-xie)
- #2290: replace calculate_dao_maximum_withdraw with calculateDaoMaximumWithdraw method in sdk (@yanguoyu)

# 0.101.3 (2022-03-01)

[CKB v0.101.4](https://github.com/nervosnetwork/ckb/releases/tag/v0.101.4) was released on Jan. 20th, 2022. This version of CKB node is now bundled and preconfigured in Neuron.

### Refactor

- #2243: Update dependencies (@Lester-xie)
- #2272: Refactor block sync renderer (@Keith-CY)

### New features

- #2247: Display all unknown custom assets (@yuche)
- #2268: Add redist log in the debug info zip file (@yanguoyu)
- #2287: Upgrade the bundled ckb node to v0.101.4 (@kellyshang)
- #2250: Upgrade the bundled ckb-indexer to v0.3.2 (@kellyshang)

### Bug fixes

- #2267: Fix the tx count inaccurate issue (@Keith-CY)
- #2269: Unwrap RPC errors (@Keith-CY)
- #2271: Fix some file is empty when export to debug info (@yanguoyu)
- #2272: Fix indexer closed unexpectedly (@Keith-CY)
- #2274: Fix copying sUDT amount problem (@Keith-CY)

# 0.101.2 (2021-12-10)

[CKB v0.101.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.101.1) was released on Oct. 28th, 2021. This version of CKB node is now bundled and preconfigured in Neuron.

**The CKB v0.101.0 activates ckb2021 since epoch 3113 in the testnet. After that nodes running this version are incompatible with old versions. However, this version is still compatible with CKB v0.25.0 and above in the mainnet.**

### New features

- Upgrade SDK to v0.101.0 to adopt new full format of address.
- Upgrade the bundled ckb node to v0.101.1.
- Update nft contract info.
- Update cheque cell contract info.
- Add feature of clear all synchronized data.
- Add tooltip for APC abbreviation.
- Set exit-and-install redist to mandatory.

### Bug fixes

- Capture capacity too small error.
- Fix the problem that sometimes cells cannot be synced in time.
- Fix the problem that Neuron cannot be synced after the ckb node is disconnected and reconnected.
- Reduce CKB RPC request.

# 0.101.1 (2021-11-29)

[CKB v0.101.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.101.0) was released on Oct. 20th, 2021. This version of CKB node is now bundled and preconfigured in Neuron.

**The CKB v0.101.0 activates ckb2021 since epoch 3113 in the testnet. After that nodes running this version are incompatible with old versions. However, this version is still compatible with CKB v0.25.0 and above in the mainnet.**

### New feature

- Remove 100-char limitation from sending addresses.

# 0.101.0 (2021-10-27)

[CKB v0.101.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.101.0) was released on Oct. 20th, 2021. This version of CKB node is now bundled and preconfigured in Neuron.

**The CKB v0.101.0 activates ckb2021 since epoch 3113 in the testnet. After that nodes running this version are incompatible with old versions. However, this version is still compatible with CKB v0.25.0 and above in the mainnet.**

### New feature

- Upgrade the bundled CKB version and CKB-Indexer version.

### Bug fix

- Update the hint of synchronization and warning of `capacity not enough for change`.

# 0.100.2 (2021-10-15)

**This version is compatible with v0.100.0 and above.**

[CKB v0.100.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.100.0) was released on Sep. 22nd, 2021. This version of CKB node is now bundled and preconfigured in Neuron.

### New feature

- Add feature of destroy CKB Asset Account.

### Bug fixes

- Kill ckb/indexer before Neuron quit.
- Fix a cosmetic bug of address truncation in addresses book under higher resolution.
- Remove useless token id prompt when asset account type is `CKB Account`.

# 0.100.1 (2021-09-29)

[CKB v0.100.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.100.0) was released on Sep. 22nd, 2021. This version of CKB node is now bundled and preconfigured in Neuron.

**Please note that in order to adapt to the latest version of CKB, Neuron will resynchronize the data on the chain, and the whole synchronization may take a long time.**

### Hotfix

- Rename ckb-indexer data folder from `ckb-indexer` to `ckb_indexer_data`.
- [GHSA-33f9-j839-rf8h](https://github.com/advisories/GHSA-33f9-j839-rf8h): Upgrade immer to 9.0.6.

# 0.100.0 (2021-09-25)

[CKB v0.100.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.100.0) was released on Sep. 22nd, 2021. This version of CKB node is now bundled and preconfigured in Neuron.

**Please note that in order to adapt to the latest version of CKB, Neuron will resynchronize the data on the chain, and the whole synchronization may take a long time.**

### New features

- Upgrade ckb version to v0.100.0 and replace lumos with ckb indexer.
- Add more notifications about synchronization.

# 0.36.0 (2021-08-30)

[CKB v0.35.2](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.2) was released on Feb. 23rd, 2021. This version of CKB node is now bundled and preconfigured in Neuron.

### New feature

- Support sending and receiving NFT in the `Customized Assets`.

### Bug fixes

- Upgrade the bundled CKB node to v0.35.2.
- Add hint for `Token ID` field when creating a new sUDT account.

# 0.36.0-rc2 (2021-08-23)

This is a release candidate to preview the changes in the next official release and may not be stable. Welcome any questions or suggestions.

[CKB v0.35.2](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.2) was released on Feb. 23rd, 2021. This version of CKB node is now bundled and preconfigured in Neuron.

### New feature

- Support sending and receiving NFT in the `Customized Assets`.

### Bug fixes

- Upgrade the bundled CKB node to v0.35.2.
- Add hint for `Token ID` field when creating a new sUDT account.

# 0.36.0-rc1 (2021-08-13)

⚠️ **Yanked because of CI exception** ⚠️

This is a release candidate to preview the changes in the next official release and may not be stable. Welcome any questions or suggestions.

[CKB v0.35.2](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.2) was released on Feb. 23rd, 2021. This version of CKB node is now bundled and preconfigured in Neuron.

### New feature

- Support sending and receiving NFT in the `Customized Assets`.

### Bug fixes

- Upgrade the bundled CKB node to v0.35.2.
- Add hint for `Token ID` field when creating a new sUDT account.

# 0.35.1 (2021-08-10)

[CKB v0.35.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.1) was released on Sept. 14th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### Hot fix

- Disable timelock for hardware wallet transfer.

# 0.35.0 (2021-01-12)

[CKB v0.35.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.1) was released on Sept. 14th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

- Enable hardware wallet of Ledger. Please note that this is an **experimental** feature, please pay attention to the risk and use with caution.
- Support address verification on hardware wallet device.

### Bug fixes

- Fix problems in searching transactions by address or tx hash.

# 0.34.2 (2020-12-31)

[CKB v0.35.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.1) was released on Sept. 14th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### Hotfix

- Update the CKB logo.
- Rename the default network name to `Default`.
- Fix version updater error when clicking the install button too soon.
- Fix bug of `too many open files` error.

# 0.35.0-rc1 (2020-12-19)

This is a release candidate to preview the changes in the next official release and may not be stable. Welcome any questions or suggestions.

[CKB v0.35.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.1) was released on Sept. 14th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

- Enable hardware wallet of Ledger.
- Support address verification on hardware wallet device.

# 0.34.1 (2020-12-19)

[CKB v0.35.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.1) was released on Sept. 14th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### Hotfix

- Fix libudev-dev dependency for Ubuntu build.

# 0.34.0 (2020-12-16)

[CKB v0.35.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.1) was released on Sept. 14th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

- Support acp short address generation and parsing.
- Support transfer to PW lock full address.
- Support generating and signing offline transaction.
- Support broadcasting the signed offline transaction.
- Display network type in the navbar.
- Display progress and estimation for synchronization.
- Minor UX changes to `Asset Accounts`.

### Bug fix

- Ensure addresses have been cleaned up for the deleted wallets.

# 0.33.2 (2020-11-26)

[CKB v0.35.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.1) was released on Sept. 14th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### Hotfix

- Upgrade Asset Account script config.

### Bug fix

- Prevent Neuron from quitting when the main window is closed on MacOS.

# 0.34.0-rc1 (2020-11-21)

This is a release candidate to preview the changes in the next official release and may not be stable. Welcome any questions or suggestions.

[CKB v0.35.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.1) was released on Sept. 14th, 2020. This version of
CKB node is now bundled and preconfigured in Neuron.

### New features

- Support hardware wallet of Ledger.
- Support generating and signing offline transaction.
- Support broadcasting the signed offline transaction.
- Display network type in the navbar.
- Display progress and left time for sync.
- Minor UX changes to `Asset Accounts`.

# 0.33.1 (2020-11-16)

[CKB v0.35.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.1) was released on Sept. 14th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### Hotfix

- Includes the `hd_public_key_info` table info in debug log.
- Requires the **x64** version of vcredist component on Windows.

# 0.33.0 (2020-10-14)

[CKB v0.35.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.1) was released on Sept. 14th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

**Note:** There will be a data migration for the new bundled node [CKB v0.35.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.1), which may take several minutes to boot up for the first time after upgraded from the earlier versions.
**Attention:** The migration is not reversible. Please backup the data directory if you want to use old versions later.

### Refactor

- Upgrade from Electron 7 to Electron 9.
- Refactor the wallet address storage to be based on an SQLite table rather than a JSON file.
- Deprecate LevelDB and instead SQLite for persisting transaction descriptions.
- Refactor send component.
- Reduce the confirmation block height from 300 to 24.

### New features

- Enable `Asset Accounts` for mainnet.
- Support transfer to multisig address.

### Bug fixes

- Fixed `InsufficientCellCapacity` error for CKB ACP transfer when there are cells with data.
- Fixed `too many SQL variables` error when there are too many addresses in wallets.
- Fixed the autofill description on unlocking assets.
- Refine error message when the fee for dao withdrawal transaction is insufficient.

# 0.33.0-rc1 (2020-09-27)

This is a release candidate to preview the changes in the next official release and may not be stable. Welcome any questions or suggestions.

[CKB v0.35.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.1) was released on Sept. 14th, 2020. This version of
CKB node is now bundled and preconfigured in Neuron.

Note: There will be a data migration for the new bundled node [CKB v0.35.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.35.1), which may take several minutes to boot up for the first time after upgraded from the earlier versions.

### Refactor

- Upgrade from Electron 7 to Electron 9.
- Refactor the wallet address storage to be based on an SQLite table rather than a JSON file.
- Deprecate LevelDB and use SQLite instead.
- Refactor send component.

### New features

- Reduce the confirmation block height from 300 to 24.
- Enable `Asset Accounts` for mainnet.
- Support transfer to multisig address.

### Bug fixes

- Fixed `InsufficientCellCapacity` error for CKB ACP transfer when there are cells with data.
- Fixed `too many SQL variables` error when there are too many addresses in wallets.
- Fixed the autofill description on unlocking assets.
- Refine error message when the fee for dao withdrawal transaction is insufficient.

# 0.32.3 (2020-09-22)

[CKB v0.32.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.32.0) was released on May 22nd, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### Bug fixes

- Fix a bug of lumos query for multisign lock.

# 0.33.0-beta.1 (2020-09-12)

This is a beta version to preview the changes in the next release and may not be stable. It is not suggested to install this version for asset management. Welcome any questions or suggestions.

[CKB v0.32.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.32.0) was released on May 22nd, 2020. This version of
CKB node is now bundled and preconfigured in Neuron.

### Refactor

- Upgrade from Electron 7 to Electron 9.
- Refactor the wallet address storage to be based on an SQLite table rather than a JSON file.
- Deprecate LevelDB and use SQLite instead.
- Refactor send component.

### New features

- Change the confirmation count from 300 to 24.
- Enable `Asset Accounts` for mainnet.

### Bug fixes

- Fixed `InsufficientCellCapacity` error for CKB ACP transfer when there are cells with data.
- Fixed `too many SQL variables` error when there are too many addresses in wallets.

# 0.32.2 (2020-08-22)

[CKB v0.32.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.32.0) was released on May 22nd, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### Bug fixes

- Fix a breaking change by lumos indexer which leads to a bug that it can't make transfers from asset accounts.

# 0.32.1 (2020-08-10)

[CKB v0.32.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.32.0) was released on May 22nd, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### Bug fixes

- Upgrade bundled lumos indexer version to 0.7.4 to support connecting node via https.

# 0.32.0 (2020-07-31)

### Bundled CKB node

[CKB v0.32.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.32.0) was released on May 22nd, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

- Detect vcredist on Windows when user launches Neuron.
- Enable the button of exporting transaction history.
- Support two modes for clearing caches: Refresh cache / Fully rebuild index.
- UI tune for pop-up windows.
- Share token info across different wallets.
- Add a link of `Deposit rules` on `Nervos DAO` page.
- Remove the FAQ from menu and update docs link.
- Order the `Completed` DAO records by unlock time in desc.

### Syncing

It has adopted a brand new indexing mechanism, which can significantly speed up the cache indexing process. The caches will be rebuilt for the first time, but it should be much faster than the previous versions (up to 3-4x on macOS, Windows and Linux).

### Bug fixes

- Fixed minor bugs on `History` page.
- Fixed some Traditional Chinese words.

# 0.32.0-rc1 (2020-07-21)

This is an RC version to preview the changes in the next release.

### Bundled CKB node

[CKB v0.32.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.32.0) was released on May 22nd, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

- Detect vcredist on Windows when user launches Neuron.
- Enable the button of exporting transaction history.
- Support two modes for clearing caches: Refresh cache / Fully rebuild index.
- UI tune for pop-up windows.
- Share token info across different wallets.
- Add a link of `Deposit rules` on `Nervos DAO` page.
- Remove the FAQ from menu and update docs link.
- Order the `Completed` DAO records by unlock time in desc.

### Syncing

It has adopted a brand new indexing mechanism, which can significantly speed up the cache indexing process. The caches will be rebuilt for the first time, but it should be much faster than the previous versions (up to 3-4x on macOS, Windows and Linux).

### Bug fixes

- Fixed minor bugs on `History` page.
- Fixed some Traditional Chinese words.

# 0.32.0-beta.1 (2020-07-04)

This is a beta version to preview the changes in the next release and may not be stable. It is not suggested to install this version for asset management. Welcome any questions or suggestions.

### Bundled CKB node

[CKB v0.32.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.32.0) was released on May 22nd, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

- Detect vcredist on Windows when user launches Neuron.
- Enable the button of exporting transaction history.
- Support two modes for clearing caches: Refresh cache / Fully rebuild index.
- UI tune for pop-up windows.
- Share token info across different wallets.
- Add a link of `Deposit rules` on `Nervos DAO` page.

### Syncing

It has adopted a brand new indexing mechanism, which can significantly speed up the cache indexing process. The caches will be rebuilt for the first time, but it should be much faster than the previous versions (up to 3-4x on macOS, Windows and Linux).

### Bug fixes

- Fixed minor bugs on `History` page.
- Fixed some Traditional Chinese words.

# 0.31.0 (2020-06-15)

### Bundled CKB node

[CKB v0.32.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.32.0) was released on May 22nd, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

We added several new features with this version:

- New style of logo.
- Make the `Settings` window to be independent with new style.
- Add Language Switching function in `Settings` - `General` page.
- Export more bundled CKB logs for debug info.
- Include the bundled CKB version on the `About Neuron` window.
- Replace the `Expected speed` drop-down box with `Quick Pick Price` in `Advanced fee settings`.
- Add `Asset Account` feature for `Aggron Testnet` only.

### User Experience

We also make some improvements for better user expeierence:

- Optimize the `Copy` component, also remove unnecessary normal context menu (right-click menu).
- Display password error in password dialog.

# 0.31.0-rc2 (2020-06-08)

### Bundled CKB node

[CKB v0.32.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.32.0) was released on May 22nd, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

We added several new features with this version:

- New style of logo.
- Enable exporting transaction history.
- Make the `Settings` window to be independent with new style.
- Add Language Switching function in `Settings` - `General` page.
- Export more bundled CKB logs for debug info.
- Include the bundled CKB version on the `About Neuron` window.
- Replace the `Expected speed` drop-down box with `Quick Pick Price` in `Advanced fee settings`.
- Add `Asset Account` feature for `Aggron Testnet` only.

### User Experience

We also make some improvements for better user expeierence:

- Optimize the `Copy` component, also remove unnecessary normal context menu (right-click menu).
- Display password error in password dialog.

# 0.31.0-rc1 (2020-05-29)

### Bundled CKB node

[CKB v0.32.0](https://github.com/nervosnetwork/ckb/releases/tag/v0.32.0) was released on May 22nd, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

We added several new features with this version:

- New style of logo.
- Enable exporting transaction history.
- Make the `Settings` window to be independent with new style.
- Add Language Switching function in `Settings` - `General` page.
- Export more bundled CKB logs for debug info.
- Include the bundled CKB version on the `About Neuron` window.
- Replace the `Expected speed` drop-down box with `Quick Pick Price` in `Advanced fee settings`.

### User Experience

We also make some improvements for better user expeierence:

- Optimize the `Copy` component, also remove unnecessary normal context menu (right-click menu).
- Display password error in password dialog.

# 0.30.0 (2020-05-15)

### Bundled CKB node

[CKB v0.31.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.31.1) was released on Apr 24th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.
[CKB v0.31.1](https://github.com/nervosnetwork/ckb/releases/tag/v0.31.1) includes a performance enhancement patch. It may speed up Neuron sync speed.

### New features

We added several new features with this version:

- Bypass password verification when deleting/exporting watch only wallet.
- Skip rescan when importing existing wallet.
- New style of DAO page.
- Remove Settings from the left side bar, which can be found from menu (Windows - Help, Mac - Preferences).
- Add an Experimental divider on the left side bar.

### Bug fixes

- Optimized the status warning message when launch.
- Added operation system info in the Debug info.

# 0.30.0-rc2 (2020-04-29)

This is an RC version to preview the changes in the next release.

### Bundled CKB node

CKB v0.31.1 was released on Apr 24th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.
CKB v0.31.1 includes a performance enhancement patch. It may speed up Neuron sync speed.

### New features

We added several new features with this version:

- Bypass password verification when deleting/exporting watch only wallet.
- Skip rescan when importing existing wallet.
- New style of DAO page.
- Remove Settings from the left side bar, which can be found from menu (Windows - Help, Mac - Preferences).
- Add an Experimental divider on the left side bar.

### Bug fixes

- Optimized the status warning message when launch.
- Added operation system info in the Debug info.

# 0.29.0 (2020-03-31)

### Bundled CKB node

CKB v0.29.0 was released on Feb 26th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

We added several new features with this version:

- Sign/Verify message: Sign a message with an address and its private key, or verify a signed message with an address and its public key.
- Customized assets: List customized assets that have non-standard cells, e.g. cells with locktime. Holders with locked assets from the genesis block would be able to view them now.
- Transaction with locktime: Send a transaction that could only be released after the locktime.
- Synced block number: Hover over the sync status area on the left bottom and check the CKB tip block number and Neuron synced block number, to see the process of the syncing.

### Performance tweak

Thanks to the community we have found and fixed a serious performance issue. Miner wallets usually receive transactions with huge amount of inputs. When syncing this kind of wallets Neuron became very slow and unresponsive, and couldn't calculate the balance correctly. With this release we've tweaked the sync process, making it run faster and handle transactions with many inputs/outputs properly.

### Electron

We updated Electron to 7.1.14.

### Bug fixes

- Fixed serveral syncing issues causing incorrect balance.
- Fixed a bug that when clearing cache transaction description would be lost.

# 0.29.0-rc3 (2020-03-24)

This is an RC version to preview the changes in the next release.

### Bundled CKB node

CKB v0.29.0 was released on Feb 26th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

We added several new features with this version:

- Sign/Verify message: Sign a message with an address and its private key, or verify a signed message with an address and its public key.
- Customized assets: List customized assets that have non-standard cells, e.g. cells with locktime. Holders with locked assets from the genesis block would be able to view them now.
- Transaction with locktime: Send a transaction that could only be released after the locktime.
- Synced block number: Hover over the sync status area on the left bottom and check the CKB tip block number and Neuron synced block number, to see the process of the syncing.

### Performance tweak

Thanks to the community we have found and fixed a serious performance issue. Miner wallets usually receive transactions with huge amount of inputs. When syncing this kind of wallets Neuron became very slow and unresponsive, and couldn't calculate the balance correctly. With this release we've tweaked the sync process, making it run faster and handle transactions with many inputs/outputs properly.

### Bug fixes

- Fixed serveral syncing issues causing incorrect balance.
- Fixed a bug that when clearing cache transaction description would be lost.

# 0.29.0-rc2 (2020-03-10)

This is an RC version to preview the changes in the next release.

### Bundled CKB node

CKB v0.29.0 was released on Feb 26th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

We added several new features with this version:

- Sign/Verify message: Sign a message with an address and its private key, or verify a signed message with an address and its public key.
- Customized assets: List customized assets that have non-standard cells, e.g. cells with locktime. Holders with locked assets from the genesis block would be able to view them now.
- Transaction with locktime: Send a transaction that could only be released after the locktime.

### Performance tweak

Thanks to the community we have found and fixed a serious performance issue. Miner wallets usually receive transactions with huge amount of inputs. When syncing this kind of wallets Neuron became very slow and unresponsive, and couldn't calculate the balance correctly. With this release we've tweaked the sync process, making it run faster and handle transactions with many inputs/outputs properly.

# 0.29.0-rc1 (2020-03-02)

This is an RC version to preview the changes in the next release.

### Bundled CKB node

CKB v0.29.0 was released on Feb 26th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### New features

We added several new features with this version:

- Sign/Verify message: Sign a message with an address and its private key, or verify a signed message with an address and its public key.
- Customized assets: List customized assets that have non-standard cells, e.g. cells with locktime.
- Transaction with locktime: Send a transaction that could only be released after the locktime.

### Performance tweak

Thanks to the community we have found and fixed a serious performance issue. Miner wallets usually receive transactions with huge amount of inputs. When syncing this kind of wallets Neuron became very slow and unresponsive, and couldn't calculate the balance correctly. With this release we've tweaked the sync process, making it run faster and handle transactions with many inputs/outputs properly.

# 0.28.0 (2020-02-13)

### Bundled CKB node

CKB v0.28.0 was released on Feb 4th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### Full Payload Format address

Full Payload Format (long) address support is ready with this release. For those of you who are curious about what long address is, let's see an example:

Before this release, Neuron only supported Short Payload Format (short) address, e.g., `ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v`.

From this release, Neuron will support Full Payload Format (long) address as well, e.g., `ckb1qjda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xw3vumhs9nvu786dj9p0q5elx66t24n3kxgj53qks`.

### Extended public key

We've added a new feature to export and import extended public key for a wallet. A wallet imported by extended public key runs in watch only mode. It can sync, show balance and transaction histories as a regular wallet, but it cannot sign and send transaction.

Please note that for this release we didn't implement any UI limitations to wallet imported by extended public key. This means you could still try to send transaction from it; but when you do so, it would fail when verifying your wallet password.

### Electron

We updated Electron to 7.1.11.

# [0.27.0](https://github.com/nervosnetwork/neuron/compare/v0.26.3...v0.27.0) (2020-01-23)

Happy Spring Festival!

### Bundled CKB node

CKB v0.27.0 was released on Jan 10th, 2020. This version of CKB node is now bundled and preconfigured in Neuron.

### Electron

We updated to Electron 7.1.9, which has fixed a bug that would cause updater to fail to download new version of Neuron.

So far Electron 7's asynchronous request/response-style IPC has been working very well, we are going to migrate more internal communications to use that.

### Syncing

We've improved the sync and block scan, making it more stable and faster (up to 2x on macOS and 3-4x on Windows). Block and other data's DB access was tweaked to write less frequently and read more quickly. We're still tweaking this and planning to enable CKB's indexer module in the near future, to make the sync a lot faster.

### Other features and changes

- Prevent multiple instances of Neuron from running at the same time.
- Change the QR reader to read an image from the desktop, instead of scanning with the camera.
- Update the network and sync status display to show more information.

### Bug fixes

- Fixed an issue that when a transaction has many inputs or outputs the wallet cannot load it and the UI would display empty history list.
- Fixed an issue that could occur when sending transaction.

# [0.26.3](https://github.com/nervosnetwork/neuron/compare/v0.26.0...v0.26.3) (2020-01-07)

Happy New Year and welcome to the v0.26.3 release of Neuron!

### New look and feel

Neuron has a new look and feel that we hope you will like. We're still designing and tweaking many of the UI parts so please stay tuned as there're more to come in future releases.

### Bundled CKB node

CKB v0.26.1 was released on Dec 30th, 2019. This version of CKB node is now bundled and preconfigured in Neuron.

### Nervos DAO

There're many improvements for Nervos DAO feature, some of the key changes include:

- Allow depositing all balance to Nervos DAO. When the user does so, show hint to remind them to reserve some CKB for withdraw operation.
- Added the Current Compensation Period dialog showing explanation of epochs period.
- Label Nervos DAO transactions in recent activities.

### Electron 7

We updated to Electron 7 in this release. Electron 7 added `ipcRenderer.invoke()` and `ipcMain.handle()` for asynchronous request/response-style IPC, which are recommended over the `remote` module. To take advantage of that, we refactored data flow between wallet core and UI layers, replacing `remote` usage with `ipcRenderer.invoke()` and `ipcMain.handle()`.

### Bug fixes

- Fixed a lot of bugs related to block syncing.
- Fixed minor bugs with Nervos DAO feature.
- Fixed an issue that transaction detail window shows blank content.
- Fixed a bug that allows transaction fee price to be set as non-integer number.

# [0.26.0](https://github.com/nervosnetwork/neuron/compare/v0.25.2...v0.26.0) (2019-12-06)

### Bundled CKB node

It's painful to download, configure and run a CKB node when setting up the Neuron wallet. We understand that. Version 0.26.0 comes with a bundled CKB node, preconfigured to connect to Nervos CKB Mainnet Lina. Just open Neuron and it will start the bundled node and sync with that.

If you prefer to run your own node you can still do that. Start your node before launching the Neuron wallet, then Neuron will connect to your node instead of the bundled one.

Note that your operating system or firewall might ask you for permission to run the bundle node. Please allow that when prompted.

### Improved Nervos DAO UI and flow

We added a feature to allow you to deposit all of your unused balance into the Nervos DAO. Simply drag the deposit amount slider to the right and Neuron will calculate the amount and fee for you.

With the updated formula of DAO compensation rate, the Nervos DAO view now displays more precise information.

### UI for checking updates

We've introduced UI for checking and downloading updates. You can find this on `Settings(Preferences) - General` view. It's now more convenient to see when there's a new version available to install.

### Bug fixes

We fixed several bugs related to block syncing and balance calculations. Now, balance of Overall and locked/free Nervos DAO should display correctly.

We also addressed several other bugs to make the Neuron wallet more stable.

## [0.25.2](https://github.com/nervosnetwork/neuron/compare/v0.25.1...v0.25.2) (2019-11-29)

### Bug Fixes

- also clean lock/dao info in renderer process ([a0b2470](https://github.com/nervosnetwork/neuron/commit/a0b2470))
- Fix the problem that balance not right if switch network from default network ([0f763a5](https://github.com/nervosnetwork/neuron/commit/0f763a5))
- remove bufferTime for address created event ([9b0a077](https://github.com/nervosnetwork/neuron/commit/9b0a077))
- the missing txs ([ed557b6](https://github.com/nervosnetwork/neuron/commit/ed557b6))
- **neuron-ui:** remove www from docs.nervos.org ([3fc8154](https://github.com/nervosnetwork/neuron/commit/3fc8154))
- balance not update after sent tx ([65e51dd](https://github.com/nervosnetwork/neuron/commit/65e51dd))
- **neuron-ui:** show 0 if withdraw rpc returns errors ([b714376](https://github.com/nervosnetwork/neuron/commit/b714376))
- clean lock utils info and dao utils info when switch network ([60ec486](https://github.com/nervosnetwork/neuron/commit/60ec486))
- initialize NetworksService in renderer process ([73f1bf0](https://github.com/nervosnetwork/neuron/commit/73f1bf0))
- network switch event broadcast twice ([f1b0f72](https://github.com/nervosnetwork/neuron/commit/f1b0f72))
- pending in windows when network off ([67dcb79](https://github.com/nervosnetwork/neuron/commit/67dcb79))
- sign witnesses test ([5000edd](https://github.com/nervosnetwork/neuron/commit/5000edd))

### Features

- **neuron-ui:** update the url to nervos dao rfc ([6b68ab6](https://github.com/nervosnetwork/neuron/commit/6b68ab6))
- Add API for downloading and installing updates ([b8d24ca](https://github.com/nervosnetwork/neuron/commit/b8d24ca))
- Add app updater subject and state ([423109d](https://github.com/nervosnetwork/neuron/commit/423109d))
- Adding check update to settings view ([98fe06c](https://github.com/nervosnetwork/neuron/commit/98fe06c))
- Connect updater events to UI ([b267321](https://github.com/nervosnetwork/neuron/commit/b267321))
- Delete unused updater translations ([bcafce8](https://github.com/nervosnetwork/neuron/commit/bcafce8))
- Different stage status of checking updates ([cd82ca4](https://github.com/nervosnetwork/neuron/commit/cd82ca4))
- Polish updater i18n translations and UI ([af45f0c](https://github.com/nervosnetwork/neuron/commit/af45f0c))
- Show release notes when there's update available ([8cf9581](https://github.com/nervosnetwork/neuron/commit/8cf9581))
- Trigger check updates menu item enabling/disabling ([cd8e5d5](https://github.com/nervosnetwork/neuron/commit/cd8e5d5))
- **neuron-ui:** add copy address and copy tx hash context menus on the tx detail view. ([7d86454](https://github.com/nervosnetwork/neuron/commit/7d86454))

## [0.25.1](https://github.com/nervosnetwork/neuron/compare/v0.25.0...v0.25.1) (2019-11-18)

### Bug Fixes

- Genesis block should be scanned when next scan range ([6947864](https://github.com/nervosnetwork/neuron/commit/6947864)), closes [#1](https://github.com/nervosnetwork/neuron/issues/1)
- set restart start number to -1 ([06b030e](https://github.com/nervosnetwork/neuron/commit/06b030e))
- sync when start node ([219d99c](https://github.com/nervosnetwork/neuron/commit/219d99c))
- **neuron-ui:** remove /s from difficulty units ([2a45e63](https://github.com/nervosnetwork/neuron/commit/2a45e63))

### Features

- Add a clear cache button on general settings view ([429be9c](https://github.com/nervosnetwork/neuron/commit/429be9c))
- Add description for clear cache feature ([38aa4c4](https://github.com/nervosnetwork/neuron/commit/38aa4c4))
- Delete cell db files when clearing cache ([83ff29d](https://github.com/nervosnetwork/neuron/commit/83ff29d))
- Do not update network info too often ([819793a](https://github.com/nervosnetwork/neuron/commit/819793a))
- Only update network's genesis hash and chain when they're actually fetched from RPC and valid ([507131b](https://github.com/nervosnetwork/neuron/commit/507131b))
- Show popup message when clearing cache finishes ([7dfe670](https://github.com/nervosnetwork/neuron/commit/7dfe670))
- start/stop syncing with sync controller ([afde49d](https://github.com/nervosnetwork/neuron/commit/afde49d))
- **neuron-ui:** add clear cache button on the general settings ([7419d37](https://github.com/nervosnetwork/neuron/commit/7419d37))
- **neuron-ui:** update the i18n texts of nervos dao. ([b445a0c](https://github.com/nervosnetwork/neuron/commit/b445a0c))
- **neuron-ui:** update the pagination style ([646cf8f](https://github.com/nervosnetwork/neuron/commit/646cf8f))

# [0.25.0](https://github.com/nervosnetwork/neuron/compare/v0.24.5...v0.25.0) (2019-11-16)

### Bug Fixes

- capacity null when calculate bytes ([97ee2a1](https://github.com/nervosnetwork/neuron/commit/97ee2a1))
- update tx and its outputs in different sqls ([b8fe366](https://github.com/nervosnetwork/neuron/commit/b8fe366))
- **neuron:** use deposit timestamp to calculate phase2 dao cell apc ([abdab3f](https://github.com/nervosnetwork/neuron/commit/abdab3f))
- **neuron-ui:** cache the genesis block timestamp in the nervos dao component instead of in global ([5274edd](https://github.com/nervosnetwork/neuron/commit/5274edd))
- **neuron-ui:** fix the missing field in error message. ([a7dc73b](https://github.com/nervosnetwork/neuron/commit/a7dc73b))
- **neuron-ui:** fix the missing of password request dialog ([19d07bd](https://github.com/nervosnetwork/neuron/commit/19d07bd))
- **neuron-ui:** fix the missing word in i18n ([952ae72](https://github.com/nervosnetwork/neuron/commit/952ae72))
- **neuron-ui:** hide the countdown if the current epoch number is greater than the target epoch number. ([2cded1c](https://github.com/nervosnetwork/neuron/commit/2cded1c))
- add typeHash when generate dao tx ([ce5e264](https://github.com/nervosnetwork/neuron/commit/ce5e264))
- **neuron-ui:** remove sort of dao cells ([e501072](https://github.com/nervosnetwork/neuron/commit/e501072))
- next address order ([fffd2f0](https://github.com/nervosnetwork/neuron/commit/fffd2f0))

### Features

- Always load genesis hash and chain info when ([761a4a8](https://github.com/nervosnetwork/neuron/commit/761a4a8))
- ChainInfo delegates Networks Service to get current chain ([0673343](https://github.com/nervosnetwork/neuron/commit/0673343))
- If genesis hash doesn't match do not proceed to sync ([bd8e4e4](https://github.com/nervosnetwork/neuron/commit/bd8e4e4))
- Remove ChainInfo moving its feature into NetworksService ([81f1eff](https://github.com/nervosnetwork/neuron/commit/81f1eff))
- **neuron-ui:** add a guide bubble in connection status ([59f2dd5](https://github.com/nervosnetwork/neuron/commit/59f2dd5))
- **neuron-ui:** add a guide link to run a ckb mainnet node. ([89aa04c](https://github.com/nervosnetwork/neuron/commit/89aa04c))
- **neuron-ui:** add difficulty formatter ([#1105](https://github.com/nervosnetwork/neuron/issues/1105)) ([98ba68d](https://github.com/nervosnetwork/neuron/commit/98ba68d))
- **neuron-ui:** add hint for synchronization not started. ([7d0cc67](https://github.com/nervosnetwork/neuron/commit/7d0cc67))
- **neuron-ui:** hide the general settings and redirect to wallets setting ([b3e3d0e](https://github.com/nervosnetwork/neuron/commit/b3e3d0e))
- **neuron-ui:** limit the times of guide bubble to 3 ([9b85589](https://github.com/nervosnetwork/neuron/commit/9b85589))
- **neuron-ui:** update chain types on launch ([2cb5047](https://github.com/nervosnetwork/neuron/commit/2cb5047))
- **neuron-ui:** update the hint of withdraw dialog ([0bec01e](https://github.com/nervosnetwork/neuron/commit/0bec01e))
- **neuron-ui:** update the warning in withdraw dialog. ([e819439](https://github.com/nervosnetwork/neuron/commit/e819439))
- add depositTimestamp ([108d5b1](https://github.com/nervosnetwork/neuron/commit/108d5b1))
- Do not allow importing keystore from cli ([1b66ea3](https://github.com/nervosnetwork/neuron/commit/1b66ea3))
- If chain info couldn't be fetched set as ckb_dev ([17c1715](https://github.com/nervosnetwork/neuron/commit/17c1715))
- Let addresses regeneration happen before sync task starts ([a52a531](https://github.com/nervosnetwork/neuron/commit/a52a531))
- Prefer network's chain and genesis hash when syncing ([9b5b52c](https://github.com/nervosnetwork/neuron/commit/9b5b52c))
- Preset mainnet network configuration ([1979e8a](https://github.com/nervosnetwork/neuron/commit/1979e8a))
- Set current wallet to null if it's undefined ([6c7117f](https://github.com/nervosnetwork/neuron/commit/6c7117f))
- Update all networks' chain and genesis hash when NetworkService ([a3ccf2d](https://github.com/nervosnetwork/neuron/commit/a3ccf2d))
- **neuron-ui:** use calculateGlobalAPC to update Nervos DAO APC ([e96ca61](https://github.com/nervosnetwork/neuron/commit/e96ca61))
- verify address according to chain type ([2026921](https://github.com/nervosnetwork/neuron/commit/2026921))

## [0.24.5](https://github.com/nervosnetwork/neuron/compare/v0.24.4...v0.24.5) (2019-11-14)

### Bug Fixes

- **neuron-ui:** add decimal validation on deposit value ([#1093](https://github.com/nervosnetwork/neuron/issues/1093)) ([61eab4f](https://github.com/nervosnetwork/neuron/commit/61eab4f))
- current block number should be -1 if not start ([543cdd0](https://github.com/nervosnetwork/neuron/commit/543cdd0))
- dao i18n ([4f41d9d](https://github.com/nervosnetwork/neuron/commit/4f41d9d))

### Features

- **neuron-ui:** add an alert when past epochs are less than 5 ([15d0cc8](https://github.com/nervosnetwork/neuron/commit/15d0cc8))
- **neuron-ui:** add border color on dao records ([96b4ef6](https://github.com/nervosnetwork/neuron/commit/96b4ef6))
- **neuron-ui:** rename APY to APC ([c337a21](https://github.com/nervosnetwork/neuron/commit/c337a21))
- **neuron-ui:** rename interest to compensation ([e6d6060](https://github.com/nervosnetwork/neuron/commit/e6d6060))
- Regenerate addresses if necessary on launch ([9988a13](https://github.com/nervosnetwork/neuron/commit/9988a13))
- **neuron-ui:** add content in deposit notice ([dd0c7dc](https://github.com/nervosnetwork/neuron/commit/dd0c7dc))
- **neuron-ui:** add global apy estimation ([#1092](https://github.com/nervosnetwork/neuron/issues/1092)) ([dc82cbb](https://github.com/nervosnetwork/neuron/commit/dc82cbb))
- **neuron-ui:** add more translation of nervos dao ([3c62598](https://github.com/nervosnetwork/neuron/commit/3c62598))
- **neuron-ui:** adjust the order of dao records ([e8398b6](https://github.com/nervosnetwork/neuron/commit/e8398b6))
- **neuron-ui:** remove the user-confirmation from phase2 of nervos dao ([7e9e9e3](https://github.com/nervosnetwork/neuron/commit/7e9e9e3))
- **neuron-ui:** rename deposit record to deposit receipt ([4c587a8](https://github.com/nervosnetwork/neuron/commit/4c587a8))
- **neuron-ui:** use the same style of activity record on deposit record. ([99f77aa](https://github.com/nervosnetwork/neuron/commit/99f77aa))
- Remove address sqlite db ([6f95340](https://github.com/nervosnetwork/neuron/commit/6f95340))
- Send address db changed event when address store ([617a9a3](https://github.com/nervosnetwork/neuron/commit/617a9a3))
- **neuron-ui:** remove redundant error messages ([c67aa36](https://github.com/nervosnetwork/neuron/commit/c67aa36))
- **neuron-ui:** update the info and message of nervos dao ([cd44e43](https://github.com/nervosnetwork/neuron/commit/cd44e43))
- **neuron-ui:** use the same style of overview on nervos dao overview ([20bbf33](https://github.com/nervosnetwork/neuron/commit/20bbf33))

## [0.24.4](https://github.com/nervosnetwork/neuron/compare/v0.24.3...v0.24.4) (2019-11-12)

### Bug Fixes

- **neuron-ui:** fix the apy calculation ([03c88d2](https://github.com/nervosnetwork/neuron/commit/03c88d2))
- **neuron-ui:** fix the free and locked value of nervos dao ([16b2233](https://github.com/nervosnetwork/neuron/commit/16b2233))
- **neuron-ui:** fix the minimal withdraw epoch number ([1c19582](https://github.com/nervosnetwork/neuron/commit/1c19582))
- **neuron-ui:** fix the yield of nervos dao records ([544becd](https://github.com/nervosnetwork/neuron/commit/544becd))
- **neuron-ui:** including keywords on tx list paging ([935950d](https://github.com/nervosnetwork/neuron/commit/935950d))
- calculate tx serialized size for dao ([2088d5c](https://github.com/nervosnetwork/neuron/commit/2088d5c))
- calculateDaoMaximumWithdraw return type ([22ee960](https://github.com/nervosnetwork/neuron/commit/22ee960))
- deposit dao and withdraw step1 error ([77a505d](https://github.com/nervosnetwork/neuron/commit/77a505d))
- fix getDaoCells return ([c914dff](https://github.com/nervosnetwork/neuron/commit/c914dff))
- fix withdraw dao bug ([9b1c0ed](https://github.com/nervosnetwork/neuron/commit/9b1c0ed))
- getDaoCells and its tests ([2460b0b](https://github.com/nervosnetwork/neuron/commit/2460b0b))
- getDaoCells load dao cells except dead ([d5ba396](https://github.com/nervosnetwork/neuron/commit/d5ba396))
- load init txs in windows ([8880d34](https://github.com/nervosnetwork/neuron/commit/8880d34))
- mark depositOutPoint when create step1 ([85a851b](https://github.com/nervosnetwork/neuron/commit/85a851b))

### Features

- add dao methods to controller ([41953bf](https://github.com/nervosnetwork/neuron/commit/41953bf))
- add inputIndex to inputs ([c760db5](https://github.com/nervosnetwork/neuron/commit/c760db5))
- add typeHash and daoData to Output ([5efe225](https://github.com/nervosnetwork/neuron/commit/5efe225))
- add typeHash and daoData when sync ([1b6b062](https://github.com/nervosnetwork/neuron/commit/1b6b062))
- generate dao transactions ([36ba523](https://github.com/nervosnetwork/neuron/commit/36ba523))
- remove SkipDataAndType module ([1bc25eb](https://github.com/nervosnetwork/neuron/commit/1bc25eb))
- remove totalBalance ([5b0df6f](https://github.com/nervosnetwork/neuron/commit/5b0df6f))
- Shorter binary file names ([337790d](https://github.com/nervosnetwork/neuron/commit/337790d))
- **neuron-ui:** add nervos dao view ([ca46665](https://github.com/nervosnetwork/neuron/commit/ca46665))
- **neuron-ui:** allow user to claim since unlock epoch. ([f1ad76b](https://github.com/nervosnetwork/neuron/commit/f1ad76b))
- **neuron-ui:** update i18n of nervos dao ([3b72042](https://github.com/nervosnetwork/neuron/commit/3b72042))

## [0.24.3](https://github.com/nervosnetwork/neuron/compare/v0.24.2...v0.24.3) (2019-11-11)

### Bug Fixes

- **neuron-ui:** fix the address prefix on tx view according to the chain type. ([ffedca7](https://github.com/nervosnetwork/neuron/commit/ffedca7))
- **neuron-wallet:** order inputs in a tx ([b0e3855](https://github.com/nervosnetwork/neuron/commit/b0e3855))
- I18n for pending confirmations count ([2990891](https://github.com/nervosnetwork/neuron/commit/2990891))
- input capacity can be null ([2d80fa8](https://github.com/nervosnetwork/neuron/commit/2d80fa8))

### Features

- **neuron-ui:** remove input truncation on importing keystore. ([#1068](https://github.com/nervosnetwork/neuron/issues/1068)) ([2d6283d](https://github.com/nervosnetwork/neuron/commit/2d6283d))
- **neuron-ui:** show local error message ahead of remote error message ([21fd5b1](https://github.com/nervosnetwork/neuron/commit/21fd5b1))
- **neuron-ui:** show the error message from api controller on send view. ([7bf6dbc](https://github.com/nervosnetwork/neuron/commit/7bf6dbc))
- **neuron-wallet:** trim the keywords on searching txs ([8ed5501](https://github.com/nervosnetwork/neuron/commit/8ed5501))
- strengthen address validation ([1bc213a](https://github.com/nervosnetwork/neuron/commit/1bc213a))
- **neuron-ui:** update the explorer url according to chain type. ([67aceb8](https://github.com/nervosnetwork/neuron/commit/67aceb8))
- Finalize testnet explorer URL ([848fe7b](https://github.com/nervosnetwork/neuron/commit/848fe7b))
- **neuron-ui:** adjust the layout of receive view to vertical aglinment. ([8d58abc](https://github.com/nervosnetwork/neuron/commit/8d58abc))
- **neuron-ui:** only addresses start with 0x0100 are valid ([67be688](https://github.com/nervosnetwork/neuron/commit/67be688))

## [0.24.2](https://github.com/nervosnetwork/neuron/compare/v0.24.1...v0.24.2) (2019-11-08)

### Bug Fixes

- replace with empty string in input group rename witness ([5d59f3d](https://github.com/nervosnetwork/neuron/commit/5d59f3d))
- skip get previous tx when cellbase ([41600ea](https://github.com/nervosnetwork/neuron/commit/41600ea))
- skip get previous tx when cellbase in indexer ([7e8a578](https://github.com/nervosnetwork/neuron/commit/7e8a578))
- skip the cellbase tx, not the first input ([aeeb464](https://github.com/nervosnetwork/neuron/commit/aeeb464))

### Features

- Disable search history by amount ([9bdece6](https://github.com/nervosnetwork/neuron/commit/9bdece6))
- remove skip data and type toggle ([879d227](https://github.com/nervosnetwork/neuron/commit/879d227))

## [0.24.1](https://github.com/nervosnetwork/neuron/compare/v0.24.0...v0.24.1) (2019-11-07)

### Features

- Create a ruby script to download a release binaries ([acfa6e9](https://github.com/nervosnetwork/neuron/commit/acfa6e9))
- Use system curl and sha256sum commands to digest binaries ([0fa0dd8](https://github.com/nervosnetwork/neuron/commit/0fa0dd8))

# [0.24.0](https://github.com/nervosnetwork/neuron/compare/v0.23.1...v0.24.0) (2019-11-04)

### Bug Fixes

- sign witness result in test ([92dbaa2](https://github.com/nervosnetwork/neuron/commit/92dbaa2))
- **neuron-ui:** remove length limitation of password, but should the alert instead ([f25c8fd](https://github.com/nervosnetwork/neuron/commit/f25c8fd))
- Search history by date ([6df490a](https://github.com/nervosnetwork/neuron/commit/6df490a))
- **neuron-ui:** hide the colon if description is empty ([3af1ec4](https://github.com/nervosnetwork/neuron/commit/3af1ec4))
- **neuron-ui:** hide the confirmations of pending txs ([456210d](https://github.com/nervosnetwork/neuron/commit/456210d))
- **neuron-ui:** hide the pending list if it has no items. ([19d857e](https://github.com/nervosnetwork/neuron/commit/19d857e))

### Features

- Always show address book ([940e23a](https://github.com/nervosnetwork/neuron/commit/940e23a))
- Change confirmation threshold to 30 ([1dabb3c](https://github.com/nervosnetwork/neuron/commit/1dabb3c))
- Change the way pending confirmations display on overview ([f5cad48](https://github.com/nervosnetwork/neuron/commit/f5cad48))
- Move explorer URL determination to ChainInfo ([83c69c7](https://github.com/nervosnetwork/neuron/commit/83c69c7))
- Remove miner info feature ([4dcdad4](https://github.com/nervosnetwork/neuron/commit/4dcdad4))
- **neuron-ui:** clear send view on wallet switching ([47af746](https://github.com/nervosnetwork/neuron/commit/47af746))
- **neuron-ui:** disable the submit button if the generated tx is null ([be45889](https://github.com/nervosnetwork/neuron/commit/be45889))
- **neuron-ui:** use tooltip component instead of element title to display the sync progress. ([6780d45](https://github.com/nervosnetwork/neuron/commit/6780d45))

### Performance Improvements

- cache getTransaction result when sync in indexer mode ([756bd30](https://github.com/nervosnetwork/neuron/commit/756bd30))

## [0.23.1](https://github.com/nervosnetwork/neuron/compare/v0.23.0...v0.23.1) (2019-10-28)

### Bug Fixes

- break => continue ([05ae69e](https://github.com/nervosnetwork/neuron/commit/05ae69e))
- return => break ([97b8ea4](https://github.com/nervosnetwork/neuron/commit/97b8ea4))

### Features

- Add a few db indices ([83dffb5](https://github.com/nervosnetwork/neuron/commit/83dffb5))
- display disconnection errors and dismiss them on getting connec… ([#1019](https://github.com/nervosnetwork/neuron/issues/1019)) ([e866c66](https://github.com/nervosnetwork/neuron/commit/e866c66))
- Optimize output db query ([6e36550](https://github.com/nervosnetwork/neuron/commit/6e36550))
- stringify the result from api controller ([1f4d4ea](https://github.com/nervosnetwork/neuron/commit/1f4d4ea))
- **neuron-ui:** add a tooltip to display synchronized block number and the tip block number ([9e52fef](https://github.com/nervosnetwork/neuron/commit/9e52fef))
- **neuron-ui:** display confirmations of pending transactions in the recent activity list ([9aebede](https://github.com/nervosnetwork/neuron/commit/9aebede))
- **neuron-ui:** update history list to make it more compact ([35d8b87](https://github.com/nervosnetwork/neuron/commit/35d8b87))
- **neuron-ui:** update the Send View according to the new transaction fee model. ([dc415f3](https://github.com/nervosnetwork/neuron/commit/dc415f3))

# [0.23.0](https://github.com/nervosnetwork/neuron/compare/v0.22.2...v0.23.0) (2019-10-23)

### Bug Fixes

- api controller params ([c345d06](https://github.com/nervosnetwork/neuron/commit/c345d0658285cda84f60b6af12cc3d5f08c64cf9))
- fix codeHashOrCodeHashIndex in UI ([bf396e5](https://github.com/nervosnetwork/neuron/commit/bf396e538c71b358b1d94d58474e2b55a173a74c))
- Integration tests ([14008f6](https://github.com/nervosnetwork/neuron/commit/14008f6afa2f71ccfb3426b04787bf5ce9fa443b))
- set previous url when set system script ([7753c4f](https://github.com/nervosnetwork/neuron/commit/7753c4fc2bb479e885d48357c4a7e88f4cfe83b5))

### Features

- Add ApiController ([7a00d33](https://github.com/nervosnetwork/neuron/commit/7a00d33c5e269d8f974176c3c4f6b9c26710c816))
- Disable certain menu items when main windows is not current focus window ([eecfa41](https://github.com/nervosnetwork/neuron/commit/eecfa412c7119661741e4a2a8f318cde5a617b44))
- Expose a flat API controller from neuron wallet to UI layer ([500c37c](https://github.com/nervosnetwork/neuron/commit/500c37cd37fa9563e6db818a58e357be21a28d96))
- Localize nervos website menu item ([02be3af](https://github.com/nervosnetwork/neuron/commit/02be3af7f48fa16a490aba9cace062d0fbe3d66d))
- Set window menu role ([51e6a38](https://github.com/nervosnetwork/neuron/commit/51e6a38c87825677c89cc2f6bdfa919eac6ea579))
- slipt sendCapacity to generateTx and sendTx ([f956088](https://github.com/nervosnetwork/neuron/commit/f95608819fe7f2f9a72469c04cc097a072a6de64))
- Softer activity row shadow ([13445e7](https://github.com/nervosnetwork/neuron/commit/13445e7d926fc4128aaa47a0f453f60c752a8994))
- **neuron-ui:** ignore the NodeDisconnected Errors from controller, … ([#996](https://github.com/nervosnetwork/neuron/issues/996)) ([248c8ed](https://github.com/nervosnetwork/neuron/commit/248c8ed60956ea7f9edfb4d18566eec0be79f344))

## [0.22.2](https://github.com/nervosnetwork/neuron/compare/v0.22.1...v0.22.2) (2019-10-16)

### Bug Fixes

- **neuron-ui:** fix the label of skip-data toggle ([dafcb3e](https://github.com/nervosnetwork/neuron/commit/dafcb3e))
- **neuron-ui:** set current wallet to empty when all wallets are deleted ([f146e34](https://github.com/nervosnetwork/neuron/commit/f146e34))

### Features

- Load icon for BrowserWindow to show it on linux launcher ([7ce28b6](https://github.com/nervosnetwork/neuron/commit/7ce28b6))
- **neuron-ui:** display address field of input on the transaction de… ([#987](https://github.com/nervosnetwork/neuron/issues/987)) ([0cb9a1d](https://github.com/nervosnetwork/neuron/commit/0cb9a1d))

## [0.22.1](https://github.com/nervosnetwork/neuron/compare/v0.22.0...v0.22.1) (2019-10-15)

### Bug Fixes

- not sync after switch network ([be5a014](https://github.com/nervosnetwork/neuron/commit/be5a014))
- **neuron-ui:** fix the type of script.args from string[] to string ([aa34515](https://github.com/nervosnetwork/neuron/commit/aa34515))

### Features

- **neuron-ui:** add loading effects on creating/import wallets ([8508965](https://github.com/nervosnetwork/neuron/commit/8508965))
- **neuron-ui:** add loading on creating networks ([8b89b1e](https://github.com/nervosnetwork/neuron/commit/8b89b1e))
- **neuron-ui:** dismiss pinned top alert if it's related to auto-dismissed notifications ([b1ea6d5](https://github.com/nervosnetwork/neuron/commit/b1ea6d5))
- **neuron-ui:** make the alert of lacking remote module more clear ([a36abba](https://github.com/nervosnetwork/neuron/commit/a36abba))
- **neuron-ui:** remove eslint rule of no-bitwise ([c5c5101](https://github.com/nervosnetwork/neuron/commit/c5c5101))
- **neuron-ui:** update loading style of submit button for importing/creating wallets ([7469911](https://github.com/nervosnetwork/neuron/commit/7469911))
- **neuron-ui:** update the epoch index ([7599cb7](https://github.com/nervosnetwork/neuron/commit/7599cb7))
- add lock to input ([436b388](https://github.com/nervosnetwork/neuron/commit/436b388))

# [0.22.0](https://github.com/nervosnetwork/neuron/compare/v0.21.0-beta.1...v0.22.0) (2019-10-09)

### Bug Fixes

- address balance error in indexer mode ([0a35d61](https://github.com/nervosnetwork/neuron/commit/0a35d61))
- **neuron-ui:** add an auto match on speed of price from 20 to 40 ([160c844](https://github.com/nervosnetwork/neuron/commit/160c844))
- **neuron-ui:** fix the relationship between transaction price and speed ([541ab94](https://github.com/nervosnetwork/neuron/commit/541ab94))
- **neuron-ui:** show 0 confirmations if the real data is negative ([e974a21](https://github.com/nervosnetwork/neuron/commit/e974a21))
- change `hasData` to 0 in `output` ([04b1176](https://github.com/nervosnetwork/neuron/commit/04b1176))

### Features

- bump sdk to v0.22.0 ([b6e3035](https://github.com/nervosnetwork/neuron/commit/b6e3035))
- **neuron-ui:** add a toggle of skip-data-and-type ([9cb7c62](https://github.com/nervosnetwork/neuron/commit/9cb7c62))
- **neuron-ui:** extend the width of tx type field to 70 px ([513c7d9](https://github.com/nervosnetwork/neuron/commit/513c7d9))
- **neuron-ui:** update the view of transaction detail ([#965](https://github.com/nervosnetwork/neuron/issues/965)) ([ca38b40](https://github.com/nervosnetwork/neuron/commit/ca38b40))
- enable copy the mainnet addresses when it's not connected to the mainnet ([6b3952f](https://github.com/nervosnetwork/neuron/commit/6b3952f))

# [0.21.0-beta.1](https://github.com/nervosnetwork/neuron/compare/v0.21.0-beta.0...v0.21.0-beta.1) (2019-09-27)

### Bug Fixes

- sync stopped in indexer and normal mode ([dfa2f1e](https://github.com/nervosnetwork/neuron/commit/dfa2f1e))
- Translation for type column on history and address book view ([4d4b7e1](https://github.com/nervosnetwork/neuron/commit/4d4b7e1))
- **neuron-ui:** hide unrelated columns when the mainnet address is displayed ([700c059](https://github.com/nervosnetwork/neuron/commit/700c059))

### Features

- discriminate chain type by the result of rpc.getBlockchainInfo method ([9654662](https://github.com/nervosnetwork/neuron/commit/9654662))

### Performance Improvements

- skip `createdBy` if already created in indexer ([b1d694b](https://github.com/nervosnetwork/neuron/commit/b1d694b))

# [0.21.0-beta.0](https://github.com/nervosnetwork/neuron/compare/v0.20.0-beta.0...v0.21.0-beta.0) (2019-09-24)

### Bug Fixes

- create tx in several SQLs ([d012cc5](https://github.com/nervosnetwork/neuron/commit/d012cc5))
- hex number in indexer mode ([9d56aee](https://github.com/nervosnetwork/neuron/commit/9d56aee))
- rename class name from text-overflow to textOverflow ([747fdcf](https://github.com/nervosnetwork/neuron/commit/747fdcf))
- throw when capacity not enough for change ([3629787](https://github.com/nervosnetwork/neuron/commit/3629787))
- **neuron-ui:** disable scroll on notification dismission ([0c754ad](https://github.com/nervosnetwork/neuron/commit/0c754ad))
- **neuron-ui:** disable the submit button once a sending request is sent ([0c72b01](https://github.com/nervosnetwork/neuron/commit/0c72b01))
- **neuron-ui:** fix the repetition of notification ([aa9e800](https://github.com/nervosnetwork/neuron/commit/aa9e800))
- **neuron-ui:** fix the transaction detail view ([9e6da54](https://github.com/nervosnetwork/neuron/commit/9e6da54))
- **neuron-ui:** fix typo in class name ([3417445](https://github.com/nervosnetwork/neuron/commit/3417445))
- **neuron-ui:** sort outputs of a transaction by outPoint.index ([c9aef30](https://github.com/nervosnetwork/neuron/commit/c9aef30))

### Features

- bump sdk to v0.21.0 ([3abf7ca](https://github.com/nervosnetwork/neuron/commit/3abf7ca))
- **neuron-ui:** add a blank margin around the QRCode for improving recognization ([8a7b246](https://github.com/nervosnetwork/neuron/commit/8a7b246))
- **neuron-ui:** add a condition of isMainnet for displaying addresses ([5be0335](https://github.com/nervosnetwork/neuron/commit/5be0335))
- **neuron-ui:** add a settings icon in the navbar component ([8d929a3](https://github.com/nervosnetwork/neuron/commit/8d929a3))
- **neuron-ui:** add mainnet/testnet addresses toggle ([d55a415](https://github.com/nervosnetwork/neuron/commit/d55a415))
- **neuron-ui:** adjust the layout of the qr scanner dialog ([5d91d90](https://github.com/nervosnetwork/neuron/commit/5d91d90))
- Improve localization translations ([44b3642](https://github.com/nervosnetwork/neuron/commit/44b3642))
- **neuron-ui:** refine transaction list and address list ([e78dd9f](https://github.com/nervosnetwork/neuron/commit/e78dd9f))
- **neuron-ui:** remove hover effect on table header ([a21bc7e](https://github.com/nervosnetwork/neuron/commit/a21bc7e))
- Remove hover background effect on property list and overview details lists ([91a1c6e](https://github.com/nervosnetwork/neuron/commit/91a1c6e))

# [0.20.0-beta.1](https://github.com/nervosnetwork/neuron/compare/v0.20.0-beta.0...v0.20.0-beta.1) (2019-09-17)

### Bug Fixes

- **neuron-ui:** disable the submit button once a sending request is sent ([0c72b01](https://github.com/nervosnetwork/neuron/commit/0c72b01))
- **neuron-ui:** fix the transaction detail view ([9e6da54](https://github.com/nervosnetwork/neuron/commit/9e6da54))
- **neuron-ui:** fix typo in class name ([3417445](https://github.com/nervosnetwork/neuron/commit/3417445))
- **neuron-ui:** sort outputs of a transaction by outPoint.index ([c9aef30](https://github.com/nervosnetwork/neuron/commit/c9aef30))

### Features

- **neuron-ui:** add a settings icon in the navbar component ([8d929a3](https://github.com/nervosnetwork/neuron/commit/8d929a3))
- Improve localization translations ([44b3642](https://github.com/nervosnetwork/neuron/commit/44b3642))
- **neuron-ui:** add a blank margin around the QRCode for improving recognization ([8a7b246](https://github.com/nervosnetwork/neuron/commit/8a7b246))
- **neuron-ui:** refine transaction list and address list ([e78dd9f](https://github.com/nervosnetwork/neuron/commit/e78dd9f))
- **neuron-ui:** remove hover effect on table header ([a21bc7e](https://github.com/nervosnetwork/neuron/commit/a21bc7e))
- Remove hover background effect on property list and overview details lists ([91a1c6e](https://github.com/nervosnetwork/neuron/commit/91a1c6e))

# [0.20.0-beta.0](https://github.com/nervosnetwork/neuron/compare/v0.19.0-beta.1...v0.20.0-beta.0) (2019-09-09)

### Bug Fixes

- fix gatherInputs select error ([a104618](https://github.com/nervosnetwork/neuron/commit/a104618))

### Features

- **neuron-ui:** set the default font style to use system fonts ([70f4680](https://github.com/nervosnetwork/neuron/commit/70f4680))
- bump sdk to v0.20.0 ([607558b](https://github.com/nervosnetwork/neuron/commit/607558b))

# [0.19.0-beta.1](https://github.com/nervosnetwork/neuron/compare/v0.19.0-beta.0...v0.19.0-beta.1) (2019-09-04)

### Bug Fixes

- add totalBalance to address test ([90184aa](https://github.com/nervosnetwork/neuron/commit/90184aa))
- change typeScript type to `text` from `varchar` ([e334085](https://github.com/nervosnetwork/neuron/commit/e334085))
- fix balance tests ([11dcac7](https://github.com/nervosnetwork/neuron/commit/11dcac7))
- network test import ([c4cb7e4](https://github.com/nervosnetwork/neuron/commit/c4cb7e4))

### Features

- add base settings and move skip config to here ([37d82fb](https://github.com/nervosnetwork/neuron/commit/37d82fb))
- **neuron-ui:** move the miner info from overview to wallet list ([#907](https://github.com/nervosnetwork/neuron/issues/907)) ([1378768](https://github.com/nervosnetwork/neuron/commit/1378768))
- add an edit button by the side of description ([031fed0](https://github.com/nervosnetwork/neuron/commit/031fed0))
- add controller for skip data and type ([834390f](https://github.com/nervosnetwork/neuron/commit/834390f))
- add hasData and typeScript to output entity ([9fe535b](https://github.com/nervosnetwork/neuron/commit/9fe535b))
- add SkipDataAndType class ([a952152](https://github.com/nervosnetwork/neuron/commit/a952152))
- add totalBalance to address entity ([5746438](https://github.com/nervosnetwork/neuron/commit/5746438))
- add totalBalance to address interface ([7a29c03](https://github.com/nervosnetwork/neuron/commit/7a29c03))
- calculate totalBalance and check skip data and type in gather inputs ([f455545](https://github.com/nervosnetwork/neuron/commit/f455545))
- **neuron-ui:** prevent updating tx and addr list when user is editing the description ([6c4ea72](https://github.com/nervosnetwork/neuron/commit/6c4ea72))
- skip cells which has data or type ([6a85705](https://github.com/nervosnetwork/neuron/commit/6a85705))
- using keep alive connection ([f3fbe15](https://github.com/nervosnetwork/neuron/commit/f3fbe15))

# [0.19.0-beta.0](https://github.com/nervosnetwork/neuron/compare/v0.18.0-beta.1...v0.19.0-beta.0) (2019-08-29)

### BREAKING CHANGES

- Code signing certification was updated. Manual installation of this version is required as automatic update won't work.
- There was a bug that caused the keystore mac to calculate incorrectly. Older exported keystore files might not be able to be imported.
- DB structure was changed per CKB transaction and other types' changes.

### Bug Fixes

- Fix keystore mac calculation
- add outputsData and headerDeps ([f2432eb](https://github.com/nervosnetwork/neuron/commit/f2432eb))
- Error when handling crypto.scryptSync with N > 16384 ([eac4339](https://github.com/nervosnetwork/neuron/commit/eac4339))
- fix filterOutputs for async filter ([c851963](https://github.com/nervosnetwork/neuron/commit/c851963))
- hide some tests in lock utils tests ([19c6673](https://github.com/nervosnetwork/neuron/commit/19c6673))
- remove default hash_type=data ([33cc4cf](https://github.com/nervosnetwork/neuron/commit/33cc4cf))

### Features

- bump sdk to v0.19.0 in neuron-ui ([3b6ede9](https://github.com/nervosnetwork/neuron/commit/3b6ede9))
- bump sdk to v0.19.0 in neuron-wallet ([6ca8200](https://github.com/nervosnetwork/neuron/commit/6ca8200))
- Increase KDF params N value to 2\*\*18 to produce more secure keystore ([06f5ac6](https://github.com/nervosnetwork/neuron/commit/06f5ac6))
- Remove MenuCommand enum ([#900](https://github.com/nervosnetwork/neuron/issues/900)) ([e40c5cf](https://github.com/nervosnetwork/neuron/commit/e40c5cf))
- Update TypeScript to 3.6 ([ac61a5b](https://github.com/nervosnetwork/neuron/commit/ac61a5b))
- **neuron-ui:** set the cycles to empty if the transaction is invalid ([64166cc](https://github.com/nervosnetwork/neuron/commit/64166cc))
- **neuron-ui:** show confirmations on the History View ([84692c7](https://github.com/nervosnetwork/neuron/commit/84692c7))

# [0.18.0-beta.1](https://github.com/nervosnetwork/neuron/compare/v0.18.0-beta.0...v0.18.0-beta.1) (2019-08-22)

### Bug Fixes

- remove hash_type=Type in test ([9340e41](https://github.com/nervosnetwork/neuron/commit/9340e41))
- **neuron-ui:** fix the color of pagination ([3ffed72](https://github.com/nervosnetwork/neuron/commit/3ffed72))
- **neuron-ui:** fix the i18n text of pagination ([c779a20](https://github.com/nervosnetwork/neuron/commit/c779a20))
- address service test ([f743a06](https://github.com/nervosnetwork/neuron/commit/f743a06))
- don't restart when generate new address in normal sync ([66b6810](https://github.com/nervosnetwork/neuron/commit/66b6810))
- minBlockNumber select error ([acbafd0](https://github.com/nervosnetwork/neuron/commit/acbafd0))
- using appendLockHashInfos ([342061d](https://github.com/nervosnetwork/neuron/commit/342061d))
- **e2e:** Make sure to exit server ([559a11e](https://github.com/nervosnetwork/neuron/commit/559a11e))
- **neuron-ui:** disable the submit button when it's sending ([9fc7b7d](https://github.com/nervosnetwork/neuron/commit/9fc7b7d))
- **neuron-ui:** use the create api for creating wallets ([49edee8](https://github.com/nervosnetwork/neuron/commit/49edee8))
- only check success txs ([2ec2529](https://github.com/nervosnetwork/neuron/commit/2ec2529))
- reset when import wallet ([6be360e](https://github.com/nervosnetwork/neuron/commit/6be360e))

### Features

- **neuron-ui:** add more detailed error messages of the amount field ([a2503ff](https://github.com/nervosnetwork/neuron/commit/a2503ff))
- **neuron-ui:** add verification on updating amounts ([46ae8c1](https://github.com/nervosnetwork/neuron/commit/46ae8c1))
- check tx success regular intervals ([a1203da](https://github.com/nervosnetwork/neuron/commit/a1203da))
- not start from zero in indexer when create wallet ([25ed522](https://github.com/nervosnetwork/neuron/commit/25ed522))
- not start from zero in normal sync when create wallet ([50a3c73](https://github.com/nervosnetwork/neuron/commit/50a3c73))
- **neuron-ui:** fill the address field automatically on QR Code recognized as a valid address ([c8a6689](https://github.com/nervosnetwork/neuron/commit/c8a6689))
- **neuron-ui:** update the cycles on the outputs changing ([01d02e0](https://github.com/nervosnetwork/neuron/commit/01d02e0))
- **neuron-ui:** use real cycles ([874e781](https://github.com/nervosnetwork/neuron/commit/874e781))
- auto switch indexer or common sync ([ece382f](https://github.com/nervosnetwork/neuron/commit/ece382f))
- compute cycles ([2be05b3](https://github.com/nervosnetwork/neuron/commit/2be05b3))
- impl sync by indexer RPCs ([16fa2a4](https://github.com/nervosnetwork/neuron/commit/16fa2a4))
- Update Electron to v6 ([0977897](https://github.com/nervosnetwork/neuron/commit/0977897))
- **neuron-ui:** use the same naming strategy as importing mnemonic words ([694ac98](https://github.com/nervosnetwork/neuron/commit/694ac98))
- process fork in indexer mode ([a7ad2d5](https://github.com/nervosnetwork/neuron/commit/a7ad2d5))

# [0.18.0-beta.0](https://github.com/nervosnetwork/neuron/compare/v0.18.0-alpha.1...v0.18.0-beta.0) (2019-08-16)

### Bug Fixes

- generate address and notify wallet created when import keystore ([9eaf2f3](https://github.com/nervosnetwork/neuron/commit/9eaf2f3))

### Features

- **neuron-ui:** update display of recent activities ([57c13c9](https://github.com/nervosnetwork/neuron/commit/57c13c9))
- Add report issue menu item ([a3e49ff](https://github.com/nervosnetwork/neuron/commit/a3e49ff))
- **neuron-ui:** add import keystore ([d3a917c](https://github.com/nervosnetwork/neuron/commit/d3a917c))
- **neuron-ui:** check the JSON format before keystore validation ([d5621e5](https://github.com/nervosnetwork/neuron/commit/d5621e5))
- **neuron-ui:** memorize lists for performance ([07c8667](https://github.com/nervosnetwork/neuron/commit/07c8667))
- Show available update's version ([37c8639](https://github.com/nervosnetwork/neuron/commit/37c8639))

# [0.18.0-alpha.1](https://github.com/nervosnetwork/neuron/compare/v0.18.0-alpha.0...v0.18.0-alpha.1) (2019-08-12)

### Bug Fixes

- **neuron-ui:** handle overflow on recent activities ([b357209](https://github.com/nervosnetwork/neuron/commit/b357209))
- **neuron-wallet:** set the language on app ready ([875cd5c](https://github.com/nervosnetwork/neuron/commit/875cd5c))

### Features

- **neuron-ui:** add custom scrollbar on activity list ([84d10d2](https://github.com/nervosnetwork/neuron/commit/84d10d2))
- **neuron-ui:** adjust the layout of list ([6a11f99](https://github.com/nervosnetwork/neuron/commit/6a11f99))
- **neuron-ui:** disable overflow hidden on activities ([01ff207](https://github.com/nervosnetwork/neuron/commit/01ff207))
- **neuron-ui:** scroll the overview view to the top on wallet switching ([45997d6](https://github.com/nervosnetwork/neuron/commit/45997d6))
- **neuron-ui:** update confirmation threshold of confirmations ([581fa70](https://github.com/nervosnetwork/neuron/commit/581fa70))

# [0.18.0-alpha.0](https://github.com/nervosnetwork/neuron/compare/v0.17.0-alpha.9...v0.18.0-alpha.0) (2019-08-10)

### Features

- **neuron-ui:** remove highlight on values in recent activities ([bc052ac](https://github.com/nervosnetwork/neuron/commit/bc052ac))
- display recent activities in sentence style ([b1af1fb](https://github.com/nervosnetwork/neuron/commit/b1af1fb))

# [0.17.0-alpha.9](https://github.com/nervosnetwork/neuron/compare/v0.17.0-alpha.8...v0.17.0-alpha.9) (2019-08-08)

### Bug Fixes

- early return when first-not-match ([08a708e](https://github.com/nervosnetwork/neuron/commit/08a708e))
- fetch size ([abdc01f](https://github.com/nervosnetwork/neuron/commit/abdc01f))
- not throw when push check range ([e2e6c90](https://github.com/nervosnetwork/neuron/commit/e2e6c90))
- waitForDrained ([b6712ff](https://github.com/nervosnetwork/neuron/commit/b6712ff))
- **neuron-ui:** set the font-size of footer to 12px ([c250678](https://github.com/nervosnetwork/neuron/commit/c250678))
- **neuron-wallet:** enable the i18n and update the wallet label of the application menu ([664ccc8](https://github.com/nervosnetwork/neuron/commit/664ccc8))

### Features

- Remove winston logger in favor of electron-log ([f3c228a](https://github.com/nervosnetwork/neuron/commit/f3c228a))

# [0.17.0-alpha.8](https://github.com/nervosnetwork/neuron/compare/v0.17.0-alpha.7...v0.17.0-alpha.8) (2019-08-06)

# [0.17.0-alpha.7](https://github.com/nervosnetwork/neuron/compare/v0.17.0-alpha.6...v0.17.0-alpha.7) (2019-08-05)

### Features

- **neuron-ui:** disable fadein animation on details list ([cb3153d](https://github.com/nervosnetwork/neuron/commit/cb3153d))
- **neuron-wallet:** enable select all ([5c0a577](https://github.com/nervosnetwork/neuron/commit/5c0a577))
- Add tsconfig plugin ts-transformer-imports to combile ([bb9cedf](https://github.com/nervosnetwork/neuron/commit/bb9cedf))
- Change space bewteen primary and secondary buttons to 10px ([cac5e8f](https://github.com/nervosnetwork/neuron/commit/cac5e8f))
- Do not use inline label for settings toggle button ([75eded1](https://github.com/nervosnetwork/neuron/commit/75eded1))
- Replace ts-node typeorm tasks with node dist js ([19ee2e7](https://github.com/nervosnetwork/neuron/commit/19ee2e7))
- Unify block status (property list) and miner info callouts style ([78e51c3](https://github.com/nervosnetwork/neuron/commit/78e51c3))

# [0.17.0-alpha.6](https://github.com/nervosnetwork/neuron/compare/v0.17.0-alpha.5...v0.17.0-alpha.6) (2019-08-05)

### Bug Fixes

- Add cachedNetwork to useMemo depencency ([733204c](https://github.com/nervosnetwork/neuron/commit/733204c))
- **neuron-wallet:** set current wallet empty if wallet list is empty ([b438509](https://github.com/nervosnetwork/neuron/commit/b438509))

### Features

- **neuron-ui:** add dynamic validation on the network editor ([c634d5b](https://github.com/nervosnetwork/neuron/commit/c634d5b))
- **neuron-ui:** make description update fluently ([cb9a5f0](https://github.com/nervosnetwork/neuron/commit/cb9a5f0))
- **neuron-ui:** separate the transaction view from the app ([7821ab3](https://github.com/nervosnetwork/neuron/commit/7821ab3))

# [0.17.0-alpha.5](https://github.com/nervosnetwork/neuron/compare/v0.17.0-alpha.4...v0.17.0-alpha.5) (2019-08-02)

### Bug Fixes

- **neuron-ui:** remove the quotation mark around error message ([5de8cba](https://github.com/nervosnetwork/neuron/commit/5de8cba))
- **neuron-wallet:** fix the error comes with deleting all wallets ([fa87136](https://github.com/nervosnetwork/neuron/commit/fa87136))

### Features

- using simple queue ([3595368](https://github.com/nervosnetwork/neuron/commit/3595368))
- **neuron-ui:** add basic style on the list header of transaction list ([3a7eeaf](https://github.com/nervosnetwork/neuron/commit/3a7eeaf))
- **neuron-ui:** add check on current wallet id on leaving settings view ([b33a238](https://github.com/nervosnetwork/neuron/commit/b33a238))
- **neuron-ui:** add CKB unit in the transaction fee field ([e6107e5](https://github.com/nervosnetwork/neuron/commit/e6107e5))
- **neuron-ui:** add dynamic prmopt in wallet wizard ([29372db](https://github.com/nervosnetwork/neuron/commit/29372db))
- **neuron-ui:** add notification panel ([f7984b0](https://github.com/nervosnetwork/neuron/commit/f7984b0))
- **neuron-ui:** add popping messages on copying and updating ([cd7d7e5](https://github.com/nervosnetwork/neuron/commit/cd7d7e5))
- **neuron-ui:** add the story of connection status component, and set the network name to 14px ([e940fdf](https://github.com/nervosnetwork/neuron/commit/e940fdf))
- **neuron-ui:** append network ips to network names in networks setting ([427941b](https://github.com/nervosnetwork/neuron/commit/427941b))
- **neuron-ui:** cache language configuration ([49e35c3](https://github.com/nervosnetwork/neuron/commit/49e35c3))
- **neuron-ui:** calculate transaction fee with user-specified price ([9ce3174](https://github.com/nervosnetwork/neuron/commit/9ce3174))
- **neuron-ui:** call generate mnemonic method from neuron-wallet in neuron-ui with remote module ([5a27c7b](https://github.com/nervosnetwork/neuron/commit/5a27c7b))
- **neuron-ui:** call networks controller's methods by remote module ([c4bc431](https://github.com/nervosnetwork/neuron/commit/c4bc431))
- **neuron-ui:** call transactions controller methods with remote module ([4751817](https://github.com/nervosnetwork/neuron/commit/4751817))
- **neuron-ui:** close the tx detail dialog on wallet switching ([5623f3b](https://github.com/nervosnetwork/neuron/commit/5623f3b))
- **neuron-ui:** display balance with thousandth delimiter ([07e4370](https://github.com/nervosnetwork/neuron/commit/07e4370))
- **neuron-ui:** double click on tx item shows its details ([383db66](https://github.com/nervosnetwork/neuron/commit/383db66))
- **neuron-ui:** handle current-wallet update and wallet-list update separately ([bd4c109](https://github.com/nervosnetwork/neuron/commit/bd4c109))
- **neuron-ui:** navigate to the Overview view on wallet switching ([bea4b20](https://github.com/nervosnetwork/neuron/commit/bea4b20))
- Configure dev-app-update.yml for electron-updater ([8fcf184](https://github.com/nervosnetwork/neuron/commit/8fcf184))
- **neuron-ui:** hide the top alert on removing the last error message from the notification panel ([e23d331](https://github.com/nervosnetwork/neuron/commit/e23d331))

# [0.17.0-alpha.4](https://github.com/nervosnetwork/neuron/compare/v0.17.0-alpha.3...v0.17.0-alpha.4) (2019-08-01)

### Bug Fixes

- **neuron-ui:** remove the quotation mark around error message ([5de8cba](https://github.com/nervosnetwork/neuron/commit/5de8cba))

### Features

- **neuron-ui:** show alert via electron for consistent with the behaviour of mnemonic validation ([3a3cee1](https://github.com/nervosnetwork/neuron/commit/3a3cee1))
- Add OK button to update message box ([9cba232](https://github.com/nervosnetwork/neuron/commit/9cba232))
- **neuron-ui:** add notification panel ([f7984b0](https://github.com/nervosnetwork/neuron/commit/f7984b0))

# [0.17.0-alpha.3](https://github.com/nervosnetwork/neuron/compare/v0.17.0-alpha.2...v0.17.0-alpha.3) (2019-08-01)

### Bug Fixes

- connection not found when delete wallet ([2afc7e7](https://github.com/nervosnetwork/neuron/commit/2afc7e7))
- Remove publisherName for win electron-builder configuration ([e1b3121](https://github.com/nervosnetwork/neuron/commit/e1b3121))
- Translation for installing update prompt message ([0540057](https://github.com/nervosnetwork/neuron/commit/0540057))

### Features

- **neuron-ui:** add the story of connection status component, and set the network name to 14px ([e940fdf](https://github.com/nervosnetwork/neuron/commit/e940fdf))
- Only bundle en and zh_CN language folders for mac ([6701659](https://github.com/nervosnetwork/neuron/commit/6701659))
- **neuron-ui:** double click on tx item shows its details ([383db66](https://github.com/nervosnetwork/neuron/commit/383db66))

# [0.17.0-alpha.2](https://github.com/nervosnetwork/neuron/compare/v0.17.0-alpha.1...v0.17.0-alpha.2) (2019-07-31)

### Bug Fixes

- check input of lock hashes ([c76590c](https://github.com/nervosnetwork/neuron/commit/c76590c))
- Connection "address" was not found in test ([c121a09](https://github.com/nervosnetwork/neuron/commit/c121a09))

### Features

- Only package AppImage for Linux ([c06b7bd](https://github.com/nervosnetwork/neuron/commit/c06b7bd))
- **neuron-ui:** set message dismission duration to 8s ([a9a09e1](https://github.com/nervosnetwork/neuron/commit/a9a09e1))
- **neuron-ui:** set page no to 1 on wallet switch ([9aa8d67](https://github.com/nervosnetwork/neuron/commit/9aa8d67))
- **neuron-wallet:** add default parameters in getAllByKeywords method ([bfd9b0d](https://github.com/nervosnetwork/neuron/commit/bfd9b0d))
- split tx service to multi files ([1dcf5e1](https://github.com/nervosnetwork/neuron/commit/1dcf5e1))
- using new tx service and delete old ([00da601](https://github.com/nervosnetwork/neuron/commit/00da601))

# [0.17.0-alpha.1](https://github.com/nervosnetwork/neuron/compare/v0.17.0-alpha.0...v0.17.0-alpha.1) (2019-07-30)

### Bug Fixes

- reuse q in Queue ([87bbf73](https://github.com/nervosnetwork/neuron/commit/87bbf73))
- update balance when address list is updated ([c0809bf](https://github.com/nervosnetwork/neuron/commit/c0809bf))

### Features

- **neuron-ui:** reduce the label width of transaction's basic info ([dc0606b](https://github.com/nervosnetwork/neuron/commit/dc0606b))
- **neuron-ui:** remove the exact block number in the synching progress component ([faf4c4f](https://github.com/nervosnetwork/neuron/commit/faf4c4f))
- Check for updates ([8b42970](https://github.com/nervosnetwork/neuron/commit/8b42970))
- Enable check updates menu item after error ([70e85c9](https://github.com/nervosnetwork/neuron/commit/70e85c9))
- **neuron-ui:** add popping messages on copying and updating ([cd7d7e5](https://github.com/nervosnetwork/neuron/commit/cd7d7e5))
- **neuron-ui:** append network ips to network names in networks setting ([427941b](https://github.com/nervosnetwork/neuron/commit/427941b))
- Rearrange main menu ([1b22932](https://github.com/nervosnetwork/neuron/commit/1b22932))
- remove the placeholder of send to address field ([2c1e0b3](https://github.com/nervosnetwork/neuron/commit/2c1e0b3))

# [0.17.0-alpha.0](https://github.com/nervosnetwork/neuron/compare/v0.16.0-alpha.2...v0.17.0-alpha.0) (2019-07-29)

### Bug Fixes

- be compatible with sdk ([21d7a13](https://github.com/nervosnetwork/neuron/commit/21d7a13))
- broadcast address info updated ([7aa4c83](https://github.com/nervosnetwork/neuron/commit/7aa4c83))
- lock utils for new lock script ([bb36ba2](https://github.com/nervosnetwork/neuron/commit/bb36ba2))
- move update address to sync process and buffer it ([fcad39a](https://github.com/nervosnetwork/neuron/commit/fcad39a))
- **neuron-ui:** fix a typo of 'ckb' to 'neuron' ([022882c](https://github.com/nervosnetwork/neuron/commit/022882c))
- **neuron-ui:** fix mnemonic formatting ([35ed784](https://github.com/nervosnetwork/neuron/commit/35ed784))

### Features

- add hash type in the script structure ([c09b6d2](https://github.com/nervosnetwork/neuron/commit/c09b6d2))
- address to lock hashes now include data and type ([02e3bca](https://github.com/nervosnetwork/neuron/commit/02e3bca))
- remove empty current wallet handler from the main view ([5810cbb](https://github.com/nervosnetwork/neuron/commit/5810cbb))
- **neuron-ui:** align list with description field ([ea9e034](https://github.com/nervosnetwork/neuron/commit/ea9e034))
- **neuron-ui:** ignore connection error in neuron-ui ([9f5593c](https://github.com/nervosnetwork/neuron/commit/9f5593c))
- **neuron-ui:** optimize updating descriptions ([6a72502](https://github.com/nervosnetwork/neuron/commit/6a72502))
- **neuron-ui:** show alert when amount is less than 61 CKB on sending transaction ([837c154](https://github.com/nervosnetwork/neuron/commit/837c154))
- **neuron-wallet:** remove spend-from menuitem ([6759e94](https://github.com/nervosnetwork/neuron/commit/6759e94))
- Updating to SDK v0.17.0 ([a7cc81c](https://github.com/nervosnetwork/neuron/commit/a7cc81c))

### Performance Improvements

- add debounce and sample on subjects for performance ([52095e5](https://github.com/nervosnetwork/neuron/commit/52095e5))

# [0.16.0-alpha.2](https://github.com/nervosnetwork/neuron/compare/v0.16.0-alpha.1...v0.16.0-alpha.2) (2019-07-26)

### Features

- Update app icon ([17936c4](https://github.com/nervosnetwork/neuron/commit/17936c4))
- **neuron-ui:** display balance with thousandth delimiter ([07e4370](https://github.com/nervosnetwork/neuron/commit/07e4370))

# [0.16.0-alpha.1](https://github.com/nervosnetwork/neuron/compare/v0.16.0-alpha.0...v0.16.0-alpha.1) (2019-07-26)

### Bug Fixes

- **neuron-wallet:** check min capacity ([ad77232](https://github.com/nervosnetwork/neuron/commit/ad77232))

### Features

- Trigger auto update on app launch ([a2ad858](https://github.com/nervosnetwork/neuron/commit/a2ad858))
- **neuron-ui:** call generate mnemonic method from neuron-wallet in neuron-ui with remote module ([5a27c7b](https://github.com/nervosnetwork/neuron/commit/5a27c7b))
- **neuron-ui:** call networks controller's methods by remote module ([c4bc431](https://github.com/nervosnetwork/neuron/commit/c4bc431))
- **neuron-ui:** call transactions controller methods with remote module ([4751817](https://github.com/nervosnetwork/neuron/commit/4751817))
- **neuron-ui:** remove UILayer ([f2f3145](https://github.com/nervosnetwork/neuron/commit/f2f3145))
- **neuron-ui:** subscribe current network id from neuron-wallet in neuron-ui ([1173622](https://github.com/nervosnetwork/neuron/commit/1173622))
- **package:** Rename package task to release, publish to GitHub ([e3d473e](https://github.com/nervosnetwork/neuron/commit/e3d473e))
- call methods of app controller with remote module ([cdc93a0](https://github.com/nervosnetwork/neuron/commit/cdc93a0))
- subscribe network list from neuron-wallet in neuron-ui ([b56ae1c](https://github.com/nervosnetwork/neuron/commit/b56ae1c))
