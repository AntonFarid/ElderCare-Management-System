"""
Sanad — Smart Elderly Care Management System
Graduation Project PowerPoint Presentation Generator
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# ─── Color Palette ───
TEAL          = RGBColor(0x0D, 0x94, 0x88)
DARK_TEAL     = RGBColor(0x0A, 0x6E, 0x65)
LIGHT_TEAL    = RGBColor(0xCC, 0xFB, 0xF1)
GOLD          = RGBColor(0xF5, 0x9E, 0x0B)
DARK_GOLD     = RGBColor(0xD9, 0x77, 0x06)
PURPLE        = RGBColor(0x8B, 0x5C, 0xF6)
LIGHT_PURPLE  = RGBColor(0xED, 0xE9, 0xFE)
WHITE         = RGBColor(0xFF, 0xFF, 0xFF)
OFF_WHITE     = RGBColor(0xF8, 0xFA, 0xFC)
LIGHT_GRAY    = RGBColor(0xF1, 0xF5, 0xF9)
MED_GRAY      = RGBColor(0x94, 0xA3, 0xB8)
DARK_GRAY     = RGBColor(0x47, 0x55, 0x69)
NEAR_BLACK    = RGBColor(0x1E, 0x29, 0x3B)
RED           = RGBColor(0xEF, 0x44, 0x44)
GREEN         = RGBColor(0x22, 0xC5, 0x5E)
BLUE          = RGBColor(0x38, 0x82, 0xF6)

SLIDE_WIDTH  = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)

prs = Presentation()
prs.slide_width  = SLIDE_WIDTH
prs.slide_height = SLIDE_HEIGHT

# ─── Helpers ───

def add_shape(slide, left, top, width, height, fill_color=None, border_color=None, border_width=Pt(0), shape_type=MSO_SHAPE.ROUNDED_RECTANGLE):
    shape = slide.shapes.add_shape(shape_type, left, top, width, height)
    shape.shadow.inherit = False
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
    ln = shape.line
    if border_color:
        ln.color.rgb = border_color
        ln.width = border_width
    else:
        ln.fill.background()
    return shape

def add_text_box(slide, left, top, width, height, text="", font_size=18, font_color=NEAR_BLACK, bold=False, alignment=PP_ALIGN.LEFT, font_name="Calibri"):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = font_color
    p.font.bold = bold
    p.font.name = font_name
    p.alignment = alignment
    return txBox

def add_paragraph(text_frame, text, font_size=16, font_color=NEAR_BLACK, bold=False, alignment=PP_ALIGN.LEFT, space_before=Pt(4), space_after=Pt(2), font_name="Calibri", level=0):
    p = text_frame.add_paragraph()
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = font_color
    p.font.bold = bold
    p.font.name = font_name
    p.alignment = alignment
    p.space_before = space_before
    p.space_after = space_after
    p.level = level
    return p

def add_accent_bar(slide, left, top, width=Inches(0.08), height=Inches(0.6), color=TEAL):
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    bar.fill.solid()
    bar.fill.fore_color.rgb = color
    bar.line.fill.background()
    bar.shadow.inherit = False
    return bar

def add_bottom_bar(slide, color=TEAL):
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(7.1), SLIDE_WIDTH, Inches(0.4))
    bar.fill.solid()
    bar.fill.fore_color.rgb = color
    bar.line.fill.background()
    bar.shadow.inherit = False
    return bar

def add_top_gradient_bar(slide, color=TEAL):
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_WIDTH, Inches(0.12))
    bar.fill.solid()
    bar.fill.fore_color.rgb = color
    bar.line.fill.background()
    bar.shadow.inherit = False
    return bar

def add_slide_number(slide, num, total=25):
    add_text_box(slide, Inches(12.3), Inches(7.1), Inches(1), Inches(0.35),
                 f"{num}/{total}", font_size=10, font_color=WHITE, alignment=PP_ALIGN.RIGHT)

def add_section_indicator(slide, text, color=TEAL):
    add_text_box(slide, Inches(0.5), Inches(7.12), Inches(4), Inches(0.35),
                 text, font_size=10, font_color=WHITE, bold=True)

def make_standard_slide(title_text, subtitle_text="", slide_num=1, section_text=""):
    """Create a standard content slide with top accent bar, title, and bottom bar."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
    # Background
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = OFF_WHITE
    # Top bar
    add_top_gradient_bar(slide, TEAL)
    # Title
    add_text_box(slide, Inches(0.7), Inches(0.3), Inches(10), Inches(0.7),
                 title_text, font_size=32, font_color=NEAR_BLACK, bold=True, font_name="Calibri")
    if subtitle_text:
        add_text_box(slide, Inches(0.7), Inches(0.9), Inches(10), Inches(0.4),
                     subtitle_text, font_size=16, font_color=MED_GRAY, font_name="Calibri")
    # Bottom bar
    add_bottom_bar(slide, TEAL)
    add_slide_number(slide, slide_num)
    if section_text:
        add_section_indicator(slide, section_text)
    # Title underline accent
    accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.7), Inches(1.0), Inches(1.5), Inches(0.05))
    accent.fill.solid()
    accent.fill.fore_color.rgb = GOLD
    accent.line.fill.background()
    accent.shadow.inherit = False
    return slide

