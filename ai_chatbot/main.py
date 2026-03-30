import streamlit as st
import requests

# --- CONFIGURARE ---
st.set_page_config(page_title="Dispecer Primărie", page_icon="🏛️")
st.title("🏛️ Ghișeu Unic Digital - Primărie")
st.caption("Sistem inteligent de triere a cererilor")

FLOWISE_BASE_URL = st.secrets["FLOWISE_BASE_URL"]

FLOW_IDS = {
    "clasificare": st.secrets["FLOWISE_CLASSIFICATION_ID"],
    "IT":          st.secrets["FLOWISE_IT_ID"],
    "HR":          st.secrets["FLOWISE_HR_ID"],
    "JURIDIC":     st.secrets["FLOWISE_JURIDIC_ID"],
}


def call_flowise(flow_key: str, question: str, session_id: str) -> tuple[str, dict]:
    """Send a question to a Flowise flow and return (text response, raw json)."""
    url = f"{FLOWISE_BASE_URL}/api/v1/prediction/{FLOW_IDS[flow_key]}"
    payload = {"question": question, "sessionId": session_id}
    try:
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        # Flowise may return the answer under different keys depending on version/config
        text = (
            data.get("text")
            or data.get("answer")
            or data.get("response")
            or data.get("output")
            or (str(data) if data else "Răspuns indisponibil.")
        )
        return text, data
    except requests.exceptions.ConnectionError:
        return "EROARE_CONEXIUNE", {}
    except Exception as e:
        return f"EROARE: {e}", {}


def clasifica(text_utilizator: str, session_id: str) -> tuple[str, str]:
    """Call the classification flow and return (department label, raw response)."""
    result, _ = call_flowise("clasificare", text_utilizator, session_id)
    result_upper = result.strip().upper()
    mapping = {
        "TEHNIC": "IT",
        "IT": "IT",
        "HR": "HR",
        "RESURSE": "HR",
        "JURIDIC": "JURIDIC",
        "LEGISLATIV": "JURIDIC",
        "LEGAL": "JURIDIC",
        "URBANISM": "JURIDIC",
    }
    for keyword, dept in mapping.items():
        if keyword in result_upper:
            return dept, result
    return "GENERAL", result


# --- INTERFAȚA DE CHAT ---

if "messages" not in st.session_state:
    st.session_state.messages = []

# Use a stable session ID so Flowise can maintain conversation context per user
if "session_id" not in st.session_state:
    import uuid
    st.session_state.session_id = str(uuid.uuid4())

session_id = st.session_state.session_id

# Afișăm mesajele vechi
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Când utilizatorul scrie ceva...
if prompt := st.chat_input("Descrie problema ta aici..."):

    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.spinner("Analizez cererea..."):
        departament, clasificare_raw = clasifica(prompt, session_id)

    with st.chat_message("assistant"):
        mesaj_raspuns = ""
        dept_raw_response = {}

        if departament == "IT":
            st.error("🔧 Departament identificat: **IT SUPPORT**")
            with st.spinner("Consult echipa IT..."):
                mesaj_raspuns, dept_raw_response = call_flowise("IT", prompt, session_id)

        elif departament == "HR":
            st.success("👥 Departament identificat: **RESURSE UMANE**")
            with st.spinner("Consult departamentul HR..."):
                mesaj_raspuns, dept_raw_response = call_flowise("HR", prompt, session_id)

        elif departament == "JURIDIC":
            st.warning("⚖️ Departament identificat: **JURIDIC / URBANISM**")
            with st.spinner("Caut în acte normative..."):
                mesaj_raspuns, dept_raw_response = call_flowise("JURIDIC", prompt, session_id)

        else:
            st.info("🤖 Asistent General")
            mesaj_raspuns = "Salut! Sunt asistentul virtual. Te pot ajuta cu probleme de IT, HR sau Juridice. Te rog detaliază."

        if "EROARE_CONEXIUNE" in mesaj_raspuns:
            mesaj_raspuns = "Nu pot contacta serverul Flowise. Asigură-te că rulează pe portul 3000."

        st.markdown(mesaj_raspuns)

        with st.expander("🔍 Debug info"):
            st.write(f"**Clasificare raw:** `{clasificare_raw}`")
            st.write(f"**Departament detectat:** `{departament}`")
            if dept_raw_response:
                st.json(dept_raw_response)

    st.session_state.messages.append({"role": "assistant", "content": mesaj_raspuns})
