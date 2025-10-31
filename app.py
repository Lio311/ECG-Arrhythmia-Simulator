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
def generate_ecg(duration=10, heart_rate=70, method="normal", noise=0.1, sampling_rate=1000):
    """
    Generates a synthetic ECG signal using NeuroKit2.
    'method' should be one of the keys from neurokit, e.g., 'afib', 'vt', 'avb1', etc.
    'ecgsyn' is used for normal rhythm.
    """
    
    # Use 'ecgsyn' for normal rhythm, but pass other method keys directly
    simulation_method = "ecgsyn" if method == "normal" else method
    
    # Some methods (like VF) don't use heart_rate, but nk handles this
    try:
        return nk.ecg_simulate(
            duration=duration, 
            heart_rate=heart_rate, 
            method=simulation_method, 
            noise=noise, 
            sampling_rate=sampling_rate
        )
    except Exception as e:
        st.error(f"Error generating signal for method '{simulation_method}': {e}")
        # Return a flat line on error
        return np.zeros(duration * sampling_rate)


def plot_ecg(signal, sampling_rate, title):
    """
    Creates an interactive Plotly chart for the ECG signal.
    """
    # Create a time index in seconds
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

# Dictionary mapping user-friendly names to neurokit2 method keys
ARRHYTHMIA_MAP = {
    "Normal Sinus Rhythm": "normal",
    
    # --- Premature Beats ---
    "Premature Atrial Contraction (PAC)": "pac",
    "Premature Ventricular Contraction (PVC)": "pvc",
    
    # --- Supraventricular Tachycardias ---
    "Atrial Fibrillation (AFib)": "afib",
    "Atrial Flutter (AFL)": "afl",
    "Supraventricular Tachycardia (SVT/PSVT)": "svt",
    
    # --- Ventricular Tachycardias (Dangerous) ---
    "Ventricular Tachycardia (VT)": "vt",
    "Ventricular Fibrillation (VF)": "vf",

    # --- Bradycardias / AV Blocks ---
    "1st-Degree AV Block": "avb1",
    "2nd-Degree AV Block (Wenckebach)": "avb2",
    "3rd-Degree (Complete) AV Block": "avb3",
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
if "AFib" in selected_arrhythmia_name:
    default_hr = 90
elif "SVT" in selected_arrhythmia_name:
    default_hr = 160
elif "VT" in selected_arrhythmia_name:
    default_hr = 180
elif "Block" in selected_arrhythmia_name or "Bradycardia" in selected_arrhythmia_name:
    default_hr = 50

# Disable HR slider for VF, as it's inherently chaotic
hr_slider_disabled = (method_key == "vf")

heart_rate = st.sidebar.slider(
    "Base Heart Rate (BPM)", 
    min_value=30, 
    max_value=220, 
    value=default_hr,
    disabled=hr_slider_disabled
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
    hr_text = f"HR: {heart_rate} BPM" if not hr_slider_disabled else ""
    plot_title = f"Simulated ECG: {selected_arrhythmia_name} ({hr_text})"
    fig = plot_ecg(ecg_signal, SAMPLING_RATE, plot_title)
    
    st.plotly_chart(fig, use_container_width=True)

# Add an expander for "medical" context
with st.expander("What am I looking at?"):
    if method_key == "normal":
        st.markdown(f"""
        This is a **Normal Sinus Rhythm** at {heart_rate} BPM. 
        - **P Wave:** Present before every QRS.
        - **QRS Complex:** Narrow.
        - **Rhythm:** Regular (constant R-R intervals).
        """)
    elif method_key == "pac":
        st.markdown("""
        **Premature Atrial Contraction (PAC):**
        - **What it is:** An "early beat" originating from the atria.
        - **Look for:** A normal-looking QRS complex that comes *earlier* than expected. The P-wave for this beat might look different or be hidden.
        """)
    elif method_key == "pvc":
        st.markdown("""
        **Premature Ventricular Contraction (PVC):**
        - **What it is:** An "early beat" originating from the ventricles.
        - **Look for:** A beat that comes early, and its QRS complex is **wide and bizarre** (looks very different from the normal beats).
        """)
    elif method_key == "afib":
        st.markdown("""
        **Atrial Fibrillation (AFib):**
        - **What it is:** Chaotic, uncoordinated electrical activity in the atria.
        - **Look for:**
            - **P Wave:** Absent. Replaced by "fibrillatory waves" (a chaotic, noisy baseline).
            - **Rhythm:** **Irregularly irregular.** The R-R intervals are completely unpredictable.
        """)
    elif method_key == "afl":
        st.markdown("""
        **Atrial Flutter (AFL):**
        - **What it is:** A very fast, organized "short-circuit" in the atria.
        - **Look for:** A **"sawtooth" pattern** instead of P-waves. The R-R intervals can be regular or irregular, depending on how many "flutter" waves get through to the ventricles.
        """)
    elif method_key == "svt":
        st.markdown("""
        **Supraventricular Tachycardia (SVT/PSVT):**
        - **What it is:** A very fast (150-250 BPM), regular rhythm originating from *above* the ventricles.
        - **Look for:** A very fast, narrow-QRS rhythm. P-waves are usually hidden inside the QRS complex and impossible to see.
        """)
    elif method_key == "vt":
        st.markdown("""
        **Ventricular Tachycardia (VT):**
        - **What it is:** A very fast, life-threatening rhythm originating from the ventricles.
        - **Look for:** A very fast (>120 BPM) rhythm composed of **wide, bizarre QRS complexes**. Looks like a string of PVCs strung together. This is a medical emergency.
        """)
    elif method_key == "vf":
        st.markdown("""
        **Ventricular Fibrillation (VF):**
        - **What it is:** Chaotic, uncoordinated electrical activity in the ventricles. The heart just "quivers" and pumps no blood.
        - **Look for:** A chaotic, messy, disorganized line. There are no identifiable P, QRS, or T waves. This is **cardiac arrest** and requires immediate defibrillation.
        """)
    elif method_key == "avb1":
        st.markdown("""
        **1st-Degree AV Block:**
        - **What it is:** A *delay* in the signal conduction from the atria to the ventricles.
        - **Look for:** A normal rhythm, but the **PR interval** (time from P-wave to QRS) is consistently long (> 0.20 seconds, or one large box).
        """)
    elif method_key == "avb2":
        st.markdown("""
        **2nd-Degree AV Block (Type I - Wenckebach):**
        - **What it is:** The signal delay gets progressively longer until one beat is "dropped" completely.
        - **Look for:** The PR interval gets **longer, longer, longer... then a dropped beat** (a P-wave with no QRS after it). The pattern then repeats.
        """)
    elif method_key == "avb3":
        st.markdown("""
        **3rd-Degree (Complete) AV Block:**
        - **What it is:** A complete disconnection between the atria and ventricles. They beat independently.
        - **Look for:**
            - P-waves march along at their own regular (atrial) rate.
            - QRS complexes march along at their own, *separate*, regular (and very slow) ventricular rate.
            - There is **no relationship** between the P-waves and the QRS complexes.
        """)
