import { useState } from 'react';
import { X, Check } from 'lucide-react';

const VALID_CODES = [
  'ANIMATCH-7X2K',
  'ANIMATCH-9P4M',
  'ANIMATCH-3R8N',
  'ANIMATCH-6T1Q',
  'ANIMATCH-2W5L',
  'ANIMATCH-8Y3J',
  'ANIMATCH-4H6D',
  'ANIMATCH-5B9F',
  'ANIMATCH-1C7V',
  'ANIMATCH-0G2S',
];

interface Props {
  onUnlock: () => void;
}

export default function UnlockCodeInput({ onUnlock }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUnlock = () => {
    const trimmed = code.trim().toUpperCase();
    if (VALID_CODES.includes(trimmed)) {
      localStorage.setItem('animatch_unlocked', 'true');
      localStorage.setItem('animatch_code_used', trimmed);
      setSuccess(true);
      setTimeout(() => onUnlock(), 800);
    } else {
      setError('Invalid code. Make sure you copied it correctly.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={e => { setCode(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleUnlock()}
          placeholder="Enter unlock code (e.g. ANIMATCH-XXXX)"
          className="flex-1 bg-gray-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:border-pink-500/50 focus:outline-none transition-colors"
        />
        <button
          onClick={handleUnlock}
          className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Unlock
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
          <X size={12} /> {error}
        </p>
      )}

      {success && (
        <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
          <Check size={12} /> Unlocked! Loading your builder...
        </p>
      )}

      <p className="text-gray-600 text-xs mt-2 text-center">
        Your code appears on the thank you page after donating
      </p>
    </div>
  );
}
