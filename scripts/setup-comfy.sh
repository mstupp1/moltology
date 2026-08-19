#!/usr/bin/env bash
set -e

# ==============================================================================
# Moltology ComfyUI Local Pipeline Setup (Apple Silicon / 24GB Unified Memory)
# ==============================================================================

COMFY_DIR="${HOME}/.comfyui"
MODELS_DIR="${COMFY_DIR}/models"
UNET_DIR="${MODELS_DIR}/unet"
CLIP_DIR="${MODELS_DIR}/clip"
VAE_DIR="${MODELS_DIR}/vae"
CUSTOM_NODES_DIR="${COMFY_DIR}/custom_nodes"

echo "🦞 [Moltology] Setting up Local ComfyUI Pipeline at: ${COMFY_DIR}"

# 1. Clone or update ComfyUI
if [ ! -d "${COMFY_DIR}" ]; then
  echo "📥 Cloning ComfyUI repository..."
  git clone https://github.com/comfyanonymous/ComfyUI.git "${COMFY_DIR}"
else
  echo "✅ ComfyUI directory already exists. Pulling latest updates..."
  cd "${COMFY_DIR}" && git pull || true
fi

# 2. Set up Python virtual environment
cd "${COMFY_DIR}"
if [ ! -d "venv" ]; then
  echo "🐍 Creating Python 3.11 virtual environment..."
  python3 -m venv venv
fi

echo "📦 Activating venv and installing core requirements..."
source venv/bin/activate
pip install --upgrade pip
pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
pip install huggingface_hub

# 3. Install ComfyUI-GGUF (Essential for quantized FLUX.1 & T5 on Apple Silicon)
mkdir -p "${CUSTOM_NODES_DIR}"
cd "${CUSTOM_NODES_DIR}"

if [ ! -d "ComfyUI-GGUF" ]; then
  echo "📥 Installing ComfyUI-GGUF custom node..."
  git clone https://github.com/city96/ComfyUI-GGUF.git
  cd ComfyUI-GGUF
  pip install -r requirements.txt
  cd ..
else
  echo "✅ ComfyUI-GGUF already installed. Pulling latest..."
  cd ComfyUI-GGUF && git pull && pip install -r requirements.txt || true
  cd ..
fi

# 4. Create model directories
mkdir -p "${UNET_DIR}"
mkdir -p "${CLIP_DIR}"
mkdir -p "${VAE_DIR}"

echo "=============================================================================="
echo "🎯 Model Weights Download Plan (Total: ~11.5 GB)"
echo "   - FLUX.1 [schnell] UNet (GGUF Q4_K_S): ~6.2 GB"
echo "   - T5-XXL Text Encoder (GGUF Q4_K_M): ~4.8 GB"
echo "   - CLIP-L Text Encoder: ~246 MB"
echo "   - FLUX VAE (ae.safetensors): ~335 MB"
echo "=============================================================================="

# Helper download function using huggingface-cli
download_hf_file() {
  local repo=$1
  local filename=$2
  local target_dir=$3
  local dest="${target_dir}/${filename}"

  if [ -f "${dest}" ]; then
    echo "✅ Found existing: ${filename}"
  else
    echo "⬇️  Downloading ${filename} from ${repo}..."
    huggingface-cli download "${repo}" "${filename}" --local-dir "${target_dir}" --local-dir-use-symlinks False || {
      echo "⚠️ huggingface-cli failed, falling back to curl..."
      curl -L -o "${dest}" "https://huggingface.co/${repo}/resolve/main/${filename}"
    }
  fi
}

# 4.1 FLUX.1 Schnell GGUF (city96/FLUX.1-schnell-gguf)
download_hf_file "city96/FLUX.1-schnell-gguf" "flux1-schnell-Q4_K_S.gguf" "${UNET_DIR}"

# 4.2 T5-XXL GGUF (city96/t5-v1_1-xxl-encoder-gguf)
download_hf_file "city96/t5-v1_1-xxl-encoder-gguf" "t5-v1_1-xxl-encoder-Q4_K_M.gguf" "${CLIP_DIR}"

# 4.3 CLIP-L (comfyanonymous/flux_text_encoders)
download_hf_file "comfyanonymous/flux_text_encoders" "clip_l.safetensors" "${CLIP_DIR}"

# 4.4 FLUX VAE (receptektas/black-forest-labs-ae_safetensors)
download_hf_file "receptektas/black-forest-labs-ae_safetensors" "ae.safetensors" "${VAE_DIR}"

echo "=============================================================================="
echo "🎉 ComfyUI Setup Complete!"
echo "To start ComfyUI in the background, run:"
echo "   npm run comfy:start"
echo "=============================================================================="
