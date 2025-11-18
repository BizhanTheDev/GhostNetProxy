import React, { useState, useCallback, FormEvent, useEffect, useRef } from 'react';

// --- HELPER & UTILITY ---

const formatUrl = (input: string): string => {
  if (!input) return '';
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }
  return `https://${input}`;
};

// NOTE: This is obfuscation for the address bar, not strong encryption.
// These functions are now Unicode-safe to prevent errors with international URLs.
const encodeUrl = (url: string): string => {
    try {
        // Use the pattern from MDN for Unicode-safe Base64 encoding
        return btoa(encodeURIComponent(url).replace(/%([0-9A-F]{2})/g,
            (match, p1) => String.fromCharCode(parseInt(p1, 16))
        ));
    } catch (e) {
        console.error("Failed to encode URL:", e);
        return '';
    }
};

const decodeUrl = (encoded: string): string => {
    try {
        // Use the pattern from MDN for Unicode-safe Base64 decoding
        return decodeURIComponent(atob(encoded).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch (e) {
        console.error("Failed to decode URL:", e);
        // This can happen if the hash is not valid Base64
        return '';
    }
};


// --- SVG ICONS (Defined outside components for performance) ---

const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
);

const ArrowPathIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.696v4.992h-4.992m0 0-3.181-3.183a8.25 8.25 0 0 1 11.667 0l3.181 3.183" />
  </svg>
);

const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);


// --- UI COMPONENTS ---

const Header: React.FC = () => (
    <header className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-cyan-200 tracking-widest drop-shadow-[0_0_15px_rgba(103,232,249,0.5)]">
            GhostNet Proxy
        </h1>
        <p className="text-slate-300 mt-2 text-sm md:text-base">Your Private Gateway to the Web</p>
    </header>
);

interface UrlInputFormProps {
    onBrowse: (url: string) => void;
    isLoading: boolean;
}

const UrlInputForm: React.FC<UrlInputFormProps> = ({ onBrowse, isLoading }) => {
    const [url, setUrl] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (url.trim() && !isLoading) {
            onBrowse(url);
        }
    };

    return (
        <div className="w-full max-w-3xl">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/30 p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="relative w-full">
                    <GlobeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter a website URL..."
                        className="w-full bg-black/20 border-2 border-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 rounded-lg py-4 pl-12 pr-44 text-lg text-white placeholder-slate-400 transition-all duration-300 outline-none shadow-inner shadow-black/40"
                        disabled={isLoading}
                        aria-label="Website URL Input"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 text-slate-900 font-bold py-2.5 px-6 rounded-md transition-all duration-300 flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/40 disabled:shadow-none"
                    >
                        {isLoading ? 'Connecting...' : 'Browse Securely'}
                    </button>
                </form>
            </div>
            <p className="text-slate-400 text-xs text-center mt-4 max-w-md mx-auto">
                Educational Demo: URLs are obfuscated locally before proxying. This is not a replacement for a real VPN.
            </p>
        </div>
    );
};

interface IframeViewProps {
    proxyUrl: string;
    displayUrl: string;
    onLoad: () => void;
    onGoBack: () => void;
    onRefresh: () => void;
    loadingError: string;
}

const IframeView: React.FC<IframeViewProps> = ({ proxyUrl, displayUrl, onLoad, onGoBack, onRefresh, loadingError }) => {
    return (
        <div className="w-full h-full flex flex-col bg-black/20 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/50 overflow-hidden border border-white/10">
            <div className="flex-shrink-0 bg-black/30 p-2 border-b border-white/10 flex items-center gap-2 z-10">
                <button onClick={onGoBack} className="bg-white/10 hover:bg-white/20 text-white font-bold py-1.5 px-4 rounded-md transition-colors" aria-label="Go Back">
                    &larr; Back
                </button>
                <button onClick={onRefresh} className="p-2 text-slate-300 hover:text-white transition-colors" aria-label="Refresh Page">
                    <ArrowPathIcon className="w-5 h-5"/>
                </button>
                <div className="flex-grow bg-black/40 rounded-md px-3 py-1.5 flex items-center gap-2 overflow-hidden">
                    <LockIcon className="text-green-400 flex-shrink-0" />
                    <span className="text-slate-300 text-sm truncate">{displayUrl}</span>
                </div>
            </div>
            <div className="flex-grow relative bg-slate-800">
                {loadingError && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-800 p-8 text-center">
                        <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />
                        <h3 className="text-xl font-bold text-red-400 mt-4">Failed to Load Page</h3>
                        <p className="text-slate-300 mt-2 max-w-md">{loadingError}</p>
                        <button onClick={onRefresh} className="mt-6 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-2 px-6 rounded-md transition-colors flex items-center gap-2">
                            <ArrowPathIcon className="w-5 h-5" />
                            Try Again
                        </button>
                    </div>
                )}
                 <iframe
                    src={proxyUrl}
                    onLoad={onLoad}
                    title="Proxied Content"
                    className={`w-full h-full border-0 bg-white transition-opacity ${loadingError ? 'opacity-0' : 'opacity-100'}`}
                    sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                    referrerPolicy="no-referrer"
                 />
            </div>
        </div>
    );
};

