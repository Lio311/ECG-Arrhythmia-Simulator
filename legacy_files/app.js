// DOM Elements
const arrhythmiaType = document.getElementById('arrhythmiaType');
const heartRate = document.getElementById('heartRate');
const duration = document.getElementById('duration');
const hrDisplay = document.getElementById('hrDisplay');
const durationDisplay = document.getElementById('durationDisplay');
const generateBtn = document.getElementById('generateBtn');
const arrhythmiaInfo = document.getElementById('arrhythmiaInfo');

// Chart
let ecgChart = null;

// Arrhythmia Information
const arrhythmiaDescriptions = {
    normal: 'קצב סינוס תקין - קצב לב רגיל ותקין עם גלי P, QRS ו-T תקינים.',
    afib: 'פרפור פרוזדורים - קצב לא סדיר ללא גלי P ברורים, תגובה חדרית לא סדירה.',
    aflutter: 'רפרוף פרוזדורים - גלי F מסורגים (saw-tooth) בקצב מהיר וסדיר.',
    svt: 'טכיקרדיה על-חדרית - קצב מהיר וסדיר מעל 150 BPM עם QRS צר.',
    vt: 'טכיקרדיה חדרית - קצב מהיר עם QRS רחב, מסכן חיים.',
    vfib: 'פרפור חדרים - קצב כאוטי לחלוטין, דורש החייאה מיידית!',
    av1: 'חסימה AV דרגה 1 - PR מוארך (>0.2 שניות), כל גל P מוליך.',
    av2: 'חסימה AV דרגה 2 - חלק מגלי ה-P לא מולכים לחדרים.',
    av3: 'חסימה AV דרגה 3 - אין הולכה בין פרוזדורים לחדרים, קצב חדרי עצמאי.'
};

// Event Listeners
heartRate.addEventListener('input', () => {
    hrDisplay.textContent = heartRate.value;
});

duration.addEventListener('input', () => {
    durationDisplay.textContent = duration.value;
});

arrhythmiaType.addEventListener('change', () => {
    arrhythmiaInfo.textContent = arrhythmiaDescriptions[arrhythmiaType.value];
});

generateBtn.addEventListener('click', generateECG);

// Initialize
arrhythmiaInfo.textContent = arrhythmiaDescriptions.normal;

function generateECG() {
    const type = arrhythmiaType.value;
    const hr = parseInt(heartRate.value);
    const dur = parseInt(duration.value);

    // Generate ECG data
    const data = generateECGData(type, hr, dur);

    // Update chart
    updateChart(data);
}

function generateECGData(type, hr, duration) {
    const samplingRate = 500; // Hz
    const totalSamples = duration * samplingRate;
    const beatInterval = (60 / hr) * samplingRate;

    const ecgData = [];
    const labels = [];

    for (let i = 0; i < totalSamples; i++) {
        const time = i / samplingRate;
        labels.push(time.toFixed(2));

        let value = 0;

        switch (type) {
            case 'normal':
                value = generateNormalECG(i, beatInterval);
                break;
            case 'afib':
                value = generateAFib(i, beatInterval);
                break;
            case 'aflutter':
                value = generateAFlutter(i, beatInterval);
                break;
            case 'svt':
                value = generateSVT(i, beatInterval * 0.5);
                break;
            case 'vt':
                value = generateVT(i, beatInterval * 0.6);
                break;
            case 'vfib':
                value = generateVFib(i);
                break;
            case 'av1':
                value = generateAV1(i, beatInterval);
                break;
            case 'av2':
                value = generateAV2(i, beatInterval);
                break;
            case 'av3':
                value = generateAV3(i, beatInterval);
                break;
            default:
                value = generateNormalECG(i, beatInterval);
        }

        ecgData.push(value);
    }

    return { labels, data: ecgData };
}

function generateNormalECG(i, interval) {
    const position = i % interval;
    const normalized = position / interval;

    // P wave (0.1-0.2)
    if (normalized > 0.1 && normalized < 0.2) {
        return 0.2 * Math.sin((normalized - 0.1) * 10 * Math.PI);
    }
    // QRS complex (0.3-0.4)
    else if (normalized > 0.3 && normalized < 0.4) {
        const qrsPos = (normalized - 0.3) * 10;
        if (qrsPos < 0.3) return -0.3;
        else if (qrsPos < 0.5) return 1.2;
        else return -0.2;
    }
    // T wave (0.5-0.7)
    else if (normalized > 0.5 && normalized < 0.7) {
        return 0.3 * Math.sin((normalized - 0.5) * 5 * Math.PI);
    }

    return 0;
}

