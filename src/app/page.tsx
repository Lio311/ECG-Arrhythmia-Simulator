"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Stethoscope, Heart, Clock, Play, Activity } from "lucide-react";
import gsap from "gsap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const arrhythmiaDescriptions: Record<string, string> = {
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

export default function ECGSimulator() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    type: "normal",
    heartRate: 75,
    duration: 10
  });
  
  const [chartData, setChartData] = useState<{labels: string[], data: number[]}>({ labels: [], data: [] });

  useEffect(() => {
    const ctxAnim = gsap.context(() => {
      gsap.from(".header-anim", { y: -30, opacity: 0, duration: 0.8, ease: "power3.out" });
      gsap.from(".card-anim", { y: 30, opacity: 0, duration: 0.8, stagger: 0.2, ease: "power3.out", delay: 0.2 });
    }, containerRef);
    generateECG();
    return () => ctxAnim.revert();
  }, []);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ----------------------------------------------------
  // ECG Generation Logic
  // ----------------------------------------------------
  const generateNormalECG = (i: number, interval: number) => {
    const position = i % interval;
    const normalized = position / interval;
    if (normalized > 0.1 && normalized < 0.2) {
        return 0.2 * Math.sin((normalized - 0.1) * 10 * Math.PI);
    } else if (normalized > 0.3 && normalized < 0.4) {
        const qrsPos = (normalized - 0.3) * 10;
        if (qrsPos < 0.3) return -0.3;
        else if (qrsPos < 0.5) return 1.2;
        else return -0.2;
    } else if (normalized > 0.5 && normalized < 0.7) {
        return 0.3 * Math.sin((normalized - 0.5) * 5 * Math.PI);
    }
    return 0;
  };

  const generateAFib = (i: number, interval: number) => {
    const irregularInterval = interval * (0.7 + (Math.sin(i * 0.1) * 0.5 + 0.5) * 0.6); 
    const position = i % irregularInterval;
    const normalized = position / irregularInterval;
    const baseline = Math.sin(i * 0.5) * 0.05;
    if (normalized > 0.3 && normalized < 0.4) {
        const qrsPos = (normalized - 0.3) * 10;
        if (qrsPos < 0.3) return baseline - 0.3;
        else if (qrsPos < 0.5) return baseline + 1.2;
        else return baseline - 0.2;
    }
    return baseline;
  };

  const generateAFlutter = (i: number, interval: number) => {
    const fWaveFreq = 0.003;
    const fWave = 0.15 * Math.sin(i * fWaveFreq * 2 * Math.PI);
    const position = i % (interval * 2);
    const normalized = position / (interval * 2);
    if (normalized > 0.3 && normalized < 0.4) {
        const qrsPos = (normalized - 0.3) * 10;
        if (qrsPos < 0.3) return fWave - 0.3;
        else if (qrsPos < 0.5) return fWave + 1.2;
        else return fWave - 0.2;
    }
    return fWave;
  };

  const generateSVT = (i: number, interval: number) => generateNormalECG(i, interval);

  const generateVT = (i: number, interval: number) => {
    const position = i % interval;
    const normalized = position / interval;
    if (normalized > 0.2 && normalized < 0.5) {
        const qrsPos = (normalized - 0.2) / 0.3;
        if (qrsPos < 0.3) return -0.4;
        else if (qrsPos < 0.6) return 1.0;
        else return -0.3;
    }
    return 0;
  };

  const generateVFib = (i: number) => {
    return Math.sin(i * 0.05) * 0.4 * Math.sin(i * 0.2) + Math.sin(i * 0.1) * 0.3;
  };

  const generateAV1 = (i: number, interval: number) => {
    const position = i % interval;
    const normalized = position / interval;
    if (normalized > 0.1 && normalized < 0.2) {
        return 0.2 * Math.sin((normalized - 0.1) * 10 * Math.PI);
    } else if (normalized > 0.4 && normalized < 0.5) {
        const qrsPos = (normalized - 0.4) * 10;
        if (qrsPos < 0.3) return -0.3;
        else if (qrsPos < 0.5) return 1.2;
        else return -0.2;
    } else if (normalized > 0.6 && normalized < 0.8) {
        return 0.3 * Math.sin((normalized - 0.6) * 5 * Math.PI);
    }
    return 0;
  };

  const generateAV2 = (i: number, interval: number) => {
    const beatNumber = Math.floor(i / interval);
    if (beatNumber % 3 === 2) {
        const position = i % interval;
        const normalized = position / interval;
        if (normalized > 0.1 && normalized < 0.2) {
            return 0.2 * Math.sin((normalized - 0.1) * 10 * Math.PI);
        }
        return 0;
    }
    return generateNormalECG(i, interval);
  };

  const generateAV3 = (i: number, interval: number) => {
    const atrialInterval = interval;
    const ventricularInterval = interval * 1.5;
    let value = 0;
    const atrialPos = i % atrialInterval;
    const atrialNorm = atrialPos / atrialInterval;
    if (atrialNorm > 0.1 && atrialNorm < 0.2) {
        value += 0.15 * Math.sin((atrialNorm - 0.1) * 10 * Math.PI);
    }
    const ventPos = i % ventricularInterval;
    const ventNorm = ventPos / ventricularInterval;
    if (ventNorm > 0.3 && ventNorm < 0.4) {
        const qrsPos = (ventNorm - 0.3) * 10;
        if (qrsPos < 0.3) value += -0.3;
        else if (qrsPos < 0.5) value += 1.2;
        else value += -0.2;
    }
    return value;
  };

  const generateECGData = (type: string, hr: number, duration: number) => {
    const samplingRate = 500;
    const totalSamples = duration * samplingRate;
    const beatInterval = (60 / hr) * samplingRate;

    const ecgData = [];
    const labels = [];

    for (let i = 0; i < totalSamples; i++) {
        const time = i / samplingRate;
        // Optimization: Subsample the data by 5 for ChartJS to render smoothly
        if (i % 5 !== 0) continue; 
        
        labels.push(time.toFixed(2));

        let value = 0;
        switch (type) {
            case 'normal': value = generateNormalECG(i, beatInterval); break;
            case 'afib': value = generateAFib(i, beatInterval); break;
            case 'aflutter': value = generateAFlutter(i, beatInterval); break;
            case 'svt': value = generateSVT(i, beatInterval * 0.5); break;
            case 'vt': value = generateVT(i, beatInterval * 0.6); break;
            case 'vfib': value = generateVFib(i); break;
            case 'av1': value = generateAV1(i, beatInterval); break;
            case 'av2': value = generateAV2(i, beatInterval); break;
            case 'av3': value = generateAV3(i, beatInterval); break;
            default: value = generateNormalECG(i, beatInterval);
        }
        ecgData.push(value);
    }
    return { labels, data: ecgData };
  };

  const generateECG = () => {
    const data = generateECGData(formData.type, formData.heartRate, formData.duration);
    setChartData(data);
  };
  
  // Chart Config
  const dataOptions = {
    labels: chartData.labels,
    datasets: [{
      label: 'ECG',
      data: chartData.data,
      borderColor: '#ef4444',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0,
    }]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: { legend: { display: false } },
    scales: {
      x: {
        display: true,
        title: { display: true, text: 'זמן (שניות)', color: '#cbd5e1' },
        ticks: { color: '#94a3b8', maxTicksLimit: 20 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        display: true,
        title: { display: true, text: 'מתח (mV)', color: '#cbd5e1' },
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  return (
    <div className="relative min-h-screen text-foreground" dir="rtl" ref={containerRef}>
      <div className="bg-animation">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="bubble"></div>)}
      </div>

      <div className="container max-w-7xl mx-auto py-12 px-4 relative z-10">
        <header className="header-anim text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Activity className="w-12 h-12 text-red-500 heartbeat-icon" />
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500 pb-2">
              סימולטור הפרעות קצב
            </h1>
          </div>
          <p className="text-lg text-foreground font-light">סימולציה אינטראקטיבית של הפרעות קצב לב שונות</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Panel */}
          <aside className="lg:col-span-4 card-anim shadow-lg border border-border bg-card p-6 rounded-2xl flex flex-col gap-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-2 text-foreground">
              <SlidersHorizontal className="w-5 h-5 text-red-500" /> בקרות
            </h2>

            <div className="space-y-2 text-right">
              <Label className="flex items-center gap-2 text-foreground">
                <Stethoscope className="w-4 h-4 text-red-500" /> סוג הפרעת קצב
              </Label>
              <Select value={formData.type} onValueChange={(val) => handleChange("type", val || "")}>
                <SelectTrigger className="bg-background border-border text-foreground focus:ring-red-500 flex-row-reverse justify-between text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground" dir="rtl">
                  <SelectItem value="normal">קצב רגיל (Normal Sinus)</SelectItem>
                  <SelectItem value="afib">פרפור פרוזדורים (AFib)</SelectItem>
                  <SelectItem value="aflutter">רפרוף פרוזדורים (AFL)</SelectItem>
                  <SelectItem value="svt">SVT</SelectItem>
                  <SelectItem value="vt">VT (Ventricular Tachycardia)</SelectItem>
                  <SelectItem value="vfib">VF (Ventricular Fibrillation)</SelectItem>
                  <SelectItem value="av1">חסימה AV דרגה 1</SelectItem>
                  <SelectItem value="av2">חסימה AV דרגה 2</SelectItem>
                  <SelectItem value="av3">חסימה AV דרגה 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 text-right">
              <Label className="flex items-center gap-2 text-foreground mb-4">
                <Heart className="w-4 h-4 text-red-500" /> קצב לב (BPM): {formData.heartRate}
              </Label>
              <Slider 
                min={40} max={200} step={1} 
                value={[formData.heartRate]} 
                onValueChange={(vals: number | readonly number[]) => handleChange("heartRate", typeof vals === 'number' ? vals : vals[0])} 
                className="my-4 [&_[role=slider]]:bg-red-500 [&_[data-orientation=horizontal]]:bg-red-500"
                dir="ltr"
              />
            </div>

            <div className="space-y-2 text-right">
              <Label className="flex items-center gap-2 text-foreground mb-4">
                <Clock className="w-4 h-4 text-red-500" /> משך (שניות): {formData.duration}
              </Label>
              <Slider 
                min={5} max={30} step={1} 
                value={[formData.duration]} 
                onValueChange={(vals: number | readonly number[]) => handleChange("duration", typeof vals === 'number' ? vals : vals[0])} 
                className="my-4 [&_[role=slider]]:bg-red-500 [&_[data-orientation=horizontal]]:bg-red-500"
                dir="ltr"
              />
            </div>

            <Button 
              onClick={generateECG}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-foreground font-semibold py-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2 text-lg"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>הצג ECG</span>
            </Button>

            <div className="mt-4 p-5 bg-background rounded-xl border border-border">
              <h3 className="text-md font-semibold text-foreground mb-2">מידע על ההפרעה</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {arrhythmiaDescriptions[formData.type] || "בחר סוג הפרעת קצב לקבלת מידע"}
              </p>
            </div>
          </aside>

          {/* Preview Panel */}
          <main className="lg:col-span-8 card-anim flex flex-col gap-6">
            <Card className="shadow-lg border border-border bg-card flex-grow">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                  <Activity className="w-5 h-5 text-red-500" /> גרף ECG
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[500px] w-full bg-muted rounded-xl p-4 border border-border relative">
                {chartData.labels.length > 0 ? (
                  <Line data={dataOptions} options={chartOptions as any} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    טוען נתונים...
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>

        <footer className="text-center text-muted-foreground text-sm mt-12 pb-8 border-t border-border pt-8">
          <p>סימולטור ECG לצרכים חינוכיים בלבד</p>
        </footer>
      </div>
    </div>
  );
}


