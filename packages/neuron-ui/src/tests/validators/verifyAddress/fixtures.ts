export default {
  'blake160 short address': {
    address: 'ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v',
    expected: true,
  },
  'multisig short address': {
    address: 'ckb1qyq5lv479ewscx3ms620sv34pgeuz6zagaaqklhtgg',
    expected: false,
  },
  'full address': {
    address: 'ckb1qjda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xw3vumhs9nvu786dj9p0q5elx66t24n3kxgj53qks',
    expected: true,
  },
  'invalid short address': {
    address: 'ckb1qy1t8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v',
    expected: false,
  },
  'unknown type address': {
    address: 'ckb11jda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xw3vumhs9nvu786dj9p0q5elx66t24n3kxgj53qks',
    expected: false,
  },
}
