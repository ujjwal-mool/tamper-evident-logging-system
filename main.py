import sys
import os
from backend.logfiles import generate_log
from backend.hash_chain import apply_hash_chain
from backend.verify_logs import verify_logs

REPORT_FILE = "audit_report.txt"


def show_help():
    print("""
===== Tamper-Evident Logging System =====

Commands:

1. Add a new log:
   python main.py add EVENT_TYPE "MESSAGE"

   Example:
   python main.py add LOGIN "User admin logged in"

2. Apply hash chaining:
   python main.py hash

3. Verify logs:
   python main.py verify

4. View audit report:
   python main.py report

=========================================
""")


def show_report():
    if not os.path.exists(REPORT_FILE):
        print("No audit report found.")
        return

    with open(REPORT_FILE, "r") as file:
        print(file.read())


def main():
    if len(sys.argv) < 2:
        show_help()
        return

    command = sys.argv[1].lower()

    if command == "add":
        if len(sys.argv) < 4:
            print("Usage: python main.py add EVENT_TYPE \"MESSAGE\"")
            return
        
        event_type = sys.argv[2]
        message = " ".join(sys.argv[3:])
        generate_log(event_type, message)
        print("Log added successfully.")
    elif command == "hash":
        apply_hash_chain()
    elif command == "verify":
        verify_logs()
    elif command == "report":
        show_report()
    else:
        print("Invalid command.")
        show_help()
if __name__ == "__main__":
    main()