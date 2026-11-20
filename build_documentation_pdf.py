import re
from fpdf import FPDF
from fpdf.fonts import FontFace

def sanitize_text(text):
    """Replace Unicode characters with ASCII equivalents for fpdf2 core fonts."""
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
        '┌': '+', '┐': '+', '┘': '+', '┌': '+',
        '█': '#', '░': ':', '▒': ':', '▓': '#',
        '■': '#', '□': '[]', '◆': '<>', '◇': '<>',
        '▪': '-', '▫': '-', '⬜': '[]', '⬛': '##',
        '×': 'x', '≤': '<=', '≥': '>=',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return ''.join(c if ord(c) < 256 else '?' for c in text)

class ModernDocPDF(FPDF):
    def __init__(self, title="MentorOS Project Documentation"):
        super().__init__(orientation='P', unit='mm', format='A4')
        self.doc_title = title
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(15, 18, 15)

    def header(self):
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(110, 110, 110)
        self.cell(0, 5, sanitize_text(self.doc_title.upper()), align='R', new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(249, 115, 22)  # Brand Solar Orange
        self.set_line_width(0.4)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(3)

    def footer(self):
        self.set_y(-14)
        self.set_draw_color(226, 232, 240)
        self.set_line_width(0.2)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(1)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(140, 140, 140)
        self.cell(90, 6, "MentorOS - AI-Powered Personal Workspace", align='L')
        self.cell(90, 6, f'Page {self.page_no()}/{{nb}}', align='R')

    def add_heading(self, text, level=1):
        self.ln(2.5)
        if level == 1:
            self.set_font('Helvetica', 'B', 15)
            self.set_text_color(15, 23, 42)
            self.cell(0, 8, sanitize_text(text), new_x="LMARGIN", new_y="NEXT")
            self.set_draw_color(249, 115, 22)
            self.set_line_width(0.6)
            self.line(15, self.get_y(), 195, self.get_y())
            self.ln(2.5)
        elif level == 2:
            self.set_font('Helvetica', 'B', 11.5)
            self.set_text_color(30, 41, 59)
            self.cell(0, 7, sanitize_text(text), new_x="LMARGIN", new_y="NEXT")
            self.ln(1)
        elif level == 3:
            self.set_font('Helvetica', 'B', 9.5)
            self.set_text_color(71, 85, 105)
            self.cell(0, 5.5, sanitize_text(text), new_x="LMARGIN", new_y="NEXT")
            self.ln(1)

    def add_body_text(self, text):
        self.set_font('Helvetica', '', 9)
        self.set_text_color(51, 65, 85)
        parts = re.split(r'(\*\*.*?\*\*)', sanitize_text(text))
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                self.set_font('Helvetica', 'B', 9)
                self.write(4.8, part[2:-2])
            else:
                self.set_font('Helvetica', '', 9)
                self.write(4.8, part)
        self.ln(5)

    def add_bullet(self, prefix, text, indent=5):
        self.set_font('Helvetica', '', 9)
        self.set_text_color(51, 65, 85)
        self.cell(indent, 4.8, '', new_x="RIGHT", new_y="TOP")
        
        self.set_font('Helvetica', 'B', 9)
        self.write(4.8, prefix + ' ')
        
        parts = re.split(r'(\*\*.*?\*\*)', sanitize_text(text))
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                self.set_font('Helvetica', 'B', 9)
                self.write(4.8, part[2:-2])
            else:
                self.set_font('Helvetica', '', 9)
                self.write(4.8, part)
        self.ln(5)

    def add_code_line(self, text):
        self.set_font('Courier', '', 7.2)
        self.set_text_color(40, 40, 40)
        self.set_fill_color(248, 250, 252)
        clean = sanitize_text(text)
        self.cell(180, 3.8, clean, new_x="LMARGIN", new_y="NEXT", fill=True)

    def render_table(self, rows):
        if not rows:
            return
        
        # Determine column weights if 3 or 4 columns
        num_cols = len(rows[0])
        total_w = 180
        col_w = total_w / num_cols

        header_style = FontFace(color=(255, 255, 255), fill_color=(249, 115, 22), family='Helvetica', size_pt=8)
        even_style = FontFace(color=(30, 41, 59), fill_color=(255, 255, 255), family='Helvetica', size_pt=7.5)
        odd_style = FontFace(color=(30, 41, 59), fill_color=(248, 250, 252), family='Helvetica', size_pt=7.5)

        self.set_draw_color(226, 232, 240)
        self.set_line_width(0.15)

        with self.table(first_row_as_headings=False) as t:
            for r_idx, row in enumerate(rows):
                if r_idx == 0:
                    r = t.row(style=header_style)
                else:
                    st = odd_style if r_idx % 2 == 1 else even_style
                    r = t.row(style=st)
                for c in row:
                    clean_c = sanitize_text(c).replace('**', '')
                    r.cell(clean_c)
        self.ln(3)

def generate_pdf_from_markdown(md_path, pdf_path, title):
    with open(md_path, 'r', encoding='utf-8') as f:
        md_content = f.read()

    pdf = ModernDocPDF(title)
    pdf.alias_nb_pages()
    pdf.add_page()

    lines = md_content.split('\n')
    in_code_block = False
    code_lines = []
    in_table = False
    table_rows = []

    for line in lines:
        stripped = line.strip()

        # Code block handling
        if stripped.startswith('```'):
            if not in_code_block:
                in_code_block = True
                code_lines = []
            else:
                in_code_block = False
                pdf.ln(1)
                for cl in code_lines:
                    pdf.add_code_line(cl)
                pdf.ln(2.5)
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        # Table handling
        if '|' in stripped and stripped.count('|') >= 2:
            # Separator row check
            if re.match(r'^\|[\s\-:|]+\|$', stripped):
                continue
            cells = [c.strip() for c in stripped.split('|')[1:-1]]
            if cells:
                if not in_table:
                    in_table = True
                    table_rows = []
                table_rows.append(cells)
            continue
        elif in_table:
            pdf.render_table(table_rows)
            in_table = False
            table_rows = []

        # Horizontal Rule
        if stripped in ['---', '***', '___']:
            pdf.ln(1.5)
            pdf.set_draw_color(226, 232, 240)
            pdf.set_line_width(0.3)
            pdf.line(15, pdf.get_y(), 195, pdf.get_y())
            pdf.ln(2.5)
            continue

        # Headings
        if stripped.startswith('# '):
            pdf.add_heading(stripped[2:], level=1)
        elif stripped.startswith('## '):
            pdf.add_heading(stripped[3:], level=2)
        elif stripped.startswith('### '):
            pdf.add_heading(stripped[4:], level=3)
        # Numbered List items (e.g. 1. , 2. )
        elif re.match(r'^\d+\.\s', stripped):
            m = re.match(r'^(\d+\.)\s*(.*)', stripped)
            pdf.add_bullet(m.group(1), m.group(2))
        # Bullet items
        elif stripped.startswith(('- ', '* ')):
            pdf.add_bullet('-', stripped[2:])
        # Regular text
        elif stripped:
            pdf.add_body_text(stripped)
        else:
            pdf.ln(1.5)

    if in_table and table_rows:
        pdf.render_table(table_rows)

    pdf.output(pdf_path)
    print(f"Successfully generated: {pdf_path}")

if __name__ == '__main__':
    generate_pdf_from_markdown(
        'mentoros_project_documentation.md',
        'MentorOS_Project_Documentation.pdf',
        'MentorOS - Project Documentation'
    )
