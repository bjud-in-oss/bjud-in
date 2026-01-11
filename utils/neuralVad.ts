
import * as ort from 'https://esm.sh/onnxruntime-web@1.19.0';

// Configure ONNX Runtime to use WASM from CDN to avoid local file issues.
// We strictly define the object paths to prevent resolution errors or "Response body loading was aborted".
ort.env.wasm.wasmPaths = {
    'ort-wasm.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/ort-wasm.wasm',
    'ort-wasm-simd.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/ort-wasm-simd.wasm',
    'ort-wasm-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/ort-wasm-threaded.wasm'
} as any;

export class NeuralVad {
    private session: ort.InferenceSession | null = null;
    private h: ort.Tensor | null = null;
    private c: ort.Tensor | null = null;
    private sr: ort.Tensor | null = null;
    private isReady = false;
    private loadFailed = false;

    constructor() {
        this.init();
    }

    private async init() {
        try {
            console.log("[NeuralVad] Loading Silero VAD model...");
            
            // Strategy: Try reliable NPM mirror first, then fallback to GitHub CDN
            const modelUrls = [
                "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.7/dist/silero_vad.onnx",
                "https://cdn.jsdelivr.net/gh/snakers4/silero-vad@v4.0.0/files/silero_vad.onnx"
            ];

            let modelBuffer: ArrayBuffer | null = null;

            for (const url of modelUrls) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        modelBuffer = await response.arrayBuffer();
                        // console.log(`[NeuralVad] Successfully fetched model from ${url}`);
                        break;
                    } 
                } catch (fetchErr) {
                    // console.warn(`[NeuralVad] Network error fetching from ${url}:`, fetchErr);
                }
            }

            if (!modelBuffer) {
                console.error("[NeuralVad] All model sources failed. Switching to RMS Fallback mode.");
                this.loadFailed = true;
                return;
            }

            // Create session - this triggers the WASM download defined in wasmPaths
            this.session = await ort.InferenceSession.create(modelBuffer, {
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'all'
            });
            
            // Initialize states (h and c are 2x1x64 zeros)
            const zeros = new Float32Array(2 * 1 * 64).fill(0);
            this.h = new ort.Tensor('float32', zeros, [2, 1, 64]);
            this.c = new ort.Tensor('float32', zeros, [2, 1, 64]);
            this.sr = new ort.Tensor('int64', new BigInt64Array([16000n]));
            
            this.isReady = true;
            console.log("[NeuralVad] Model loaded and session initialized successfully.");
        } catch (e) {
            console.error("[NeuralVad] Critical Error during init:", e);
            this.loadFailed = true; // Enable fallback on error
        }
    }

    public async process(audioFrame: Float32Array): Promise<number> {
        // FALLBACK LOGIC: 
        // If the model failed to load OR is still loading (!this.isReady), 
        // use simple RMS (Volume) detection so the user isn't blocked.
        if (this.loadFailed || !this.isReady) {
            let sum = 0;
            for(let i=0; i<audioFrame.length; i++) sum += audioFrame[i] * audioFrame[i];
            const rms = Math.sqrt(sum / audioFrame.length);
            // Default threshold for fallback (approx 0.01 is decent for speech)
            return rms > 0.01 ? 0.8 : 0; 
        }

        if (!this.session || !this.h || !this.c || !this.sr) return 0;

        try {
            const windowSize = 512;
            let maxProb = 0;

            for (let i = 0; i < audioFrame.length; i += windowSize) {
                let chunk = audioFrame.slice(i, i + windowSize);
                
                // Pad if last chunk is too small
                if (chunk.length < windowSize) {
                    const padded = new Float32Array(windowSize);
                    padded.set(chunk);
                    chunk = padded;
                }

                const inputTensor = new ort.Tensor('float32', chunk, [1, windowSize]);

                const feeds = {
                    input: inputTensor,
                    sr: this.sr,
                    h: this.h,
                    c: this.c
                };

                const results = await this.session.run(feeds);

                this.h = results.hn;
                this.c = results.cn;

                const output = results.output.data[0] as number;
                if (output > maxProb) maxProb = output;
            }

            return maxProb;
        } catch (e) {
            console.error("[NeuralVad] Runtime error, switching to fallback", e);
            this.loadFailed = true; // Switch to fallback permanently if it crashes once
            return 0;
        }
    }
    
    public reset() {
        if (this.isReady) {
            const zeros = new Float32Array(2 * 1 * 64).fill(0);
            this.h = new ort.Tensor('float32', zeros, [2, 1, 64]);
            this.c = new ort.Tensor('float32', zeros, [2, 1, 64]);
        }
    }

    public release() {
        // Helps JS Garbage Collector know these are free
        this.h = null;
        this.c = null;
        this.sr = null;
        // Typically ONNX JS sessions are auto-managed, but nullifying helps.
        this.session = null;
        this.isReady = false;
        // console.log("[NeuralVad] Resources released.");
    }
}
