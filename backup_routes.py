import os
import io
import zipfile
from flask import Blueprint, request, jsonify, send_file
from file_manager import WORKSPACES_DIR

backup_bp = Blueprint('backup_bp', __name__)

@backup_bp.route("/api/backup", methods=["GET"])
def system_backup():
    """Създава ZIP архив на цялата папка workspaces и локалните бази данни"""
    try:
        mem = io.BytesIO()
        with zipfile.ZipFile(mem, 'w', zipfile.ZIP_DEFLATED) as zipf:
            if os.path.exists(WORKSPACES_DIR):
                for root, dirs, files in os.walk(WORKSPACES_DIR):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, os.path.dirname(WORKSPACES_DIR))
                        zipf.write(file_path, arcname)
            
            for db_file in ["database.db", "niki.db", "data.db"]:
                if os.path.exists(db_file):
                    zipf.write(db_file, db_file)

        mem.seek(0)
        return send_file(
            mem,
            as_attachment=True,
            download_name="NIKI_System_Backup.zip",
            mimetype="application/zip"
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@backup_bp.route("/api/restore", methods=["POST"])
def system_restore():
    """Възстановява системата от качен ZIP архив"""
    if 'backup_file' not in request.files:
        return jsonify({"status": "error", "message": "Няма качен архив за възстановяване."}), 400
    
    file = request.files['backup_file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "Не е избран файл."}), 400

    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        with zipfile.ZipFile(file, 'r') as zip_ref:
            zip_ref.extractall(base_dir)
            
        return jsonify({"status": "success", "message": "Системата беше възстановена успешно! Рестартирайте приложението."})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Грешка при възстановяване: {str(e)}"}), 500
