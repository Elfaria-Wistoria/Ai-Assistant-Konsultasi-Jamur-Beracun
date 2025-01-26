# Prof.MushMate - AI Chatbot for Toxic Mushroom Consultation

**Prof.MushMate** is an AI-powered chatbot designed to provide expert-level consultation about toxic mushrooms. Built using **Flask** and **LangChain**, the chatbot utilizes advanced language models and a vector database to deliver accurate and conversational responses. With a focus on engaging and informative dialogue, Prof.MushMate acts as a virtual professor specializing in the identification and understanding of toxic mushrooms.

---

## 🚀 Features

- **Interactive Chatbot**: Provides precise and conversational answers about toxic mushrooms with a professional and approachable tone.
- **Memory Integration**: Uses conversation history to provide context-aware responses.
- **Vector Search**: Incorporates Chroma vectorstore to retrieve relevant information from a pre-trained dataset.
- **Customizable Prompt**: Tailored for a specific use case with a defined style and behavior for the chatbot.
- **User-Friendly API**: Includes endpoints for interacting with the chatbot and managing conversation history.
- **Lightweight Deployment**: Built with Flask for easy deployment and scalability.

---

## 🛠️ Technologies Used

- **Framework**: Flask
- **AI Models**: 
  - Google Generative AI (`gemini-1.5-flash`)
  - Hugging Face Embeddings (`sentence-transformers/bert-base-nli-max-tokens`)
- **Database**: Chroma for vector search
- **Memory Management**: LangChain ConversationBufferMemory
- **Environment Management**: Python `dotenv`
- **Frontend Integration**: HTML templates for rendering the user interface

---

## 📂 Project Structure

```plaintext
.
├── app.py                 # Main application file
├── templates/
│   ├── index.html         # Homepage
│   ├── skinthinc.html     # Additional page (placeholder)
├── static/                # Static files (CSS, JS, images)
├── data/                  # Directory for vectorstore persistence
├── .env                   # Environment variables
├── requirements.txt       # Dependencies
└── README.md              # Project documentation
