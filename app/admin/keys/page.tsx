
'use client';

import { useState } from 'react';

export default function AdminKeysPage() {
  const [secret, setSecret] = useState('');
  const [duration, setDuration] = useState(1);
  const [maxDevices, setMaxDevices] = useState(1);
  const [type, setType] = useState('PREMIUM');
  const [customKey, setCustomKey] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/create-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminSecret: secret,
          durationDays: duration,
          maxDevices,
          type,
          customKey: customKey || undefined
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-blue-400">Admin Key Generator</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-400">Admin Secret</label>
            <input 
              type="password" 
              value={secret}
              onChange={e => setSecret(e.target.value)}
              className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-blue-500 outline-none"
              placeholder="Enter secret code"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-400">Type</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full bg-gray-700 rounded p-2 border border-gray-600 outline-none"
            >
              <option value="PREMIUM">PREMIUM (GUMBALLZ-...)</option>
              <option value="FREE">FREE (GUMFREE-...)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-400">Duration (Days)</label>
            <input 
              type="number" 
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full bg-gray-700 rounded p-2 border border-gray-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-400">Max Devices</label>
            <input 
              type="number" 
              value={maxDevices}
              onChange={e => setMaxDevices(Number(e.target.value))}
              className="w-full bg-gray-700 rounded p-2 border border-gray-600 outline-none"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-400">Custom Key (Optional)</label>
            <input 
              type="text" 
              value={customKey}
              onChange={e => setCustomKey(e.target.value)}
              className="w-full bg-gray-700 rounded p-2 border border-gray-600 outline-none"
              placeholder="Leave empty for random"
            />
          </div>

          <button 
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition"
          >
            {loading ? 'Creating...' : 'Create Key'}
          </button>
        </div>

        {result && (
          <div className={`mt-6 p-4 rounded ${result.success ? 'bg-green-900/50 border border-green-500' : 'bg-red-900/50 border border-red-500'}`}>
            {result.success ? (
              <div>
                <h3 className="text-green-400 font-bold mb-2">Key Created!</h3>
                <div className="bg-black/50 p-2 rounded mb-2 font-mono text-lg break-all select-all">
                  {result.data.key_value}
                </div>
                <p className="text-sm text-gray-300">Expires: {new Date(result.data.expires_at).toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-red-400">{result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
