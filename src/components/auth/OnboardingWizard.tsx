import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  Download,
  CheckCircle2,
  Copy,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  LogOut,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWallet } from '../../context/WalletContext';
import { generateMnemonic } from '../../services/mockBlockchain';

type OnboardingStep =
  | 'welcome'
  | 'create_reveal'
  | 'create_verify'
  | 'import_phrase';

export const OnboardingWizard: React.FC = () => {
  const { createWallet, importWallet, userEmail, lockVault } = useWallet();

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [hasAcknowledgedRisk, setHasAcknowledgedRisk] = useState(false);

  // Verification quiz state
  const [quizIndices, setQuizIndices] = useState<number[]>([2, 6, 10]); // 3rd, 7th, 11th words
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizError, setQuizError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import state
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // Start Create Wallet flow
  const handleStartCreate = () => {
    const words = generateMnemonic(12);
    setMnemonicWords(words);
    // Pick 3 random distinct indices for the quiz
    const randomIdx1 = Math.floor(Math.random() * 4); // 0-3
    const randomIdx2 = Math.floor(Math.random() * 4) + 4; // 4-7
    const randomIdx3 = Math.floor(Math.random() * 4) + 8; // 8-11
    setQuizIndices([randomIdx1, randomIdx2, randomIdx3]);
    setQuizAnswers({});
    setQuizError('');
    setStep('create_reveal');
  };

  const handleCopyPhrase = () => {
    navigator.clipboard.writeText(mnemonicWords.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuizError('');

    for (const idx of quizIndices) {
      const userWord = (quizAnswers[idx] || '').trim().toLowerCase();
      const expectedWord = mnemonicWords[idx].toLowerCase();
      if (userWord !== expectedWord) {
        setQuizError(`Word #${idx + 1} does not match your recovery phrase. Please check again.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createWallet(mnemonicWords);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {
      setQuizError('Failed to create wallet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    const trimmed = importText.trim();
    const words = trimmed.split(/\s+/);
    if (words.length !== 12 && words.length !== 24 && !trimmed.startsWith('0x')) {
      setImportError('Please enter a valid 12 or 24-word recovery phrase or a 64-character private key.');
      return;
    }
    setIsSubmitting(true);
    try {
      await importWallet(trimmed);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch {
      setImportError('Failed to import wallet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const spinner = <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />;

  return (
    <div className="min-h-full flex flex-col justify-center max-w-lg mx-auto p-4 sm:p-6 animate-fadeIn">
      {/* 1. Welcome Screen */}
      {step === 'welcome' && (
        <div className="text-center space-y-6">
          <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 shadow-2xl mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-8 h-8" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Apex <span className="gradient-text">Vault</span>
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
              Your non-custodial multi-chain gateway. Safe, ultra-fast, and powered by real-time Web3 feeds.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={handleStartCreate}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-600/25 flex items-center justify-between transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">Create a New Wallet</div>
                  <div className="text-xs text-indigo-200">Generate a fresh 12-word seed phrase</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-200 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => {
                setImportText('');
                setImportError('');
                setStep('import_phrase');
              }}
              className="w-full py-4 px-6 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/70 text-slate-200 font-semibold rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-800 rounded-xl">
                  <Download className="w-5 h-5 text-slate-300" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">Import Existing Wallet</div>
                  <div className="text-xs text-slate-400">Use 12/24 recovery words or private key</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Your recovery phrase is never sent to our servers</span>
          </div>

          {userEmail && (
            <div className="text-xs text-slate-500">
              Signed in as <span className="text-slate-300">{userEmail}</span>
              {' · '}
              <button onClick={lockVault} className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                <LogOut className="w-3 h-3" /> Sign out
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Reveal Seed Phrase */}
      {step === 'create_reveal' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('welcome')}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Step 1 of 2: Secret Recovery Phrase
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Write Down Your Secret Phrase</h2>
            <p className="text-xs text-slate-400 mt-1">
              These 12 words are the ONLY way to recover your funds. Never share them with anyone, including support.
            </p>
          </div>

          {/* Seed Words Grid */}
          <div className="grid grid-cols-3 gap-2.5 p-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl relative">
            {mnemonicWords.map((word, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 bg-slate-950/80 px-2.5 py-2 rounded-xl border border-slate-800 text-xs font-mono"
              >
                <span className="text-slate-600 select-none w-4 text-right">{idx + 1}.</span>
                <span className="text-indigo-200 font-medium">{word}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleCopyPhrase}
              className="flex items-center space-x-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 py-2 px-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl transition-all"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
            </button>

            <span className="text-[11px] text-slate-500 font-mono">BIP-39 Standard</span>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <label className="cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAcknowledgedRisk}
                onChange={(e) => setHasAcknowledgedRisk(e.target.checked)}
                className="mr-2 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              I have saved my recovery phrase in a secure, offline location.
            </label>
          </div>

          <button
            onClick={() => setStep('create_verify')}
            disabled={!hasAcknowledgedRisk}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-40"
          >
            <span>Next: Verify Phrase</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Verify Backup Quiz */}
      {step === 'create_verify' && (
        <form onSubmit={handleVerifyQuiz} className="space-y-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('create_reveal')}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Step 2 of 2: Verification
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Confirm Secret Phrase</h2>
            <p className="text-xs text-slate-400 mt-1">
              Please enter the following words from your phrase to confirm you wrote them down correctly.
            </p>
          </div>

          <div className="space-y-3">
            {quizIndices.map((idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Word #{idx + 1}
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Enter word #${idx + 1}`}
                  value={quizAnswers[idx] || ''}
                  onChange={(e) => {
                    setQuizAnswers({ ...quizAnswers, [idx]: e.target.value });
                    if (quizError) setQuizError('');
                  }}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>

          {quizError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
              {quizError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? spinner : (
              <>
                <span>Confirm & Create Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* 4. Import Phrase Input */}
      {step === 'import_phrase' && (
        <form onSubmit={handleImport} className="space-y-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('welcome')}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Import Wallet
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Enter Recovery Phrase or Key</h2>
            <p className="text-xs text-slate-400 mt-1">
              Paste your 12/24-word mnemonic seed phrase separated by spaces, or a 64-character private key.
            </p>
          </div>

          <textarea
            rows={4}
            required
            placeholder="e.g. apple banana cat dog elephant frog guitar hotel island jungle kangaroo lemon"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full p-3.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {importError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
              {importError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? spinner : (
              <>
                <span>Import Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

    </div>
  );
};
