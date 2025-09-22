Agri Supply Chain System - Fullstack (Frontend + Backend)

Files included:
- index.html        (frontend main file)
- style.css         (frontend styles)
- app.js            (frontend logic connecting to backend)
- app.py            (Flask backend)
- requirements.txt  (Python dependencies)
- users.xlsx        (generated after running backend)

Setup instructions (backend):
1. Install Python 3.8+
2. Install dependencies: pip install -r requirements.txt
3. Start MySQL server and create a user. Update DB credentials in app.py (DB_CONFIG).
   Default expects a 'root' user with empty password and will create database 'agri_system'.
4. Run backend: python app.py
   Backend will run on http://127.0.0.1:5000
5. Open index.html in a browser (or serve it via a simple server). Frontend will call backend APIs.

Notes:
- Signup, login, update trigger export to Excel (users.xlsx) automatically.
- A 'Download Excel' button is available on the 'View All Users' page.
- For production, secure passwords (hashing) and use HTTPS. This demo stores passwords in plain text for simplicity.
