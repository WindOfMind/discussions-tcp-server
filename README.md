## Synthesia Task – TCP Discussion Server

A simple TCP server written in TypeScript that manages lightweight discussions with sign-in/out, creating discussions, replying, and querying. Clients connect over TCP and exchange pipe-delimited messages. The server also pushes asynchronous notifications when discussions are updated.

### Prerequisites
- Node.js 20+
- pnpm/npm/yarn (examples below use npm)

### Install, Build, Run
1. Install dependencies:
   - `npm install`
2. Build TypeScript:
   - `npm run build`
3. Start server:
   - `npm start`

Environment variables:
- `PORT` (default `8083`)
- `HOST` (default `localhost`)

The compiled entrypoint is `dist/index.js`, which creates a TCP server listening on `HOST:PORT`.

For development you can also run:
- `npm run dev` (builds then starts)

### Running Tests
- `npm test`

Uses Vitest for unit and integration tests located under `test/`.

## TCP Protocol

### Message framing
- Messages are UTF-8 text, single-line, newline-terminated (`\n`).
- Fields are pipe-delimited: `|`.

### Request format
`requestId|ACTION|payload...\n`

- `requestId`: exactly 7 lowercase letters (`^[a-z]{7}$`).
- `ACTION`: one of the supported actions below.
- `payload`: zero or more fields depending on action.

If the message is malformed, the server replies with `Error processing message`.

### Supported actions and payloads
- SIGN_IN: `requestId|SIGN_IN|userName`
  - Signs in the current TCP connection under `userName`.
  - Response: `requestId`

- WHOAMI: `requestId|WHOAMI`
  - Returns the signed-in user for this connection.
  - Response: `requestId|userName`

- SIGN_OUT: `requestId|SIGN_OUT`
  - Signs out the current connection.
  - Response: `requestId`

- CREATE_DISCUSSION: `requestId|CREATE_DISCUSSION|reference|comment`
  - Creates a new discussion under `reference` with the initial `comment` by the signed-in user.
  - Response: `requestId|discussionId`

- CREATE_REPLY: `requestId|CREATE_REPLY|discussionId|comment`
  - Adds a reply to a discussion by the signed-in user.
  - Response: `requestId`

- GET_DISCUSSION: `requestId|GET_DISCUSSION|discussionId`
  - Fetches a single discussion.
  - Response: `requestId|discussionId|reference|(userName|comment,...)`

- LIST_DISCUSSIONS: `requestId|LIST_DISCUSSIONS|referencePrefix`
  - Lists discussions with references starting with `referencePrefix`.
  - Response: `requestId|(discussionId|reference|(userName|comment,...),...)`

Notes on list/tuple formatting:
- Lists are wrapped in parentheses and separated by commas.
- Strings in response parts are CSV-escaped: quotes are doubled; fields containing commas are wrapped in double quotes.

### Asynchronous notifications
The server may push notifications at any time (not correlated with a `requestId`).

- Discussion updated: `DISCUSSION_UPDATED|discussionId\n`

### Quick manual test with netcat
1. Start server (`npm start`).
2. In another terminal:
   - `nc localhost 8083`
3. Send requests (each terminated with `\n`):
   - `aaaaaaa|SIGN_IN|alice`
   - `bbbbbbb|CREATE_DISCUSSION|DOC-1|First comment`
   - `ccccccc|LIST_DISCUSSIONS|DOC-`
   - `ddddddd|GET_DISCUSSION|<paste-discussion-id>`

Expected example responses:
- `aaaaaaa` (sign-in ack)
- `bbbbbbb|<discussionId>`
- `ccccccc|( <discussionId>|DOC-1|(alice|First comment) )` (spacing optional)
- `ddddddd|<discussionId>|DOC-1|(alice|First comment)`

### Logging
Structured logs are printed to stdout using Winston. Connection-level `clientId` is the TCP peer address and port.