# TCP Discussion Server

A simple TCP server written in TypeScript that manages lightweight discussions with sign-in/out, creating discussions, replying, and querying. Clients connect over TCP and exchange pipe-delimited messages. The server also pushes asynchronous notifications when discussions are updated.

## Prerequisites

-   [Node.js 24+](https://nodejs.org/en)
-   pnpm/npm/yarn (examples below use npm)

## Install, Build, Run

1. Install dependencies:
    - `npm install`
2. Build TypeScript:
    - `npm run build`
3. Start server:
    - `npm start` or in dev mode `npm run dev`

Environment variables:

-   `PORT` (default `8083`)
-   `HOST` (default `localhost`)

The compiled entrypoint is `dist/index.js`, which creates a TCP server listening on `HOST:PORT`.

For development you can also run:

-   `npm run dev` (builds then starts)

## Running Tests

-   `npm test`

Uses Vitest for unit and integration tests located under `test/`.

## TCP Protocol

### Message framing

-   Messages are UTF-8 text, single-line, newline-terminated (`\n`).
-   Fields are pipe-delimited: `|`.

### Request format

`requestId|ACTION|payload...\n`

-   `requestId`: exactly 7 lowercase letters (`^[a-z]{7}$`).
-   `ACTION`: one of the supported actions below.
-   `payload`: zero or more fields depending on action.

If the message is malformed, the server replies with `Error processing message`.

### Supported actions and payloads

Note: we assume in the context of this assignment that the input is always valid.

-   SIGN_IN: `requestId|SIGN_IN|userName`

    -   Signs in the current TCP connection under `userName`.
    -   Response: `requestId`

-   WHOAMI: `requestId|WHOAMI`

    -   Returns the signed-in user for this connection.
    -   Response: `requestId|userName`

-   SIGN_OUT: `requestId|SIGN_OUT`

    -   Signs out the current connection.
    -   Response: `requestId`

-   CREATE_DISCUSSION: `requestId|CREATE_DISCUSSION|reference|comment`

    -   Creates a new discussion under `reference` with the initial `comment` by the signed-in user.
    -   Response: `requestId|discussionId`

-   CREATE_REPLY: `requestId|CREATE_REPLY|discussionId|comment`

    -   Adds a reply to a discussion by the signed-in user.
    -   Response: `requestId`

-   GET_DISCUSSION: `requestId|GET_DISCUSSION|discussionId`

    -   Fetches a single discussion.
    -   Response: `requestId|discussionId|reference|(userName|comment,...)`

-   LIST_DISCUSSIONS: `requestId|LIST_DISCUSSIONS|referencePrefix`
    -   Lists discussions with references starting with `referencePrefix`.
    -   Response: `requestId|(discussionId|reference|(userName|comment,...),...)`

Notes on list/tuple formatting:

-   Lists are wrapped in parentheses and separated by commas.
-   Strings in response parts are CSV-escaped: quotes are doubled; fields containing commas are wrapped in double quotes.

### Asynchronous notifications

The server may push notifications at any time (not correlated with a `requestId`).

-   Discussion updated: `DISCUSSION_UPDATED|discussionId\n`

### Quick manual test with netcat

1. Start server (`npm start`).
2. In another terminal:
    - `nc localhost 8083`
3. Send requests (each terminated with `\n`):
    - `aaaaaaa|SIGN_IN|alice`
    - `bbbbbbb|CREATE_DISCUSSION|DOC.1|First comment`
    - `ccccccc|LIST_DISCUSSIONS|DOC`
    - `ddddddd|GET_DISCUSSION|<paste-discussion-id>`

Expected example responses:

-   `aaaaaaa` (sign-in ack)
-   `bbbbbbb|<discussionId>`
-   `ccccccc|(<discussionId>|DOC.1|(alice|First comment))`
-   `ddddddd|<discussionId>|DOC.1|(alice|First comment)`

### Logging

Structured logs are printed to stdout using Winston. Connection-level `clientId` is the TCP peer address and port.

## Architecture

The application built in the way to support easy extension by plugging-in new message handlers for new types of messages in the `server.ts`.

Discussion updates are asynchronously processed and are sent out for the connected users. When there is an update for an offline user, the update would be saved in memory (DB/Cache in real case), and sent out when used is back. We assume that the only channel for delivering updates is TCP connection. If we would need other channels (emails, etc.), we would need to introduce dedicated Notification services classes, each responsible for a particular channel. Also, user preferences should be taken into account.

In the real application, apart from logging, it is important to collect metrics (CPU usage, memory usage, request latencies, etc.).

### Discussion storage

For the demonstration purpose, the data is stored in memory.
In the real application, we need to replace current repository implementation and use a durable DB for discussions (e.g., MySQL, PostgreSQL).
Proper indices should be added to support queries:

-   getting discussions by ID;
-   listing by reference prefix;
-   joins (collecting comments, users).

In the case of the future growth and expecting a huge number of the discussions,
we can introduce a cache for the "hottest" discussions to mitigate the performance degradation of the main storage.

### Notification storage

Notification storage depends on the product decisions:

-   do we need to guarantee at least one notification;
-   should we notify only "online" users;
-   what's the SLA for delivering notifications;
-   do we need other channels of the notifications.

In this solution we assume that we need to notify users once we have updates for them and they are signed-in.
If they are not signed-in, we keep notifications for them in memory.
If we need stronger guarantees (preserve notifications if app crashed), we would need to use a durable DB.
If it's fine to lose some notifications, we can use a fast in-memory DB (e.g., Redis) with Pub-Sub pattern.

In the case of the further growth, we can extract notification functionality into a separate process/service
to avoid affecting discussion functionality performance.
