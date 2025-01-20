from flask import Flask, render_template, request, jsonify, session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from dotenv import load_dotenv
from PIL import Image
import numpy as np
import io
import os

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Load Model AI untuk deteksi jamur
try:
    model = load_model('mushroom_model.h5', compile=False)  # Tambahkan compile=False
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])  # Compile manual setelah load
    print("Model deteksi jamur berhasil dimuat")
except Exception as e:
    print(f"Error loading mushroom detection model: {e}")
    model = None

# Memuat vectorstore yang sudah ada dari direktori "data"
try:
    vectorstore = Chroma(
        persist_directory="data",
        embedding_function=HuggingFaceEmbeddings(model_name="sentence-transformers/bert-base-nli-max-tokens")
    )
    print("Vectorstore berhasil dimuat.")
except Exception as e:
    print(f"Kesalahan saat memuat vectorstore: {e}")
    vectorstore = None

# Menyiapkan retriever jika vectorstore berhasil dimuat
if vectorstore:
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 10})

# Menyiapkan model LLM
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
        MessagesPlaceholder(variable_name="chat_history"),
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

def preprocess_image(img):
    """
    Preprocess gambar untuk model deteksi jamur
    """
    try:
        img = img.resize((224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0  # Normalisasi
        return img_array
    except Exception as e:
        print(f"Error in preprocessing image: {e}")
        return None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/skinthinc')
def skinthinc():
    return render_template('index1.html')

@app.route('/get', methods=['GET'])
def get_response():
    try:
        user_message = request.args.get('msg')
        
        if not user_message:
            return jsonify({'error': 'Pesan tidak boleh kosong'}), 400

        if "chat_history" not in session:
            session["chat_history"] = []

        conversation_history = session["chat_history"]
        
        result = conversation_chain.run(question=user_message)
        
        conversation_history.append({"sender": "user", "message": user_message})
        conversation_history.append({"sender": "bot", "message": result})

        session["chat_history"] = conversation_history

        return jsonify(result)
    except Exception as e:
        print(f"Error in get_response: {e}")
        return jsonify({'error': 'Terjadi kesalahan internal'}), 500

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({
            'error': 'Model deteksi tidak tersedia. Silakan hubungi administrator.',
            'detail': 'Model tidak berhasil dimuat saat inisialisasi.'
        }), 503
        
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'Tidak ada file yang diunggah'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'Tidak ada file yang dipilih'}), 400

        # Validasi ukuran file (max 5MB)
        if len(file.read()) > 5 * 1024 * 1024:  # 5MB in bytes
            return jsonify({'error': 'Ukuran file terlalu besar (max 5MB)'}), 400
        file.seek(0)  # Reset file pointer setelah membaca

        # Validasi tipe file
        allowed_extensions = {'png', 'jpg', 'jpeg'}
        if not '.' in file.filename or \
           file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({'error': 'Format file tidak didukung'}), 400

        # Baca dan preprocess gambar
        img = Image.open(io.BytesIO(file.read()))
        processed_img = preprocess_image(img)

        if processed_img is None:
            return jsonify({'error': 'Gagal memproses gambar'}), 500

        # Prediksi
        try:
            prediction = model.predict(processed_img)
            is_poisonous = bool(prediction[0][0] > 0.5)
            confidence = float(prediction[0][0])
        except Exception as e:
            print(f"Prediction error: {e}")
            return jsonify({'error': 'Gagal melakukan prediksi'}), 500

        # Update chat history
        if "chat_history" not in session:
            session["chat_history"] = []
        
        conversation_history = session["chat_history"]
        result_message = f"{'Jamur beracun' if is_poisonous else 'Jamur tidak beracun'} (Confidence: {confidence:.2%})"
        
        conversation_history.append({
            "sender": "user",
            "message": "Uploaded a mushroom image for analysis"
        })
        conversation_history.append({
            "sender": "bot",
            "message": f"Prof.MushMate telah menganalisis gambar jamur Anda. {result_message}"
        })
        
        session["chat_history"] = conversation_history

        return jsonify({
            'is_poisonous': is_poisonous,
            'confidence': confidence,
            'message': 'Jamur beracun!' if is_poisonous else 'Jamur tidak beracun',
            'detail': f"Tingkat keyakinan: {confidence:.2%}"
        })

    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({
            'error': 'Terjadi kesalahan saat memproses gambar',
            'detail': str(e)
        }), 500

@app.route('/load_history', methods=['GET'])
def load_history():
    try:
        conversation_history = session.get("chat_history", [])
        return jsonify(conversation_history)
    except Exception as e:
        print(f"Error loading history: {e}")
        return jsonify({'error': 'Gagal memuat riwayat percakapan'}), 500

@app.route('/clear_history', methods=['POST'])
def clear_history():
    try:
        session.pop("chat_history", None)
        memory.clear()
        return jsonify({"status": "success", "message": "Riwayat percakapan telah dihapus"})
    except Exception as e:
        print(f"Error clearing history: {e}")
        return jsonify({'error': 'Gagal menghapus riwayat percakapan'}), 500

# Error Handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    if model is None:
        print("WARNING: Model deteksi jamur tidak tersedia")
    app.run(debug=True)