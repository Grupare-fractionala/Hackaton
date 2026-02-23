import streamlit as st
from google import genai

# --- CONFIGURARE ---
st.set_page_config(page_title="Dispecer Primărie", page_icon="🏛️")
st.title("🏛️ Ghișeu Unic Digital - Primărie")
st.caption("Sistem inteligent de triere a cererilor")

# --- CONECTARE LA GOOGLE AI ---
# Folosim noua librarie pe care ai instalat-o
try:
    client = genai.Client(api_key=st.secrets["GEMINI_API_KEY"])
except Exception as e:
    st.error("Nu am găsit cheia API! Verifică .streamlit/secrets.toml")
    st.stop()


# --- FUNCTIA CREIER (CLASSIFIER) ---
def determina_departamentul(text_utilizator):
    """
    Această funcție nu răspunde la întrebare, ci doar decide CUI îi aparține problema.
    """

    # Acest prompt este "instrucțiunea secretă" pentru AI
    prompt_sistem = """
    Ești un sistem de rutare pentru o primărie. Analizează mesajul de mai jos și clasifică-l 
    într-una dintre următoarele 3 categorii.

    CATEGORII:
    1. IT (probleme tehnice, calculator, imprimantă, internet, parole, VPN, software)
    2. HR (resurse umane, salarii, concedii, adeverințe, angajări, zile libere)
    3. JURIDIC (legi, hotărâri, urbanism, autorizații, amenzi, regulamente)

    REGULI STRICTE:
    - Răspunde DOAR cu un singur cuvânt: "IT", "HR" sau "JURIDIC".
    - Dacă mesajul este un salut sau nu e clar, răspunde "GENERAL".
    - Mesajul utilizatorului iti va fi dat mai jos

    Mesaj utilizator: 
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_sistem + f"'{text_utilizator}'"
        )
        # Curățăm răspunsul (scoatem spații, facem majuscule)
        return response.text.strip().upper()
    except Exception as e:
        return "EROARE"


# --- INTERFAȚA DE CHAT ---

# Inițializăm istoricul
if "messages" not in st.session_state:
    st.session_state.messages = []

# Afișăm mesajele vechi
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Când utilizatorul scrie ceva...
if prompt := st.chat_input("Descrie problema ta aici..."):

    # 1. Afișăm ce a scris userul
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # 2. Gândim (Aici se întâmplă magia)
    with st.spinner("Analizez cererea..."):
        departament = determina_departamentul(prompt)

    # 3. Răspundem în funcție de categorie
    with st.chat_message("assistant"):

        mesaj_raspuns = ""

        if "IT" in departament:
            st.error(f"🔧 Departament identificat: **IT SUPPORT**")
            mesaj_raspuns = "Am înțeles că ai o problemă tehnică. Am deschis un tichet automat către echipa IT. Un coleg te va contacta rapid."

        elif "HR" in departament:
            st.success(f"👥 Departament identificat: **RESURSE UMANE**")
            mesaj_raspuns = "Întrebarea ta ține de HR. Verific baza de date cu proceduri de personal..."
            # Aici pe viitor vei pune logica care caută în PDF-uri de HR

        elif "JURIDIC" in departament:
            st.warning(f"⚖️ Departament identificat: **JURIDIC / URBANISM**")
            mesaj_raspuns = "Este o speță legislativă. Caut în HCL-uri și regulamente..."

        else:
            st.info(f"🤖 Asistent General")
            mesaj_raspuns = "Salut! Sunt asistentul virtual. Te pot ajuta cu probleme de IT, HR sau Juridice. Te rog detaliază."

        st.markdown(mesaj_raspuns)

    # Salvăm răspunsul în istoric
    st.session_state.messages.append({"role": "assistant", "content": mesaj_raspuns})