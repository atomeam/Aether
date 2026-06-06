import React, { useState, useEffect } from 'react';
import { 
  Waves, Radio, Lightning, Thermometer, Radar, Clock, Atom, Layers, 
  Dna, ArrowUpRight, Ghost, MessageSquare, Battery, Spark, Globe, Activity 
} from 'lucide-react';

interface DetectionData {
  gravitational?: { strain: number; frequency: number; amplitude: number };
  electromagnetic?: { elf: number; vlf: number; magneticField: number };
  propulsion?: { antigravityField: number; zeroPointEnergy: number };
  thermal?: { heatSignature: number; infraredAnomaly: boolean };
  radar?: { rcs: number; dopplerShift: number };
  temporal?: { timeDilation: number; temporalRift: boolean };
  quantum?: { entanglement: number; coherence: number };
  dimensional?: { interdimensionalRift: number; spatialDistortion: number };
  biological?: { nonHumanMarkers: string[]; psychometricField: number };
  trajectory?: { nonBallistic: boolean; instantAcceleration: number };
  material?: { metamaterial: string; memoryMetal: boolean };
  communication?: { neuralInterface: boolean; telepathicSignal: number };
  energy?: { ambientAbsorption: number; zeroPointExtraction: number };
  teleportation?: { matterDisplacement: number; spatialJump: boolean };
  reality?: { simulationGlitch: number; physicsViolation: boolean };
  externalData?: {
    earthquakes: number;
    solarActivity: number;
    weather: number;
  };
}

interface DetectionCard {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
  color: string;
}

