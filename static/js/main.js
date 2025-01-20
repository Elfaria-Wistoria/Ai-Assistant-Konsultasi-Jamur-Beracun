// main.js
document.addEventListener('DOMContentLoaded', function() {
    "use strict";

    // DOM Elements
    const msgerForm = document.querySelector(".msger-inputarea");
    const msgerInput = document.querySelector(".msger-input");
    const msgerChat = document.querySelector(".msger-chat");
    const sendButton = document.getElementById("sendButton");
    const micButton = document.getElementById("micButton");
    const clearButton = document.getElementById("clearButton");
    const toggleButton = document.getElementById("toggleButton");
    const leftContainer = document.getElementById("leftContainer");
    const msgerBox = document.getElementById("msgerBox");

    // Constants
    const BOT_IMG = "/static/img/headbot.png";
    const PERSON_IMG = "/static/img/headuser.png";
    const BOT_NAME = "MushMate";
    const PERSON_NAME = "Anda";

    // State
    let isVoiceInput = false;
    let isSpeaking = false;

    // Load chat history when page loads
    function loadChatHistory() {
        fetch("/load_history")
            .then(response => response.json())
            .then(history => {
                history.forEach(entry => {
                    const { sender, message } = entry;
                    const name = sender === "user" ? PERSON_NAME : BOT_NAME;
                    const img = sender === "user" ? PERSON_IMG : BOT_IMG;
                    const side = sender === "user" ? "right" : "left";
                    appendMessage(name, img, side, message);
                });
                msgerChat.scrollTop = msgerChat.scrollHeight;
            })
            .catch(error => console.error("Error loading chat history:", error));
    }

    // Setup event listeners
    function setupEventListeners() {
        // Form submit handler
        msgerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handleSendMessage();
        });

        // Keyboard event for textarea
        msgerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });

        // Send button click
        sendButton.addEventListener("click", () => {
            handleSendMessage();
        });

        // Clear button
        clearButton.addEventListener("click", () => {
            const modal = document.getElementById('confirmationModal');
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        });

        // Modal handlers
        document.getElementById('confirmDelete').addEventListener('click', () => {
            fetch('/clear_history', { method: 'POST' })
                .then(() => {
                    msgerChat.innerHTML = '';
                    hideModal();
                })
                .catch(error => console.error("Error clearing history:", error));
        });

        document.getElementById('cancelDelete').addEventListener('click', hideModal);

        // Suggested questions
        document.querySelectorAll('.suggested-question').forEach(question => {
            question.addEventListener('click', () => {
                const text = question.querySelector('p').textContent;
                msgerInput.value = text;
                handleSendMessage();
            });
        });

        // Auto-resize textarea
        msgerInput.addEventListener('input', () => {
            msgerInput.style.height = '50px';
            msgerInput.style.height = Math.min(msgerInput.scrollHeight, 120) + 'px';
        });

        // Toggle sidebar
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                leftContainer.classList.toggle('hidden');
                if (window.innerWidth > 670) {
                    msgerBox.classList.toggle('full-width', leftContainer.classList.contains('hidden'));
                }
                toggleButton.innerHTML = leftContainer.classList.contains('hidden') ? 
                    '<i class="fas fa-chevron-right"></i>' : 
                    '<i class="fas fa-chevron-left"></i>';
            });
        }

        // Window resize
        window.addEventListener('resize', checkScreenSize);
        window.addEventListener('load', checkScreenSize);
    }

    // Message sending handler
    function handleSendMessage() {
        const msgText = msgerInput.value.trim();
        if (!msgText) return;

        // Display user message
        appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
        msgerInput.value = "";
        msgerInput.style.height = '50px';

        // Show typing indicator
        appendTypingIndicator();

        // Send to backend
        fetch(`/get?msg=${encodeURIComponent(msgText)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            removeTypingIndicator();
            if (typeof data === 'string') {
                appendMessage(BOT_NAME, BOT_IMG, "left", data);
            } else {
                appendMessage(BOT_NAME, BOT_IMG, "left", data.message || "Maaf, saya tidak mengerti pertanyaan Anda.");
            }

            if (isVoiceInput) {
                speak(data);
                isVoiceInput = false;
            }
        })
        .catch(error => {
            console.error("Error sending message:", error);
            removeTypingIndicator();
            appendMessage(BOT_NAME, BOT_IMG, "left", "Maaf, terjadi kesalahan. Silakan coba lagi.");
        });
    }

    // Append message to chat
    function appendMessage(name, img, side, text) {
        const msgHTML = `
            <div class="msg ${side}-msg animate-fade-in">
                <div class="flex items-start space-x-3 ${side === 'right' ? 'flex-row-reverse' : ''} mb-4">
                    <div class="w-8 h-8 rounded-full bg-cover" style="background-image: url(${img})"></div>
                    <div class="msg-bubble max-w-[70%] bg-${side === 'right' ? 'indigo-600' : 'gray-100'} rounded-2xl p-4">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-medium text-sm ${side === 'right' ? 'text-white' : 'text-gray-700'}">${name}</span>
                            <span class="text-xs ${side === 'right' ? 'text-indigo-200' : 'text-gray-500'}">${formatDate(new Date())}</span>
                        </div>
                        <div class="msg-text ${side === 'right' ? 'text-white' : 'text-gray-800'}">${text}</div>
                        ${side === 'left' ? `
                            <div class="flex space-x-2 mt-2">
                                <button class="volume-btn p-1 hover:bg-gray-200 rounded transition-all">
                                    <i class="fas fa-volume-up text-gray-600"></i>
                                </button>
                                <button class="copy-btn p-1 hover:bg-gray-200 rounded transition-all">
                                    <i class="fas fa-copy text-gray-600"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        msgerChat.insertAdjacentHTML("beforeend", msgHTML);
        msgerChat.scrollTop = msgerChat.scrollHeight;

        // Add event listeners for volume and copy buttons
        if (side === 'left') {
            const lastMsg = msgerChat.lastElementChild;
            const volumeBtn = lastMsg.querySelector('.volume-btn');
            const copyBtn = lastMsg.querySelector('.copy-btn');

            volumeBtn?.addEventListener('click', () => {
                if (isSpeaking) {
                    stopSpeaking();
                    volumeBtn.innerHTML = '<i class="fas fa-volume-up text-gray-600"></i>';
                } else {
                    speak(text);
                    volumeBtn.innerHTML = '<i class="fas fa-stop text-gray-600"></i>';
                }
            });

            copyBtn?.addEventListener('click', () => {
                navigator.clipboard.writeText(text).then(() => {
                    const icon = copyBtn.querySelector('i');
                    icon.className = 'fas fa-check text-green-600';
                    setTimeout(() => {
                        icon.className = 'fas fa-copy text-gray-600';
                    }, 1000);
                });
            });
        }
    }

    // Voice input handling
    function initializeVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            micButton.style.display = 'none';
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.interimResults = true;

        let isListening = false;

        micButton.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
                micButton.classList.remove('mic-active');
                document.getElementById('micAlert').style.display = 'none';
            } else {
                recognition.start();
                micButton.classList.add('mic-active');
                document.getElementById('micAlert').style.display = 'block';
            }
            isListening = !isListening;
        });

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');

            msgerInput.value = transcript;
            isVoiceInput = true;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            micButton.classList.remove('mic-active');
            document.getElementById('micAlert').style.display = 'none';
            isListening = false;
        };
    }

    // Utility functions
    function formatDate(date) {
        const h = "0" + date.getHours();
        const m = "0" + date.getMinutes();
        return `${h.slice(-2)}:${m.slice(-2)}`;
    }

    function appendTypingIndicator() {
        const indicatorHTML = `
            <div id="typing-indicator" class="msg left-msg animate-pulse">
                <div class="msg-bubble max-w-[70%] bg-gray-100 rounded-2xl p-4">
                    <div class="typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        msgerChat.insertAdjacentHTML("beforeend", indicatorHTML);
        msgerChat.scrollTop = msgerChat.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById("typing-indicator");
        if (indicator) indicator.remove();
    }

    function hideModal() {
        const modal = document.getElementById('confirmationModal');
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    function checkScreenSize() {
        const isSmallScreen = window.innerWidth <= 670;
        leftContainer.classList.toggle("hidden", isSmallScreen);
        msgerBox.classList.toggle("full-width", window.innerWidth > 670 && leftContainer.classList.contains("hidden"));
        if (toggleButton) {
            toggleButton.innerHTML = leftContainer.classList.contains("hidden") ? 
                '<i class="fas fa-chevron-right"></i>' : 
                '<i class="fas fa-chevron-left"></i>';
        }
    }

    function speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'id-ID';
            utterance.onstart = () => { 
                isSpeaking = true;
            };
            utterance.onend = () => {
                isSpeaking = false;
                const volumeBtns = document.querySelectorAll('.volume-btn');
                volumeBtns.forEach(btn => {
                    btn.innerHTML = '<i class="fas fa-volume-up text-gray-600"></i>';
                });
            };
            speechSynthesis.speak(utterance);
        }
    }

    function stopSpeaking() {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            isSpeaking = false;
        }
    }

    // Initialize everything
    function initialize() {
        setupEventListeners();
        initializeVoiceInput();
        loadChatHistory();
    }

    // Start the application
    initialize();
});