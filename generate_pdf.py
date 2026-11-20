import markdown
from fpdf import FPDF
import re

def sanitize_text(text):
    """Replace Unicode characters with ASCII equivalents for fpdf2 core fonts."""
    replacements = {
        '→': '->',      # →
        '←': '<-',      # ←
        '•': '-',       # •
        '–': '-',       # –
        '—': '--',      # —
        '‘': "'",       # '
        '’': "'",       # '
        '“': '"',       # "
        '”': '"',       # "
        '…': '...',     # …
        ' ': ' ',       # non-breaking space
        '✓': '✓',       # ✓
        '✗': '✗',       # ✗
        '★': '*',       # ★
        '☆': '*',       # ☆
        '·': '-',       # ·
        '•': '-',       # •
        '●': '-',       # ●
        '○': 'o',       # ○
        '↑': '^',       # ↑
        '↓': 'v',       # ↓
        '⌘': 'Cmd',     # Command key symbol
        '⌥': 'Opt',     # Option key symbol
        '⇧': 'Shift',   # Shift key symbol
        '⌃': 'Ctrl',    # Control key symbol
        '⏎': 'Enter',   # Enter key symbol
        '⌫': 'Delete',  # Delete key symbol
        '␣': 'Space',   # Space symbol
        '…': '...',     # ellipsis
        '│': '|',       # box drawing
        '├': '+',       # box drawing
        '└': '+',       # box drawing
        '─': '-',       # box drawing
        '┤': '+',       # box drawing
        '┬': '+',       # box drawing
        '┴': '+',       # box drawing
        '┼': '+',       # box drawing
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text

# Read the markdown file
with open('mentoros_meeting_prep.md', 'r', encoding='utf-8') as f:
    md_content = f.read()

# Create PDF
class PDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 10)
        self.cell(0, 6, sanitize_text('MentorOS Documentation Meeting - Preparation Guide'), 0, 1, 'C')
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', 0, 0, 'C')

pdf = PDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()
pdf.set_font('Helvetica', '', 10)

# Parse markdown line by line
lines = md_content.split('\n')
in_code_block = False
code_lines = []

for line in lines:
    stripped = line.strip()

    # Handle code blocks
    if stripped.startswith('```'):
        if not in_code_block:
            in_code_block = True
            code_lines = []
        else:
            in_code_block = False
            # Print code block
            pdf.set_font('Courier', '', 8)
            pdf.set_fill_color(240, 240, 240)
            for cl in code_lines:
                pdf.cell(0, 4, cl, 0, 1, 'L', fill=True)
            pdf.ln(2)
            pdf.set_font('Helvetica', '', 10)
        continue

    if in_code_block:
        code_lines.append(sanitize_text(line))
        continue

    # Handle headers
    if stripped.startswith('# '):
        pdf.set_font('Helvetica', 'B', 16)
        pdf.cell(0, 10, sanitize_text(stripped[2:]), 0, 1, 'L')
        pdf.ln(2)
    elif stripped.startswith('## '):
        pdf.set_font('Helvetica', 'B', 13)
        pdf.cell(0, 8, sanitize_text(stripped[3:]), 0, 1, 'L')
        pdf.ln(1)
    elif stripped.startswith('### '):
        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(0, 7, sanitize_text(stripped[4:]), 0, 1, 'L')
        pdf.ln(1)
    # Handle table rows (simple)
    elif '|' in stripped and stripped.count('|') > 1 and not stripped.startswith('|---'):
        pdf.set_font('Helvetica', '', 8)
        cells = [c.strip() for c in stripped.split('|') if c.strip()]
        if cells:
            col_width = 180 / len(cells)
            for c in cells:
                pdf.cell(col_width, 5, sanitize_text(c[:40]), 1, 0, 'L')
            pdf.ln()
    elif stripped.startswith('|---'):
        continue
    # Handle bullet points
    elif stripped.startswith('- ') or stripped.startswith('* '):
        pdf.set_font('Helvetica', '', 10)
        pdf.cell(10, 5, '', 0, 0)
        pdf.cell(0, 5, sanitize_text('- ' + stripped[2:]), 0, 1)
    # Handle bold text lines
    elif stripped.startswith('**') and stripped.endswith('**'):
        pdf.set_font('Helvetica', 'B', 10)
        pdf.cell(0, 6, sanitize_text(stripped[2:-2]), 0, 1)
    # Regular text
    elif stripped:
        pdf.set_font('Helvetica', '', 10)
        # Handle inline bold
        parts = re.split(r'(\*\*.*?\*\*)', stripped)
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                pdf.set_font('Helvetica', 'B', 10)
                pdf.write(5, sanitize_text(part[2:-2]))
            else:
                pdf.set_font('Helvetica', '', 10)
                pdf.write(5, sanitize_text(part))
        pdf.ln(5)
    else:
        pdf.ln(2)

pdf.output('mentoros_meeting_prep.pdf')
print('PDF created successfully!')