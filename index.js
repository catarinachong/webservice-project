const express = require("express");
const app = express();

const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");

app.use(cors());
app.use(morgan("combined"));
app.use(bodyParser.raw({ type: "*/*" }));

app.get("/sourcecode", (req, res) => {
  res.send(
    require("fs")
      .readFileSync(__filename)
      .toString()
  );
});

let passwords = new Map();
let tokens = new Map();
let channels = new Map();
let joins = new Map();
let bans = new Map();

let join = [];
let ban = [];
let message = [];

//unique token
let counter = 23;
let genToken = () => {
  counter = counter + 1;
  return "some-unique-token-" + counter + "l4";
};

app.post("/signup", (req, res) => {
  let parsedBody = JSON.parse(req.body);

  if (!parsedBody.password) {
    res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
    return;
  }
  if (!parsedBody.username) {
    res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
    return;
  }
  if (passwords.has(parsedBody.username)) {
    res.send(JSON.stringify({ success: false, reason: "Username exists" }));
    return;
  }
  passwords.set(parsedBody.username, parsedBody.password);
  res.send(JSON.stringify({ success: true }));
});

app.post("/login", (req, res) => {
  let parsedBody = JSON.parse(req.body);
  let usr = parsedBody.username;
  let actualPassword = parsedBody.password;
  let expectPassword = passwords.get(usr);
  let token = genToken();

  // If the password property is missing from the request body
  if (!actualPassword) {
    res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
    return;
  }
  // If the username is missing
  if (!parsedBody.username) {
    res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
    return;
  }
  // If the username doesn't exist
  if (!passwords.has(usr)) {
    res.send(JSON.stringify({ success: false, reason: "User does not exist" }));
    return;
  }
  // If the password is incorrect
  if (actualPassword !== expectPassword) {
    res.send(JSON.stringify({ success: false, reason: "Invalid password" }));
    return;
  }
  // If a user has signed up with that username and password
  tokens.set(token, parsedBody.username);
  res.send(JSON.stringify({ success: true, token: token }));
});

app.post("/create-channel", (req, res) => {
  let parsedBody = JSON.parse(req.body);

  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the channelName property is missing from the request body
  if (!parsedBody.channelName) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }
  //If a channel with the same name already exists
  if (channels.has(parsedBody.channelName)) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel already exists" })
    );
    return;
  }

  channels.set(parsedBody.channelName, req.header("token"));
  res.send(JSON.stringify({ success: true }));
});

app.post("/join-channel", (req, res) => {
  let parsedBody = JSON.parse(req.body);

  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the channelName property is missing from the request body
  if (!parsedBody.channelName) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }
  //If a channel does not exist
  if (!channels.has(parsedBody.channelName)) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel does not exist" })
    );
    return;
  }

  let arrTokens = [];
  for (const item of join) {
    if (item.channel === parsedBody.channelName) {
      arrTokens.push(item.token);
    }
  }

  //If a user had joined the channel
  let userExist = 0;
  for (let i = 0; i < arrTokens.length; i++) {
    if (arrTokens[i] === req.header("token")) {
      userExist += 1;
    }
  }
  if (userExist > 0) {
    res.send(
      JSON.stringify({ success: false, reason: "User has already joined" })
    );
    return;
  }

  //If a user is banned from the channel
  ban.some(item => {
    if (
      item.token === req.header("token") &&
      item.channel === parsedBody.channelName
    )
      res.send(JSON.stringify({ success: false, reason: "User is banned" }));
  });

  //Join the channel
  join.push({
    token: req.header("token"),
    channel: parsedBody.channelName
  });

  // joins.set(req.header("token"), parsedBody.channelName);
  res.send(JSON.stringify({ success: true }));
});

app.post("/leave-channel", (req, res) => {
  let parsedBody = JSON.parse(req.body);

  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the channelName property is missing from the request body
  if (!parsedBody.channelName) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }
  //If a channel does not exist
  if (!channels.has(parsedBody.channelName)) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel does not exist" })
    );
    return;
  }

  let arrTokens = [];
  for (const item of join) {
    if (item.channel === parsedBody.channelName) {
      arrTokens.push(item.token);
    }
  }

  //If a user had joined the channel
  let userExist = 0;
  for (let i = 0; i < arrTokens.length; i++) {
    if (arrTokens[i] === req.header("token")) {
      userExist += 1;
    }
  }
  if (userExist === 0) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "User is not part of this channel"
      })
    );
    return;
  }

  //Leave the channel
  join.some(item => {
    if (
      item.token === req.header("token") &&
      item.channel === parsedBody.channelName
    )
      join.splice(join.indexOf(item), 1);
  });

  res.send(JSON.stringify({ success: true }));
});

