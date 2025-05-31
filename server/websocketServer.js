// server/websocketServer.js
const WebSocket = require('ws');
const db = require('./db'); // Шлях до db.js
const { authenticateWebSocket } = require('./middleware/auth');

const clients = new Map();
const onlineAdmins = new Set();
let wssInstance = null;

// Функція, яка буде обробляти та розсилати повідомлення, незалежно від джерела (WS чи HTTP)
async function processAndBroadcastChatMessage(messagePayload, wsBroadcasterInstance = null) {
    const { text, targetAccountId, // для повідомлення від адміна конкретному юзеру
            senderAccountId, senderRole: originalSenderRole // інформація про відправника (встановлюється або з clientInfo, або передається з HTTP)
          } = messagePayload;

    // Мапування originalSenderRole на дозволені значення ENUM ('user', 'admin')
    let mappedSenderType;
    if (originalSenderRole === 'admin') {
        mappedSenderType = 'admin';
    } else { // 'student', 'supervisor', або будь-яка інша не-адмінська роль вважається 'user'
        mappedSenderType = 'user';
    }

    const conversationAccountId = (originalSenderRole === 'admin' && targetAccountId) ? targetAccountId : senderAccountId;
    const receiverId = (originalSenderRole === 'admin' && targetAccountId) ? targetAccountId : null; // null -> йде до "пулу адмінів"

    const messageDataToSave = {
        sender_type: mappedSenderType, // Використовуємо змаплене значення
        sender_id: senderAccountId,
        account_id: conversationAccountId,
        message_text: text.trim(),
        receiver_id: receiverId,
        timestamp: new Date(),
        is_read: 0
    };

    try {
        const [result] = await db.query(
            "INSERT INTO support_messages (sender_type, sender_id, account_id, message_text, receiver_id, timestamp, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [messageDataToSave.sender_type, messageDataToSave.sender_id, messageDataToSave.account_id, messageDataToSave.message_text, messageDataToSave.receiver_id, messageDataToSave.timestamp, messageDataToSave.is_read]
        );

        const messageToSendToClients = {
            type: 'new_chat_message',
            message_id: result.insertId,
            sender_type: messageDataToSave.sender_type, // Надсилаємо змаплений тип
            original_sender_role: originalSenderRole, // Опціонально: надсилаємо оригінальну роль клієнту
            sender_id: messageDataToSave.sender_id,
            account_id: messageDataToSave.account_id,
            message_text: messageDataToSave.message_text,
            timestamp: messageDataToSave.timestamp.toISOString(),
            is_read: messageDataToSave.is_read
        };

        const broadcaster = wsBroadcasterInstance || getWebSocketBroadcaster(); // Використовуємо переданий або отримуємо новий

        // Розсилка через WebSocket
        // 1. Самому собі (відправнику)
        broadcaster.broadcastToAccount(senderAccountId, messageToSendToClients);

        // 2. Одержувачу/адмінам
        if (originalSenderRole === 'admin' && targetAccountId) {
            broadcaster.broadcastToAccount(targetAccountId, messageToSendToClients);
        } else if (originalSenderRole !== 'admin') {
            broadcaster.broadcastToAdmins(messageToSendToClients, senderAccountId); // Виключаючи самого себе, якщо це адмін, що пише як юзер (малоймовірно)
        }

        // Оновлення списків бесід
        if (originalSenderRole !== 'admin') {
            broadcaster.notifyAdminsConversationUpdate(conversationAccountId);
        } else if (targetAccountId) { // Якщо адмін написав користувачу
            // Можливо, потрібно оновити список бесід для цього адміна (якщо це не відбувається на клієнті)
            // broadcaster.broadcastToAccount(senderAccountId, { type: 'update_conversation_list', forAccountId: conversationAccountId });
        }
        return messageToSendToClients; // Повертаємо оброблене повідомлення
    } catch (error) {
        console.error('Помилка processAndBroadcastChatMessage:', error);
        throw error; // Передаємо помилку далі для обробки
    }
}


