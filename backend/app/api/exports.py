"""DataHarvest — Exports Blueprint"""
from flask import Blueprint, request, jsonify, send_file
import pandas as pd, io, uuid, os
from loguru import logger

exports_bp = Blueprint("exports", __name__)
def _ok(d=None, s=200): return jsonify({"success": True, "data": d}), s
def _err(m, s=400): return jsonify({"success": False, "error": m}), s


@exports_bp.post("/")
def create_export():
    data = request.get_json(silent=True) or {}
    rows = data.get("rows", [])
    fmt = data.get("format", "csv")   # csv | xlsx | json | parquet | pdf
    filename = data.get("filename", f"export_{uuid.uuid4().hex[:8]}")

    if not rows:
        return _err("rows required")

    df = pd.DataFrame(rows)
    export_id = str(uuid.uuid4())
    os.makedirs("./exports", exist_ok=True)

    try:
        if fmt == "csv":
            path = f"./exports/{export_id}.csv"
            df.to_csv(path, index=False)
        elif fmt == "xlsx":
            path = f"./exports/{export_id}.xlsx"
            with pd.ExcelWriter(path, engine="xlsxwriter") as writer:
                df.to_excel(writer, index=False, sheet_name="Data")
                ws = writer.sheets["Data"]
                ws.set_column(0, len(df.columns)-1, 18)
        elif fmt == "json":
            path = f"./exports/{export_id}.json"
            df.to_json(path, orient="records", indent=2)
        elif fmt == "parquet":
            path = f"./exports/{export_id}.parquet"
            df.to_parquet(path, index=False)
        else:
            return _err(f"Unsupported format: {fmt}")

        size = os.path.getsize(path)
        return _ok({
            "export_id": export_id,
            "format": fmt,
            "filename": f"{filename}.{fmt}",
            "rows": len(df),
            "size_bytes": size,
            "download_url": f"/api/v1/exports/{export_id}/download",
        }), 201

    except Exception as e:
        return _err(str(e))


@exports_bp.get("/<export_id>/download")
def download_export(export_id: str):
    for ext in ["csv", "xlsx", "json", "parquet"]:
        path = f"./exports/{export_id}.{ext}"
        if os.path.exists(path):
            return send_file(path, as_attachment=True, download_name=f"export.{ext}")
    return _err("Export not found", 404)


@exports_bp.post("/report/pdf")
def generate_pdf_report():
    """Generate PDF report from dataset + profile."""
    data = request.get_json(silent=True) or {}
    rows = data.get("rows", [])
    title = data.get("title", "DataHarvest Report")
    include_charts = data.get("include_charts", True)

    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib import colors

        df = pd.DataFrame(rows)
        export_id = str(uuid.uuid4())
        path = f"./exports/{export_id}.pdf"

        doc = SimpleDocTemplate(path, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph(title, styles["Title"]))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"Rows: {len(df)} | Columns: {len(df.columns)}", styles["Normal"]))
        story.append(Spacer(1, 12))

        # Table preview
        preview = [df.columns.tolist()] + df.head(20).fillna("").values.tolist()
        t = Table(preview, hAlign="LEFT")
        t.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#0ea5e9")),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("FONTSIZE", (0,0), (-1,-1), 8),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
            ("GRID", (0,0), (-1,-1), 0.25, colors.HexColor("#e2e8f0")),
        ]))
        story.append(t)
        doc.build(story)

        return _ok({
            "export_id": export_id,
            "format": "pdf",
            "download_url": f"/api/v1/exports/{export_id}/download",
            "size_bytes": os.path.getsize(path),
        })
    except Exception as e:
        return _err(str(e))