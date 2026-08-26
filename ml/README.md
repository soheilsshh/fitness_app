# Shenava ASR (Fitino)

Offline Persian speech recognition using **Shenava Koochik v1.0** (sherpa-onnx CTC).

Weights live in `models/` (not inside the Python package). Code is an installable package so you can import it from scripts, services, notebooks, etc.

## Install (editable — use from many places)

```bash
cd fitness_app/ml
python -m pip install -e .
# optional: Hugging Face downloader
python -m pip install -e ".[download]"
```

## Model files

Expected layout:

```
ml/models/shenava-koochik-v1.0/
  model.onnx
  tokens.txt
```

If missing:

```bash
# one-time: enable auto-download on future git pull / checkout
sh .githooks/install

# or download now
python ml/scripts/ensure_shenava_model.py
# or: shenava-download-model
# or: set SHENAVA_MODEL_DIR=E:\path\to\shenava-koochik-v1.0
```

After `sh .githooks/install`, a missing `model.onnx` starts downloading in the background on `git pull` / branch checkout.

## Usage

```python
from shenava_asr import ShenavaASR, itn

asr = ShenavaASR()  # create once, reuse
text = asr.transcribe_file("speech.wav")
print(text)

# or one-shot
from shenava_asr import transcribe_file
print(transcribe_file("speech.wav"))
```

CLI:

```bash
shenava-transcribe path\to\audio.wav
```

Audio should be **16 kHz mono**. Do not enable sherpa-onnx per-feature normalization for this export.
