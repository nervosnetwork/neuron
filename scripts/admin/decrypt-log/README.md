## Log Encryption & Decryption

## Encryption

An environment variable `LOG_ENCRYPTION_PUBLIC_KEY` must be set to enable log encryption when releasing Neuron. If the variable is not set, a placeholder message will be left in the log file.

To generate a keypair

```sh
# for ADMIN_PRIVATE_KEY
openssl genrsa -out key.pem 2048

# for LOG_ENCRYPTION_PUBLIC_KEY
openssl rsa -in key.pem -outform PEM -pubout -out public.pem
```

## Decryption

An encrypted log is following the pattern

```
[key:<encrypted_aes_password>] [iv:<random initial vector>] <content>
```

And here is a real world example

```
[2024-07-31T11:15:06.811Z] [info]  [key:sWFKSuG+GzC52QlqDUcLhCvWFevSR8JjcvlIwCmB6U750UbO59zQZlQFyIUCBMH2Vamdr/ScZaF00wObzyi2BERMkKCQ9XY1ELcQSvCaAjUy4251B4MIyrnYPu4Bf+bca5U/906ko37G6dZMDNCcm2J5pm3+0TvqwXFA+BDXsAeZ7YWXpNha+WTMbQJiGj+ltbjIlodXhtqGWBhkLHgeZtfpM/OQDclOUfSP4SDva1LUvjdkQjnmUB+5dLumEAQpm7u7mroXl5eMTpVhyVtULm+QkQ4aA/D9Q/Y1dGUxl8jU2zcgL1h8Uhrb9FMpCaLyu13gGZr42HlFVU4j/VzD/g==] [iv:/jDhuN6b/qEetyHnU2WPDw==] 0+B+gimzrZgbxfxBTtznyA==
```

To decrypt the message

```sh
export LOG_MESSAGE="<log message similar the above mentioned>"
export ADMIN_PRIVATE_KEY="<pem formatted rsa private key>"
bun run.ts
```

### Advanced

If the admin key is protected, please decrypt the log key by the following script

```sh
openssl pkeyutl -pkeyopt rsa_padding_mode:oaep -passin "${MY_KEY_PASSWORD}" -decrypt -inkey private.key -in "${LOCAL_KEY}" -out "aes.key"
```

```js
const aesKey = "<aes.key>";
const iv = Buffer.from("<iv>", "base64");
const decipher = createDecipheriv("aes-256-cbc", aesKey, iv);

console.log(
  Buffer.concat([
    decipher.update("<content>", "base64"),
    decipher.final(),
  ]).toString("utf-8")
);
```