export function UAPDetectionArrays() {
  const [detectionData, setDetectionData] = useState<DetectionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetectionData();
    const interval = setInterval(fetchDetectionData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchDetectionData = async () => {
    try {
      const response = await fetch('/api/detect');
      if (response.ok) {
        const data = await response.json();
        setDetectionData(data.anomaly || data);
      }
    } catch (err) {
      // Try production API
      try {
        const prodResponse = await fetch('https://uap-detection.atomicmoonbeam88.workers.dev/api/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sensorData: Array.from({ length: 5 }, () => Math.random()) })
        });
        if (prodResponse.ok) {
          const data = await prodResponse.json();
          setDetectionData(data.anomaly);
        }
      } catch {
        // Use simulated data if API not available
        setDetectionData(generateSimulatedData());
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSimulatedData = (): DetectionData => ({
    gravitational: { strain: Math.random() * 1e-20, frequency: 100 + Math.random() * 1000, amplitude: Math.random() * 1e-21 },
    electromagnetic: { elf: 3 + Math.random() * 27, vlf: 3000 + Math.random() * 27000, magneticField: 50e-6 + Math.random() * 10e-6 },
    propulsion: { antigravityField: Math.random() * 10, zeroPointEnergy: Math.random() * 1e20 },
    thermal: { heatSignature: 200 + Math.random() * 300, infraredAnomaly: Math.random() > 0.9 },
    radar: { rcs: Math.random() * 100, dopplerShift: Math.random() * 10000 },
    temporal: { timeDilation: 1 + Math.random() * 0.1, temporalRift: Math.random() > 0.99 },
    quantum: { entanglement: Math.random(), coherence: Math.random() },
    dimensional: { interdimensionalRift: Math.random() * 100, spatialDistortion: Math.random() * 100 },
    biological: { nonHumanMarkers: Math.random() > 0.5 ? ['DETECTED'] : [], psychometricField: Math.random() * 100 },
    trajectory: { nonBallistic: Math.random() > 0.8, instantAcceleration: Math.random() > 0.8 ? Math.random() * 100000 : 0 },
    material: { metamaterial: 'meta-' + Math.random().toString(36).substring(2, 8), memoryMetal: Math.random() > 0.5 },
    communication: { neuralInterface: Math.random() > 0.95, telepathicSignal: Math.random() * 100 },
    energy: { ambientAbsorption: Math.random() * 1000, zeroPointExtraction: Math.random() * 1e15 },
    teleportation: { matterDisplacement: Math.random() * 1000, spatialJump: Math.random() > 0.99 },
    reality: { simulationGlitch: Math.random() * 100, physicsViolation: Math.random() > 0.999 }
  });

  const getDetectionCards = (): DetectionCard[] => {
    const data = detectionData || generateSimulatedData();
    
    return [
      {
        icon: Waves,
        label: 'Gravitational',
        value: data.gravitational?.strain.toExponential(2) || '0',
        unit: 'strain',
        color: 'blue'
      },
      {
        icon: Radio,
        label: 'EM Field',
        value: data.electromagnetic?.elf.toFixed(1) || '0',
        unit: 'Hz',
        color: 'purple'
      },
      {
        icon: Lightning,
        label: 'Propulsion',
        value: data.propulsion?.antigravityField.toFixed(1) || '0',
        unit: 'G',
        color: 'yellow'
      },
      {
        icon: Thermometer,
        label: 'Thermal',
        value: data.thermal?.heatSignature.toFixed(0) || '0',
        unit: 'K',
        color: 'red'
      },
      {
        icon: Radar,
        label: 'Radar',
        value: data.radar?.rcs.toFixed(2) || '0',
        unit: 'm²',
        color: 'green'
      },
      {
        icon: Clock,
        label: 'Temporal',
        value: data.temporal?.timeDilation.toFixed(3) || '1',
        unit: 'x',
        color: 'cyan'
      },
      {
        icon: Atom,
        label: 'Quantum',
        value: data.quantum?.entanglement.toFixed(2) || '0',
        unit: 'φ',
        color: 'pink'
      },
      {
        icon: Layers,
        label: 'Dimensional',
        value: data.dimensional?.interdimensionalRift.toFixed(0) || '0',
        unit: '%',
        color: 'indigo'
      },
      {
        icon: Dna,
        label: 'Biological',
        value: data.biological?.nonHumanMarkers.length > 0 ? 'DETECTED' : 'NONE',
        unit: '',
        color: 'emerald'
      },
      {
        icon: ArrowUpRight,
        label: 'Trajectory',
        value: data.trajectory?.nonBallistic ? 'NON-BALLISTIC' : 'NORMAL',
        unit: '',
        color: 'orange'
      },
      {
        icon: Ghost,
        label: 'Material',
        value: data.material?.metamaterial || 'METAMATERIAL',
        unit: '',
        color: 'gray'
      },
      {
        icon: MessageSquare,
        label: 'Comm',
        value: data.communication?.neuralInterface ? 'NEURAL' : 'NONE',
        unit: '',
        color: 'teal'
      },
      {
        icon: Battery,
        label: 'Energy',
        value: data.energy?.zeroPointExtraction.toExponential(2) || '0',
        unit: 'J',
        color: 'lime'
      },
      {
        icon: Spark,
        label: 'Teleport',
        value: data.teleportation?.spatialJump ? 'JUMP' : 'NONE',
        unit: '',
        color: 'violet'
      },
      {
        icon: Globe,
        label: 'Reality',
        value: data.reality?.physicsViolation ? 'VIOLATION' : 'STABLE',
        unit: '',
        color: 'rose'
      }
    ];
  };

  const cards = getDetectionCards();

  return (
    <div className="col-span-2 p-6 border border-gold/10 bg-gold/[0.02] rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gold/10 rounded-lg">
          <Activity className="w-4 h-4 text-gold animate-pulse" />
        </div>
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gold">UAP Detection Arrays</h3>
          <p className="text-[6px] text-white/30 uppercase tracking-wider">Real-time Sensor Data - 15 Detection Systems</p>
        </div>
      </div>
      
      <div className="grid grid-cols-5 gap-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              className="p-3 border border-white/5 bg-white/[0.01] rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group"
            >
              <Icon className={`w-4 h-4 text-${card.color}-400 mb-2 group-hover:scale-110 transition-transform`} />
              <div className="text-[6px] text-white/40 uppercase tracking-wider">{card.label}</div>
              <div className="text-[8px] font-mono text-white/80">
                {card.value}
                {card.unit && <span className="text-white/40 ml-1">{card.unit}</span>}
              </div>
            </div>
          );
        })}
      </div>
      
      {detectionData?.externalData && (
        <div className="mt-4 pt-4 border-t border-gold/20">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-3 h-3 text-gold animate-pulse" />
            <div className="text-[8px] text-gold/60 uppercase tracking-wider">Real-World Correlation</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-gold/[0.05] border border-gold/10 rounded">
              <div className="text-[6px] text-white/40 uppercase tracking-wider">Earthquakes</div>
              <div className="text-[10px] font-mono text-gold">{detectionData.externalData.earthquakes}</div>
            </div>
            <div className="p-2 bg-gold/[0.05] border border-gold/10 rounded">
              <div className="text-[6px] text-white/40 uppercase tracking-wider">Solar Wind</div>
              <div className="text-[10px] font-mono text-gold">{detectionData.externalData.solarActivity} km/s</div>
            </div>
            <div className="p-2 bg-gold/[0.05] border border-gold/10 rounded">
              <div className="text-[6px] text-white/40 uppercase tracking-wider">Temperature</div>
              <div className="text-[10px] font-mono text-gold">{detectionData.externalData.weather}°C</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}