def make_section_divider(section_title, section_subtitle, presenter, slide_num, bg_color=TEAL, accent_color=GOLD):
    """Create a bold section divider slide."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = bg_color
    # Section number circle
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(5.9), Inches(1.5), Inches(1.5), Inches(1.5))
    circle.fill.solid()
    circle.fill.fore_color.rgb = accent_color
    circle.line.fill.background()
    circle.shadow.inherit = False
    tf = circle.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.text = str(slide_num)
    p.font.size = Pt(40)
    p.font.color.rgb = WHITE
    p.font.bold = True
    # Section title
    add_text_box(slide, Inches(1), Inches(3.2), Inches(11.3), Inches(1.2),
                 section_title, font_size=40, font_color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)
    # Subtitle
    add_text_box(slide, Inches(1), Inches(4.3), Inches(11.3), Inches(0.6),
                 section_subtitle, font_size=20, font_color=LIGHT_TEAL, alignment=PP_ALIGN.CENTER)
    # Presenter
    add_text_box(slide, Inches(1), Inches(5.3), Inches(11.3), Inches(0.5),
                 f"Presented by: {presenter}", font_size=18, font_color=GOLD, bold=True, alignment=PP_ALIGN.CENTER)
    # Bottom accent
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.5), Inches(6.2), Inches(4.3), Inches(0.06))
    bar.fill.solid()
    bar.fill.fore_color.rgb = accent_color
    bar.line.fill.background()
    bar.shadow.inherit = False
    return slide

def add_card(slide, left, top, width, height, title, items, icon="", card_color=WHITE, accent_color=TEAL, title_size=16, item_size=13):
    """Add a rounded card with a title and bullet items."""
    card = add_shape(slide, left, top, width, height, fill_color=card_color, border_color=LIGHT_GRAY, border_width=Pt(1))
    # Accent strip on top of card
    strip = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.06))
    strip.fill.solid()
    strip.fill.fore_color.rgb = accent_color
    strip.line.fill.background()
    strip.shadow.inherit = False
    # Title
    title_text = f"{icon}  {title}" if icon else title
    txBox = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.15), width - Inches(0.4), Inches(0.4))
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title_text
    p.font.size = Pt(title_size)
    p.font.color.rgb = accent_color
    p.font.bold = True
    p.font.name = "Calibri"
    # Items
    for item in items:
        add_paragraph(tf, f"• {item}", font_size=item_size, font_color=DARK_GRAY, space_before=Pt(2), space_after=Pt(1))
    return card


# ════════════════════════════════════════════════════════════════
# SLIDE 1 — Title Slide
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
bg = slide.background
fill = bg.fill
fill.solid()
fill.fore_color.rgb = NEAR_BLACK

# Top decorative band
band = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_WIDTH, Inches(0.15))
band.fill.solid(); band.fill.fore_color.rgb = TEAL; band.line.fill.background(); band.shadow.inherit = False

# Large accent shape (diagonal feel)
shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(2.0), Inches(0.15), Inches(3.5))
shape.fill.solid(); shape.fill.fore_color.rgb = GOLD; shape.line.fill.background(); shape.shadow.inherit = False

# Project emoji/icon
add_text_box(slide, Inches(1), Inches(1.2), Inches(2), Inches(0.8),
             "🏠", font_size=48, font_color=WHITE, alignment=PP_ALIGN.LEFT)

# Project name
add_text_box(slide, Inches(1), Inches(2.0), Inches(8), Inches(1.0),
             "Sanad", font_size=56, font_color=TEAL, bold=True, alignment=PP_ALIGN.LEFT)

add_text_box(slide, Inches(1), Inches(2.9), Inches(10), Inches(0.7),
             "Smart Elderly Care Management System", font_size=28, font_color=GOLD, bold=False, alignment=PP_ALIGN.LEFT)

# Divider line
div = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1), Inches(3.7), Inches(4), Inches(0.04))
div.fill.solid(); div.fill.fore_color.rgb = TEAL; div.line.fill.background(); div.shadow.inherit = False

add_text_box(slide, Inches(1), Inches(4.0), Inches(10), Inches(0.5),
             "Graduation Project — Academic Year 2025–2026", font_size=18, font_color=MED_GRAY, alignment=PP_ALIGN.LEFT)

add_text_box(slide, Inches(1), Inches(4.5), Inches(10), Inches(0.5),
             "Supervised by: Dr. [Supervisor Name]", font_size=16, font_color=MED_GRAY, alignment=PP_ALIGN.LEFT)

# Team members in a row
members = ["Anton Farid", "Haidy Medhat", "Maryam Elghazaly", "Abdelrhman Reda", "Mahmoud Mohammed", "Abdallah Essam"]
x_start = Inches(1)
for i, member in enumerate(members):
    card_w = Inches(1.85)
    card_h = Inches(0.65)
    cx = x_start + i * (card_w + Inches(0.12))
    cy = Inches(5.5)
    c = add_shape(slide, cx, cy, card_w, card_h, fill_color=RGBColor(0x27, 0x37, 0x4D), border_color=TEAL, border_width=Pt(1))
    add_text_box(slide, cx + Inches(0.1), cy + Inches(0.12), card_w - Inches(0.2), card_h - Inches(0.2),
                 member, font_size=12, font_color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)

# Bottom bar
band2 = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(7.1), SLIDE_WIDTH, Inches(0.4))
band2.fill.solid(); band2.fill.fore_color.rgb = TEAL; band2.line.fill.background(); band2.shadow.inherit = False
add_slide_number(slide, 1)


# ════════════════════════════════════════════════════════════════
# SLIDE 2 — Problem Statement
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("The Problem We're Solving", "", 2, "Section 1 — Problem Definition  |  Anton Farid")

# Stat highlight box
stat_box = add_shape(slide, Inches(0.7), Inches(1.4), Inches(12), Inches(1.0), fill_color=LIGHT_TEAL, border_color=TEAL, border_width=Pt(1))
add_text_box(slide, Inches(1.0), Inches(1.5), Inches(11.3), Inches(0.7),
             "🌍  By 2050, 1 in 6 people worldwide will be over age 65 — WHO",
             font_size=22, font_color=DARK_TEAL, bold=True, alignment=PP_ALIGN.CENTER)

# Pain points
problems = [
    ("❌", "Paper-based Health Tracking", "Manual records lead to errors, delays, and data loss in care facilities"),
    ("❌", "No Early Warning System", "Health crises go undetected — no predictive or real-time alert mechanisms"),
    ("❌", "Disconnected Families", "Families lack transparency and real-time updates about their loved ones"),
    ("❌", "Manual Shift Scheduling", "Inefficient workforce management with paper-based shift assignments"),
    ("❌", "Generic Meal Plans", "No personalized nutrition — allergies & medical conditions are ignored"),
]

for i, (icon, title, desc) in enumerate(problems):
    y = Inches(2.7) + i * Inches(0.85)
    add_accent_bar(slide, Inches(0.7), y, Inches(0.07), Inches(0.6), RED)
    add_text_box(slide, Inches(1.0), y - Inches(0.02), Inches(11), Inches(0.35),
                 f"{icon}  {title}", font_size=18, font_color=NEAR_BLACK, bold=True)
    add_text_box(slide, Inches(1.0), y + Inches(0.32), Inches(11), Inches(0.35),
                 desc, font_size=14, font_color=DARK_GRAY)


# ════════════════════════════════════════════════════════════════
# SLIDE 3 — Project Objectives
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Project Objectives", "", 3, "Section 1 — Problem Definition  |  Anton Farid")

objectives = [
    ("🏥", "Digitize daily elderly care operations (health tracking, reports, schedules)"),
    ("🤖", "Integrate AI for predictive health risk assessment & early warnings"),
    ("🍽️", "Provide ML-powered personalized dietary recommendations"),
    ("📝", "Automate clinical report generation using Generative AI (Google Gemini)"),
    ("👨‍👩‍👧", "Empower families with real-time updates and visit management"),
    ("📊", "Enable management with dashboards, analytics, and audit trails"),
    ("🔔", "Implement real-time notifications for critical health events"),
]

for i, (icon, text) in enumerate(objectives):
    y = Inches(1.5) + i * Inches(0.75)
    # Number badge
    badge = add_shape(slide, Inches(0.7), y, Inches(0.45), Inches(0.45), fill_color=TEAL)
    tf = badge.text_frame
    p = tf.paragraphs[0]
    p.text = str(i+1)
    p.font.size = Pt(16)
    p.font.color.rgb = WHITE
    p.font.bold = True
    p.alignment = PP_ALIGN.CENTER
    tf.paragraphs[0].space_before = Pt(0)
    add_text_box(slide, Inches(1.35), y + Inches(0.03), Inches(11), Inches(0.45),
                 f"{icon}  {text}", font_size=17, font_color=NEAR_BLACK)


# ════════════════════════════════════════════════════════════════
# SLIDE 4 — Project Scope & User Roles
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Project Scope — 4 User Roles", "", 4, "Section 1 — Problem Definition  |  Anton Farid")

roles = [
    ("👑 Admin", TEAL, [
        "Full system control & user management",
        "Elderly resident registration",
        "Statistics dashboard & audit logs",
        "Visit request oversight"
    ]),
    ("🎖️ Team Leader", PURPLE, [
        "Approve/reject daily care reports",
        "Create employee work schedules",
        "Track attendance & performance",
        "Monitor resident health"
    ]),
    ("👨‍⚕️ Employee", BLUE, [
        "Submit daily care reports",
        "View assigned residents & schedules",
        "Receive AI health predictions & diet",
        "Task management"
    ]),
    ("👨‍👩‍👧 Family Member", GOLD, [
        "Link via unique connection code",
        "View daily health updates",
        "Request and manage visits",
        "Real-time health notifications"
    ]),
]

card_w = Inches(2.85)
card_h = Inches(3.8)
spacing = Inches(0.2)
x_start = Inches(0.5)

for i, (title, color, items) in enumerate(roles):
    cx = x_start + i * (card_w + spacing)
    cy = Inches(1.5)
    add_card(slide, cx, cy, card_w, card_h, title, items, accent_color=color, title_size=18, item_size=14)


# ════════════════════════════════════════════════════════════════
# SLIDE 5 — Section Divider: Architecture
# ════════════════════════════════════════════════════════════════
make_section_divider("System Architecture & Technology", "Clean Architecture  •  Microservices  •  Real-Time", "Haidy Medhat", 2)


# ════════════════════════════════════════════════════════════════
# SLIDE 6 — System Architecture
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("System Architecture Overview", "Microservice + Clean Architecture Pattern", 6, "Section 2 — Architecture  |  Haidy Medhat")

# Frontend box
add_card(slide, Inches(0.5), Inches(1.5), Inches(12.3), Inches(1.1),
         "Frontend — React 19 + Vite 8",
         ["HeroUI Components  •  TailwindCSS 4  •  Framer Motion  •  React Router 7  •  TanStack Query  •  Recharts"],
         accent_color=BLUE, item_size=14)

# Connection arrows text
add_text_box(slide, Inches(3.5), Inches(2.65), Inches(3), Inches(0.3),
             "▼ REST API", font_size=12, font_color=MED_GRAY, alignment=PP_ALIGN.CENTER, bold=True)
add_text_box(slide, Inches(7.5), Inches(2.65), Inches(3), Inches(0.3),
             "▼ SignalR WebSocket", font_size=12, font_color=MED_GRAY, alignment=PP_ALIGN.CENTER, bold=True)

# Backend box - using nested cards for layers
add_card(slide, Inches(0.5), Inches(3.0), Inches(12.3), Inches(2.4),
         ".NET 8 Backend API — Clean Architecture",
         [], accent_color=TEAL)

layers = [
    ("API Layer", "Controllers, Hubs, Middleware", TEAL),
    ("Application Layer", "DTOs, Interfaces, Mappings", DARK_TEAL),
    ("Infrastructure Layer", "EF Core, Services, Identity", RGBColor(0x06, 0x5F, 0x56)),
    ("Domain Layer", "Entities, Enums, Interfaces", RGBColor(0x04, 0x47, 0x40)),
]
for i, (name, desc, color) in enumerate(layers):
    lx = Inches(0.8) + i * Inches(3.0)
    ly = Inches(3.65)
    box = add_shape(slide, lx, ly, Inches(2.7), Inches(1.3), fill_color=color, border_color=None)
    add_text_box(slide, lx + Inches(0.1), ly + Inches(0.15), Inches(2.5), Inches(0.4),
                 name, font_size=14, font_color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, lx + Inches(0.1), ly + Inches(0.55), Inches(2.5), Inches(0.6),
                 desc, font_size=11, font_color=LIGHT_TEAL, alignment=PP_ALIGN.CENTER)

# Bottom row: DB + AI
add_text_box(slide, Inches(3.5), Inches(5.45), Inches(3), Inches(0.3),
             "▼", font_size=16, font_color=MED_GRAY, alignment=PP_ALIGN.CENTER)
add_text_box(slide, Inches(7.5), Inches(5.45), Inches(3), Inches(0.3),
             "▼ REST + API Key", font_size=12, font_color=MED_GRAY, alignment=PP_ALIGN.CENTER, bold=True)

add_card(slide, Inches(0.5), Inches(5.8), Inches(5.8), Inches(1.1),
         "🗄️  SQL Server Database",
         ["Entity Framework Core ORM  •  11 Entities"],
         accent_color=DARK_GRAY, item_size=13)

add_card(slide, Inches(7.0), Inches(5.8), Inches(5.8), Inches(1.1),
         "🧠  Python AI Microservice",
         ["FastAPI  •  Scikit-Learn  •  Google Gemini API"],
         accent_color=PURPLE, item_size=13)


# ════════════════════════════════════════════════════════════════
# SLIDE 7 — Technology Stack
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Technology Stack", "", 7, "Section 2 — Architecture  |  Haidy Medhat")

frontend_items = [
    "React 19", "Vite 8", "TailwindCSS 4",
    "HeroUI Component Library", "Framer Motion",
    "React Router 7", "TanStack React Query",
    "Recharts (data visualization)",
    "Axios, React Hook Form, Zod"
]
backend_items = [
    ".NET 8 (ASP.NET Core)", "Entity Framework Core",
    "ASP.NET Identity", "JWT Authentication",
    "SignalR (Real-Time WebSocket)",
    "AutoMapper", "Swagger / OpenAPI",
    "SQL Server", "SMTP Email Service"
]
ai_items = [
    "Python 3.x", "FastAPI + Uvicorn",
    "Scikit-Learn (ML)", "Random Forest Classifier",
    "Gradient Boosting", "Pandas & NumPy",
    "Joblib (model persistence)",
    "Google Gemini API (GenAI)",
    "Pydantic (validation)"
]

col_w = Inches(3.8)
add_card(slide, Inches(0.5), Inches(1.4), col_w, Inches(5.2), "⚛️  Frontend", frontend_items, accent_color=BLUE, item_size=14)
add_card(slide, Inches(4.7), Inches(1.4), col_w, Inches(5.2), "⚙️  Backend", backend_items, accent_color=TEAL, item_size=14)
add_card(slide, Inches(8.9), Inches(1.4), col_w, Inches(5.2), "🧠  AI / ML", ai_items, accent_color=PURPLE, item_size=14)


# ════════════════════════════════════════════════════════════════
# SLIDE 8 — Database Design
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Database Design", "SQL Server  •  Entity Framework Core  •  11 Core Entities", 8, "Section 2 — Architecture  |  Haidy Medhat")

entities = [
    ("User", "Extends ASP.NET Identity\n4 roles, soft delete, audit fields", TEAL),
    ("Elderly", "Resident profile, medical conditions\nallergies, ConnectionCode", TEAL),
    ("DailyReport", "Employee → Elderly report\nApproval workflow, AI report", BLUE),
    ("HealthMetric", "6 types: Meal, Medication\nActivity, Symptom, Vital, Mood", BLUE),
    ("WorkSchedule", "Shift management\nMorning/Afternoon/Night/Off", PURPLE),
    ("AttendanceLog", "Employee check-in/out\nTime tracking", PURPLE),
    ("VisitRequest", "Family visit management\n5 statuses: Pending→Completed", GOLD),
    ("Notification", "6 types: HealthAlert\nReportApproved, VisitRequest...", GOLD),
    ("AuditLog", "Full action trail\nTimestamped, user-linked", DARK_GRAY),
    ("EmployeeElderlyAssignment", "Caregiver↔Resident\nmany-to-many link", DARK_GRAY),
    ("ElderlyFamilyMember", "Family↔Resident\nvia ConnectionCode", DARK_GRAY),
]

cols = 4
rows = 3
cw = Inches(3.0)
ch = Inches(1.5)
sx = Inches(0.4)
sy = Inches(1.5)

for i, (name, desc, color) in enumerate(entities):
    col = i % cols
    row = i // cols
    cx = sx + col * (cw + Inches(0.15))
    cy = sy + row * (ch + Inches(0.12))
    box = add_shape(slide, cx, cy, cw, ch, fill_color=WHITE, border_color=color, border_width=Pt(2))
    # Color strip
    strip = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, cx, cy, cw, Inches(0.05))
    strip.fill.solid(); strip.fill.fore_color.rgb = color; strip.line.fill.background(); strip.shadow.inherit = False
    add_text_box(slide, cx + Inches(0.15), cy + Inches(0.12), cw - Inches(0.3), Inches(0.35),
                 name, font_size=14, font_color=color, bold=True)
    add_text_box(slide, cx + Inches(0.15), cy + Inches(0.5), cw - Inches(0.3), Inches(0.9),
                 desc, font_size=11, font_color=DARK_GRAY)


# ════════════════════════════════════════════════════════════════
# SLIDE 9 — Security & Authentication
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Security & Authentication", "", 9, "Section 2 — Architecture  |  Haidy Medhat")

sec_cards = [
    ("🔐 Authentication", TEAL, [
        "ASP.NET Core Identity",
        "JWT Bearer Token (60 min expiry)",
        "Password policy: digit + uppercase + min 6",
        "Email verification for password reset",
    ]),
    ("🛡️ Authorization", BLUE, [
        "Role-Based Access Control (RBAC): 4 roles",
        "Frontend: ProtectedRoutes by role",
        "Backend: [Authorize] on controllers",
        "Route guards prevent unauthorized access",
    ]),
    ("🔑 AI Service Security", PURPLE, [
        "X-API-Key header on every request",
        "API key validated per endpoint",
        "CORS configured for backend only",
        "Separate microservice isolation",
    ]),
    ("📋 Audit & Safety", GOLD, [
        "Account lockout: 5 fails → 5 min lock",
        "Soft delete (never lose data)",
        "Full AuditLog trail",
        "Prediction history logged to CSV",
    ]),
]

for i, (title, color, items) in enumerate(sec_cards):
    col = i % 2
    row = i // 2
    cx = Inches(0.5) + col * Inches(6.3)
    cy = Inches(1.4) + row * Inches(2.8)
    add_card(slide, cx, cy, Inches(6.0), Inches(2.5), title, items, accent_color=color, title_size=17, item_size=14)


# ════════════════════════════════════════════════════════════════
# SLIDE 10 — Section Divider: AI Module
# ════════════════════════════════════════════════════════════════
make_section_divider("AI & Machine Learning Module", "Health Risk Prediction  •  Diet Recommendation  •  Fall Detection  •  Gemini AI", "Maryam Elghazaly", 3, bg_color=PURPLE, accent_color=GOLD)


# ════════════════════════════════════════════════════════════════
# SLIDE 11 — AI Module Overview
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("AI-Powered Intelligence — 4 Capabilities", "Python FastAPI Microservice", 11, "Section 3 — AI Module  |  Maryam Elghazaly")

ai_features = [
    ("🧠", "Predictive Health Risk Assessment", "ML model predicts High/Low risk from 11 vital signs\nHybrid approach: AI + Clinical Rule-Based Safety Overrides", TEAL),
    ("🍽️", "Smart Dietary Recommendation", "Random Forest classifiers recommend personalized meals\nAllergy-aware • Condition-aware • BMI-aware • Dynamic retraining", GREEN),
    ("🎥", "Fall Detection (CV Prototype)", "Bounding-box aspect ratio for posture detection\nProduction-ready API for future pose estimation (YOLOv8)", BLUE),
    ("📝", "Gemini AI Report Generation", "Google Gemini transforms structured data into clinical narratives\nMulti-day health pattern detection with severity alerts", PURPLE),
]

for i, (icon, title, desc, color) in enumerate(ai_features):
    cy = Inches(1.5) + i * Inches(1.35)
    # Icon circle
    circle = add_shape(slide, Inches(0.7), cy, Inches(0.7), Inches(0.7), fill_color=color, shape_type=MSO_SHAPE.OVAL)
    tf = circle.text_frame
    p = tf.paragraphs[0]
    p.text = icon
    p.font.size = Pt(22)
    p.alignment = PP_ALIGN.CENTER
    # Title
    add_text_box(slide, Inches(1.6), cy - Inches(0.02), Inches(10.5), Inches(0.35),
                 title, font_size=20, font_color=color, bold=True)
    # Description
    add_text_box(slide, Inches(1.6), cy + Inches(0.35), Inches(10.5), Inches(0.65),
                 desc, font_size=13, font_color=DARK_GRAY)


# ════════════════════════════════════════════════════════════════
# SLIDE 12 — Health Risk Prediction Model
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Predictive Health Risk Assessment", "Hybrid ML + Clinical Safety Rules", 12, "Section 3 — AI Module  |  Maryam Elghazaly")

# Left column - Model details
add_card(slide, Inches(0.5), Inches(1.4), Inches(6.0), Inches(2.5),
         "📊 Model Training Pipeline", [
             "Dataset: 3,000 synthetic elderly health records",
             "Probabilistic labeling (not rule-based)",
             "Missing value imputation (median strategy)",
             "Outlier clipping to clinical ranges",
             "Stratified 80/20 train-test split",
         ], accent_color=TEAL, item_size=13)

# Right column - Model comparison
add_card(slide, Inches(6.8), Inches(1.4), Inches(6.0), Inches(2.5),
         "🔬 Model Comparison (Best of 4)", [
             "Logistic Regression",
             "Decision Tree (max_depth=6)",
             "Random Forest (150 trees) ✅ Best",
             "Gradient Boosting",
             "Auto-selected by highest F1-Score",
         ], accent_color=BLUE, item_size=13)

# Bottom - Clinical Overrides
add_card(slide, Inches(0.5), Inches(4.1), Inches(12.3), Inches(2.7),
         "🛡️ Hybrid Safety Net — Clinical Rule-Based Overrides (Force High Risk @ 99% Confidence)", [
             "🔺 Severe Hypertension: BP ≥ 160/100 mmHg → Cardiovascular distress risk",
             "🔺 Tachycardia: Heart Rate ≥ 115 bpm → Possible fever, infection, or cardiac stress",
             "🔺 High Fever: Temperature ≥ 101.5°F → Active infection or heat stress",
             "🔺 Severe Hyperglycemia: Blood Sugar ≥ 200 mg/dL → Risk of DKA / HHS",
             "🔻 Severe Hypoglycemia: Blood Sugar ≤ 60 mg/dL → Seizure / loss of consciousness risk",
             "🔻 Bradycardia: Heart Rate ≤ 45 bpm → Syncope / low perfusion risk",
             "⚠️ 2+ Missed Medications → Chronic disease destabilization",
         ], accent_color=RED, title_size=14, item_size=12)


# ════════════════════════════════════════════════════════════════
# SLIDE 13 — Diet Recommendation System
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Smart Dietary & Nutrition Recommendation", "Random Forest Classifiers  •  Allergy-Aware  •  Dynamic Retraining", 13, "Section 3 — AI Module  |  Maryam Elghazaly")

# Pipeline
add_card(slide, Inches(0.5), Inches(1.4), Inches(6.0), Inches(3.0),
         "🧬 Recommendation Pipeline", [
             "1. Patient profile: age, gender, BMI, conditions",
             "2. Feature engineering: conditions → boolean flags",
             "3. Three RF classifiers predict:",
             "   • Breakfast  •  Lunch  •  Dinner",
             "4. Allergy filter: scan for allergens",
             "   → Unsafe meal → fallback to safe recipe",
             "5. Dynamic recipe bank (JSON + CRUD API)",
             "6. Auto-generate dietitian clinical notes",
         ], accent_color=GREEN, item_size=13)

add_card(slide, Inches(6.8), Inches(1.4), Inches(6.0), Inches(3.0),
         "📋 Intelligent Dietitian Notes", [
             "BMI analysis (underweight/healthy/overweight)",
             "Blood sugar & BP trend assessment",
             "Per-allergen explanations:",
             "   🥛 Dairy  🥜 Nuts  🐟 Seafood  🍳 Egg  🫘 Soy",
             "Per-restriction adaptation:",
             "   🌾 Gluten-free  🧂 Low-sodium  🥗 Vegetarian",
             "   🌙 Halal  🍬 Low-sugar  🥣 Soft-food",
             "Total daily calorie & protein breakdown",
         ], accent_color=PURPLE, item_size=13)

add_card(slide, Inches(0.5), Inches(4.6), Inches(12.3), Inches(2.0),
         "♻️ Dynamic On-the-Fly Retraining", [
             "POST /api/ml/retrain → augments dataset with new recipes from recipes.json",
             "Generates 150 synthetic training samples per new recipe (realistic patient profiles)",
             "Retrains all 3 classifiers automatically — zero downtime, no manual intervention",
             "New recipes inherit appropriate disease/dietary mappings from their tags",
         ], accent_color=GOLD, item_size=13)


# ════════════════════════════════════════════════════════════════
# SLIDE 14 — Fall Detection + Gemini
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Fall Detection & Gemini AI Reports", "", 14, "Section 3 — AI Module  |  Maryam Elghazaly")

# Left - Fall Detection
add_card(slide, Inches(0.5), Inches(1.4), Inches(6.0), Inches(5.2),
         "🎥 Fall Detection — CV Prototype", [
             "Bounding box aspect ratio analysis:",
             "   Standing: height > width → ratio > 1.0  ✅",
             "   Fallen:    height < width → ratio < 0.85  ⚠️",
             "",
             "Confidence: 95% when fall detected",
             "",
             "🔮 Production Roadmap:",
             "   → YOLOv8-Pose skeleton keypoints",
             "   → Real-time video stream (OpenCV)",
             "   → CCTV camera integration",
             "",
             "Alert: AI → Backend → SignalR → Real-Time",
         ], accent_color=BLUE, item_size=13)

# Right - Gemini
add_card(slide, Inches(6.8), Inches(1.4), Inches(6.0), Inches(5.2),
         "📝 Gemini AI Report Generation", [
             "Input: Structured health metrics data",
             "Output: Professional clinical narrative",
             "",
             "Generated Report Sections:",
             "   1. Summary — condition & mood",
             "   2. Medications — adherence",
             "   3. Meals — consumption & appetite",
             "   4. Activities — engagement",
             "   5. Observations — changes/concerns",
             "   6. Recommendations — next shift",
             "",
             "🧠 Multi-day pattern detection",
             "🛟 Fallback template if API unavailable",
         ], accent_color=PURPLE, item_size=13)


# ════════════════════════════════════════════════════════════════
# SLIDE 15 — Section Divider: Backend
# ════════════════════════════════════════════════════════════════
make_section_divider("Backend API & Real-Time Features", "RESTful Design  •  Approval Workflow  •  SignalR  •  Email", "Abdelrhman Reda", 4, bg_color=DARK_TEAL, accent_color=GOLD)


# ════════════════════════════════════════════════════════════════
# SLIDE 16 — Backend API Design
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Backend API Design", "Clean Architecture  •  10 Controllers  •  10 Services", 16, "Section 4 — Backend  |  Abdelrhman Reda")

add_card(slide, Inches(0.5), Inches(1.4), Inches(5.8), Inches(3.7),
         "📂 API Controllers (10)", [
             "AuthController — Login, Register, Password Reset",
             "AdminController — User/Elder CRUD, Statistics",
             "TeamLeaderController — Reports, Schedules, Attendance",
             "EmployeeController — Daily Reports, Metrics, Tasks",
             "FamilyController — Loved Ones, Updates, Visits",
             "NotificationController — Get/Mark notifications",
             "GeminiTestController — AI report generation",
         ], accent_color=TEAL, item_size=13)

add_card(slide, Inches(6.7), Inches(1.4), Inches(6.1), Inches(3.7),
         "📦 Backend Services (10)", [
             "AdminService (77KB of logic!)",
             "TeamLeaderService (79KB of logic!)",
             "EmployeeService (48KB)",
             "FamilyMemberService (48KB)",
             "AuthenticationService (18KB)",
             "GeminiService — Gemini API integration",
             "AiPredictionService — Python ML bridge",
             "NotificationService — SignalR + DB",
             "EmailService — SMTP Gmail",
         ], accent_color=BLUE, item_size=13)

add_card(slide, Inches(0.5), Inches(5.3), Inches(12.3), Inches(1.5),
         "🔧 Design Patterns Used", [
             "Repository Pattern (EF Core)  •  Service Layer Pattern  •  DTO + AutoMapper  •  Response Wrapper  •  Dependency Injection  •  Middleware Pipeline",
         ], accent_color=GOLD, item_size=14)


# ════════════════════════════════════════════════════════════════
# SLIDE 17 — Daily Report Workflow
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Daily Care Report — End-to-End Workflow", "", 17, "Section 4 — Backend  |  Abdelrhman Reda")

steps = [
    ("1", "Employee Submits", "6 categories: Meals,\nMedications, Vitals,\nActivities, Symptoms, Mood", TEAL),
    ("2", "AI Processing", "Health risk prediction\nGemini narrative report\nDiet recommendation", PURPLE),
    ("3", "Team Leader Review", "Pending queue\nApprove ✅ or\nReject ❌ with reason", BLUE),
    ("4", "Notifications", "Approval → Employee + Family\nHigh Risk → All stakeholders\nReal-time via SignalR", GOLD),
]

for i, (num, title, desc, color) in enumerate(steps):
    cx = Inches(0.4) + i * Inches(3.25)
    cy = Inches(1.5)
    # Step card
    card = add_shape(slide, cx, cy, Inches(3.0), Inches(3.8), fill_color=WHITE, border_color=color, border_width=Pt(2))
    # Number circle
    circle = add_shape(slide, cx + Inches(1.1), cy + Inches(0.2), Inches(0.8), Inches(0.8), fill_color=color, shape_type=MSO_SHAPE.OVAL)
    tf = circle.text_frame; p = tf.paragraphs[0]; p.text = num; p.font.size = Pt(28); p.font.color.rgb = WHITE; p.font.bold = True; p.alignment = PP_ALIGN.CENTER
    add_text_box(slide, cx + Inches(0.15), cy + Inches(1.2), Inches(2.7), Inches(0.4),
                 title, font_size=18, font_color=color, bold=True, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, cx + Inches(0.15), cy + Inches(1.7), Inches(2.7), Inches(1.8),
                 desc, font_size=13, font_color=DARK_GRAY, alignment=PP_ALIGN.CENTER)

    # Arrow between steps
    if i < 3:
        add_text_box(slide, cx + Inches(3.0), cy + Inches(1.5), Inches(0.3), Inches(0.4),
                     "→", font_size=24, font_color=MED_GRAY, bold=True, alignment=PP_ALIGN.CENTER)

# Bottom note
add_text_box(slide, Inches(0.5), Inches(5.7), Inches(12.3), Inches(0.8),
             "📊 Health Metric Types:  Meal  •  Medication  •  Activity  •  Symptom  •  Vital  •  Mood\n"
             "📋 Approval Statuses:   Pending → Approved → Rejected    |    Family sees ONLY approved reports",
             font_size=13, font_color=DARK_GRAY, alignment=PP_ALIGN.CENTER)


# ════════════════════════════════════════════════════════════════
# SLIDE 18 — Real-Time Notifications
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Real-Time Notifications", "SignalR WebSocket  •  6 Notification Types  •  Multi-Channel", 18, "Section 4 — Backend  |  Abdelrhman Reda")

notif_types = [
    ("🚨", "HealthAlert", "Critical vital anomaly detected by AI", RED),
    ("✅", "ReportApproved", "Daily care report approved by Team Leader", GREEN),
    ("❌", "ReportRejected", "Report needs revision (with reason)", RED),
    ("🏠", "VisitRequest", "Family visit request submitted/status change", BLUE),
    ("📅", "ScheduleChange", "Shift or schedule modification", PURPLE),
    ("📋", "General", "System announcements & information", DARK_GRAY),
]

for i, (icon, title, desc, color) in enumerate(notif_types):
    col = i % 3
    row = i // 3
    cx = Inches(0.5) + col * Inches(4.2)
    cy = Inches(1.5) + row * Inches(2.1)
    card = add_shape(slide, cx, cy, Inches(3.9), Inches(1.7), fill_color=WHITE, border_color=color, border_width=Pt(2))
    add_text_box(slide, cx + Inches(0.15), cy + Inches(0.15), Inches(3.6), Inches(0.4),
                 f"{icon}  {title}", font_size=17, font_color=color, bold=True)
    add_text_box(slide, cx + Inches(0.15), cy + Inches(0.6), Inches(3.6), Inches(0.9),
                 desc, font_size=13, font_color=DARK_GRAY)

add_text_box(slide, Inches(0.5), Inches(5.9), Inches(12.3), Inches(0.8),
             "📡 Delivery Channels:  In-App Real-Time (SignalR)  •  Email (SMTP/Gmail)  •  Dashboard Badge Count\n"
             "🔔 Example:  AI detects High Risk → NotificationService → SignalR push to Employee + TeamLeader + Family + Admin",
             font_size=13, font_color=DARK_GRAY, alignment=PP_ALIGN.CENTER)


# ════════════════════════════════════════════════════════════════
# SLIDE 19 — Visit Management
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Visit Management & Email Service", "", 19, "Section 4 — Backend  |  Abdelrhman Reda")

# Visit workflow steps
vsteps = [
    ("1", "Family Requests", "Select elder\nChoose date & time\nSpecify purpose", GOLD),
    ("2", "Review Queue", "Team Leader or Admin\nreviews requests", BLUE),
    ("3", "Decision", "Approve  ✅\nReject  ❌\nCancel  🚫", TEAL),
    ("4", "Completed", "Visit conducted\nStatus updated\nAll parties notified", GREEN),
]

for i, (num, title, desc, color) in enumerate(vsteps):
    cx = Inches(0.4) + i * Inches(3.25)
    cy = Inches(1.5)
    card = add_shape(slide, cx, cy, Inches(3.0), Inches(2.8), fill_color=WHITE, border_color=color, border_width=Pt(2))
    badge = add_shape(slide, cx + Inches(1.15), cy + Inches(0.2), Inches(0.7), Inches(0.7), fill_color=color, shape_type=MSO_SHAPE.OVAL)
    tf = badge.text_frame; p = tf.paragraphs[0]; p.text = num; p.font.size = Pt(24); p.font.color.rgb = WHITE; p.font.bold = True; p.alignment = PP_ALIGN.CENTER
    add_text_box(slide, cx + Inches(0.1), cy + Inches(1.05), Inches(2.8), Inches(0.35), title, font_size=16, font_color=color, bold=True, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, cx + Inches(0.1), cy + Inches(1.5), Inches(2.8), Inches(1.2), desc, font_size=13, font_color=DARK_GRAY, alignment=PP_ALIGN.CENTER)
    if i < 3:
        add_text_box(slide, cx + Inches(3.0), cy + Inches(1.1), Inches(0.3), Inches(0.4), "→", font_size=24, font_color=MED_GRAY, bold=True)

# Email card
add_card(slide, Inches(0.5), Inches(4.7), Inches(12.3), Inches(2.0),
         "📧 Email Notification Service", [
             "SMTP Provider: Gmail  •  From: Sanad Elder Care",
             "Triggers: Password reset  •  Critical health alerts  •  Visit request updates  •  Report status changes",
             "Template-based emails with professional branding",
         ], accent_color=DARK_GRAY, item_size=14)


# ════════════════════════════════════════════════════════════════
# SLIDE 20 — Section Divider: Frontend
# ════════════════════════════════════════════════════════════════
make_section_divider("Frontend UI/UX & Dashboards", "React 19  •  42+ Routes  •  4 Role-Based Portals", "Mahmoud Mohammed", 5, bg_color=BLUE, accent_color=GOLD)


# ════════════════════════════════════════════════════════════════
# SLIDE 21 — Frontend Architecture
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Frontend Architecture", "React 19 + Vite 8  •  Component-Based  •  42+ Routes", 21, "Section 5 — Frontend  |  Mahmoud Mohammed")

add_card(slide, Inches(0.5), Inches(1.4), Inches(6.0), Inches(4.0),
         "🗂️ Code Organization", [
             "src/pages/ — Role-specific pages",
             "  ├── admin/       (11 pages)",
             "  ├── employee/   (10 pages)",
             "  ├── teamleader/ (12 pages)",
             "  └── family/        (9 pages)",
             "src/components/ — Reusable UI components",
             "src/contexts/ — AuthContext (global state)",
             "src/services/ — Axios API service layer",
             "src/layouts/ — 4 role-specific layouts",
             "src/ProtectedRoutes/ — Route guards",
         ], accent_color=BLUE, item_size=13)

add_card(slide, Inches(6.8), Inches(1.4), Inches(6.0), Inches(4.0),
         "⚛️ Key Architecture Decisions", [
             "React Router 7 with nested layouts",
             "TanStack React Query for server state",
             "React Hook Form + Zod for validation",
             "Axios interceptors for JWT tokens",
             "HeroUI for consistent component design",
             "Framer Motion for smooth animations",
             "Recharts for data visualization",
             "html2pdf.js for PDF export",
             "xlsx for Excel data export",
         ], accent_color=TEAL, item_size=13)

add_card(slide, Inches(0.5), Inches(5.6), Inches(12.3), Inches(1.1),
         "🧭 Routing & Guards", [
             "ProtectedRoutes — checks role before rendering  •  ProtectedAuthRoutes — redirects logged-in users from auth pages  •  42+ unique routes",
         ], accent_color=GOLD, item_size=14)


# ════════════════════════════════════════════════════════════════
# SLIDE 22 — Admin & Team Leader Dashboards
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Admin & Team Leader Dashboards", "", 22, "Section 5 — Frontend  |  Mahmoud Mohammed")

admin_pages = [
    "AdminDashboard — System-wide statistics",
    "UsersManagement — CRUD for all users",
    "UserDetails — Individual user profiles",
    "EldersManagement — Resident CRUD",
    "ElderDetails — Individual resident view",
    "Reports — All daily reports overview",
    "AdminStatistics — Analytics & charts",
    "AuditLogs — Full action trail viewer",
    "Visits — Visit request oversight",
    "Notifications — Alert center",
    "AdminProfile — Profile management",
]

tl_pages = [
    "TeamLeaderDashboard — Team metrics",
    "TeamLeaderReports — Approve/Reject queue",
    "ViewReport — Detailed report review",
    "TeamLeaderResidents — Resident overview",
    "Employees — Team member list",
    "EmployeePerformance — Performance metrics",
    "Schedules — Shift schedule management",
    "CreateSchedule — New schedule creation",
    "Attendance — Check-in/out tracking",
    "Visits — Visit request management",
    "Notifications — Alert center",
]

add_card(slide, Inches(0.5), Inches(1.4), Inches(6.0), Inches(5.2),
         "👑 Admin Portal — 11 Pages", admin_pages, accent_color=TEAL, item_size=12)
add_card(slide, Inches(6.8), Inches(1.4), Inches(6.0), Inches(5.2),
         "🎖️ Team Leader Portal — 12 Pages", tl_pages, accent_color=PURPLE, item_size=12)


# ════════════════════════════════════════════════════════════════
# SLIDE 23 — Employee & Family Portals
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Employee & Family Portals", "", 23, "Section 5 — Frontend  |  Mahmoud Mohammed")

emp_pages = [
    "Dashboard — Assigned residents overview",
    "Residents — Full resident list",
    "ResidentDetails — Health history & details",
    "DailyReports — Report history",
    "CreateReport — Rich form (6 metric types)",
    "ViewReport — Detailed report with AI insights",
    "Schedule — Personal shift schedule",
    "Tasks — Task management board",
    "Notifications — Real-time alerts",
    "Profile — Personal settings",
]

fam_pages = [
    "Home — Connected elderly overview",
    "LovedOnes — Linked elderly list",
    "ElderDetail — Health info, conditions, charts",
    "DailyUpdates — Approved reports feed",
    "Visits — Request & manage visits",
    "ContactStaffModal — Direct staff contact",
    "Messages — Communication",
    "Notifications — Real-time health alerts",
    "Profile — Personal settings",
]

add_card(slide, Inches(0.5), Inches(1.4), Inches(6.0), Inches(5.2),
         "👨‍⚕️ Employee Portal — 10 Pages", emp_pages, accent_color=BLUE, item_size=12)
add_card(slide, Inches(6.8), Inches(1.4), Inches(6.0), Inches(5.2),
         "👨‍👩‍👧 Family Portal — 9 Pages", fam_pages, accent_color=GOLD, item_size=12)


# ════════════════════════════════════════════════════════════════
# SLIDE 24 — UI Features & Data Viz
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Key UI/UX Features", "", 24, "Section 5 — Frontend  |  Mahmoud Mohammed")

ui_cards = [
    ("📊 Data Visualization", TEAL, [
        "Recharts: line, bar, pie charts",
        "Health trend tracking over time",
        "Employee performance metrics",
        "System-wide statistics",
    ]),
    ("🔍 Smart Forms", BLUE, [
        "React Hook Form + Zod validation",
        "Real-time field validation",
        "Dynamic fields by metric type",
        "6-category daily report form",
    ]),
    ("🎨 Design Quality", PURPLE, [
        "HeroUI consistent components",
        "Framer Motion animations",
        "Responsive desktop & tablet",
        "Toast notifications & loading states",
    ]),
    ("📄 Export Capabilities", GOLD, [
        "html2pdf.js for PDF reports",
        "xlsx for Excel data export",
        "Printable report formatting",
        "Professional clinical layouts",
    ]),
]

for i, (title, color, items) in enumerate(ui_cards):
    col = i % 2
    row = i // 2
    cx = Inches(0.5) + col * Inches(6.3)
    cy = Inches(1.4) + row * Inches(2.8)
    add_card(slide, cx, cy, Inches(6.0), Inches(2.5), title, items, accent_color=color, title_size=17, item_size=14)


# ════════════════════════════════════════════════════════════════
# SLIDE 25 — Section Divider: Results
# ════════════════════════════════════════════════════════════════
make_section_divider("Testing, Results & Conclusion", "Quality Assurance  •  Achievements  •  Future Roadmap", "Abdallah Essam", 6, bg_color=RGBColor(0x1E, 0x29, 0x3B), accent_color=TEAL)


# ════════════════════════════════════════════════════════════════
# SLIDE 26 — Testing Strategy
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Testing Strategy & Quality Assurance", "", 26, "Section 6 — Results  |  Abdallah Essam")

test_cards = [
    ("🧪 AI Service Testing", PURPLE, [
        "test_ml.py — 18KB comprehensive ML tests",
        "test_load.py — API load/stress testing",
        "Health prediction edge cases",
        "Allergen filtering validation",
        "Clinical override verification",
    ]),
    ("🔬 Backend Testing", TEAL, [
        "Swagger/OpenAPI endpoint testing",
        "Manual integration testing (10 controllers)",
        "Role-based authorization checks",
        "JWT token flow validation",
        "SignalR connection testing",
    ]),
    ("🎨 Frontend Testing", BLUE, [
        "Manual testing: 42+ routes",
        "Cross-browser: Chrome, Firefox, Edge",
        "Responsive design verification",
        "Form validation edge cases",
        "Protected route guard testing",
    ]),
    ("📊 ML Model Evaluation", GOLD, [
        "Stratified 5-fold Cross Validation",
        "Metrics: Accuracy, F1-Score",
        "Confusion matrix analysis",
        "Feature importance extraction",
        "Best model auto-selection",
    ]),
]

for i, (title, color, items) in enumerate(test_cards):
    col = i % 2
    row = i // 2
    cx = Inches(0.5) + col * Inches(6.3)
    cy = Inches(1.4) + row * Inches(2.8)
    add_card(slide, cx, cy, Inches(6.0), Inches(2.5), title, items, accent_color=color, item_size=13)


# ════════════════════════════════════════════════════════════════
# SLIDE 27 — Key Results & Achievements
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Key Results & Achievements", "", 27, "Section 6 — Results  |  Abdallah Essam")

achievements = [
    ("✅", "42+ frontend routes across 4 role-based dashboards", GREEN),
    ("✅", "10 API controllers + 10 backend services (370KB+ logic)", GREEN),
    ("✅", "11 database entities with full relational integrity", GREEN),
    ("🤖", "Health risk model: 4 algorithms compared, best auto-selected by F1", PURPLE),
    ("🤖", "Hybrid ML + Clinical Rules = zero missed emergencies", PURPLE),
    ("🤖", "Diet recommender: 3 classifiers, allergy-aware, dynamic retraining", PURPLE),
    ("🤖", "Gemini AI: auto-generated clinical narratives + pattern detection", PURPLE),
    ("🔐", "JWT auth + RBAC + API key + account lockout + audit logging", TEAL),
    ("⚡", "Real-time SignalR notifications: 6 types, multi-channel delivery", BLUE),
    ("📄", "PDF & Excel export, email notifications, visit management", GOLD),
]

for i, (icon, text, color) in enumerate(achievements):
    y = Inches(1.35) + i * Inches(0.55)
    add_accent_bar(slide, Inches(0.7), y + Inches(0.05), Inches(0.06), Inches(0.38), color)
    add_text_box(slide, Inches(0.95), y, Inches(12), Inches(0.5),
                 f"{icon}  {text}", font_size=15, font_color=NEAR_BLACK)


# ════════════════════════════════════════════════════════════════
# SLIDE 28 — Future Work
# ════════════════════════════════════════════════════════════════
slide = make_standard_slide("Future Work & Roadmap", "", 28, "Section 6 — Results  |  Abdallah Essam")

future_cards = [
    ("🔮 Phase 2 — AI Enhancements", PURPLE, [
        "YOLOv8-Pose for real fall detection",
        "Deep learning for vital anomaly detection",
        "NLP sentiment analysis from notes",
        "Medication interaction warnings",
    ]),
    ("📱 Phase 3 — Mobile & IoT", BLUE, [
        "React Native / Flutter mobile app",
        "IoT wearable integration (smartwatch)",
        "Automated vital sign collection",
        "Firebase push notifications (FCM)",
    ]),
    ("🏥 Phase 4 — Enterprise", TEAL, [
        "Multi-facility SaaS support",
        "Doctor/physician role + prescriptions",
        "Telemedicine video calls",
        "Arabic language support (i18n)",
    ]),
    ("📊 Phase 5 — Analytics", GOLD, [
        "Long-term health trend prediction",
        "Staff workload optimization",
        "Predictive scheduling by need",
        "Advanced reporting & BI dashboards",
    ]),
]

for i, (title, color, items) in enumerate(future_cards):
    col = i % 2
    row = i // 2
    cx = Inches(0.5) + col * Inches(6.3)
    cy = Inches(1.4) + row * Inches(2.8)
    add_card(slide, cx, cy, Inches(6.0), Inches(2.5), title, items, accent_color=color, item_size=14)


# ════════════════════════════════════════════════════════════════
# SLIDE 29 — Conclusion + Thank You
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
bg = slide.background; fill = bg.fill; fill.solid(); fill.fore_color.rgb = NEAR_BLACK

# Top band
band = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_WIDTH, Inches(0.15))
band.fill.solid(); band.fill.fore_color.rgb = TEAL; band.line.fill.background(); band.shadow.inherit = False

# Side accent
shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(2.0), Inches(0.15), Inches(3.5))
shape.fill.solid(); shape.fill.fore_color.rgb = GOLD; shape.line.fill.background(); shape.shadow.inherit = False

add_text_box(slide, Inches(1), Inches(1.0), Inches(11.3), Inches(0.7),
             "Conclusion", font_size=40, font_color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)

# Main message
points = [
    "✓  Predicts health risks BEFORE they become emergencies",
    "✓  Personalizes nutrition for each resident's unique needs",
    "✓  Connects families with real-time updates and transparency",
    "✓  Empowers caregivers with AI-assisted tools",
    "✓  Gives management full visibility and control",
]
for i, point in enumerate(points):
    add_text_box(slide, Inches(2.5), Inches(2.0) + i * Inches(0.55), Inches(8.3), Inches(0.5),
                 point, font_size=18, font_color=LIGHT_TEAL, alignment=PP_ALIGN.LEFT)

# Divider
div = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.5), Inches(4.9), Inches(4.3), Inches(0.04))
div.fill.solid(); div.fill.fore_color.rgb = GOLD; div.line.fill.background(); div.shadow.inherit = False

add_text_box(slide, Inches(1), Inches(5.1), Inches(11.3), Inches(0.8),
             "Thank You!", font_size=48, font_color=GOLD, bold=True, alignment=PP_ALIGN.CENTER)

add_text_box(slide, Inches(1), Inches(5.9), Inches(11.3), Inches(0.5),
             "Questions & Answers", font_size=22, font_color=MED_GRAY, alignment=PP_ALIGN.CENTER)

# Team members row
members_text = "Anton Farid  •  Haidy Medhat  •  Maryam Elghazaly  •  Abdelrhman Reda  •  Mahmoud Mohammed  •  Abdallah Essam"
add_text_box(slide, Inches(1), Inches(6.5), Inches(11.3), Inches(0.4),
             members_text, font_size=14, font_color=TEAL, bold=True, alignment=PP_ALIGN.CENTER)

# Bottom band
band2 = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(7.1), SLIDE_WIDTH, Inches(0.4))
band2.fill.solid(); band2.fill.fore_color.rgb = TEAL; band2.line.fill.background(); band2.shadow.inherit = False
add_text_box(slide, Inches(5), Inches(7.12), Inches(3.3), Inches(0.35),
             "Sanad — Smart Elderly Care", font_size=10, font_color=WHITE, alignment=PP_ALIGN.CENTER)


# ════════════════════════════════════════════════════════════════
# Save
# ════════════════════════════════════════════════════════════════
output_path = os.path.join(os.path.dirname(__file__), "Sanad_Graduation_Presentation.pptx")
prs.save(output_path)
print(f"\n[OK] Presentation saved successfully!")
print(f"Location: {output_path}")
print(f"Total slides: {len(prs.slides)}")
