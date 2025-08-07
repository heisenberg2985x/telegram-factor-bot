// server.js
const TelegramBot = require('node-telegram-bot-api');

// 🔐 Inserisci il tuo token qui
const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// 🗃️ Mappa per tenere traccia dei giocatori in attesa di prezzo
const waitingForPrice = new Map();

// 📩 Quando riceve un messaggio testuale
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Se è in attesa del prezzo per un giocatore
  if (waitingForPrice.has(chatId)) {
    const { factor, playerId } = waitingForPrice.get(chatId);
    const price = parseFloat(text.replace(',', '.'));

    if (!isNaN(price) && factor !== 0) {
      const ratio = price / factor;
      bot.sendMessage(chatId, `💰 Prezzo/Factor per ID ${playerId}: ${ratio.toFixed(2)}`);
    } else {
      bot.sendMessage(chatId, '⚠️ Prezzo non valido. Riprova.');
      return;
    }

    waitingForPrice.delete(chatId);
  }
});

// 📥 Gestione delle callback dei pulsanti
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith('insert_')) {
    const parts = data.split('_');
    const playerId = parts[1];
    const factor = parseFloat(parts[2]);

    waitingForPrice.set(chatId, { factor, playerId });

    bot.sendMessage(chatId, `✍️ Invia il prezzo per il giocatore ID ${playerId}`);
  }
});

// ✅ Funzione esportata per inviare messaggi dal client HTML
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/send-player', (req, res) => {
  const { chatId, playerId, name, ratio, wages, value, factor } = req.body;

  const text = `👤 ID: ${playerId} - ${name}\n` +
    `Ratio: ${ratio.toFixed(3)} | Wages: ${wages} | Value: ${value}\n` +
    `Factor: ${factor.toFixed(5)}`;

  const opts = {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '💸 Inserisci prezzo',
          callback_data: `insert_${playerId}_${factor}`
        }
      ]]
    }
  };

  bot.sendMessage(chatId, text, opts);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🤖 Bot server running on port ${PORT}`);
});
