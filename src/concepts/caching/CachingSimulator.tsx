import { useCachingEngine } from './useCachingEngine';
import { CachingDiagram } from './CachingDiagram';
import { CachingSidebar } from './CachingSidebar';
import { StoryBox } from './StoryBox';

interface CachingSimulatorProps {
  conceptId: string;
  onStatsUpdate: (stats: { hits: number; misses: number; total: number; ms: number }) => void;
  onReset: () => void;
}

export function CachingSimulator({ conceptId, onStatsUpdate: _onStatsUpdate, onReset: _onReset }: CachingSimulatorProps) {
  const { state, start, pause, reset, triggerSpike, clearCache, updateConfig } = useCachingEngine();

  return (
    <div className="flex flex-1 h-full overflow-hidden select-none">
      {/* Diagram canvas */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          background: '#fafbfc',
          backgroundImage: 'radial-gradient(circle, #dde2ea 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        {/* Story panel — top-left */}
        <StoryBox
          cacheEnabled={state.config.cacheEnabled}
          hitRate={state.cacheHitRate}
          dbLoad={state.dbLoad}
        />

        {/* Main diagram */}
        <CachingDiagram
          activeRequests={state.activeRequests}
          cacheSlots={state.cacheSlots}
          config={state.config}
          cacheHitRate={state.cacheHitRate}
          dbLoad={state.dbLoad}
          dbQueueLength={state.dbQueueLength}
          avgLatencyMs={state.avgLatencyMs}
          running={state.running}
        />
      </div>

      {/* Right sidebar */}
      <CachingSidebar
        conceptId={conceptId}
        engineState={state}
        running={state.running}
        onStart={start}
        onPause={pause}
        onReset={reset}
        onSpike={triggerSpike}
        onClearCache={clearCache}
        onConfigChange={updateConfig}
      />
    </div>
  );
}
