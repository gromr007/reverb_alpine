export default function chatComponent() {

    // Явно сохраняем значения env на уровне функции для Alpine
    const apiUrl = import.meta.env.VITE_API_URL || 'Не задано';
    const wsHost = import.meta.env.VITE_REVERB_HOST || 'localhost'; // Изменено
    const wsPort = import.meta.env.VITE_REVERB_PORT || '6001';      // Изменено
    const currentToken = localStorage.getItem('alpine_auth_token') || import.meta.env.VITE_TOKEN_CHAT_BACK;
      
    return {
        messageInput: '',
        authUserId: null,
        chatRoomId: 1,
        messages: [],
        isLoading: false,
        token: localStorage.getItem('alpine_auth_token') || import.meta.env.VITE_TOKEN_CHAT_BACK,

        envApiUrl: apiUrl,
        envWsHost: wsHost,
        envWsPort: wsPort,
        envHasToken: !!currentToken,

        async init() {
            console.log('Инициализация Alpine чата...');
            await this.loadChatData();
            this.initEcho();
        },

        async loadChatData() {
            this.isLoading = true;
            try {
                const response = await window.axios.get(
                    `${import.meta.env.VITE_API_URL}/api/chat/1`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.token}`,
                            'Accept': 'application/json',
                        }
                    }
                );

                this.authUserId = response.data.user_id;
                this.chatRoomId = response.data.chat_room_id;
                // Заполняем массив сообщениями из базы
                this.messages = response.data.messages || [];

                console.log('История загружена:', this.messages);
            } catch (err) {
                console.error('Ошибка API:', err);
            } finally {
                this.isLoading = false;
            }
        },

        initEcho() {
            // Echo уже настроен в bootstrap.js / echo.js
            // Но мы можем переинициализировать его здесь, если нужно динамически менять заголовки

            window.Echo.join(`chat.${this.chatRoomId}`)
                .here((users) => console.log('Онлайн:', users))
                .listen('NewMessage', (e) => {
                    console.log('Новое сообщение по сокету:', e);

                    // console.log('-1-');
                    // console.log(Number(e.user?.id));
                    // console.log(Number(e.from?.id));
                    // console.log(Number(this.authUserId));
                    // console.log('-1-');

                    // Если id отправителя совпадает с моим — игнорируем (уже добавили вручную)
                    //if (Number(e.user?.id) === Number(this.authUserId)) return;
                    //if (Number(e.from?.id) === Number(this.authUserId)) return;

                    this.messages.push({
                        id: Date.now(),
                        text: e.text || e.message || 'Текст отсутствует',
                        from: e.user || e.from,
                        //text: e.text,
                        //from: e.user, // В Vue у тебя структура message.from.name
                        created_at: new Date().toISOString()
                    });
                })
                .listenForWhisper('NewMessageFromClient', (e) => {

// console.log('-2-');
// console.log(Number(e.user?.id));
// console.log(Number(this.authUserId));
// console.log('-2-');

                    // Если id отправителя совпадает с моим — игнорируем (уже добавили вручную)
                    // if (Number(e.user?.id) === Number(this.authUserId)) return;

                    this.messages.push({
                        id: Date.now(),
                        text: e.message,
                        from: { id: 0, name: 'Client Direct' },
                        created_at: new Date().toISOString()
                    });
                });
        },

        // Группировка сообщений (аналог computed из Vue)
        get groupedMessages() {
            return this.messages.reduce((groups, message) => {
                const date = new Date(message.created_at).toLocaleDateString();
                if (!groups[date]) groups[date] = [];
                groups[date].push(message);
                return groups;
            }, {});
        },

        // Добавляем отсутствующий метод
        async sendMessageSocket() {
            if (!this.messageInput.trim()) return;

            console.log('Отправка через Whisper...');

            try {
                // Whisper работает только в Presence или Private каналах
                window.Echo.join(`chat.${this.chatRoomId}`)
                    .whisper('NewMessageFromClient', {
                        message: this.messageInput,
                        chat_room_id: this.chatRoomId,
                        // Передаем данные о себе, так как сервер в этом не участвует
                        user: {
                            id: this.authUserId,
                            name: 'Alpine'
                        }
                    });

                // Whisper не прилетает отправителю, поэтому добавляем в массив вручную
                // Отключил из за дублирования, у нас бекенд сам отправляет в канал всем это сообщение
                // this.messages.push({
                //     id: Date.now(),
                //     text: this.messageInput,
                //     from: { id: this.authUserId, name: 'Me (Socket)' },
                //     created_at: new Date().toISOString(),
                //     type: 'whisper' // пометка для себя
                // });

                this.messageInput = '';
            } catch (error) {
                console.error('Ошибка Whisper:', error);
            }
        },

        async sendMessageAxios() {
            if (!this.messageInput.trim()) return;
            try {
                await window.axios.post(`${import.meta.env.VITE_API_URL}/api/send_message`, {
                    chat_room_id: this.chatRoomId,
                    message: this.messageInput,
                }, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                this.messageInput = '';
            } catch (e) { console.error(e); }
        }
    }
}
