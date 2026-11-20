import markdown
from fpdf import FPDF
import re

def sanitize_text(text):
    """Replace Unicode characters with ASCII equivalents for fpdf2 core fonts."""
    # First pass: known replacements
    replacements = {
        '→': '->', '←': '<-', '•': '-', '–': '-', '—': '--',
        '‘': "'", '’': "'", '“': '"', '”': '"', '…': '...',
        ' ': ' ', '✓': 'OK', '✗': 'X', '★': '*', '☆': '*',
        '·': '-', '●': '-', '○': 'o', '↑': '^', '↓': 'v',
        '⌘': 'Cmd', '⌥': 'Opt', '⇧': 'Shift', '⌃': 'Ctrl',
        '⏎': 'Enter', '⌫': 'Delete', '␣': 'Space',
        '│': '|', '├': '+', '└': '+', '─': '-',
        '┤': '+', '┬': '+', '┴': '+', '┼': '+',
        '▶': '>', '◀': '<', '▲': '^', '▼': 'v',
        '┌': '+', '┐': '+', '┘': '+', '┘': '+',
        '█': '#', '░': ':', '▒': ':', '▓': '#',
        '■': '#', '□': '[]', '◆': '<>', '◇': '<>',
        '●': '*', '○': 'o', '▪': '-', '▫': '-',
        '✓': 'OK', '✗': 'X', '•': '-', '…': '...',
        '⬜': '[]', '⬛': '##', '◼': '##', '◻': '[]',
        '⬤': '*', '⭘': 'o', '◆': '<>', '◇': '<>',
        '▸': '>', '▹': '>', '▾': 'v', '▿': 'v',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    # Second pass: strip any remaining non-latin1 characters
    # latin1 range is 0-255
    return ''.join(c if ord(c) < 256 else '?' for c in text)

class PDF(FPDF):
    def __init__(self, title="Document"):
        super().__init__()
        self.doc_title = title
        self.set_auto_page_break(auto=True, margin=25)

    def header(self):
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(80, 80, 80)
        self.cell(0, 6, sanitize_text(self.doc_title), new_x="LMARGIN", new_y="NEXT", align='C')
        self.set_draw_color(200, 200, 200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', align='C')

    def add_heading(self, text, level=1):
        self.ln(2)
        if level == 1:
            self.set_font('Helvetica', 'B', 16)
            self.set_text_color(30, 30, 30)
            self.cell(0, 10, sanitize_text(text), new_x="LMARGIN", new_y="NEXT")
            self.set_draw_color(249, 115, 22)
            self.line(10, self.get_y(), 200, self.get_y())
        elif level == 2:
            self.set_font('Helvetica', 'B', 13)
            self.set_text_color(50, 50, 50)
            self.cell(0, 8, sanitize_text(text), new_x="LMARGIN", new_y="NEXT")
        elif level == 3:
            self.set_font('Helvetica', 'B', 11)
            self.set_text_color(70, 70, 70)
            self.cell(0, 7, sanitize_text(text), new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def add_body_text(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(40, 40, 40)
        parts = re.split(r'(\*\*.*?\*\*)', sanitize_text(text))
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                self.set_font('Helvetica', 'B', 10)
                self.write(5, part[2:-2])
            else:
                self.set_font('Helvetica', '', 10)
                self.write(5, part)
        self.ln(5)

    def add_bullet(self, text, indent=10):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(40, 40, 40)
        self.cell(indent, 5, '', new_x="RIGHT", new_y="TOP")
        self.cell(0, 5, sanitize_text('- ' + text), new_x="LMARGIN", new_y="NEXT")

    def add_code_line(self, text):
        self.set_font('Courier', '', 8)
        self.set_text_color(60, 60, 60)
        self.set_fill_color(245, 245, 245)
        self.cell(0, 4, sanitize_text(text), new_x="LMARGIN", new_y="NEXT", fill=True)

    def add_table_row(self, cells, is_header=False):
        if is_header:
            self.set_font('Helvetica', 'B', 8)
            self.set_fill_color(249, 115, 22)
            self.set_text_color(255, 255, 255)
        else:
            self.set_font('Helvetica', '', 8)
            self.set_fill_color(250, 250, 250)
            self.set_text_color(40, 40, 40)

        col_width = 180 / len(cells)
        for i, cell in enumerate(cells):
            align = 'L' if i == 0 else 'C'
            self.cell(col_width, 6, sanitize_text(cell[:35]), border=1, new_x="RIGHT", new_y="TOP", fill=True, align=align)
        self.ln()

def generate_pdf(md_file, pdf_file, title):
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()

    pdf = PDF(title)
    pdf.alias_nb_pages()
    pdf.add_page()

    lines = md_content.split('\n')
    in_code_block = False
    code_lines = []
    in_table = False
    table_rows = []

    for line in lines:
        stripped = line.strip()

        # Code blocks
        if stripped.startswith('```'):
            if not in_code_block:
                in_code_block = True
                code_lines = []
            else:
                in_code_block = False
                for cl in code_lines:
                    pdf.add_code_line(cl)
                pdf.ln(2)
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        # Tables
        if '|' in stripped and stripped.count('|') > 1:
            if stripped.startswith('|---'):
                continue
            cells = [c.strip() for c in stripped.split('|') if c.strip()]
            if cells:
                if not in_table:
                    in_table = True
                    table_rows = []
                table_rows.append(cells)
            continue
        elif in_table:
            # Print accumulated table
            for i, row in enumerate(table_rows):
                pdf.add_table_row(row, is_header=(i == 0))
            pdf.ln(2)
            in_table = False
            table_rows = []

        # Headers
        if stripped.startswith('# '):
            pdf.add_heading(stripped[2:], level=1)
        elif stripped.startswith('## '):
            pdf.add_heading(stripped[3:], level=2)
        elif stripped.startswith('### '):
            pdf.add_heading(stripped[4:], level=3)
        # Bold lines
        elif stripped.startswith('**') and stripped.endswith('**'):
            pdf.set_font('Helvetica', 'B', 10)
            pdf.set_text_color(40, 40, 40)
            pdf.cell(0, 6, sanitize_text(stripped[2:-2]), new_x="LMARGIN", new_y="NEXT")
            pdf.ln(1)
        # Bullets
        elif stripped.startswith('- ') or stripped.startswith('* '):
            pdf.add_bullet(stripped[2:])
        # Regular text
        elif stripped:
            pdf.add_body_text(stripped)
        else:
            pdf.ln(2)

    # Flush any remaining table
    if in_table and table_rows:
        for i, row in enumerate(table_rows):
            pdf.add_table_row(row, is_header=(i == 0))

    pdf.output(pdf_file)
    print(f'PDF created: {pdf_file}')

if __name__ == '__main__':
    generate_pdf('mentoros_documentation.md', 'MentorOS_Technical_Documentation.pdf', 'MentorOS Technical Documentation')
    generate_pdf('mentoros_study_questions.md', 'MentorOS_Study_Questions.pdf', 'MentorOS Study Questions')
    print('Both PDFs generated successfully!')