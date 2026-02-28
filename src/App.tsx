import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import type { ConceptMeta } from './types';
import { LandingPage } from './pages/LandingPage';
import { ConceptIntroModal } from './pages/ConceptIntroModal';
import { SimulatorPage } from './pages/SimulatorPage';

type Screen = 'landing' | 'intro' | 'simulator';

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [selectedConcept, setSelectedConcept] = useState<ConceptMeta | null>(null);

  const handleCardClick = (concept: ConceptMeta) => {
    setSelectedConcept(concept);
    setScreen('intro');
  };

  const handleStart = () => setScreen('simulator');
  const handleBack = () => setScreen('landing');
  const handleBackFromSim = () => {
    setScreen('landing');
    setSelectedConcept(null);
  };

  return (
    <div className="h-screen" style={{ overflow: screen === 'landing' ? 'auto' : 'hidden' }}>
      {/* Landing is always rendered as base layer */}
      {screen !== 'simulator' && <LandingPage onSelectConcept={handleCardClick} />}

      {/* Intro modal overlays landing */}
      <AnimatePresence>
        {screen === 'intro' && selectedConcept && (
          <ConceptIntroModal
            concept={selectedConcept}
            onStart={handleStart}
            onBack={handleBack}
          />
        )}
      </AnimatePresence>

      {/* Simulator takes full screen */}
      {screen === 'simulator' && selectedConcept && (
        <SimulatorPage conceptId={selectedConcept.id} onBack={handleBackFromSim} />
      )}
    </div>
  );
}

export default App;