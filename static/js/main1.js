document.addEventListener('DOMContentLoaded', function() {
    "use strict";

    // DOM Elements
    const msgerForm = document.querySelector(".msger-inputarea");
    const msgerInput = document.querySelector(".msger-input");
    const msgerChat = document.querySelector(".msger-chat");
    const sendButton = document.getElementById("sendButton");
    const clearButton = document.getElementById("clearButton");
    const toggleButton = document.getElementById("toggleButton");
    const leftContainer = document.getElementById("leftContainer");
    const msgerBox = document.getElementById("msgerBox");
    const imageUploadForm = document.getElementById("imageUploadForm");
    const imageInput = document.getElementById("imageInput");

    // Constants
    const BOT_IMG = "/static/img/headbot.png";
    const PERSON_IMG = "/static/img/headuser.png";
    const BOT_NAME = "MushMate";
    const PERSON_NAME = "Anda";

    // State
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
        // Chat form submit
        msgerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handleSendMessage();
        });

        // Image upload form submit
        if (imageUploadForm) {
            imageUploadForm.addEventListener("submit", handleImageUpload);
        }

        // Image input change
        if (imageInput) {
            imageInput.addEventListener("change", (e) => previewImage(e.target));
        }

        // Keyboard event for textarea
        msgerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });

        // Send button click
        sendButton.addEventListener("click", handleSendMessage);

        // Clear button click
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
                    msgerBox.classList.toggle('full-width');
                }
                toggleButton.innerHTML = leftContainer.classList.contains('hidden') ? 
                    '<i class="fas fa-chevron-right"></i>' : 
                    '<i class="fas fa-chevron-left"></i>';
            });
        }

        // Setup drag and drop
        setupDragAndDrop();

        // Window resize
        window.addEventListener('resize', checkScreenSize);
        window.addEventListener('load', checkScreenSize);
    }

    // Image handling functions
    function previewImage(input) {
        const file = input.files[0];
        const analyzeButton = document.getElementById('analyzeButton');
        const uploadText = document.getElementById('uploadText');
        const previewArea = document.getElementById('previewArea');
        const imagePreview = document.getElementById('imagePreview');

        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                previewArea.classList.remove('hidden');
                analyzeButton.disabled = false;
                uploadText.textContent = file.name;
            }
            reader.readAsDataURL(file);
        } else {
            previewArea.classList.add('hidden');
            analyzeButton.disabled = true;
            uploadText.textContent = 'Pilih atau seret gambar ke sini';
        }
    }

    async function handleImageUpload(e) {
        e.preventDefault();
        
        const formData = new FormData();
        const imageFile = imageInput.files[0];
        
        if (!imageFile) {
            alert('Silakan pilih gambar terlebih dahulu');
            return;
        }

        formData.append('image', imageFile);

        // Show loading state
        document.getElementById('loadingResult').classList.remove('hidden');
        document.getElementById('predictionResult').classList.add('hidden');

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                updatePredictionUI(result);
                appendMessage(BOT_NAME, BOT_IMG, "left", 
                    `Hasil analisis gambar: ${result.message}\n${result.detail}`);
            } else {
                alert(result.error || 'Terjadi kesalahan dalam analisis');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat menganalisis gambar');
        } finally {
            document.getElementById('loadingResult').classList.add('hidden');
        }
    }

    function updatePredictionUI(result) {
        const predictionMessage = document.getElementById('predictionMessage');
        const confidenceBar = document.getElementById('confidenceBar');
        
        predictionMessage.textContent = result.message;
        predictionMessage.className = result.is_poisonous ? 
            'text-red-600 font-medium' : 
            'text-green-600 font-medium';
        
        confidenceBar.style.width = `${result.confidence * 100}%`;
        confidenceBar.className = `h-2.5 rounded-full ${
            result.is_poisonous ? 'bg-red-600' : 'bg-green-600'
        }`;

        document.getElementById('predictionResult').classList.remove('hidden');
    }

    function setupDragAndDrop() {
        const dropZone = document.querySelector('[for="imageInput"]');
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        dropZone.addEventListener('drop', handleDrop, false);
    }

    // Chat handling functions
    async function handleSendMessage() {
        const msgText = msgerInput.value.trim();
        if (!msgText) return;

        appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
        msgerInput.value = "";
        msgerInput.style.height = '50px';

        appendTypingIndicator();

        try {
            const response = await fetch(`/get?msg=${encodeURIComponent(msgText)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            removeTypingIndicator();
            appendMessage(BOT_NAME, BOT_IMG, "left", 
                typeof data === 'string' ? data : 
                (data.message || "Maaf, saya tidak mengerti pertanyaan Anda."));
        } catch (error) {
            console.error("Error sending message:", error);
            removeTypingIndicator();
            appendMessage(BOT_NAME, BOT_IMG, "left", 
                "Maaf, terjadi kesalahan. Silakan coba lagi.");
        }
    }

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

        // Add copy button functionality
        if (side === 'left') {
            const lastMsg = msgerChat.lastElementChild;
            const copyBtn = lastMsg.querySelector('.copy-btn');

            copyBtn?.addEventListener('click', () => {
                navigator.clipboard.writeText(text).then(() => {
                    const icon = copyBtn.querySelector('i');
                    icon.className = 'fas fa-check text-green-600';
                    setTimeout(() => {
                        icon.className = 'fas fa-copy text-gray-600';
                    }, 2000);
                });
            });
        }
    }

    // Utility functions
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        document.querySelector('[for="imageInput"]').classList.add('border-blue-500', 'bg-blue-50');
    }

    function unhighlight(e) {
        document.querySelector('[for="imageInput"]').classList.remove('border-blue-500', 'bg-blue-50');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        imageInput.files = files;
        previewImage(imageInput);
    }

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

    // Initialize
    function initialize() {
        setupEventListeners();
        loadChatHistory();
    }

    // Start the application
    initialize();
});