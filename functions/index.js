const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {Telegraf} = require("telegraf");

admin.initializeApp();
const bot = new Telegraf(functions.config().telegram.token, {
  telegram: {webhookReply: true},
});

// error handling
bot.catch((err, ctx) => {
  functions.logger.error("[Bot] Error", err);
  return ctx.reply(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

// initialize the commands
bot.command("/start", (ctx) => ctx.reply("Hello! Send me a message."));
// record every message and reply to user
bot.on("message", async (ctx) => {
  await admin.firestore().collection("messages").add(ctx.message);
  ctx.reply("Oki, I'll post it on GitHub 😘");
});

// handle all telegram updates with HTTPs trigger
exports.mysBot = functions.https.onRequest(async (request, response) => {
  functions.logger.log("Incoming message", request.body);
  return await bot.handleUpdate(request.body, response).then((rv) => {
    // if it's not a request from the telegram, rv will be undefined,
    // but we should respond with 200
    return !rv && response.sendStatus(200);
  });
});

// List updates in Firestore
exports.listUpdates = functions.https.onRequest(async (request, response) => {
  functions.logger.log("Incoming message", request.body);
  let updates = "";
  await admin.firestore().collection("messages").orderBy("date", "desc")
      .limit(20).get()
      .then((querySnapshot) => querySnapshot.forEach((messageSnapshot) => {
        const message = messageSnapshot.data();
        const date = new Date(message.date * 1000);
        const formattedDate = date.getFullYear() + "-" + (date.getMonth() + 1) +
         "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes();
        updates += "- " + formattedDate + ": " + message.text + "\n";
      }));
  response.json({markdown: updates});
});
