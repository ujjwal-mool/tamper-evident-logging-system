from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json, os, webbrowser, threading

from backend.logfiles    import generate_log
from backend.hash_chain  import apply_hash_chain
from backend.verify_logs import verify_logs, GENESIS_HASH, compute_hash

app = Flask(__name__)
CORS(app)

LOG_FILE    = "logs.jsonl"
REPORT_FILE = "audit_report.txt"



@app.route('/')
def index():
    return render_template('index.html')


@app.route('/logs', methods=['GET'])
def get_logs():
    if not os.path.exists(LOG_FILE):
        return jsonify([])
    logs = []
    with open(LOG_FILE, 'r') as f:
        for line in f:
            line = line.strip()
            if line:
                logs.append(json.loads(line))
    return jsonify(logs)

@app.route('/add', methods=['POST'])
def add_log():
    data = request.get_json()
    generate_log(data['event_type'], data['message'])
    return jsonify({'status': 'ok'})


@app.route('/hash', methods=['POST'])
def apply_hash():
    apply_hash_chain()
    return jsonify({'status': 'ok'})

@app.route('/verify', methods=['GET'])
def do_verify():
    verify_logs()          

    logs = []
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r') as f:
            for line in f:
                line = line.strip()
                if line:
                    logs.append(json.loads(line))


    prev = GENESIS_HASH
    for log in logs:
        h_in     = f"{log['log_id']}|{log['timestamp']}|{log['event_type']}|{log['message']}|{prev}"
        computed = compute_hash(h_in)
        log['is_valid']    = (computed == log['current_hash'])
        log['tamper_type'] = None if log['is_valid'] else 'modified'
        prev = log['current_hash']

    report_text = ''
    if os.path.exists(REPORT_FILE):
        with open(REPORT_FILE, 'r') as f:
            report_text = f.read()

    tampered_entries = [
        {
            'index':     l['log_id'],
            'type':      l['tamper_type'],
            'message':   f"Hash mismatch at Log #{l['log_id']}. Entry was modified after hashing.",
            'timestamp': l['timestamp'],
        }
        for l in logs if not l['is_valid']
    ]

    return jsonify({
        'isValid':         len(tampered_entries) == 0,
        'totalLogs':       len(logs),
        'validLogs':       sum(1 for l in logs if l['is_valid']),
        'tamperedLogs':    len(tampered_entries),
        'tamperedEntries': tampered_entries,
        'logs':            logs,
        'report':          report_text,
    })


@app.route('/report', methods=['GET'])
def get_report():
    if not os.path.exists(REPORT_FILE):
        return 'No audit report found. Run verify first.', 404
    return send_file(REPORT_FILE, mimetype='text/plain')


if __name__ == '__main__':
    threading.Timer(1.0, lambda: webbrowser.open('http://localhost:5000')).start()
    app.run(debug=False, port=5000)
