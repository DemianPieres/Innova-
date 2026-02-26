/**
 * Chatbot MilO IA - Flujo por botones
 * Menú separado del chat. "Envíanos un mensaje" abre el chat.
 * Animación typing (3 puntos) ~3 segundos antes de respuestas.
 */

(function() {
    'use strict';

    const TYPING_DELAY_MS = 3000;
    const TICKET_SUCCESS_MSG = 'Tu consulta fue enviada correctamente. Un agente se pondrá en contacto contigo.';

    let ticketsDB = [];

    const FLOW_RESPONSES = {
        'como-compro': {
            text: '¡Es muy fácil! Navegá por nuestro catálogo, agregá los productos al carrito y al finalizá la compra elegí el método de pago. Aceptamos tarjetas, transferencia y efectivo.',
            nextOptions: [
                { id: 'como-pago', text: '¿Cómo pago?', type: 'dark' },
                { id: 'envios', text: '¿Cómo son los envíos?', type: 'dark' },
                { id: 'volver-menu', text: 'Ir al menú', type: 'light' }
            ]
        },
        'es-seguro': {
            text: 'Sí, es 100% seguro. Trabajamos con métodos de pago verificados y protegemos tus datos. Además, tenemos garantía de 30 días en todos nuestros productos.',
            nextOptions: [
                { id: 'como-compro', text: '¿Cómo compro en la página?', type: 'dark' },
                { id: 'hablar-agente', text: 'Quiero hablar con un agente', type: 'dark' },
                { id: 'volver-menu', text: 'Ir al menú', type: 'light' }
            ]
        },
        'pedido-no-llego': {
            text: 'Lamentamos lo ocurrido. ¿Tu pedido figura como enviado?',
            nextOptions: [
                { id: 'pedido-si-enviado', text: 'Sí', type: 'dark' },
                { id: 'pedido-no-enviado', text: 'No', type: 'dark' },
                { id: 'volver-menu', text: 'Ir al menú', type: 'light' }
            ]
        },
        'pedido-si-enviado': {
            text: 'Si ya fue enviado, podés rastrear tu pedido con el número de seguimiento que te enviamos por email. Si pasaron más de 5 días hábiles, contactá a un agente para que revise tu caso.',
            nextOptions: [
                { id: 'hablar-agente', text: 'Quiero hablar con un agente', type: 'dark' },
                { id: 'volver-menu', text: 'Ir al menú', type: 'light' }
            ]
        },
        'pedido-no-enviado': {
            text: 'Tu pedido podría estar en preparación. Te recomendamos esperar 24-48 horas. Si sigue sin actualizarse, un agente puede ayudarte a verificar el estado.',
            nextOptions: [
                { id: 'hablar-agente', text: 'Quiero hablar con un agente', type: 'dark' },
                { id: 'volver-menu', text: 'Ir al menú', type: 'light' }
            ]
        },
        'hablar-agente': {
            text: TICKET_SUCCESS_MSG,
            createTicket: true,
            tipoConsulta: 'Contacto con agente',
            nextOptions: [{ id: 'volver-menu', text: 'Ir al menú', type: 'light' }]
        },
        'enviar-mensaje': {
            text: TICKET_SUCCESS_MSG,
            createTicket: true,
            tipoConsulta: 'Consulta general',
            nextOptions: []
        },
        'como-pago': {
            text: 'Aceptamos tarjetas de crédito/débito, transferencia bancaria y efectivo al retirar. El pago se realiza de forma segura al finalizar tu compra.',
            nextOptions: [{ id: 'volver-menu', text: 'Ir al menú', type: 'light' }]
        },
        'envios': {
            text: 'Realizamos envíos a todo el país. El envío es gratis superando $60.000. Los tiempos varían según la zona, generalmente 3-7 días hábiles.',
            nextOptions: [{ id: 'volver-menu', text: 'Ir al menú', type: 'light' }]
        },
        'volver-menu': {
            text: '¿En qué más podemos ayudarte?',
            resetToMenu: true,
            nextOptions: [
                { id: 'como-compro', text: '¿Cómo compro en la página?', type: 'dark' },
                { id: 'es-seguro', text: '¿Es seguro comprar aquí?', type: 'dark' },
                { id: 'pedido-no-llego', text: 'Mi pedido no llegó', type: 'dark' },
                { id: 'hablar-agente', text: 'Quiero hablar con un agente', type: 'dark' }
            ]
        }
    };

    const MAIN_OPTIONS = [
        { id: 'como-compro', text: '¿Cómo compro en la página?', type: 'dark' },
        { id: 'es-seguro', text: '¿Es seguro comprar aquí?', type: 'dark' },
        { id: 'pedido-no-llego', text: 'Mi pedido no llegó', type: 'dark' },
        { id: 'hablar-agente', text: 'Quiero hablar con un agente', type: 'dark' }
    ];

    function getUserName() {
        try {
            const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
            return usuario.name || usuario.nombre || '';
        } catch {
            return '';
        }
    }

    function createTicket(tipoConsulta) {
        const id = 'TKT-' + Date.now();
        const usuario = getUserName() || 'Invitado';
        const ticket = { id, usuario, fecha: new Date().toISOString(), estado: 'Abierto', tipoConsulta };
        ticketsDB.push(ticket);
        return ticket;
    }

    function getOptionText(optionId) {
        const opt = MAIN_OPTIONS.find(o => o.id === optionId);
        if (opt) return opt.text;
        for (const flow of Object.values(FLOW_RESPONSES)) {
            const found = (flow.nextOptions || []).find(o => o.id === optionId);
            if (found) return found.text;
        }
        return optionId;
    }

    function renderMessage(text, type) {
        const container = document.getElementById('chatbot-messages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = `chatbot-message ${type}`;
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function renderTypingIndicator() {
        const container = document.getElementById('chatbot-messages');
        if (!container) return null;
        const div = document.createElement('div');
        div.className = 'chatbot-typing';
        div.innerHTML = '<div class="chatbot-typing-dots"><span></span><span></span><span></span></div>';
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return div;
    }

    function removeTypingIndicator(el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    function renderOptions(options, onSelect) {
        const container = document.getElementById('chatbot-options-container');
        if (!container) return;
        container.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = `chatbot-option-btn ${opt.type || 'dark'}`;
            btn.textContent = opt.text;
            btn.dataset.optionId = opt.id;
            btn.addEventListener('click', () => onSelect(opt.id));
            container.appendChild(btn);
        });
    }

    function handleOptionSelect(optionId) {
        const flow = FLOW_RESPONSES[optionId];
        if (!flow) return;

        const optionsContainer = document.getElementById('chatbot-options-container');

        renderMessage(getOptionText(optionId), 'user');

        if (flow.createTicket) {
            createTicket(flow.tipoConsulta || 'Consulta');
        }

        // Deshabilitar opciones mientras "piensa"
        if (optionsContainer) optionsContainer.style.pointerEvents = 'none';
        optionsContainer.style.opacity = '0.6';

        const typingEl = renderTypingIndicator();

        setTimeout(() => {
            removeTypingIndicator(typingEl);
            if (optionsContainer) {
                optionsContainer.style.pointerEvents = '';
                optionsContainer.style.opacity = '1';
            }

            const isSuccess = flow.createTicket && (optionId === 'enviar-mensaje' || optionId === 'hablar-agente');
            renderMessage(flow.text, isSuccess ? 'success' : 'bot');

            if (flow.resetToMenu) {
                renderOptions(MAIN_OPTIONS, handleOptionSelect);
            } else if (flow.nextOptions && flow.nextOptions.length > 0) {
                renderOptions(flow.nextOptions, handleOptionSelect);
            } else {
                optionsContainer.innerHTML = '';
                renderOptions(MAIN_OPTIONS, handleOptionSelect);
            }
        }, TYPING_DELAY_MS);
    }

    function showConversationView() {
        const home = document.getElementById('chatbot-home');
        const conversation = document.getElementById('chatbot-conversation');
        if (home) home.classList.add('hidden');
        if (conversation) conversation.classList.add('active');
    }

    function showInitialOptions() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const optionsContainer = document.getElementById('chatbot-options-container');
        if (messagesContainer) messagesContainer.innerHTML = '';
        if (optionsContainer) optionsContainer.innerHTML = '';
        renderOptions(MAIN_OPTIONS, handleOptionSelect);
    }

    function handleSendMessage() {
        showConversationView();
        createTicket('Consulta general');
        renderMessage('Consulta enviada', 'user');

        const optionsContainer = document.getElementById('chatbot-options-container');
        if (optionsContainer) {
            optionsContainer.style.pointerEvents = 'none';
            optionsContainer.style.opacity = '0.6';
        }

        const typingEl = renderTypingIndicator();

        setTimeout(() => {
            removeTypingIndicator(typingEl);
            if (optionsContainer) {
                optionsContainer.style.pointerEvents = '';
                optionsContainer.style.opacity = '1';
            }
            renderMessage(TICKET_SUCCESS_MSG, 'success');
            renderOptions(MAIN_OPTIONS, handleOptionSelect);
        }, TYPING_DELAY_MS);
    }

    function initChatHome() {
        const greetingHola = document.getElementById('chatbot-greeting-hola');
        if (greetingHola) {
            const name = getUserName();
            greetingHola.textContent = name ? `Hola ${name} 👋` : 'Hola 👋';
        }

        const recentInner = document.getElementById('chatbot-recent-content');
        const summaryEl = document.getElementById('chatbot-recent-summary');
        const timeEl = document.getElementById('chatbot-recent-time');

        if (recentInner && summaryEl) {
            const last = ticketsDB[ticketsDB.length - 1];
            if (last) {
                recentInner.classList.remove('empty-state');
                summaryEl.textContent = `Tú: ${last.tipoConsulta}`;
                if (timeEl) {
                    timeEl.textContent = '1d';
                    timeEl.style.display = '';
                }
            } else {
                recentInner.classList.add('empty-state');
                summaryEl.textContent = 'No hay mensajes recientes';
                if (timeEl) timeEl.style.display = 'none';
            }
        }

        const sendBtn = document.getElementById('chatbot-send-message-btn');
        if (sendBtn) sendBtn.onclick = handleSendMessage;
    }

    function toggleChat() {
        const overlay = document.getElementById('chatbot-overlay');
        const modal = document.getElementById('chatbot-modal');
        const home = document.getElementById('chatbot-home');
        const conversation = document.getElementById('chatbot-conversation');
        const isOpen = modal && modal.classList.contains('open');

        if (isOpen) {
            overlay?.classList.remove('open');
            modal?.classList.remove('open');
        } else {
            overlay?.classList.add('open');
            modal?.classList.add('open');
            if (home) home.classList.remove('hidden');
            if (conversation) conversation.classList.remove('active');
            initChatHome();
        }
    }

    function handleRecentClick(e) {
        e.preventDefault();
        e.stopPropagation();
        showConversationView();
        showInitialOptions();
    }

    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('chatbot-fab')?.addEventListener('click', toggleChat);
        document.getElementById('chatbot-close')?.addEventListener('click', toggleChat);
        document.getElementById('chatbot-overlay')?.addEventListener('click', toggleChat);
        document.getElementById('chatbot-recent-card')?.addEventListener('click', handleRecentClick);
    });
})();
