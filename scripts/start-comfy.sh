#!/usr/bin/env bash
# ==============================================================================
# Start ComfyUI Local Server (Apple Silicon MPS Optimized)
# ==============================================================================

COMFY_DIR="${HOME}/.comfyui"
PORT=8188

if lsof -i :${PORT} > /dev/null 2>&1; then
  echo "✅ ComfyUI is already running on http://127.0.0.1:${PORT}"
  exit 0
fi

if [ ! -d "${COMFY_DIR}" ]; then
  echo "❌ ComfyUI is not installed at ${COMFY_DIR}. Please run:"
  echo "   npm run comfy:setup"
  exit 1
fi

echo "🚀 Starting ComfyUI on http://127.0.0.1:${PORT} (Metal/MPS mode)..."
cd "${COMFY_DIR}"
source venv/bin/activate

# Use --listen 127.0.0.1 --port 8188 --highvram for persistent in-memory weights on 24GB Unified Memory
python main.py --listen 127.0.0.1 --port ${PORT} --highvram "$@"
