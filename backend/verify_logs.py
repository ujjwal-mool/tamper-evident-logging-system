import json
import hashlib
from datetime import datetime
LOG_FILE = "logs.jsonl"
REPORT_FILE = "audit_report.txt"
GENESIS_HASH = "GENESIS"

def compute_hash(data):
    return hashlib.sha256(data.encode()).hexdigest()

def verify_logs():
    previous_hash = GENESIS_HASH
    expected_log_id = 1

    with open(LOG_FILE, "r") as file:
        for line in file:
            log = json.loads(line)

            # Detect deletion or insertion
            if log["log_id"] != expected_log_id:
                print(f"❌ Log sequence issue detected at Log ID {expected_log_id}")
                print("Possible deletion or fake insertion found.")

                generate_audit_report(
                    status="FAILED",
                    log_id=expected_log_id,
                    reason="Log sequence mismatch (deletion/insertion suspected)"
                )
                return  # VERY IMPORTANT

            # Recalculate hash
            hash_input = f"{log['log_id']}|{log['timestamp']}|{log['event_type']}|{log['message']}|{previous_hash}"
            recalculated_hash = compute_hash(hash_input)

            # Detect modification
            if log["current_hash"] != recalculated_hash:
                print(f"❌ Tampering detected at Log ID {log['log_id']}")
                print("Reason: Hash mismatch (modification detected)")

                generate_audit_report(
                    status="FAILED",
                    log_id=log["log_id"],
                    reason="Hash mismatch (log modification detected)"
                )
                return  # VERY IMPORTANT

            previous_hash = log["current_hash"]
            expected_log_id += 1

    # If everything is fine
    print("✅ Logs verified successfully. No tampering detected.")

    generate_audit_report(
        status="SUCCESS",
        reason="No tampering detected"
    )

def generate_audit_report(status, log_id=None, reason=None):
    with open(REPORT_FILE, "w") as file:
        file.write("===== AUDIT REPORT =====\n")
        file.write(f"Verification Time: {datetime.now()}\n")
        file.write(f"Status: {status}\n")

        if log_id is not None:
            file.write(f"Tampering Detected At Log ID: {log_id}\n")

        if reason:
            file.write(f"Reason: {reason}\n")

        file.write("========================\n")

if __name__ == "__main__":
    verify_logs()