function generateAFib(i, interval) {
    // Irregular baseline with irregular QRS
    const irregularInterval = interval * (0.7 + Math.random() * 0.6);
    const position = i % irregularInterval;
    const normalized = position / irregularInterval;

    // Irregular baseline (no P waves)
    let baseline = (Math.random() - 0.5) * 0.1;

    // Irregular QRS
    if (normalized > 0.3 && normalized < 0.4) {
        const qrsPos = (normalized - 0.3) * 10;
        if (qrsPos < 0.3) return baseline - 0.3;
        else if (qrsPos < 0.5) return baseline + 1.2;
        else return baseline - 0.2;
    }

    return baseline;
}

function generateAFlutter(i, interval) {
    // Sawtooth F waves
    const fWaveFreq = 0.003; // ~300 bpm
    const fWave = 0.15 * Math.sin(i * fWaveFreq * 2 * Math.PI);

    // Regular QRS every 2-3 F waves
    const position = i % (interval * 2);
    const normalized = position / (interval * 2);

    if (normalized > 0.3 && normalized < 0.4) {
        const qrsPos = (normalized - 0.3) * 10;
        if (qrsPos < 0.3) return fWave - 0.3;
        else if (qrsPos < 0.5) return fWave + 1.2;
        else return fWave - 0.2;
    }

    return fWave;
}

function generateSVT(i, interval) {
    // Fast regular rhythm, narrow QRS
    return generateNormalECG(i, interval);
}

function generateVT(i, interval) {
    // Wide QRS complexes
    const position = i % interval;
    const normalized = position / interval;

    if (normalized > 0.2 && normalized < 0.5) {
        const qrsPos = (normalized - 0.2) / 0.3;
        if (qrsPos < 0.3) return -0.4;
        else if (qrsPos < 0.6) return 1.0;
        else return -0.3;
    }

    return 0;
}

function generateVFib(i) {
    // Chaotic waveform
    return (Math.random() - 0.5) * 0.8 + Math.sin(i * 0.1) * 0.3;
}

function generateAV1(i, interval) {
    // Prolonged PR interval
    const position = i % interval;
    const normalized = position / interval;

    // P wave (0.1-0.2)
    if (normalized > 0.1 && normalized < 0.2) {
        return 0.2 * Math.sin((normalized - 0.1) * 10 * Math.PI);
    }
    // Longer PR segment
    // QRS complex (0.4-0.5) - delayed
    else if (normalized > 0.4 && normalized < 0.5) {
        const qrsPos = (normalized - 0.4) * 10;
        if (qrsPos < 0.3) return -0.3;
        else if (qrsPos < 0.5) return 1.2;
        else return -0.2;
    }
    // T wave
    else if (normalized > 0.6 && normalized < 0.8) {
        return 0.3 * Math.sin((normalized - 0.6) * 5 * Math.PI);
    }

    return 0;
}

function generateAV2(i, interval) {
    // Some P waves don't conduct
    const beatNumber = Math.floor(i / interval);

    // Drop every 3rd beat
    if (beatNumber % 3 === 2) {
        const position = i % interval;
        const normalized = position / interval;

        // P wave only, no QRS
        if (normalized > 0.1 && normalized < 0.2) {
            return 0.2 * Math.sin((normalized - 0.1) * 10 * Math.PI);
        }
        return 0;
    }

    return generateNormalECG(i, interval);
}

function generateAV3(i, interval) {
    // Independent atrial and ventricular rhythms
    const atrialInterval = interval;
    const ventricularInterval = interval * 1.5;

    let value = 0;

    // Atrial P waves
    const atrialPos = i % atrialInterval;
    const atrialNorm = atrialPos / atrialInterval;
    if (atrialNorm > 0.1 && atrialNorm < 0.2) {
        value += 0.15 * Math.sin((atrialNorm - 0.1) * 10 * Math.PI);
    }

    // Ventricular QRS (slower, independent)
    const ventPos = i % ventricularInterval;
    const ventNorm = ventPos / ventricularInterval;
    if (ventNorm > 0.3 && ventNorm < 0.4) {
        const qrsPos = (ventNorm - 0.3) * 10;
        if (qrsPos < 0.3) value += -0.3;
        else if (qrsPos < 0.5) value += 1.2;
        else value += -0.2;
    }

    return value;
}

function updateChart(data) {
    const ctx = document.getElementById('ecgChart').getContext('2d');

    if (ecgChart) {
        ecgChart.destroy();
    }

    ecgChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'ECG',
                data: data.data,
                borderColor: '#ef4444',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                tension: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'זמן (שניות)',
                        color: '#cbd5e1'
                    },
                    ticks: {
                        color: '#94a3b8',
                        maxTicksLimit: 20
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'מתח (mV)',
                        color: '#cbd5e1'
                    },
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Generate initial ECG
generateECG();