function initializeWebSocketServer(httpServer) {
    wssInstance = new WebSocket.Server({ server: httpServer });

    wssInstance.on('connection', async (ws, req) => {
        let clientInfo = null;

        const handleAuth = async (token) => {
            try {
                const user = await authenticateWebSocket(token);
                if (user) {
                    clientInfo = user;
                    clients.set(clientInfo.accountId, ws);
                    if (clientInfo.role === 'admin') {
                        onlineAdmins.add(clientInfo.accountId);
                    }
                    ws.send(JSON.stringify({ type: 'auth_success', message: 'Аутентифікація успішна' }));
                } else {
                    throw new Error('Недійсний токен');
                }
            } catch (error) {
                ws.send(JSON.stringify({ type: 'auth_failure', message: 'Помилка аутентифікації: ' + error.message }));
                ws.terminate();
            }
        };

        ws.on('message', async (message) => {
            let parsedMessage;
            try {
                parsedMessage = JSON.parse(message.toString());
            } catch (e) {
                ws.send(JSON.stringify({ type: 'error', content: 'Неправильний формат повідомлення.' }));
                return;
            }

            if (parsedMessage.type === 'auth' && parsedMessage.token) {
                await handleAuth(parsedMessage.token);
                return;
            }

            if (!clientInfo) {
                ws.send(JSON.stringify({ type: 'error', content: 'Клієнт не аутентифікований.' }));
                return;
            }

            const { accountId: senderAccountId, role: senderRole } = clientInfo; // senderRole тут буде 'student', 'admin', etc.

            if (parsedMessage.type === 'chat_message') {
                const { text, targetAccountId } = parsedMessage;
                if (!text || text.trim() === '') {
                    ws.send(JSON.stringify({ type: 'error', content: 'Повідомлення не може бути порожнім.' }));
                    return;
                }
                try {
                    await processAndBroadcastChatMessage({
                        text: text,
                        targetAccountId: targetAccountId,
                        senderAccountId: senderAccountId,
                        senderRole: senderRole // Передаємо оригінальну роль
                    });
                } catch (error) {
                     ws.send(JSON.stringify({ type: 'error', content: 'Не вдалося обробити ваше повідомлення на сервері.' }));
                }

            } else if (parsedMessage.type === 'mark_messages_as_read') {
                // senderRole тут - роль того, хто відправив 'mark_messages_as_read', тобто адміна
                if (senderRole === 'admin' && parsedMessage.chattingWithAccountId) {
                    try {
                        await db.query(
                            // Адмін прочитав повідомлення від користувача. sender_type != 'admin' означає повідомлення від 'user'
                            "UPDATE support_messages SET is_read = 1 WHERE account_id = ? AND sender_type != 'admin' AND is_read = 0",
                            [parsedMessage.chattingWithAccountId]
                        );
                        ws.send(JSON.stringify({ type: 'messages_marked_read_ack', targetAccountId: parsedMessage.chattingWithAccountId }));

                        const broadcaster = getWebSocketBroadcaster();
                        broadcaster.notifyAdminsConversationUpdate(parsedMessage.chattingWithAccountId);

                    } catch (error) {
                        console.error('Помилка позначення повідомлень як прочитаних (WS):', error);
                        ws.send(JSON.stringify({ type: 'error', content: 'Не вдалося позначити повідомлення як прочитані.' }));
                    }
                }
            }
        });

        ws.on('close', () => {
            if (clientInfo) {
                clients.delete(clientInfo.accountId);
                if (clientInfo.role === 'admin') {
                    onlineAdmins.delete(clientInfo.accountId);
                }
            }
        });
        ws.onerror = (error) => {
            console.error("WebSocket помилка для клієнта:", clientInfo ? clientInfo.accountId : 'невідомий', error);
        };
    });
}

function getWebSocketBroadcaster() {
    if (!wssInstance) {
        console.error("WSS instance not initialized when getting broadcaster!");
        return {
            broadcastToAccount: () => {},
            broadcastToAdmins: () => {},
            notifyAdminsConversationUpdate: () => {},
            processAndRelayHttpMessage: async () => { throw new Error("WSS not ready"); }
        };
    }
    return {
        broadcastToAccount: (accountId, messageObject) => {
            const recipientWs = clients.get(accountId);
            if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                recipientWs.send(JSON.stringify(messageObject));
            }
        },
        broadcastToAdmins: (messageObject, excludeAdminId = null) => {
            onlineAdmins.forEach(adminAccountId => {
                if (excludeAdminId && adminAccountId === excludeAdminId) return;
                const adminWs = clients.get(adminAccountId);
                if (adminWs && adminWs.readyState === WebSocket.OPEN) {
                    adminWs.send(JSON.stringify(messageObject));
                }
            });
        },
        notifyAdminsConversationUpdate: (forAccountId) => {
            onlineAdmins.forEach(adminId => {
                const adminWs = clients.get(adminId);
                if (adminWs && adminWs.readyState === WebSocket.OPEN) {
                    adminWs.send(JSON.stringify({ type: 'update_conversation_list', forAccountId: forAccountId }));
                }
            });
        },
        processAndRelayHttpMessage: async (messagePayloadFromHttp) => {
            return processAndBroadcastChatMessage(messagePayloadFromHttp, getWebSocketBroadcaster());
        }
    };
}

module.exports = { initializeWebSocketServer, getWebSocketBroadcaster };