import json
import os
from datetime import datetime

LOG_FILE = "logs.jsonl"

def get_next_log_id():
    if not os.path.exists(LOG_FILE):
        return 1
    with open(LOG_FILE, "r") as file:
        return sum(1 for _ in file) + 1

def generate_log(event_type, message):
    log_entry = {
        "log_id": get_next_log_id(),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "event_type": event_type,
        "message": message,
        "previous_hash": "NULL",
        "current_hash": "NULL"
    }

    with open(LOG_FILE, "a") as file:
        file.write(json.dumps(log_entry) + "\n")

    print("Log recorded:", log_entry)

if __name__ == "__main__":
    # Sample logs for testing
    generate_log("LOGIN", "User admin logged in")
    generate_log("FILE_ACCESS", "Accessed confidential.pdf")
    generate_log("LOGOUT", "User admin logged out")