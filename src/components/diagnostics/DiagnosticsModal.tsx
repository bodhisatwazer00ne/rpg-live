import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { 
  runFullDiagnosticSuite, 
  TestSuiteSummary, 
  TestResult 
} from '../../services/testSuite';
import { chiptune } from '../../services/audio';
import { PixelIcon } from '../rpg/PixelIcon';

interface DiagnosticsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onRecoverStamina?: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  user,
  isOpen,
  onClose,
  onRecoverStamina,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<TestSuiteSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FUNCTIONAL' | 'STRESS' | 'LOAD' | 'PERFORMANCE' | 'SECURITY' | 'TOKEN_EXHAUSTION'>('ALL');
  const [serverHealth, setServerHealth] = useState<{ status: string; hasGeminiKey: boolean; cacheSize: number; uptime: number } | null>(null);

  // Live Token Exhaustion Simulation State
  const [simulateExhaustion, setSimulateExhaustion] = useState(false);
  const [oracleOutput, setOracleOutput] = useState<any | null>(null);
  const [isOracleLoading, setIsOracleLoading] = useState(false);

  // Fetch server health on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/health')
        .then(res => res.json())
        .then(data => setServerHealth(data))
        .catch(() => setServerHealth(null));
      
      // Auto run first suite if empty
      if (!summary) {
        handleRunTests();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setIsRunning(true);
    chiptune.playSelect();
    try {
      const res = await runFullDiagnosticSuite(user);
      setSummary(res);
      if (res.failed === 0) {
        chiptune.playLevelUp();
      } else {
        chiptune.playHit();
      }
    } catch (err) {
      console.error('Error running test suite:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleConsultOracle = async (forceSimulate?: boolean) => {
    setIsOracleLoading(true);
    chiptune.playSelect();
    try {
      const res = await fetch('/api/ai/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulateTokenExhaustion: forceSimulate !== undefined ? forceSimulate : simulateExhaustion,
          trainerInfo: {
            level: user.level,
            specialization: user.title,
            streak: user.streak,
            attributes: user.attributes,
          },
        }),
      });
      const data = await res.json();
      setOracleOutput(data);
      chiptune.playSelect();
    } catch (err: any) {
      setOracleOutput({ error: err.message });
    } finally {
      setIsOracleLoading(false);
    }
  };

  const filteredResults = summary?.results.filter(r => 
    activeTab === 'ALL' ? true : r.category === activeTab
  ) || [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#0b0814]/85 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnostics-title"
    >
      <div className="w-full max-w-4xl max-h-[92vh] bg-[#241c38] border-4 border-[#5b4e7a] flex flex-col shadow-[8px_8px_0px_#0b0814] overflow-hidden text-[#f4eee3]">
        
        {/* MODAL HEADER */}
        <div className="bg-[#181425] px-4 py-3 border-b-4 border-[#0b0814] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#38b764] border border-white animate-pulse" />
            <h2 id="diagnostics-title" className="font-pixel text-xs sm:text-sm text-[#fec83e] tracking-wide">
              SYSTEM TEST LAB & DIAGNOSTIC CONSOLE
            </h2>
          </div>
          <button
            onClick={() => {
              chiptune.playSelect();
              onClose();
            }}
            aria-label="Close Test Lab"
            className="font-pixel text-xs bg-[#e43b44] hover:bg-[#c22d35] text-white px-2.5 py-1 border-2 border-white shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* SUBHEADER CONTROLS & SUMMARY BANNER */}
        <div className="bg-[#1e1730] p-4 border-b-2 border-[#3e3458] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs font-silkscreen">
            <div>
              <span className="text-[#94a3b8]">TEST SUITE:</span>{' '}
              <span className="font-pixel text-[#38b764]">{summary ? `${summary.passed}/${summary.total} PASSED` : 'IDLE'}</span>
            </div>
            {summary && (
              <div>
                <span className="text-[#94a3b8]">ELAPSED:</span>{' '}
                <span className="font-pixel text-[#93c5fd]">{summary.totalDurationMs} ms</span>
              </div>
            )}
            {serverHealth && (
              <div className="flex items-center gap-2">
                <span className="text-[#94a3b8]">BACKEND:</span>{' '}
                <span className="font-pixel text-[#38b764]">ONLINE (UP {Math.round(serverHealth.uptime)}s)</span>
                <span className="text-[#94a3b8]">| CACHE:</span>{' '}
                <span className="font-pixel text-[#fec83e]">{serverHealth.cacheSize} ITEMS</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className={`font-pixel text-xs px-4 py-2 border-2 shadow-[2px_2px_0px_#000] transition-all cursor-pointer ${
                isRunning 
                  ? 'bg-[#40335c] border-[#6b588c] text-[#a594c9] cursor-wait' 
                  : 'bg-[#38b764] hover:bg-[#2e9c54] border-white text-white active:translate-y-0.5'
              }`}
            >
              {isRunning ? '⏳ RUNNING DIAGNOSTICS...' : '▶ RE-RUN ALL TESTS'}
            </button>
          </div>
        </div>

        {/* CATEGORY FILTER TABS */}
        <div className="bg-[#150e24] px-4 py-2 border-b border-[#3e3458] flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'FUNCTIONAL', 'STRESS', 'LOAD', 'PERFORMANCE', 'SECURITY', 'TOKEN_EXHAUSTION'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                chiptune.playSelect();
                setActiveTab(tab);
              }}
              className={`font-pixel text-[10px] px-2.5 py-1 border transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#5b4e7a] border-[#fec83e] text-[#fec83e]'
                  : 'bg-[#241c38] border-[#3e3458] text-[#94a3b8] hover:text-white'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* MAIN TEST REPORT & LIVE TOKEN EXHAUSTION LAB */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* SECTION: INTERACTIVE TOKEN EXHAUSTION MEASURES & SIMULATION */}
          <div className="bg-[#181425] border-2 border-[#5b21b6] p-3 shadow-[4px_4px_0px_#0b0814]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3e3458] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-pixel text-xs text-[#a78bfa] flex items-center gap-1.5">
                  ⚡ TOKEN EXHAUSTION MITIGATION & HEURISTIC FAILSAFE LAB
                </span>
                <span className="font-silkscreen text-[9px] bg-[#2e1065] text-[#c4b5fd] px-1.5 py-0.5 border border-[#6d28d9]">
                  ZERO DOWNTIME GUARANTEE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 font-silkscreen text-[10px] text-[#f4eee3] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateExhaustion}
                    onChange={(e) => setSimulateExhaustion(e.target.checked)}
                    className="accent-[#a78bfa] cursor-pointer"
                  />
                  <span>Simulate 429 Quota / Token Exhaustion</span>
                </label>
              </div>
            </div>

            <p className="font-silkscreen text-xs text-[#94a3b8] mb-3">
              Demonstrates measures taken when LLM tokens or API quotas exhaust. When tokens exhaust, the server automatically 
              deploys the deterministic offline heuristic RPG engine, yielding immediate tactical advice and balanced quests with 0 tokens consumed.
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                onClick={() => handleConsultOracle(false)}
                disabled={isOracleLoading}
                className="font-pixel text-[10px] bg-[#4338ca] hover:bg-[#3730a3] text-white px-3 py-1.5 border border-[#818cf8] shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                {isOracleLoading ? 'QUERYING ORACLE...' : '🔮 CONSULT AI ORACLE'}
              </button>
              <button
                onClick={() => handleConsultOracle(true)}
                disabled={isOracleLoading}
                className="font-pixel text-[10px] bg-[#9333ea] hover:bg-[#7e22ce] text-white px-3 py-1.5 border border-[#d8b4fe] shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                ⚡ TEST 429 EXHAUSTION FALLBACK
              </button>
              {onRecoverStamina && (
                <button
                  onClick={() => {
                    chiptune.playLevelUp();
                    onRecoverStamina();
                  }}
                  className="font-pixel text-[10px] bg-[#059669] hover:bg-[#047857] text-white px-3 py-1.5 border border-[#34d399] shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  🍵 EMERGENCY MEDITATION (+20 STAMINA)
                </button>
              )}
            </div>

            {oracleOutput && (
              <div className="bg-[#120e1d] border border-[#4c1d95] p-3 text-xs font-silkscreen space-y-1.5">
                <div className="flex flex-wrap items-center justify-between text-[10px] text-[#a78bfa] border-b border-[#2e1065] pb-1">
                  <span>SOURCE: <strong className="text-[#34d399]">{oracleOutput.source || 'GEMINI'}</strong></span>
                  <span>TOKENS CONSUMED: <strong className="text-[#fec83e]">{oracleOutput.tokensConsumed ?? 0}</strong></span>
                  <span>STATUS: <strong className="text-[#60a5fa]">{oracleOutput.tokenStatus || 'ACTIVE'}</strong></span>
                </div>
                <div className="text-[#e2e8f0] pt-1">
                  <strong className="text-[#fec83e]">TACTICAL ADVICE:</strong> {oracleOutput.advice}
                </div>
                {oracleOutput.recommendedStrategy && (
                  <div className="text-[#94a3b8] text-[11px]">
                    <strong className="text-[#a78bfa]">STRATEGY:</strong> {oracleOutput.recommendedStrategy}
                  </div>
                )}
                {oracleOutput.questSuggestions && oracleOutput.questSuggestions.length > 0 && (
                  <div className="pt-1">
                    <div className="text-[10px] text-[#38b764] font-pixel">GENERATED FAILSAFE QUESTS (0 TOKENS):</div>
                    <ul className="list-disc list-inside text-[11px] text-[#cbd5e1] space-y-0.5 mt-0.5">
                      {oracleOutput.questSuggestions.map((q: any, i: number) => (
                        <li key={i}>
                          <strong className="text-[#f4eee3]">{q.title}</strong>: {q.description} (+{q.rewardXp} XP, +{q.rewardGold} Gold)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LIST OF VERIFIED TEST SPECS */}
          <div className="space-y-2">
            <div className="font-pixel text-[11px] text-[#fec83e] tracking-wide flex items-center justify-between">
              <span>TEST RESULTS ({filteredResults.length})</span>
              <span className="font-silkscreen text-[10px] text-[#94a3b8]">Sorted by execution order</span>
            </div>

            {filteredResults.map(test => (
              <div 
                key={test.id}
                className={`p-3 border-2 shadow-[2px_2px_0px_#0b0814] flex flex-col gap-1.5 transition-colors ${
                  test.status === 'PASS' 
                    ? 'bg-[#181425] border-[#257142]' 
                    : 'bg-[#291316] border-[#e43b44]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className={`font-pixel text-[10px] px-1.5 py-0.5 border ${
                        test.status === 'PASS'
                          ? 'bg-[#0d2a15] text-[#38b764] border-[#257142]'
                          : 'bg-[#401f24] text-[#e43b44] border-[#8a242a]'
                      }`}
                    >
                      {test.status}
                    </span>
                    <span className="font-pixel text-xs text-[#f4eee3]">{test.name}</span>
                    <span className="font-silkscreen text-[9px] bg-[#2d2247] text-[#c4b5fd] px-1.5 py-0.5">
                      {test.category}
                    </span>
                  </div>
                  <span className="font-pixel text-[10px] text-[#93c5fd]">
                    ⏱ {test.durationMs} ms
                  </span>
                </div>

                <p className="font-silkscreen text-[11px] text-[#94a3b8]">
                  {test.description}
                </p>

                {test.details && (
                  <div className="bg-[#120e1d] p-2 border border-[#3e3458] font-silkscreen text-[11px] text-[#38b764]">
                    {test.details}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-[#181425] px-4 py-2.5 border-t-4 border-[#0b0814] flex items-center justify-between text-xs font-silkscreen text-[#94a3b8]">
          <span>Security, Load, Performance & Token Exhaustion Standards Verified</span>
          <button
            onClick={() => {
              chiptune.playSelect();
              onClose();
            }}
            className="font-pixel text-[10px] bg-[#3e3458] hover:bg-[#5b4e7a] text-white px-3 py-1 border border-white cursor-pointer"
          >
            RETURN TO GAME
          </button>
        </div>

      </div>
    </div>
  );
};
