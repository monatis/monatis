const functions = require("firebase-functions");
const {Telegraf} = require("telegraf");

const bot = new Telegraf(functions.config().telegram.token, {
  telegram: {webhookReply: true},
});

// error handling
bot.catch((err, ctx) => {
  functions.logger.error("[Bot] Error", err);
  return ctx.reply(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

// initialize the commands
bot.command("/start", (ctx) => ctx.reply("Hello! Send a message."));
// copy every message and send to the user
bot.on("message", (ctx) => ctx.telegram.sendCopy(ctx.chat.id, ctx.message));

// handle all telegram updates with HTTPs trigger
exports.echoBot = functions.https.onRequest(async (request, response) => {
  functions.logger.log("Incoming message", request.body);
  return await bot.handleUpdate(request.body, response).then((rv) => {
    // if it's not a request from the telegram, rv will be undefined,
    // but we should respond with 200
    return !rv && response.sendStatus(200);
  });
});
