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

## 🔧 Technologies Used

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
```

---

## 🔧 Setup and Installation

Follow these steps to set up and run the project:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Elfaria-Wistoria/Ai-Assistant-Konsultasi-Jamur-Beracun.git
   cd prof-mushmate
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Add environment variables**:
   - Create a `.env` file and add your API keys and configurations:
     ```
     FLASK_SECRET_KEY=your_secret_key
     GOOGLE_API_KEY=your_google_api_key
     ```

5. **Run the application**:
   ```bash
   python app.py
   ```

6. **Access the application**:
   Open your browser and go to: [http://localhost:5000](http://localhost:5000)

---

## 📡 API Endpoints

- **`GET /`**: Renders the homepage.
- **`GET /skinthinc`**: Displays the `skinthinc.html` page.
- **`GET /get`**: Processes user messages and returns chatbot responses.
- **`GET /load_history`**: Retrieves the chat history for the session.
- **`POST /clear_history`**: Clears the chat history and memory.

---

## 💪 Future Enhancements

- Add support for multiple language models.
- Improve vectorstore with additional datasets.
- Enhance frontend design for better user experience.
- Integrate multimedia support (e.g., images of mushrooms).
- Deploy the application using Docker or cloud platforms.

---

## 🙏 Contribution

Contributions are welcome! If you'd like to improve the project or add new features, follow these steps:
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Create a Pull Request.


---

## 🙌 Acknowledgments

- [LangChain](https://www.langchain.com/)
- [Hugging Face](https://huggingface.co/)
- [Chroma](https://www.trychroma.com/)
- [Flask](https://flask.palletsprojects.com/)
- The amazing open-source community!

---

Start exploring Prof.MushMate and revolutionize the way you learn about toxic mushrooms! 🌱🍄

