require('dotenv').config();

const web3 = require('@solana/web3.js');
const storage = require('node-persist');
const base58 = require('bs58');
const { getTokenAccounts } = require('./Helius');
const connection = new web3.Connection("https://mainnet.helius-rpc.com/?api-key=7ee5ade7-805f-4c9f-8252-f370010985aa");
storage.init();

const startReplyMarkup = {
    inline_keyboard: [
        [{ text: "Buy", callback_data: "buy" }, { text: "Sell & Manage", callback_data: "sell" }],
        [{ text: "Help", callback_data: "help" }, { text: "Refer Friends", callback_data: "refer" }, { text: "Alerts", callback_data: "alerts" }],
        [{ text: "Wallet", callback_data: "wallet" }, { text: "Settings", callback_data: "setting" }],
        [{ text: "Pin", callback_data: "pin" }, { text: "Refresh", callback_data: "refresh_home" }]
    ],
};

/**
 * Handles the home screen functionality for the BonkBot Telegram bot.
 *
 * This function is responsible for managing the user's Solana wallet, checking their
 * SOL balance, and displaying the appropriate home screen message based on the user's
 * wallet status and balance.
 *
 * @param {string} chatId - The unique identifier for the Telegram chat.
 * @param {object} bot - The Telegram bot instance.
 * @param {number} msgId - The message ID of the previous home screen message (if any).
 * @returns {Promise<void>} - A Promise that resolves when the home screen message is sent or updated.
 */
const home = async (chatId, bot, msgId) => {
    storage.getItem(`userWallet_${chatId}`).then(async (userWallet) => {
        let txt = `<b>Welcome to BonkBot!</b>\n\n`;

        if (!userWallet) {
            const wallet = await web3.Keypair.generate();
            const publicKey = wallet.publicKey.toBase58();
            const privateKey = base58.encode(wallet.secretKey).toString();
            userWallet = {
                publicKey: publicKey,
                privateKey: privateKey,
                settings: {
                    announcements: "enable",
                    minpos: "0.001",
                    autoset: "disable",
                    autoSOL: "0.1",
                    buyleftset: "1",
                    buyrightset: "5",
                    sellleftset: "25",
                    sellrightset: "100",
                    slippagebuy: "10",
                    slippagesell: "10",
                    maximpct: "25",
                    secure: "Secure",
                    translevel: "Medium",
                    transval: "0.001",
                },
            };
            await storage.setItem(`userWallet_${chatId}`, userWallet);
            txt +=
                `Solana's fastest bot to trade any coin (SPL token), and BONK's official Telegram trading bot.\n\n` +
                `You currently have no SOL balance. To get started with trading, send some SOL to your bonkbot wallet address:\n\n` +
                `<code>${userWallet.publicKey}</code>(tap to copy)\n\n` +
                `Once done tap refresh and your balance will appear here.\n\n` +
                `To buy a token just enter a token address, or even post the birdeye link of the coin.\n\n` +
                `For more info on your wallet and to retrieve your private key, tap the wallet button below.` +
                `We guarantee the safety of user funds on BONKbot, but if you expose your private key your funds will not be safe.`;
        } else {
            const balance = await connection.getBalance(
                new web3.PublicKey(userWallet.publicKey)
            );
            const sell_data = await getTokenAccounts(userWallet.publicKey);
            const sol_balance = balance / web3.LAMPORTS_PER_SOL;
            if (sol_balance > 0) {
                if (sell_data.total > 0) {
                    txt +=
                        `You currently have a balance of <b>${sol_balance.toFixed(
                            4
                        )}</b> SOL, and <b>${sell_data.total}</b> open positions.\n\n` +
                        `To buy a token just enter a token address or paste a Birdeye link,` +
                        ` and you will see a Buy dashboard pop up where you can choose how much you want to buy.\n\n` +
                        `Advanced traders can enable Auto Buy in their settings. When enabled,` +
                        ` BONKbot will instantly buy any token you enter with a fixed amount that you set.` +
                        ` This is <b>disabled</b> by default.\n\n` +
                        `Wallet:\n<code>${userWallet.publicKey}</code>`;
                } else {
                    txt +=
                        `You currently have a balance of <b>${sol_balance.toFixed(
                            4
                        )}</b> SOL, but no open positions.\n\n` +
                        `To get started trading, you can open a position by buying a token.\n\n` +
                        `To buy a token just enter a token address or paste a Birdeye link,` +
                        ` and you will see a Buy dashboard pop up where you can choose how much you want to buy.\n\n` +
                        `Advanced traders can enable Auto Buy in their settings. When enabled,` +
                        ` BONKbot will instantly buy any token you enter with a fixed amount that you set.` +
                        ` This is <b>disabled</b> by default.\n\n` +
                        `Wallet:\n<code>${userWallet.publicKey}</code>`;
                }
            } else {
                txt +=
                    `Solana's fastest bot to trade any coin (SPL token), and BONK's official Telegram trading bot.\n\n` +
                    `You currently have no SOL balance. To get started with trading, send some SOL to your bonkbot wallet address:\n\n` +
                    `<code>${userWallet.publicKey}</code>(tap to copy)\n\n` +
                    `Once done tap refresh and your balance will appear here.\n\n` +
                    `To buy a token just enter a token address, or even post the birdeye link of the coin.\n\n` +
                    `For more info on your wallet and to retrieve your private key, tap the wallet button below.` +
                    `We guarantee the safety of user funds on BONKbot, but if you expose your private key your funds will not be safe.`;
            }
        }
        if (!msgId) {
            bot.sendMessage(chatId, txt, {
                reply_markup: startReplyMarkup,
                parse_mode: "html",
            });
        } else {
            bot.editMessageText(txt, {
                chat_id: chatId,
                message_id: msgId,
                reply_markup: startReplyMarkup,
                parse_mode: "html",
            });
        }
    });
};

module.exports = {
    home
}