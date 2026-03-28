# Python services

Each subdirectory under `services/` is a **separate** project. You can use different Python versions per service.

## Recommended workflow

1. Install [pyenv](https://github.com/pyenv/pyenv) (Linux/macOS) or [pyenv-win](https://github.com/pyenv-win/pyenv-win) (Windows).
2. In a service folder, run `pyenv install` for the version listed in `.python-version` (if present).
3. Create a virtual environment in that folder only:
   - `python -m venv .venv`
   - Windows: `.venv\Scripts\activate`
   - Unix: `source .venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt` or use `uv` / Poetry if you add `pyproject.toml` later.

Do **not** commit `.venv/` (already ignored at repo root).

## Template

See `services/_template/` for a minimal starting point.
