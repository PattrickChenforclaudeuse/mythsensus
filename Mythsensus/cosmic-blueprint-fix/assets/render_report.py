#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
mythsensus-render-fixed.py — Cosmic Blueprint Premium PDF Renderer
===================================================================
Converts Cosmic Blueprint HTML reports to 25-page A4 PDFs using WeasyPrint.

Usage:
  python3 mythsensus-render-fixed.py                    # renders demo (uses template)
  python3 mythsensus-render-fixed.py report.html        # converts specific HTML to PDF
  python3 mythsensus-render-fixed.py report.html out.pdf # with custom output path

Requires:
  pip install weasyprint
  mythsensus-sarabun-embedded.css (in same directory)

Color scheme: #040407 (background), #c8a45a (gold), #e6e2d8 (text)
Font: Sarabun (embedded as base64 woff2 in the CSS file)
Target: 25 A4 pages per report
"""

import os
import sys

# ─── CSS: Component styles + @page rules ─────────────────────────
# Sarabun font is loaded separately from mythsensus-sarabun-embedded.css
CSS_STYLES = """
/* ── WeasyPrint A4 Page Rules ── */
@page{size:A4;margin:10mm 6mm 10mm 6mm;}
@page:first{margin-top:12mm;}

/* ── Print color preservation ── */
@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;}}