const LoadingIndicator: React.FC = () => (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-opacity duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 text-cyan-400 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.7)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75" />
        </svg>
        <p className="text-cyan-300 mt-4 text-lg tracking-wider">Establishing secure connection...</p>
    </div>
);


// --- MAIN APP COMPONENT ---

export default function App() {
    const [proxiedUrl, setProxiedUrl] = useState<string>('');
    const [displayUrl, setDisplayUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingError, setLoadingError] = useState<string>('');
    const [iframeKey, setIframeKey] = useState<number>(Date.now());
    const loadingTimeoutRef = useRef<number | null>(null);

    const clearLoadingTimeout = () => {
        if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
        }
    };

    // Effect to handle initial load and URL hash changes
    useEffect(() => {
        // On initial mount, ensure a clean slate by clearing any existing hash.
        // This prevents the app from auto-loading a site on refresh.
        if (window.location.hash) {
            window.location.hash = '';
        }

        const handleHashChange = () => {
            clearLoadingTimeout();
            setLoadingError('');
            const hash = window.location.hash.substring(1);

            if (hash) {
                setIsLoading(true);
                const newErrorMessage = 'Connection timed out or was blocked. The website may be incompatible, offline, or actively preventing itself from being loaded in a proxy. Please try another URL.';
                loadingTimeoutRef.current = window.setTimeout(() => {
                    setIsLoading(false);
                    setLoadingError(newErrorMessage);
                }, 15000);

                const decryptedUrl = decodeUrl(hash);
                if (decryptedUrl) {
                    setDisplayUrl(decryptedUrl);
                    // Switched to a more robust proxy service.
                    const proxyServiceUrl = `https://thingproxy.freeboard.io/fetch/${decryptedUrl}`;
                    setProxiedUrl(proxyServiceUrl);
                    setIframeKey(Date.now());
                } else {
                    setProxiedUrl('');
                    setDisplayUrl('');
                    window.location.hash = '';
                    setIsLoading(false);
                }
            } else {
                setProxiedUrl('');
                setDisplayUrl('');
                setIsLoading(false);
            }
        };

        window.addEventListener('hashchange', handleHashChange, false);

        return () => {
            window.removeEventListener('hashchange', handleHashChange, false);
            clearLoadingTimeout();
        };
    }, []);

    const handleBrowse = useCallback((urlInput: string) => {
        const formatted = formatUrl(urlInput);
        if (formatted) {
            const encoded = encodeUrl(formatted);
            if(encoded) {
                 window.location.hash = encoded;
            }
        }
    }, []);
    
    const handleGoBack = useCallback(() => {
        // Directly update state for an immediate and reliable UI change.
        // This avoids potential race conditions with the event listener.
        clearLoadingTimeout();
        setIsLoading(false);
        setLoadingError('');
        setProxiedUrl('');
        setDisplayUrl('');
        // Also update the hash to keep the URL in sync with the state.
        // The listener will still fire but will just re-affirm the state we've already set.
        window.location.hash = '';
    }, []);

    const handleRefresh = useCallback(() => {
        if (proxiedUrl) {
          clearLoadingTimeout();
          setIsLoading(true);
          setLoadingError('');
          const newErrorMessage = 'Connection timed out or was blocked. The website may be incompatible, offline, or actively preventing itself from being loaded in a proxy. Please try another URL.';
          loadingTimeoutRef.current = window.setTimeout(() => {
            setIsLoading(false);
            setLoadingError(newErrorMessage);
          }, 15000);
          setIframeKey(Date.now()); // Change the key to force iframe reload
        }
    }, [proxiedUrl]);

    const handleIframeLoad = useCallback(() => {
        setIsLoading(false);
        setLoadingError('');
        clearLoadingTimeout();
    }, []);
    
    const showIframeView = !!proxiedUrl;

    return (
        <main className="font-mono text-slate-200 min-h-screen w-full relative">
            <div 
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${showIframeView ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
                aria-hidden={showIframeView}
            >
                <div className="min-h-screen flex flex-col items-center justify-center p-4">
                    <Header />
                    <UrlInputForm onBrowse={handleBrowse} isLoading={isLoading && !showIframeView} />
                </div>
            </div>

            <div 
                className={`absolute inset-0 p-2 sm:p-4 transition-all duration-700 ease-in-out ${showIframeView ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
                aria-hidden={!showIframeView}
            >
                {showIframeView && (
                    <IframeView 
                        key={iframeKey}
                        proxyUrl={proxiedUrl}
                        displayUrl={displayUrl}
                        onLoad={handleIframeLoad} 
                        onGoBack={handleGoBack}
                        onRefresh={handleRefresh}
                        loadingError={loadingError}
                    />
                )}
            </div>

            {isLoading && showIframeView && <LoadingIndicator />}
        </main>
    );
}
