# Public Complaint Portal (Local Demo)

Files created:

- `index.html` — main UI
- `styles.css` — styles
- `script.js` — client logic using `localStorage`

How to run

1. Open `index.html` in your browser (double-click or use a lightweight server).

Optional: serve with Python for local testing:

```bash
cd /Users/jahnviarya/Desktop/nagriksetu
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Notes
- This is a static demo — complaints are stored in browser `localStorage` only.
- For production, add a backend API to persist data, authentication, and input sanitization.
