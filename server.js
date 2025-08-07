const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!TOKEN || !CHAT_ID) {
  console.error('TELEGRAM_TOKEN o CHAT_ID non sono definiti nelle variabili di ambiente.');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

const waitingForPrice = {};

app.use(express.json());

app.post('/send-player', (req, res) => {
  const { player_id, name, wages, value, ratio, factor } = req.body;

  const text = `👤 ID: ${player_id} - ${name}\nRatio: ${ratio} | Wages: ${wages} | Value: ${value}\nFactor: ${factor}`;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '💰 Inserisci prezzo',
            callback_data: `price_${player_id}_${factor}`,
          },
        ],
      ],
    },
  };

  bot.sendMessage(CHAT_ID, text, opts);
  res.sendStatus(200);
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const [_, playerId, factor] = query.data.split('_');

  waitingForPrice[chatId] = { playerId, factor };
  bot.sendMessage(chatId, `💬 Invia ora il prezzo per il giocatore ${playerId}`);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userInput = msg.text;

  if (waitingForPrice[chatId]) {
    const { playerId, factor } = waitingForPrice[chatId];
    const price = parseFloat(userInput.replace(',', '.'));

    if (!isNaN(price)) {
      const result = price / parseFloat(factor);
      bot.sendMessage(chatId, `📊 Prezzo/Factor per ${playerId} = ${result.toFixed(2)}`);
    } else {
      bot.sendMessage(chatId, `⚠️ Inserisci un numero valido.`);
    }

    delete waitingForPrice[chatId];
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server avviato su porta ${PORT}`);
});