/* ── Base ── */
body{font-family:'Sarabun','Garuda','Loma','TH Sarabun New','Norasi',sans-serif;font-size:9.5pt;color:#e6e2d8;line-height:1.55;background:#040407;}
*{box-sizing:border-box}
h2{font-size:11pt;color:#c8a45a;font-weight:bold;border-bottom:1.5pt solid #c8a45a;padding-bottom:1pt;margin:8pt 0 4pt}
h3{font-size:9.5pt;color:#c8a45a;font-weight:bold;margin:5pt 0 2pt}
p{color:#e6e2d8;margin-bottom:3pt;font-size:8.5pt}
hr{border:none;border-top:0.5pt solid #333;margin:6pt 0}
table{width:100%;border-collapse:collapse;margin-bottom:4pt;font-size:8pt}
th{background:#0d0d12;color:#c8a45a;padding:2pt 4pt;text-align:left;font-weight:bold}
td{padding:2pt 4pt;border-bottom:0.5pt solid #1a1a22;vertical-align:top;color:#e6e2d8;}
tr:nth-child(even) td{background:#0a0a10}
.lbl{background:#0d0d14!important;color:#c8a45a;font-weight:bold;width:26%;font-size:8.5pt}
.nb{border-radius:4pt;padding:4pt 6pt;margin:4pt 0;page-break-inside:avoid}
.nb-dark{background:#0d0d12;color:#e6e2d8;border-radius:5pt;padding:5pt 8pt;margin:4pt 0;border:0.5pt solid #1a1a22;}
.nb-gold{background:#0d0d12;border:1pt solid #c8a45a;color:#e6e2d8;}
.nb-green{background:#0a1a10;border:1.5pt solid #1a8a3a;color:#e6e2d8;}
.nb-red{background:#1a0808;border:2pt solid #c01020;border-radius:5pt;padding:9pt 12pt;margin:7pt 0;color:#e6e2d8;}
.nb-purple{background:#0d0a14;border:1pt solid #7a3aaa;color:#e6e2d8;}
.page-break{page-break-before:always}

/* ── Cover ── */
.page{padding:5pt 12pt}
.cover-eye{font-size:8pt;color:#c8a45a;letter-spacing:4px;text-align:center;margin-bottom:5pt}
.cover-title{font-size:22pt;color:#c8a45a;font-weight:bold;text-align:center;line-height:1.3;margin-bottom:5pt}
.cover-sub{font-size:10pt;color:#9a8a72;text-align:center;margin-bottom:14pt}
.cover-banner{background:#0d0d12;color:#e6e2d8;border-radius:8pt;padding:8pt 12pt;margin-bottom:10pt;display:table;width:100%;border:0.5pt solid #1a1a22;}
.cb-l{display:table-cell;width:20%;vertical-align:middle;text-align:center}
.cb-score{font-size:46pt;font-weight:bold;color:#c8a45a;line-height:1}
.cb-den{font-size:9pt;color:#806040}
.cb-m{display:table-cell;vertical-align:middle;padding:0 12pt}
.cb-tier{font-size:13pt;color:#e6e2d8;font-weight:bold;margin-bottom:3pt}
.cb-pct{font-size:8.5pt;color:#9a8a72;margin-bottom:4pt}
.cb-r{display:table-cell;width:14%;text-align:center;vertical-align:middle}
.cover-grid{display:table;width:100%;border:0.5pt solid #1a1a22;margin-bottom:8pt}
.cg-cell{display:table-cell;width:33.3%;padding:5pt 7pt;border:0.5pt solid #1a1a22;vertical-align:top;background:#0a0a10}
.cg-label{font-size:7.5pt;color:#c8a45a;text-transform:uppercase;letter-spacing:1px;margin-bottom:2pt}
.cg-value{font-size:9pt;color:#e6e2d8;font-weight:bold}
.bmn-box{background:#1a0808;border:2pt solid #c01020;border-radius:5pt;padding:7pt 10pt;margin-bottom:8pt;page-break-inside:avoid}
.bmn-title{font-size:12pt;color:#ff6060;font-weight:bold;margin-bottom:5pt}
.bmn-grid{display:table;width:100%}
.bmn-col{display:table-cell;width:50%;padding:3pt 5pt;vertical-align:top}
.bmn-item{background:#0d0508;border:0.5pt solid #3a1515;padding:3pt 6pt;margin-bottom:3pt}
.bmn-item-title{font-weight:bold;color:#ff6060;font-size:9pt;margin-bottom:2pt}
.bmn-item-body{font-size:8.5pt;color:#d0c0b0;line-height:1.6}
.cover-disc{font-size:8pt;color:#9a8a72;text-align:center;border-top:0.5pt solid #333;padding-top:6pt}

/* ── Score Row ── */
.sr{display:table;width:100%;margin-bottom:3pt}
.sr-label{display:table-cell;width:38%;font-size:8pt;color:#e6e2d8;vertical-align:middle}
.sr-sub{font-size:7.5pt;color:#9a8a72}
.sr-num{display:table-cell;width:8%;text-align:right;font-weight:bold;font-size:10pt;vertical-align:middle;padding-right:5pt}
.sr-bar{display:table-cell;vertical-align:middle}
.bar-wrap{background:#1a1a22;border-radius:3pt;height:9pt;overflow:hidden}
.bar-fill{height:100%;border-radius:3pt}

/* ── Convergence ── */
.conv{border-left:2pt solid #c8a45a;padding:4pt 8pt;margin-bottom:5pt;background:#0a0a10;page-break-inside:avoid}
.conv.med{border-left-color:#9a8a72;background:#0a0a10}
.conv-title{font-weight:bold;font-size:10.5pt;color:#c8a45a;margin-bottom:2pt}
.conv-sys{font-size:7.5pt;color:#9a8a72;margin:2pt 0 4pt}
.conv-body{font-size:8pt;color:#e6e2d8;line-height:1.55}

/* ── BaZi Pillars ── */
.pillars{display:table;width:100%;margin:6pt 0;border:0.5pt solid #1a1a22}
.pc{display:table-cell;text-align:center;border:0.5pt solid #1a1a22;padding:5pt 3pt;width:25%;background:#0a0a10}
.pc-dm{background:#0d0d08;border-color:#c8a45a}
.pc-lbl{font-size:7pt;color:#9a8a72;margin-bottom:2pt}
.pc-stem{font-size:19pt;font-weight:bold;line-height:1.1;color:#e6e2d8}
.pc-dm .pc-stem{color:#c8a45a}
.pc-sname{font-size:7.5pt;color:#9a8a72;margin-bottom:4pt}
.pc-branch{font-size:15pt;color:#b0a890;line-height:1.1}
.pc-bname{font-size:7.5pt;color:#9a8a72}

/* ── Decade Card ── */
.dc{border:1pt solid #1a1a22;border-radius:6pt;margin-bottom:6pt;page-break-inside:avoid}
.dc-head{background:#0d0d12;color:#e6e2d8;padding:8pt 12pt;border-radius:5pt 5pt 0 0;display:table;width:100%}
.dc-age{display:table-cell;width:56pt;font-size:19pt;font-weight:bold;color:#c8a45a;vertical-align:middle}
.dc-info{display:table-cell;vertical-align:middle}
.dc-period{font-size:11pt;font-weight:bold;color:#e6e2d8}
.dc-lp{font-size:8.5pt;color:#9a8a72;margin-top:2pt}
.dc-badge{display:table-cell;width:50pt;text-align:right;vertical-align:middle}
.dc-tag{display:inline-block;border-radius:3pt;padding:2pt 8pt;font-size:8pt;font-weight:bold}
.dc-body{padding:4pt 6pt;background:#0a0a10}
.dc-cols{display:table;width:100%}
.dc-left{display:table-cell;width:60%;vertical-align:top;padding-right:8pt}
.dc-right{display:table-cell;vertical-align:top;padding-left:8pt;border-left:0.5pt solid #1a1a22}
.dc-stitle{font-size:8.5pt;font-weight:bold;color:#c8a45a;text-transform:uppercase;letter-spacing:1px;margin:7pt 0 4pt}
.dc-item{font-size:8pt;color:#e6e2d8;margin-bottom:2pt;padding-left:10pt;position:relative}
.dc-item::before{content:"•";position:absolute;left:0;color:#c8a45a}

/* ── Color Swatches ── */
.csw{display:inline-block;width:12pt;height:12pt;border-radius:3pt;vertical-align:middle;margin-right:5pt;border:0.5pt solid rgba(255,255,255,.2)}

/* ── Historical Figure Card ── */
.hist-card{margin-bottom:7pt;border:0.5pt solid #1a1a22;page-break-inside:avoid;background:#0a0a10}
.hh{background:#0d0d12;padding:5pt 9pt;display:table;width:100%}
.hh-icon{display:table-cell;width:22pt;font-size:15pt;vertical-align:middle}
.hh-info{display:table-cell;vertical-align:middle}
.hh-name{font-weight:bold;font-size:10.5pt;color:#e6e2d8}
.hh-sub{font-size:8pt;color:#9a8a72}
.hh-score{display:table-cell;text-align:right;font-size:14pt;color:#c8a45a;font-weight:bold;width:38pt;vertical-align:middle}
.hh-body{padding:6pt 9pt}
.hh-trait{font-size:8.5pt;color:#9a8a72;margin-bottom:3pt}
.hh-detail{font-size:8pt;color:#d0c8b0;line-height:1.65}

/* ── Activation Card ── */
.act{border:0.5pt solid #1a1a22;border-radius:5pt;padding:5pt 8pt;margin-bottom:4pt;page-break-inside:avoid;background:#0a0a10}
.act-h{display:table;width:100%;margin-bottom:3pt}
.act-icon{display:table-cell;width:22pt;font-size:15pt;vertical-align:middle}
.act-title{display:table-cell;font-weight:bold;font-size:9.5pt;color:#e6e2d8;vertical-align:middle}
.act-pts{display:table-cell;text-align:right;font-size:8.5pt;color:#c8a45a;width:38%;vertical-align:middle}
.act-sys{font-size:7.5pt;color:#9a8a72;margin-bottom:3pt}
.act-body{font-size:8pt;color:#d0c8b0;line-height:1.6}

/* ── Warning ── */
.warn-item{background:#1a0808;border:0.5pt solid #3a1515;padding:5pt 8pt;margin-bottom:3pt;border-radius:3pt;page-break-inside:avoid}
.warn-title{font-weight:bold;font-size:9pt;color:#ff6060;margin-bottom:2pt}
.warn-body{font-size:8pt;color:#d0a0a0;line-height:1.55}

/* ── Footer ── */
.footer{border-top:1pt solid #333;padding-top:8pt;margin-top:14pt;font-size:7.5pt;color:#9a8a72;text-align:center;line-height:1.7}
"""


# ─── RENDERING FUNCTIONS ─────────────────────────────────────────

def _load_css(css_dir=None):
    """Load CSS stylesheets: component styles + Sarabun font."""
    from weasyprint import CSS

    if css_dir is None:
        css_dir = os.path.dirname(os.path.abspath(__file__))

    css_list = [CSS(string=CSS_STYLES)]

    font_css = os.path.join(css_dir, 'mythsensus-sarabun-embedded.css')
    if os.path.exists(font_css):
        css_list.append(CSS(filename=font_css))
        print(f"  Loaded Sarabun font: {font_css}")
    else:
        print(f"  WARNING: Sarabun font CSS not found: {font_css}")
        print(f"  Thai text may not render correctly.")

    return css_list


def render_html_to_pdf(html_path, output_path=None, css_dir=None):
    """
    Convert a Cosmic Blueprint HTML report to 25-page A4 PDF.

    The HTML content is generated by Claude using the template structure
    defined in SKILL.md. This function applies the correct CSS styles
    and Sarabun font, then renders via WeasyPrint.

    Args:
        html_path: Path to the HTML file
        output_path: Output PDF path (default: same name with .pdf)
        css_dir: Directory containing mythsensus-sarabun-embedded.css
    """
    from weasyprint import HTML

    if output_path is None:
        output_path = os.path.splitext(html_path)[0] + '.pdf'

    css_list = _load_css(css_dir)
    html_doc = HTML(filename=html_path)
    html_doc.write_pdf(output_path, stylesheets=css_list)
    print(f"  PDF generated: {output_path}")

    return output_path


def render_string_to_pdf(html_string, output_path, css_dir=None):
    """
    Convert an HTML string to PDF.
    Used when Claude generates HTML content in-memory.

    Args:
        html_string: Complete HTML string (with <html><body> tags)
        output_path: Output PDF path
        css_dir: Directory containing mythsensus-sarabun-embedded.css
    """
    from weasyprint import HTML

    css_list = _load_css(css_dir)
    html_doc = HTML(string=html_string)
    html_doc.write_pdf(output_path, stylesheets=css_list)
    print(f"  PDF generated: {output_path}")

    return output_path


# ─── HTML HELPER FUNCTIONS (for Claude to use when building reports) ──

def sc(v):
    """Score color based on cosmic score value."""
    if v >= 730: return '#4aba50'
    if v >= 700: return '#c8a45a'
    if v >= 670: return '#6090c0'
    return '#ff6060'

def bar(v, color=None):
    """Generate score bar HTML."""
    c = color or sc(v)
    return f'<div class="bar-wrap"><div class="bar-fill" style="width:{v/10:.0f}%;background:{c};"></div></div>'

def pillar(s, b, sl, bl, label, dm=False):
    """Generate BaZi pillar cell HTML."""
    dm_c = ' pc-dm' if dm else ''
    star = ' ★' if dm else ''
    return f'''<div class="pc{dm_c}">
<div class="pc-lbl">{label}{star}</div>
<div class="pc-stem">{s}</div>
<div class="pc-sname">{sl}</div>
<div class="pc-branch">{b}</div>
<div class="pc-bname">{bl}</div>
</div>'''

def wrap_html(body_content):
    """Wrap body content in a complete HTML document."""
    return f'''<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8">
<style>{CSS_STYLES}</style>
</head><body><div class="page">
{body_content}
</div></body></html>'''


# ─── CLI ──────────────────────────────────────────────────────────

def main():
    """CLI entry point."""
    print("Cosmic Blueprint PDF Renderer v2.0")
    print("=" * 40)

    if len(sys.argv) >= 2 and sys.argv[1].endswith('.html'):
        # Mode 1: Convert specific HTML file to PDF
        html_path = sys.argv[1]
        pdf_path = sys.argv[2] if len(sys.argv) >= 3 else None
        print(f"  Converting: {html_path}")
        try:
            result = render_html_to_pdf(html_path, pdf_path)
            print(f"\n  Success! {result}")
        except Exception as e:
            print(f"\n  Error: {e}")
            sys.exit(1)
    else:
        # Mode 2: Demo — render the bundled template
        css_dir = os.path.dirname(os.path.abspath(__file__))
        template_path = os.path.join(css_dir, 'mythsensus-template-fixed.html')
        pdf_path = sys.argv[1] if len(sys.argv) >= 2 else 'mythsensus-blueprint.pdf'

        if os.path.exists(template_path):
            print(f"  Using template: {template_path}")
            try:
                result = render_html_to_pdf(template_path, pdf_path, css_dir)
                print(f"\n  Success! Demo PDF: {result}")
            except Exception as e:
                print(f"\n  Error: {e}")
                sys.exit(1)
        else:
            print(f"\n  Template not found: {template_path}")
            print(f"  Usage: python3 {os.path.basename(__file__)} <input.html> [output.pdf]")
            sys.exit(1)


if __name__ == "__main__":
    main()