app.get("/joined", (req, res) => {
  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }
  //If a channel does not exist
  if (!channels.has(req.query.channelName)) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel does not exist" })
    );
    return;
  }

  let arrTokens = [];
  for (const item of join) {
    if (item.channel === req.query.channelName) {
      arrTokens.push(item.token);
    }
  }

  //If a user had joined the channel
  let userExist = 0;
  for (let i = 0; i < arrTokens.length; i++) {
    if (arrTokens[i] === req.header("token")) {
      userExist += 1;
    }
  }
  if (userExist === 0) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "User is not part of this channel"
      })
    );
    return;
  }

  const arrUsers = [];
  for (let i = 0; i < arrTokens.length; i++) {
    for (const [k, v] of tokens.entries()) {
      if (arrTokens[i] === k) {
        arrUsers.push(v);
      }
    }
  }
  res.send(JSON.stringify({ success: true, joined: arrUsers }));
});

app.post("/delete", (req, res) => {
  let parsedBody = JSON.parse(req.body);

  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the channelName property is missing from the request body
  if (!parsedBody.channelName) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }
  //If a channel does not exist
  if (!channels.has(parsedBody.channelName)) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel does not exist" })
    );
    return;
  }

  //Delete channel - Only the person who created the channel can delete
  let requestUser = req.header("token");
  let expectUser = channels.get(parsedBody.channelName);
  if (requestUser === expectUser) {
    channels.delete(parsedBody.channelName, req.header("token"));
    res.send(JSON.stringify({ success: true }));
    return;
  }
});

app.post("/kick", (req, res) => {
  let parsedBody = JSON.parse(req.body);

  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the channelName property is missing from the request body
  if (!parsedBody.channelName) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  //If the target property is missing from the request body
  if (!parsedBody.target) {
    res.send(
      JSON.stringify({ success: false, reason: "target field missing" })
    );
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }
  //If the user associated with the token did not create the channel
  let requestCreator = req.header("token");
  let expectCreator = channels.get(parsedBody.channelName);
  if (requestCreator !== expectCreator) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel not owned by user" })
    );
    return;
  }

  //kick
  let target = tokens.get(parsedBody.target);
  //remove item
  const itemToBeRemoved = { token: target, channel: parsedBody.channelName };
  join.splice(join.findIndex(a => a.token === itemToBeRemoved.token), 1);

  res.send(JSON.stringify({ success: true }));
});

app.post("/ban", (req, res) => {
  let parsedBody = JSON.parse(req.body);

  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the channelName property is missing from the request body
  if (!parsedBody.channelName) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  //If the target property is missing from the request body
  if (!parsedBody.target) {
    res.send(
      JSON.stringify({ success: false, reason: "target field missing" })
    );
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }
  //If the user associated with the token did not create the channel
  let requestCreator = req.header("token");
  let expectCreator = channels.get(parsedBody.channelName);
  if (requestCreator !== expectCreator) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel not owned by user" })
    );
    return;
  }

  //ban
  let target = tokens.get(parsedBody.target);
  // bans.set(target, parsedBody.channelName);
  ban.push({ token: target, channel: parsedBody.channelName });
  res.send(JSON.stringify({ success: true }));
});

app.post("/message", (req, res) => {
  let parsedBody = JSON.parse(req.body);

  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }
  //If the channelName property is missing from the request body
  if (!parsedBody.channelName) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  //If the contents property is missing from the request body
  if (!parsedBody.contents) {
    res.send(
      JSON.stringify({ success: false, reason: "contents field missing" })
    );
    return;
  }

  //A list of users in the channel
  let arrTokens = [];
  for (const item of join) {
    if (item.channel === parsedBody.channelName) {
      arrTokens.push(item.token);
    }
  }

  //If a user had joined the channel
  let userExist = 0;
  for (let i = 0; i < arrTokens.length; i++) {
    if (arrTokens[i] === req.header("token")) {
      userExist += 1;
    }
  }
  if (userExist === 0) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "User is not part of this channel"
      })
    );
    return;
  }

  let user = tokens.get(req.header("token"));
  let destination = parsedBody.channelName;
  let content = parsedBody.contents;
  message.push({
    from: user,
    to: destination,
    contents: content
  });
  res.send(JSON.stringify({ success: true }));
});

app.get("/messages", (req, res) => {
  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the channelName query parameter is missing
  if (!req.query.channelName) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field is missing" })
    );
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }
  //If a channel does not exist
  if (!channels.has(req.query.channelName)) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel does not exist" })
    );
    return;
  }
  //If the user is not a part of that channel
  let actualChannel = req.query.channelName;
  let expectChannel = joins.get(req.header("token"));
  if (actualChannel !== expectChannel) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "User is not part of this channel"
      })
    );
    return;
  }

  let messages = [];
  for (let i = 0; i < message.length; i++) {
    let m = message[i];
    if (m.to === req.query.channelName) {
      delete m.to;
      messages.push(m);
    }
  }
  res.send(JSON.stringify({ success: true, messages: messages }));
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})
// listen for requests :)
app.listen(process.env.PORT || 3000)
