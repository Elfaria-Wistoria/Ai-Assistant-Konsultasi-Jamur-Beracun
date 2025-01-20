from flask import Flask, render_template, request, jsonify, session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

# Set secret key untuk manajemen sesi
app.secret_key = os.urandom(24)

# Memuat vectorstore yang sudah ada dari direktori "data"
try:
    vectorstore = Chroma(
        persist_directory="data",
        embedding_function=HuggingFaceEmbeddings(model_name="sentence-transformers/bert-base-nli-max-tokens")
    )
    print("Vectorstore berhasil dimuat.")
except Exception as e:
    print(f"Kesalahan saat memuat vectorstore: {e}")

# Menyiapkan retriever
retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 10})



# Menyiapkan model
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0, max_tokens=None, timeout=None)

# Membuat memori
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

# Membuat prompt dengan memori
prompt = ChatPromptTemplate(
    messages=[
        SystemMessagePromptTemplate.from_template(
        "Jangan memberikan jawaban yang ada boldnya, seperi ada petik 2"
        "Jangan memberikan jawaban yang ada boldnya, seperi ada bintang * **"
        "Berikan jawaban yang tidak terlalu panjang."
        "Anda adalah asisten chatbot bernama MushMate, tetapi Anda memanggil diri Anda dengan sebutan 'Prof.MushMate'"
        "Tugas MushMate adalah memberikan informasi berdasarkan informasi di dataset dengan fokus pada pemberian informasi. "
        "Pastikan jawaban MushMate selalu terasa seperti ngobrol sama seorang profesor yang sangat ahli soal jamur beracun"
),
        MessagesPlaceholder(variable_name="chat_history"),  # Memori akan otomatis disisipkan di sini
        HumanMessagePromptTemplate.from_template("{question}")
    ]
)

# Membuat chain dengan memori
conversation_chain = LLMChain(
    llm=llm,
    prompt=prompt,
    memory=memory,
    verbose=True
)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/skinthinc')
def skinthinc():
    return render_template('skinthinc.html')

@app.route('/get', methods=['GET'])
def get_response():
    user_message = request.args.get('msg')  # Ambil pesan dari user
    
    # Ambil riwayat percakapan dari sesi Flask
    if "chat_history" not in session:
        session["chat_history"] = []

    # Gabungkan semua pesan sebelumnya dalam chat history sebagai konteks
    conversation_history = session["chat_history"]
    
    # Proses input dengan chain yang sudah terintegrasi dengan memori
    result = conversation_chain.run(question=user_message)  # Memori otomatis diperbarui
    
    # Simpan pesan pengguna dan respons bot ke dalam riwayat percakapan
    conversation_history.append({"sender": "user", "message": user_message})
    conversation_history.append({"sender": "bot", "message": result})

    # Simpan kembali riwayat percakapan dalam sesi Flask
    session["chat_history"] = conversation_history

    return jsonify(result)  # Kembalikan respons ke front-end

@app.route('/load_history', methods=['GET'])
def load_history():
    # Mengembalikan riwayat percakapan yang ada dalam sesi
    conversation_history = session.get("chat_history", [])
    return jsonify(conversation_history)

@app.route('/clear_history', methods=['POST'])
def clear_history():
    # Menghapus riwayat percakapan dari sesi
    session.pop("chat_history", None)
    memory.clear() 
    return jsonify({"status": "success", "message": "Riwayat percakapan telah dihapus"})

if __name__ == '__main__':
    app.run(debug=True)