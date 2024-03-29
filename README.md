<img title="Dall-E 3 Logo" align="right" width="300px" src="logo.svg" alt="Netcat Comments Logo" />

# Netcat Comments

## 🏗️Setup

1. Clone repository and install dependencies

```bash
$ git clone https://github.com/ndom91/netcat-comments.git
$ cd netcat-comments
$ corepack enable
$ pnpm install
```

2. Run development server

```bash
$ pnpm dev
```

You'll then have a process listening on port `5000`

3. Start Netcat on port `5000`

```bash
$ nc localhost 5000
```

In this netcat process you can then send and receive messages by entering your message and pressing <kbd>Enter</kbd>.

## 👷 Usage

Messages sent to the system have the following syntax.

```
<requestId>|<command>|<payload>
```

- `requestId` - Unique 7 character string matching `/([a-z]{7})/`
- `command` - One of the available [commands](#%EF%B8%8F-commands)
- `payload` - Command specific payload. If there are multiple fields, these will continue to be pipe (`|`) delimited.

**Example**

```bash
> nc localhost 5000
abcdefg|SIGN_IN|nico
abcdefg

gfedcba|WHOAMI
gfedcba|nico
```

## ⚙️ Commands

### `SIGN_IN` 

Signin with a supplied username as 

**Payload Arguments**
- `<username>`

**Returns**
- `<requestId>` - Request Id consisting of a 7-character lowercase string

**Example**
```bash
haskduw|SIGN_IN|nico
haskduw
```

---

### `SIGN_OUT` 
Signout of supplied username 

**Payload Arguments**
- `<username>`

**Returns**
- `<requestId>` - Request Id consisting of a 7-character lowercase string

**Example**
```bash
lqkwidh|SIGN_OUT
lqkwidh
```

---

### `WHOAMI` 

Return current username

**Payload Arguments**
- None

**Returns**
- Active `username`

**Example**
```bash
iqibalz|WHOAMI
iqibalz|john
```
---

### `CREATE_DISCUSSION` 

Create a new comment thread

**Payload Arguments**
- `<discussionUserReference>` - Discussion user reference consisting of a period delimited alphanumeric string, such as `b3hsbdf.1m30s`
- `<comment>` - Comment body, a unicode string of unspecified length

**Returns**
- `<discussionId>` - Discussion thread identifier

**Example**
```bash
pqjdbyx|CREATE_DISCUSSION|fghjkla.01|Hello everybody!
pqjdbyx|ef95a0d5
```

---

### `GET_DISCUSSION`

Return all messages on a discussion thread

**Payload Arguments**
- `<discussionId>` - Discussion Id consisting of a 7-character alphanumeric string, like `dh7hs3b`

**Returns**
- `<requestId>` - Request Id consisting of a 7-character lowercase string
- `<discussionId>` - Discussion Id consisting of a 7-character alphanumeric string, like `dh7hs3b`
- `<discussionUserReference>` - Discussion user reference consisting of a period delimited alphanumeric string, such as `b3hsbdf.1m30s`
- `(<username>|<comment>)[]` - Array of all messages with `username` and `comment`

**Example**
```bash
bajkxuj|GET_DISCUSSION|ef95a0d5
bajkxuj|ef95a0d5|fghjkla.01|(john|"Hello everybody!")
```

---

### `CREATE_REPLY`

Append a reply to an existing discussion thread

**Payload Arguments**
- `<discussionId>` - Discussion Id consisting of a 7-character alphanumeric string, like `dh7hs3b`
- `<comment>` - Comment body

**Returns**
- `<requestId>` - Request Id consisting of a 7-character lowercase string

**Example**
```bash
hvbxnod|CREATE_REPLY|ef95a0d5|Hello back at you!
hvbxnod
```

---

### `LIST_DISCUSSIONS`

Return all discussion threads and its messages 

**Payload Arguments**
- `<commentReferencePrefix>` - First part of the period delimited reference, such as `b3hsbdf`

**Returns**
- `<requestId>` - Request Id consisting of a 7-character lowercase string
- `<discussionId>` - Discussion Id consisting of a 7-character alphanumeric string, like `dh7hs3b`
- `<discussionUserReference>` - Discussion user reference consisting of a period delimited alphanumeric string, such as `b3hsbdf.1m30s`
- `(<username>|<comment>)[]` - Array of all messages with `username` and `comment`

**Example**
```bash
bakxufh|LIST_DISCUSSIONS|fghjkla
bakxufh|(72bdabe3|fghjkla.02|(john|"Hey there")),(ef95a0d5|fghjkla.01|(bob|"Hello back at you!",nico|"Hey team"))
```

## 📝 License

MIT
