## Log Decryption

An encrypted log looks the following block

```
[2024-07-31T11:15:06.811Z] [info]  LogEncryption key LFWL6pdZrEgMwhuyL6ViGYKy/ZSilpeksZW3gpvGEqTg+4tzKk0Sjep8/Emzy1t5tyGEI6fs0BJVVkgmiAVCozotDQJVmUUtAZkdNok7Y9rnZxIaTsyLciXUyWXyqckW7WJriNKmpzxUSj9PBH+U69irdeqmwNTysJ3Qv4y7wSdSG4mZ9/WOOH3S4S27NmJ9ZeO1PNaXZWMz2i7baA0erYAkl9zyPtgg3QSlYrSqk91mkOGgCrqJebC6d63+516wIskNk/NWPt0GA+KXIlDNketIFgu6SOBopLorhXi69mX/7q5XU/Cmv8+4nYrdnhqd+hReJg3MIK8tJuZvxNXy6w==
[2024-07-31T11:15:06.811Z] [info]  [iv:OJ9oGf7yL3K1jWYx7ABWHg==] /b4lCkOpL/kt7DHoyaDlOg==
```

To decrypt the message

1. Create an `.env` at this folder(`/decrypt-log`)
2. Config `CLIENT_ENCRYPTED_KEY`: Search the keyword `LogEncryption key` in the log file, copy the value to `.env`. This is an encrypted AES key used for decrypting the encrypted log message
3. Config `ADMIN_PRIVATE_KEY`: copy the PEM format RSA private key to the `.env` file
4. Config `LOG_MESSAGE`: copy the encrypted, base64 encoded log message to the `.env` file
5. Run `node --experimental-strip-types --env-file .env run.ts` or `bun run.ts`
