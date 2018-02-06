# Hedwig
Simple email generator

Basics steps:
- Read something from amqp
- Template it
- Deliver it to mandrill

## Start the consumer

```bash
$ nvm run system index.js
```

## Simulate a producer

```bash
$ ./send.py
```
