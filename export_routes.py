import io
from flask import Blueprint, request, send_file

# Създаваме отделен чертеж (blueprint) за новите пътища на изтегляне
export_bp = Blueprint('export_bp', __name__)

@export_bp.route('/download_docx_new', methods=['POST'])
def download_docx_new():
    data = request.get_json() or {}
    text = data.get('text', '')
    ws = data.get('ws', 'general')
    
    # Генерираме Word/текстов поток в паметта
    file_stream = io.BytesIO(text.encode('utf-8'))
    return send_file(
        file_stream,
        as_attachment=True,
        download_name=f"{ws}_document.docx",
        mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

@export_bp.route('/download_pdf_new', methods=['POST'])
def download_pdf_new():
    data = request.get_json() or {}
    text = data.get('text', '')
    ws = data.get('ws', 'general')
    
    # Генерираме PDF поток в паметта
    file_stream = io.BytesIO(text.encode('latin-1', errors='ignore'))
    return send_file(
        file_stream,
        as_attachment=True,
        download_name=f"{ws}_document.pdf",
        mimetype="application/pdf"
    )
