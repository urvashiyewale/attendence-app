import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "Smart Attendance System — Comprehensive Project & Technical Overview")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)
        self.drawString(54, 32, "Confidential — Attendly Smart Campus Ecosystem")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 44, 558, 44)
        self.restoreState()

def build_pdf(filename="Smart_Attendance_System_Overview.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=55,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()
    
    # Custom palette
    primary_color = colors.HexColor("#1e3a8a")     # Deep Indigo
    accent_color = colors.HexColor("#2563eb")      # Vibrant Blue
    dark_text = colors.HexColor("#0f172a")         # Slate 900
    body_text = colors.HexColor("#334155")         # Slate 700
    border_color = colors.HexColor("#cbd5e1")      # Slate 300

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=accent_color,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'DocH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=accent_color,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=body_text,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=body_text,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=dark_text
    )

    code_style = ParagraphStyle(
        'DocCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1e293b")
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor("#1e40af")
    )

    story = []

    # ==================== PAGE 1 ====================
    story.append(Paragraph("Smart Attendance System", title_style))
    story.append(Paragraph("Next-Gen Dynamic QR & Geofenced Campus Attendance Platform", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_color, spaceBefore=0, spaceAfter=10))

    summary_text = (
        "<b>Executive Summary:</b> The Smart Attendance System is a cloud-native, mobile-first campus application "
        "engineered to permanently eliminate proxy attendance ('buddy punching'), paper sign-in sheets, and manual roll calls. "
        "It combines <b>time-expiring rotating QR codes (HMAC-SHA256)</b>, <b>GPS geofencing (Haversine equation)</b>, and "
        "<b>device fingerprinting</b> to guarantee that only physically present students in the lecture hall can mark their attendance."
    )
    summary_table = Table([[Paragraph(summary_text, callout_style)]], colWidths=[504])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#bfdbfe")),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. The Core Problem vs. The Smart Solution", h1_style))
    story.append(Paragraph(
        "Traditional classroom attendance suffers from three major flaws that compromise institutional integrity:", body_style
    ))
    story.append(Paragraph("• <b>Proxy Attendance (Buddy Punching):</b> Friends mark attendance for absentees using roll calls or static sign-in sheets.", bullet_style))
    story.append(Paragraph("• <b>QR Code Forwarding:</b> In basic digital apps, students photograph the QR code and send it via WhatsApp to friends staying in dorms.", bullet_style))
    story.append(Paragraph("• <b>Classroom Disruption:</b> Manual roll calls consume 10 to 15 minutes of every lecture, wasting thousands of teaching hours per semester.", bullet_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "<b>How Attendly Solves It:</b> With Attendly, taking attendance takes under <b>30 seconds</b> for an entire auditorium. "
        "The professor projects a rotating QR code on screen. Each code is mathematically valid for only <b>10 seconds</b>. "
        "Simultaneously, the student's mobile GPS coordinates are checked against the classroom's coordinates in real time.", body_style
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("2. How the System Works in Real Life (5 Simple Steps)", h1_style))
    flow_steps = [
        ("Step 1: Session Launch", "The Teacher logs in, selects their Course/Class, and starts an Attendance Session. The system captures the teacher's classroom GPS coordinates and sets an allowable radius (e.g., 50 meters)."),
        ("Step 2: Dynamic QR Generation", "The teacher's screen displays a dynamic QR code containing a cryptographically signed HMAC token and timestamp. This QR automatically refreshes every 10 seconds. Screenshots sent to friends expire instantly."),
        ("Step 3: Instant 1-Tap Camera Scan", "The Student opens the app, taps 'Scan QR' (which instantly launches the camera), and scans the code. The mobile browser simultaneously reads the student's high-precision device GPS."),
        ("Step 4: Real-time Cloud Verification", "The server verifies: (1) Is the token authentic and unexpired? (2) Is the student's GPS within the teacher's allowed radius? (3) Has this student already marked? If valid, status is recorded in milliseconds!"),
        ("Step 5: Live Analytics & Class View", "The Teacher's dashboard instantly increments the live head-count. Teachers and admins can view granular attendance records, export CSVs, and audit absences.")
    ]

    flow_table_data = [[Paragraph(f"<b>{title}</b>", ParagraphStyle('BTitle', parent=table_cell_style, fontName='Helvetica-Bold', textColor=accent_color)), 
                        Paragraph(desc, table_cell_style)] for title, desc in flow_steps]
    
    t_flow = Table(flow_table_data, colWidths=[140, 364])
    t_flow.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_flow)

    # Page 1 ends cleanly here
    story.append(PageBreak())

    # ==================== PAGE 2 ====================
    story.append(Paragraph("3. Geolocation & Distance Calculation (How it Works)", h1_style))
    story.append(Paragraph(
        "A critical innovation in Attendly is its resilient <b>Haversine Great-Circle Distance Engine</b>. "
        "Earlier systems showed inaccurate distance errors when devices were side-by-side due to missing coordinate validation. "
        "Here is how precision is guaranteed:", body_style
    ))
    story.append(Paragraph("• <b>High-Accuracy HTML5 Geolocation API:</b> Requests GPS hardware coordinates with <code>enableHighAccuracy: true</code> and a strict 10-second timeout.", bullet_style))
    story.append(Paragraph("• <b>Haversine Trigonometric Formulation:</b> Calculates exact curvature distance in meters between teacher (lat1, lon1) and student (lat2, lon2):", bullet_style))
    
    math_box = (
        "d = 2 * R * arcsin( sqrt( sin^2(delta_lat/2) + cos(lat1) * cos(lat2) * sin^2(delta_lon/2) ) )<br/>"
        "where R = 6,371,000 meters (Earth's radius). Accurately calculates classroom proximity down to 1-2 meters."
    )
    t_math = Table([[Paragraph(math_box, code_style)]], colWidths=[504])
    t_math.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_math)
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "• <b>Real-Time Feedback:</b> If a student scans from outside the allowed radius (e.g., dormitory or cafeteria), "
        "the scanner immediately displays a clear amber warning with exact measured distance vs. allowed boundary.", bullet_style
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("4. Technical Stack & Architecture", h1_style))
    story.append(Paragraph(
        "The system is built on a modern, ultra-fast serverless architecture designed for sub-100ms response times:", body_style
    ))

    tech_data = [
        [Paragraph("Layer", table_header_style), Paragraph("Technology", table_header_style), Paragraph("Role & Key Capability", table_header_style)],
        [Paragraph("Frontend Framework", table_cell_style), Paragraph("Next.js 16 (App Router + Turbopack)", table_cell_style), Paragraph("High performance React Server Components, fast hydration, pre-rendered static routes.", table_cell_style)],
        [Paragraph("Styling & UI", table_cell_style), Paragraph("Tailwind CSS + Lucide Icons", table_cell_style), Paragraph("Glassmorphic modern campus theme, fully responsive for smartphones, tablets, and desktops.", table_cell_style)],
        [Paragraph("Backend / Server", table_cell_style), Paragraph("Next.js Edge / Node.js Route Handlers", table_cell_style), Paragraph("51 optimized REST API routes with zero-cold-start latency and in-memory token hashing.", table_cell_style)],
        [Paragraph("Database", table_cell_style), Paragraph("Supabase (PostgreSQL 15)", table_cell_style), Paragraph("Row-Level Security (RLS), real-time change data capture, automated timestamps and foreign keys.", table_cell_style)],
        [Paragraph("Authentication", table_cell_style), Paragraph("Supabase Auth + NextAuth Tokens", table_cell_style), Paragraph("Role-Based Access Control (Admin, Teacher, Student) with secure HTTP-only session cookies.", table_cell_style)],
        [Paragraph("Camera & QR Engine", table_cell_style), Paragraph("HTML5 QrCode Scanner + QRCode.react", table_cell_style), Paragraph("Instant hardware camera access with automatic fallback to environment-facing camera.", table_cell_style)],
        [Paragraph("Hosting & Cloud", table_cell_style), Paragraph("Vercel Edge Network + AWS Pooler", table_cell_style), Paragraph("Global CDN caching, automatic CI/CD deployment on every Git push, 99.99% uptime.", table_cell_style)]
    ]

    t_tech = Table(tech_data, colWidths=[100, 155, 249])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_tech)

    # Page 2 ends cleanly here
    story.append(PageBreak())

    # ==================== PAGE 3 ====================
    story.append(Paragraph("5. User Roles & Key Features", h1_style))

    roles_data = [
        ("Student Role (/student)", [
            "1-Tap QR Scanner directly accessing device camera with zero delay.",
            "Visual attendance history breakdown (% present, absent, excused).",
            "Course-by-course analytics with warnings for courses near attendance threshold (e.g. < 75%).",
            "GPS proximity checks providing transparent distance feedback."
        ]),
        ("Teacher Role (/teacher)", [
            "One-click Session Creator with customizable expiration and geofence radius.",
            "Dynamic QR Projector with live student scan ticker and real-time head-count.",
            "Granular Class Roster Page showing each student's attendance history and attendance rates.",
            "Manual override capabilities (mark Present/Absent/Late) with justification notes."
        ]),
        ("Admin Role (/admin)", [
            "Complete institutional overview: Total departments, courses, teachers, and enrolled students.",
            "Enrollment management and teacher course assignments.",
            "System audit logging: tracks logins, attendance overrides, and administrative actions.",
            "Comprehensive reporting tools with CSV export for academic records."
        ])
    ]

    for role_name, features in roles_data:
        story.append(Paragraph(role_name, h2_style))
        for feat in features:
            story.append(Paragraph(f"• {feat}", bullet_style))
        story.append(Spacer(1, 2))

    story.append(Spacer(1, 8))
    story.append(Paragraph("6. Ready-to-Use Demo Accounts (Pre-Seeded)", h1_style))
    story.append(Paragraph(
        "All accounts are pre-configured in the Supabase database with unified simple passwords for instant testing:", body_style
    ))

    creds_data = [
        [Paragraph("Role", table_header_style), Paragraph("Email", table_header_style), Paragraph("Password", table_header_style), Paragraph("Primary Screen", table_header_style)],
        [Paragraph("Admin", table_cell_style), Paragraph("admin@attendly.edu", table_cell_style), Paragraph("password123", table_cell_style), Paragraph("/admin (System Dashboard)", table_cell_style)],
        [Paragraph("Teacher", table_cell_style), Paragraph("teacher@attendly.edu", table_cell_style), Paragraph("password123", table_cell_style), Paragraph("/teacher (Session & QR Hub)", table_cell_style)],
        [Paragraph("Student 1", table_cell_style), Paragraph("student@attendly.edu", table_cell_style), Paragraph("password123", table_cell_style), Paragraph("/student (Attendance Scanner)", table_cell_style)],
        [Paragraph("Student 2", table_cell_style), Paragraph("student2@attendly.edu", table_cell_style), Paragraph("password123", table_cell_style), Paragraph("/student (Attendance Scanner)", table_cell_style)],
        [Paragraph("Student 3", table_cell_style), Paragraph("student3@attendly.edu", table_cell_style), Paragraph("password123", table_cell_style), Paragraph("/student (Attendance Scanner)", table_cell_style)]
    ]

    t_creds = Table(creds_data, colWidths=[70, 160, 105, 169])
    t_creds.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('PADDING', (0, 0), (-1, -1), 4.5),
    ]))
    story.append(t_creds)
    story.append(Spacer(1, 10))

    conclusion_text = (
        "<b>Summary for Stakeholders:</b> The Smart Attendance System delivers an airtight, tamper-proof, "
        "and frictionless attendance experience. By replacing traditional call-outs with rotating cryptographic QR tokens "
        "and geofencing, it protects institutional academic compliance while saving valuable teaching hours."
    )
    t_conc = Table([[Paragraph(conclusion_text, callout_style)]], colWidths=[504])
    t_conc.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#bfdbfe")),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_conc)

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully built at: {os.path.abspath(filename)}")

if __name__ == '__main__':
    build_pdf()
