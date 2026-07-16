import json
import hashlib

LOG_FILE = "logs.jsonl"
GENESIS_HASH = "GENESIS"

def compute_hash(data):
    return hashlib.sha256(data.encode()).hexdigest()

def apply_hash_chain():
    updated_logs = []
    previous_hash = GENESIS_HASH

    with open(LOG_FILE, "r") as file:
        for line in file:
            log = json.loads(line)

            hash_input = f"{log['log_id']}|{log['timestamp']}|{log['event_type']}|{log['message']}|{previous_hash}"
            current_hash = compute_hash(hash_input)

            log["previous_hash"] = previous_hash
            log["current_hash"] = current_hash

            updated_logs.append(log)
            previous_hash = current_hash

    # Overwrite file ONCE after processing
    with open(LOG_FILE, "w") as file:
        for log in updated_logs:
            file.write(json.dumps(log) + "\n")

    print("Hash chaining applied successfully.")

if __name__ == "__main__":
    apply_hash_chain()