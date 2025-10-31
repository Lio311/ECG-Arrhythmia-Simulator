import streamlit as st
import neurokit2 as nk
import plotly.graph_objects as go
import pandas as pd
import numpy as np

# --- Page Configuration ---
st.set_page_config(layout="wide", page_title="ECG Arrhythmia Simulator")

st.title("ECG Arrhythmia Simulator")
st.markdown("Use the sidebar to select an arrhythmia and configure simulation parameters.")

# --- Helper Functions ---

@st.cache_data
def generate_ecg(duration=10, heart_rate=70, method=None, noise=0.1, sampling_rate=1000):
    """
    Generates a synthetic ECG signal using NeuroKit2.
    """
    if method == "afib":
        # Atrial Fibrillation
        return nk.ecg_simulate(duration=duration, heart_rate=heart_rate, method="afib", noise=noise, sampling_rate=sampling_rate)
    
    elif method == "pvc":
        # Premature Ventricular Contraction
        # The 'pvc_frequency' in nk is complex, so we'll just use the method
        # which inserts them at a default rate.
        return nk.ecg_simulate(duration=duration, heart_rate=heart_rate, method="pvc", noise=noise, sampling_rate=sampling_rate)
    
    else:
        # Normal Sinus Rhythm (or Tachy/Brady based on heart_rate)
        return nk.ecg_simulate(duration=duration, heart_rate=heart_rate, method="ecgsyn", noise=noise, sampling_rate=sampling_rate)

def plot_ecg(signal, sampling_rate, title):
    """
    Creates an interactive Plotly chart for the ECG signal.
    """
    # Create a time index in seconds
    duration_sec = len(signal) / sampling_rate
    time_index = pd.to_timedelta(np.arange(len(signal)) / sampling_rate, unit='s')
    
    # Create a Pandas Series for easy plotting
    signal_series = pd.Series(signal, index=time_index, name="Amplitude")

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=signal_series.index, 
        y=signal_series.values, 
        mode='lines',
        line=dict(color='green')
    ))

    fig.update_layout(
        title=title,
        xaxis_title="Time (seconds)",
        yaxis_title="Amplitude (mV)",
        template="plotly_dark",
        hovermode="x unified"
    )
    return fig

# --- Sidebar Controls ---
st.sidebar.header("Simulation Parameters")

# Dictionary to map user-friendly names to method names
ARRHYTHMIA_MAP = {
    "Normal Sinus Rhythm": "normal",
    "Atrial Fibrillation (AFib)": "afib",
    "Premature Ventricular Contraction (PVC)": "pvc"
}

selected_arrhythmia_name = st.sidebar.selectbox(
    "Select Arrhythmia",
    options=list(ARRHYTHMIA_MAP.keys())
)
method_key = ARRHYTHMIA_MAP[selected_arrhythmia_name]

# Info box for Tachycardia and Bradycardia
st.sidebar.info("""
**For Tachycardia/Bradycardia:**
Select "Normal Sinus Rhythm" and adjust the Heart Rate slider.
- **Tachycardia:** > 100 BPM
- **Bradycardia:** < 60 BPM
""")

# Sliders for parameters
duration = st.sidebar.slider(
    "Duration (seconds)", 
    min_value=5, 
    max_value=30, 
    value=10
)

# Set a default HR based on selection
default_hr = 70
if selected_arrhythmia_name == "Atrial Fibrillation (AFib)":
    default_hr = 90  # AFib often presents with a faster rate

heart_rate = st.sidebar.slider(
    "Base Heart Rate (BPM)", 
    min_value=30, 
    max_value=180, 
    value=default_hr
)

noise = st.sidebar.slider(
    "Noise Level", 
    min_value=0.0, 
    max_value=0.5, 
    value=0.1, 
    step=0.01,
    help="Simulates muscle artifacts and baseline wander"
)

SAMPLING_RATE = 1000  # Standard for NeuroKit simulations

# --- Main Page Logic ---

with st.spinner(f"Generating {selected_arrhythmia_name} signal..."):
    # Generate the signal
    ecg_signal = generate_ecg(
        duration=duration,
        heart_rate=heart_rate,
        method=method_key,
        noise=noise,
        sampling_rate=SAMPLING_RATE
    )

    # Plot the signal
    plot_title = f"Simulated ECG: {selected_arrhythmia_name} (HR: {heart_rate} BPM)"
    fig = plot_ecg(ecg_signal, SAMPLING_RATE, plot_title)
    
    st.plotly_chart(fig, use_container_width=True)

# Add an expander for some "medical" context
with st.expander("What am I looking at?"):
    if method_key == "normal":
        st.markdown(f"""
        This is a **Normal Sinus Rhythm** at {heart_rate} BPM. 
        - **P Wave:** Present before every QRS.
        - **QRS Complex:** Narrow.
        - **Rhythm:** Regular (constant R-R intervals).
        """)
    elif method_key == "afib":
        st.markdown(f"""
        This is **Atrial Fibrillation (AFib)**.
        - **P Wave:** Absent. Replaced by chaotic "fibrillatory waves" (the noisy baseline).
        - **QRS Complex:** Usually narrow.
        - **Rhythm:** **Irregularly irregular.** The R-R intervals are completely unpredictable.
        """)
    elif method_key == "pvc":
        st.markdown(f"""
        This is **Premature Ventricular Contraction (PVC)**.
        - **P Wave:** Usually absent before the PVC.
        - **QRS Complex:** The PVC beat is **wide and bizarre** looking, completely different from the normal beats.
        - **Rhythm:** An early beat disrupts the regular rhythm, often followed by a "compensatory pause."
        """)
