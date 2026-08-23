# Graph Report - ml  (2026-08-16)

## Corpus Check
- 8 files · ~1,080 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 40 nodes · 68 edges · 8 communities (6 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c24f3ff7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ShenavaASR
- __init__.py
- Shenava ASR (Fitino)
- default_model_dir
- paths.py
- cli.py
- ml_root
- shenava-asr

## God Nodes (most connected - your core abstractions)
1. `ShenavaASR` - 11 edges
2. `default_model_dir()` - 8 edges
3. `resolve_model_paths()` - 7 edges
4. `itn()` - 6 edges
5. `transcribe_waveform()` - 6 edges
6. `ml_root()` - 4 edges
7. `transcribe_file()` - 4 edges
8. `Shenava ASR (Fitino)` - 4 edges
9. `download()` - 3 edges
10. `main()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `ShenavaASR`  [EXTRACTED]
  src/shenava_asr/cli.py → src/shenava_asr/recognizer.py
- `download()` --calls--> `default_model_dir()`  [EXTRACTED]
  src/shenava_asr/download.py → src/shenava_asr/paths.py
- `main()` --calls--> `default_model_dir()`  [EXTRACTED]
  src/shenava_asr/download.py → src/shenava_asr/paths.py

## Import Cycles
- None detected.

## Communities (8 total, 2 thin omitted)

### Community 0 - "ShenavaASR"
Cohesion: 0.33
Nodes (6): ndarray, Path, Reusable recognizer — create once, call from many call sites., ShenavaASR, transcribe_file(), transcribe_waveform()

### Community 1 - "__init__.py"
Cohesion: 0.33
Nodes (6): Shenava Koochik Persian ASR helpers for Fitino., itn(), Persian inverse text normalization (spoken numbers -> digits) for Shenava ASR., Convert spoken Persian numbers in ASR text to digits., _val(), Offline Persian ASR wrapper around sherpa-onnx NeMo CTC export.

### Community 2 - "Shenava ASR (Fitino)"
Cohesion: 0.40
Nodes (4): Install (editable — use from many places), Model files, Shenava ASR (Fitino), Usage

### Community 3 - "default_model_dir"
Cohesion: 0.70
Nodes (4): download(), main(), Download Shenava Koochik v1.0 sherpa-onnx weights from Hugging Face., default_model_dir()

### Community 4 - "paths.py"
Cohesion: 0.50
Nodes (3): Resolve Shenava model asset paths (weights live outside the Python package)., Return (model.onnx, tokens.txt). Raises FileNotFoundError if missing., resolve_model_paths()

### Community 6 - "ml_root"
Cohesion: 0.67
Nodes (3): ml_root(), Path, fitness_app/ml — package lives in src/, weights in models/.

## Knowledge Gaps
- **4 isolated node(s):** `shenava-asr`, `Install (editable — use from many places)`, `Model files`, `Usage`
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ShenavaASR` connect `ShenavaASR` to `__init__.py`, `cli.py`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **Why does `default_model_dir()` connect `default_model_dir` to `__init__.py`, `paths.py`, `ml_root`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `resolve_model_paths()` connect `paths.py` to `ShenavaASR`, `__init__.py`, `default_model_dir`, `ml_root`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `shenava-asr`, `Install (editable — use from many places)`, `Model files` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._