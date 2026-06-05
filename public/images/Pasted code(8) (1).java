import javax.swing.*;
import javax.swing.table.*;

import org.w3c.dom.events.MouseEvent;

import javax.swing.border.*;
import java.awt.*;
import java.awt.event.*;
import java.awt.geom.RoundRectangle2D;
import java.sql.*;
import java.io.File;

public class LanguageInstitute extends JFrame {

    // ─── Palette ────────────────────────────────────────────────
    static final Color C_BG         = new Color(15, 23, 42);       // deep navy bg
    static final Color C_SIDEBAR    = new Color(22, 33, 62);       // sidebar bg
    static final Color C_CARD       = new Color(30, 41, 59);       // card bg
    static final Color C_CARD2      = new Color(37, 52, 74);       // input bg
    static final Color C_BORDER     = new Color(51, 65, 85);       // border
    static final Color C_ACCENT     = new Color(99, 179, 237);     // sky blue
    static final Color C_ACCENT2    = new Color(129, 140, 248);    // indigo
    static final Color C_TEXT       = new Color(241, 245, 249);    // near white
    static final Color C_TEXT_DIM   = new Color(148, 163, 184);    // muted
    static final Color C_GREEN      = new Color(52, 211, 153);     // success
    static final Color C_RED        = new Color(251, 113, 133);    // danger
    static final Color C_YELLOW     = new Color(251, 191, 36);     // warning
    static final Color C_PURPLE     = new Color(167, 139, 250);    // purple
    static final Color C_TEAL       = new Color(45, 212, 191);     // teal
    static final Color C_ROW        = new Color(30, 41, 59);
    static final Color C_ROW_ALT    = new Color(36, 49, 72);
    static final Color C_ROW_SEL    = new Color(56, 89, 138);

    // ─── Fonts ──────────────────────────────────────────────────
    static final Font F_TITLE   = new Font("Segoe UI", Font.BOLD,  18);
    static final Font F_SECTION = new Font("Segoe UI", Font.BOLD,  11);
    static final Font F_LABEL   = new Font("Segoe UI", Font.PLAIN, 12);
    static final Font F_INPUT   = new Font("Segoe UI", Font.PLAIN, 13);
    static final Font F_BTN     = new Font("Segoe UI", Font.BOLD,  12);
    static final Font F_TABLE   = new Font("Segoe UI", Font.PLAIN, 12);
    static final Font F_TH      = new Font("Segoe UI", Font.BOLD,  12);
    static final Font F_BADGE   = new Font("Segoe UI", Font.BOLD,  10);

    // ─── Fields ─────────────────────────────────────────────────
    JTextField txtId, txtName, txtLevel, txtBatch, txtFees,
               txtTrainer, txtContact, txtPerformance;
    JComboBox<String> cmbLanguage;
    JCheckBox chkExam;
    JTextArea txtRemarks;
    JTable table;
    DefaultTableModel model;
    JLabel lblFile, lblCount;
    String profilePath = "";

    JButton btnAdd, btnUpdate, btnDelete,
            btnSearch, btnReset, btnExit, btnUpload;

    Connection con;

    // ────────────────────────────────────────────────────────────
    LanguageInstitute() {

    connectDB();

    if(!showLogin()){
        System.exit(0);
    }

    setTitle("Language Institute — Enrollment System");
        setSize(1400, 800);
        setMinimumSize(new Dimension(1100, 650));
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new BorderLayout(0, 0));
        getContentPane().setBackground(C_BG);

        try { UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName()); }
        catch (Exception ignored) {}

        connectDB();
        buildMenuBar();
        add(buildTopBar(),    BorderLayout.NORTH);
        add(buildSidebar(),   BorderLayout.WEST);
        add(buildMainArea(),  BorderLayout.CENTER);
        add(buildStatusBar(), BorderLayout.SOUTH);

        loadTable();
        setLocationRelativeTo(null);
        setVisible(true);
    }

    // ─── Top Bar ─────────────────────────────────────────────────
    JPanel buildTopBar() {
        JPanel p = new JPanel(new BorderLayout());
        p.setBackground(C_SIDEBAR);
        p.setPreferredSize(new Dimension(0, 60));
        p.setBorder(new MatteBorder(0, 0, 1, 0, C_BORDER));

        // Left: icon + title
        JPanel left = new JPanel(new FlowLayout(FlowLayout.LEFT, 20, 0));
        left.setOpaque(false);
        left.setBorder(new EmptyBorder(10, 0, 0, 0));

        JLabel icon = new JLabel("🎓");
        icon.setFont(new Font("Segoe UI Emoji", Font.PLAIN, 26));

        JPanel titles = new JPanel();
        titles.setLayout(new BoxLayout(titles, BoxLayout.Y_AXIS));
        titles.setOpaque(false);
        JLabel title = new JLabel("Language Institute");
        title.setFont(F_TITLE);
        title.setForeground(C_TEXT);
        JLabel sub = new JLabel("Enrollment Management System");
        sub.setFont(new Font("Segoe UI", Font.PLAIN, 11));
        sub.setForeground(C_TEXT_DIM);
        titles.add(title);
        titles.add(sub);

        left.add(icon);
        left.add(titles);
        p.add(left, BorderLayout.WEST);

        // Right: pill badges
        JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 12, 15));
        right.setOpaque(false);
        right.add(pill("● LIVE", C_GREEN));
        right.add(pill("MySQL Connected", C_ACCENT));
        p.add(right, BorderLayout.EAST);
        return p;
    }

    JLabel pill(String text, Color c) {
        JLabel l = new JLabel(text) {
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(new Color(c.getRed(), c.getGreen(), c.getBlue(), 40));
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), getHeight(), getHeight());
                g2.dispose();
                super.paintComponent(g);
            }
        };
        l.setFont(F_BADGE);
        l.setForeground(c);
        l.setBorder(new EmptyBorder(4, 10, 4, 10));
        l.setOpaque(false);
        return l;
    }

    // ─── Menu Bar ────────────────────────────────────────────────
    void buildMenuBar() {
        JMenuBar bar = new JMenuBar();
        bar.setBackground(C_BG);
        bar.setBorder(null);

        for (String name : new String[]{"File", "Edit", "Help"}) {
            JMenu m = new JMenu(name);
            m.setFont(new Font("Segoe UI", Font.PLAIN, 13));
            m.setForeground(C_TEXT_DIM);
            bar.add(m);
        }
        setJMenuBar(bar);
    }

    // ─── Sidebar: Form ───────────────────────────────────────────
    JScrollPane buildSidebar() {
        JPanel p = new JPanel();
        p.setLayout(new BoxLayout(p, BoxLayout.Y_AXIS));
        p.setBackground(C_SIDEBAR);
        p.setBorder(new EmptyBorder(16, 16, 16, 16));

        txtId          = darkField();
        txtName        = darkField();
        cmbLanguage    = darkCombo(new String[]{"English","French","Russian", "Hindi" ,"German","Spanish","Japanese"});
        txtLevel       = darkField();
        txtBatch       = darkField();
        txtFees        = darkField();
        txtTrainer     = darkField();
        txtContact     = darkField();
        txtPerformance = darkField();

        p.add(sectionLabel("STUDENT INFO", C_ACCENT));
        p.add(vgap(8));
        p.add(fRow("Student ID",       txtId));
        p.add(fRow("Full Name",        txtName));
        p.add(fRow("Language",         cmbLanguage));
        p.add(fRow("Course Level",     txtLevel));
        p.add(fRow("Batch Timing",     txtBatch));
        p.add(fRow("Fees Paid (₹)",    txtFees));

        p.add(vgap(8));
        p.add(sectionLabel("TRAINER & STATUS", C_ACCENT2));
        p.add(vgap(8));
        p.add(fRow("Trainer Name",     txtTrainer));
        p.add(fRow("Contact Number",   txtContact));
        p.add(fRow("Performance",      txtPerformance));

        p.add(vgap(8));
        p.add(sectionLabel("EXTRAS", C_PURPLE));
        p.add(vgap(8));

        chkExam = new JCheckBox("  Certification Exam Enrolled");
        chkExam.setFont(F_INPUT);
        chkExam.setForeground(C_TEXT);
        chkExam.setBackground(C_SIDEBAR);
        chkExam.setFocusPainted(false);
        chkExam.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        chkExam.setAlignmentX(Component.LEFT_ALIGNMENT);
        p.add(chkExam);
        p.add(vgap(10));

        btnUpload = mkBtn("📁  Upload Photo", C_ACCENT, C_BG);
        btnUpload.setAlignmentX(Component.LEFT_ALIGNMENT);
        lblFile = new JLabel("No file selected");
        lblFile.setFont(new Font("Segoe UI", Font.ITALIC, 11));
        lblFile.setForeground(C_TEXT_DIM);
        lblFile.setAlignmentX(Component.LEFT_ALIGNMENT);
        p.add(btnUpload);
        p.add(vgap(4));
        p.add(lblFile);
        p.add(vgap(10));

        p.add(mkLabel("Remarks", C_TEXT_DIM));
        p.add(vgap(4));
        txtRemarks = new JTextArea(4, 1);
        txtRemarks.setFont(F_INPUT);
        txtRemarks.setBackground(C_CARD2);
        txtRemarks.setForeground(C_TEXT);
        txtRemarks.setCaretColor(C_ACCENT);
        txtRemarks.setLineWrap(true);
        txtRemarks.setWrapStyleWord(true);
        txtRemarks.setBorder(new EmptyBorder(8, 10, 8, 10));
        JScrollPane rs = new JScrollPane(txtRemarks);
        rs.setBorder(BorderFactory.createLineBorder(C_BORDER));
        rs.setAlignmentX(Component.LEFT_ALIGNMENT);
        rs.setMaximumSize(new Dimension(Integer.MAX_VALUE, 90));
        p.add(rs);
        p.add(Box.createVerticalGlue());

        btnUpload.addActionListener(e -> {
            JFileChooser ch = new JFileChooser();
            if (ch.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
                File f = ch.getSelectedFile();
                profilePath = f.getAbsolutePath();
                lblFile.setText(f.getName());
                lblFile.setForeground(C_GREEN);
            }
        });

        JScrollPane sp = new JScrollPane(p);
        sp.setBorder(new MatteBorder(0, 0, 0, 1, C_BORDER));
        sp.setHorizontalScrollBarPolicy(ScrollPaneConstants.HORIZONTAL_SCROLLBAR_NEVER);
        sp.setPreferredSize(new Dimension(300, 0));
        sp.setBackground(C_SIDEBAR);
        sp.getVerticalScrollBar().setBackground(C_SIDEBAR);
        sp.getViewport().setBackground(C_SIDEBAR);
        return sp;
    }

    // ─── Main Area: Table + Buttons ──────────────────────────────
    JPanel buildMainArea() {
        JPanel p = new JPanel(new BorderLayout(0, 0));
        p.setBackground(C_BG);

        // ── Table toolbar ──
        JPanel toolbar = new JPanel(new BorderLayout());
        toolbar.setBackground(C_CARD);
        toolbar.setBorder(new EmptyBorder(12, 20, 12, 20));

        JPanel tLeft = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
        tLeft.setOpaque(false);
        JLabel tableTitle = new JLabel("Enrollment Records");
        tableTitle.setFont(new Font("Segoe UI", Font.BOLD, 16));
        tableTitle.setForeground(C_TEXT);
        lblCount = new JLabel(" — 0 students");
        lblCount.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        lblCount.setForeground(C_TEXT_DIM);
        tLeft.add(tableTitle);
        tLeft.add(lblCount);
        toolbar.add(tLeft, BorderLayout.WEST);

        // Column visibility hint
        JLabel hint = new JLabel("Click any row to load into form");
        hint.setFont(new Font("Segoe UI", Font.ITALIC, 11));
        hint.setForeground(C_TEXT_DIM);
        toolbar.add(hint, BorderLayout.EAST);

        p.add(toolbar, BorderLayout.NORTH);

        // ── Table ──
        model = new DefaultTableModel() {
            public boolean isCellEditable(int r, int c) { return false; }
        };
        model.setColumnIdentifiers(new String[]{
            "ID", "Name", "Language", "Level",
            "Batch", "Fees (₹)", "Trainer",
            "Contact", "Performance", "Exam", "Remarks"
        });

        table = new JTable(model);
        table.setFont(F_TABLE);
        table.setRowHeight(30);
        table.setBackground(C_ROW);
        table.setForeground(C_TEXT);
        table.setGridColor(C_BORDER);
        table.setShowVerticalLines(true);
        table.setShowHorizontalLines(true);
        table.setSelectionBackground(C_ROW_SEL);
        table.setSelectionForeground(Color.WHITE);
        table.setFillsViewportHeight(true);
        table.setAutoResizeMode(JTable.AUTO_RESIZE_OFF);
        table.setIntercellSpacing(new Dimension(0, 0));

        // Col widths
        int[] widths = {55, 150, 95, 90, 100, 85, 130, 120, 110, 55, 160};
        for (int i = 0; i < widths.length; i++)
            table.getColumnModel().getColumn(i).setPreferredWidth(widths[i]);

        // Cell renderer
        DefaultTableCellRenderer cellR = new DefaultTableCellRenderer() {
            public Component getTableCellRendererComponent(
                    JTable t, Object v, boolean sel, boolean foc, int r, int c) {
                super.getTableCellRendererComponent(t, v, sel, foc, r, c);
                if (!sel) {
                    setBackground(r % 2 == 0 ? C_ROW : C_ROW_ALT);
                    setForeground(C_TEXT);
                } else {
                    setBackground(C_ROW_SEL);
                    setForeground(Color.WHITE);
                }
                setFont(F_TABLE);
                setBorder(new EmptyBorder(0, 10, 0, 10));
                // Special: Exam column badge color
                if (c == 9 && v != null) {
                    setForeground(v.toString().equals("Yes") ? C_GREEN : C_RED);
                    setFont(F_BTN);
                }
                // Performance column color
                if (c == 8 && v != null) {
                    String s = v.toString().toLowerCase();
                    if (s.contains("excel") || s.contains("good"))
                        setForeground(C_GREEN);
                    else if (s.contains("poor") || s.contains("fail"))
                        setForeground(C_RED);
                    else
                        setForeground(C_YELLOW);
                }
                return this;
            }
        };
        for (int i = 0; i < model.getColumnCount(); i++)
            table.getColumnModel().getColumn(i).setCellRenderer(cellR);

        // Header
        JTableHeader header = table.getTableHeader();
        header.setFont(F_TH);
        header.setBackground(new Color(15, 23, 42));
        header.setForeground(C_ACCENT);
        header.setPreferredSize(new Dimension(0, 36));
        header.setReorderingAllowed(false);
        DefaultTableCellRenderer hr = new DefaultTableCellRenderer();
        hr.setBackground(new Color(15, 23, 42));
        hr.setForeground(C_ACCENT);
        hr.setFont(F_TH);
        hr.setBorder(new EmptyBorder(0, 10, 0, 10));
        header.setDefaultRenderer(hr);

        JScrollPane scroll = new JScrollPane(table);
        scroll.setBorder(null);
        scroll.setBackground(C_ROW);
        scroll.getViewport().setBackground(C_ROW);
        scroll.getVerticalScrollBar().setBackground(C_CARD);
        scroll.getHorizontalScrollBar().setBackground(C_CARD);

        p.add(scroll, BorderLayout.CENTER);

        // ── Button bar ──
        p.add(buildButtonBar(), BorderLayout.SOUTH);

        // Row click
        table.addMouseListener(new MouseAdapter() {
            public void mouseClicked(MouseEvent e) {
                int row = table.getSelectedRow();
                if (row < 0) return;
                txtId.setText(model.getValueAt(row, 0).toString());
                txtName.setText(model.getValueAt(row, 1).toString());
                cmbLanguage.setSelectedItem(model.getValueAt(row, 2));
                txtLevel.setText(model.getValueAt(row, 3).toString());
                txtBatch.setText(model.getValueAt(row, 4).toString());
                txtFees.setText(model.getValueAt(row, 5).toString());
                txtTrainer.setText(model.getValueAt(row, 6).toString());
                txtContact.setText(model.getValueAt(row, 7).toString());
                txtPerformance.setText(model.getValueAt(row, 8).toString());
                chkExam.setSelected(model.getValueAt(row, 9).toString().equals("Yes"));
                txtRemarks.setText(model.getValueAt(row, 10).toString());
            }
        });

        return p;
    }

    // ─── Button Bar ──────────────────────────────────────────────
    JPanel buildButtonBar() {
        JPanel wrapper = new JPanel(new BorderLayout());
        wrapper.setBackground(C_CARD);
        wrapper.setBorder(new MatteBorder(1, 0, 0, 0, C_BORDER));

        JPanel bar = new JPanel(new FlowLayout(FlowLayout.CENTER, 8, 12));
        bar.setBackground(C_CARD);

        btnAdd    = mkBtn("＋  Add Student",  C_GREEN,  C_BG);
        btnUpdate = mkBtn("✎  Update",        C_ACCENT, C_BG);
        btnDelete = mkBtn("✕  Delete",        C_RED,    C_BG);
        btnSearch = mkBtn("⌕  Search",        C_YELLOW, C_BG);
        btnReset  = mkBtn("↺  Reset Form",    C_TEXT_DIM, C_BG);
        btnExit   = mkBtn("⏻  Exit",          C_PURPLE, C_BG);

        bar.add(btnAdd); bar.add(btnUpdate); bar.add(btnDelete);
        bar.add(btnSearch); bar.add(btnReset); bar.add(btnExit);

        wrapper.add(bar, BorderLayout.CENTER);

        btnAdd.addActionListener(e -> addRecord());
        btnUpdate.addActionListener(e -> updateRecord());
        btnDelete.addActionListener(e -> deleteRecord());
        btnSearch.addActionListener(e -> searchRecord());
        btnReset.addActionListener(e -> resetFields());
        btnExit.addActionListener(e -> {
            if (JOptionPane.showConfirmDialog(this, "Exit Application?", "Confirm",
                    JOptionPane.YES_NO_OPTION) == JOptionPane.YES_OPTION)
                System.exit(0);
        });
        return wrapper;
    }

    // ─── Status Bar ──────────────────────────────────────────────
    JPanel buildStatusBar() {
        JPanel p = new JPanel(new BorderLayout());
        p.setBackground(new Color(10, 15, 30));
        p.setBorder(new EmptyBorder(4, 16, 4, 16));
        JLabel l = new JLabel("Language Institute Enrollment System  •  Connected to localhost:3306");
        l.setFont(new Font("Segoe UI", Font.PLAIN, 11));
        l.setForeground(C_TEXT_DIM);
        p.add(l, BorderLayout.WEST);
        return p;
    }

    // ─── UI Helpers ──────────────────────────────────────────────
    JTextField darkField() {
        JTextField f = new JTextField() {
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(C_CARD2);
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 6, 6);
                g2.dispose();
                super.paintComponent(g);
            }
        };
        f.setFont(F_INPUT);
        f.setForeground(C_TEXT);
        f.setBackground(C_CARD2);
        f.setCaretColor(C_ACCENT);
        f.setOpaque(false);
        f.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(C_BORDER, 1, true),
            new EmptyBorder(5, 10, 5, 10)));
        f.setPreferredSize(new Dimension(0, 34));
        return f;
    }

    JComboBox<String> darkCombo(String[] items) {
    JComboBox<String> c = new JComboBox<>(items);

    c.setFont(F_INPUT);
    c.setBackground(C_CARD2);
    c.setForeground(C_TEXT);
    c.setOpaque(true);
    c.setFocusable(false);

    // Make selected field dark
    ((JLabel)c.getRenderer()).setOpaque(true);

    c.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(C_BORDER,1,true),
            new EmptyBorder(5,10,5,10)
    ));

    // Arrow button color fix
    c.setUI(new javax.swing.plaf.basic.BasicComboBoxUI() {
        @Override
        protected JButton createArrowButton() {
            JButton b = new JButton("▼");
            b.setBorder(null);
            b.setContentAreaFilled(false);
            b.setForeground(C_TEXT);
            b.setBackground(C_CARD2);
            return b;
        }
    });

    c.setRenderer(new DefaultListCellRenderer() {
        @Override
        public Component getListCellRendererComponent(
                JList<?> list, Object value, int index,
                boolean isSelected, boolean cellHasFocus) {

            JLabel lbl = (JLabel) super.getListCellRendererComponent(
                    list, value, index, isSelected, cellHasFocus);

            lbl.setBackground(isSelected ? C_ROW_SEL : C_CARD2);
            lbl.setForeground(C_TEXT);
            lbl.setFont(F_INPUT);
            lbl.setBorder(new EmptyBorder(4,10,4,10));
            return lbl;
        }
    });

    return c;
}

    JPanel fRow(String labelText, JComponent field) {
        JPanel row = new JPanel(new BorderLayout(0, 4));
        row.setBackground(C_SIDEBAR);
        row.setBorder(new EmptyBorder(0, 0, 10, 0));
        row.setAlignmentX(Component.LEFT_ALIGNMENT);
        row.setMaximumSize(new Dimension(Integer.MAX_VALUE, 64));

        JLabel lbl = new JLabel(labelText);
        lbl.setFont(F_LABEL);
        lbl.setForeground(C_TEXT_DIM);
        row.add(lbl, BorderLayout.NORTH);
        row.add(field, BorderLayout.CENTER);
        return row;
    }

    JPanel sectionLabel(String text, Color color) {
        JPanel p = new JPanel(new BorderLayout());
        p.setBackground(C_SIDEBAR);
        p.setAlignmentX(Component.LEFT_ALIGNMENT);
        p.setMaximumSize(new Dimension(Integer.MAX_VALUE, 28));

        JLabel l = new JLabel(text);
        l.setFont(F_SECTION);
        l.setForeground(color);
        l.setBorder(new EmptyBorder(0, 0, 6, 0));

        JSeparator sep = new JSeparator();
        sep.setForeground(C_BORDER);
        sep.setBackground(C_BORDER);

        p.add(l, BorderLayout.NORTH);
        p.add(sep, BorderLayout.SOUTH);
        return p;
    }

    JLabel mkLabel(String t, Color c) {
        JLabel l = new JLabel(t);
        l.setFont(F_LABEL);
        l.setForeground(c);
        l.setAlignmentX(Component.LEFT_ALIGNMENT);
        return l;
    }

    Component vgap(int h) { return Box.createVerticalStrut(h); }

    JButton mkBtn(String text, Color bg, Color fg) {
        JButton b = new JButton(text) {
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                Color base = bg;
                if (getModel().isPressed())       base = bg.darker().darker();
                else if (getModel().isRollover())  base = bg.brighter();
                // translucent fill + colored border
                g2.setColor(new Color(base.getRed(), base.getGreen(), base.getBlue(), 30));
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 8, 8);
                g2.setColor(base);
                g2.setStroke(new BasicStroke(1.5f));
                g2.drawRoundRect(1, 1, getWidth()-2, getHeight()-2, 8, 8);
                g2.dispose();
                super.paintComponent(g);
            }
        };
        b.setFont(F_BTN);
        b.setForeground(bg);          // text same as border color
        b.setBackground(new Color(0,0,0,0));
        b.setOpaque(false);
        b.setContentAreaFilled(false);
        b.setBorderPainted(false);
        b.setFocusPainted(false);
        b.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        b.setPreferredSize(new Dimension(138, 38));
        b.setMargin(new Insets(0,0,0,0));
        return b;
    }

    // ─── DB ──────────────────────────────────────────────────────
    void connectDB() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            con = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/language_institute", "root", "");
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this,
                "Database connection failed:\n" + e.getMessage(),
                "Connection Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    // ─── CRUD ────────────────────────────────────────────────────
    void addRecord() {
        if (txtId.getText().trim().isEmpty() || txtName.getText().trim().isEmpty()) {
            JOptionPane.showMessageDialog(this, "Student ID and Name are required.",
                "Validation Error", JOptionPane.WARNING_MESSAGE); return;
        }
        try {
            PreparedStatement ps = con.prepareStatement(
                "INSERT INTO enrollment VALUES(?,?,?,?,?,?,?,?,?,?,?,?)");
            ps.setInt(1,    Integer.parseInt(txtId.getText().trim()));
            ps.setString(2, txtName.getText().trim());
            ps.setString(3, cmbLanguage.getSelectedItem().toString());
            ps.setString(4, txtLevel.getText().trim());
            ps.setString(5, txtBatch.getText().trim());
            ps.setDouble(6, Double.parseDouble(
                txtFees.getText().trim().isEmpty() ? "0" : txtFees.getText().trim()));
            ps.setString(7, txtTrainer.getText().trim());
            ps.setString(8, txtContact.getText().trim());
            ps.setString(9, txtPerformance.getText().trim());
            ps.setString(10, chkExam.isSelected() ? "Yes" : "No");
            ps.setString(11, txtRemarks.getText().trim());
            ps.setString(12, profilePath);
            ps.executeUpdate();
            JOptionPane.showMessageDialog(this, "Student added successfully!",
                "Success", JOptionPane.INFORMATION_MESSAGE);
            loadTable(); resetFields();
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error: " + e.getMessage(),
                "Add Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    void updateRecord() {
        if (txtId.getText().trim().isEmpty()) {
            JOptionPane.showMessageDialog(this, "Select a record to update.",
                "Validation", JOptionPane.WARNING_MESSAGE); return;
        }
        try {
            PreparedStatement ps = con.prepareStatement(
                "UPDATE enrollment SET student_name=?,language_selected=?," +
                "course_level=?,batch_timing=?,fees_paid=?,trainer_name=?," +
                "contact_number=?,performance_status=?,certification_exam=?," +
                "remarks=?,profile_path=? WHERE student_id=?");
            ps.setString(1, txtName.getText().trim());
            ps.setString(2, cmbLanguage.getSelectedItem().toString());
            ps.setString(3, txtLevel.getText().trim());
            ps.setString(4, txtBatch.getText().trim());
            ps.setDouble(5, Double.parseDouble(
                txtFees.getText().trim().isEmpty() ? "0" : txtFees.getText().trim()));
            ps.setString(6, txtTrainer.getText().trim());
            ps.setString(7, txtContact.getText().trim());
            ps.setString(8, txtPerformance.getText().trim());
            ps.setString(9, chkExam.isSelected() ? "Yes" : "No");
            ps.setString(10, txtRemarks.getText().trim());
            ps.setString(11, profilePath);
            ps.setInt(12, Integer.parseInt(txtId.getText().trim()));
            ps.executeUpdate();
            JOptionPane.showMessageDialog(this, "Record updated.", "Updated",
                JOptionPane.INFORMATION_MESSAGE);
            loadTable();
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error: " + e.getMessage(),
                "Update Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    void deleteRecord() {
        if (txtId.getText().trim().isEmpty()) {
            JOptionPane.showMessageDialog(this, "Select a record to delete.",
                "Validation", JOptionPane.WARNING_MESSAGE); return;
        }
        if (JOptionPane.showConfirmDialog(this,
                "Delete Student ID " + txtId.getText() + "?", "Confirm Delete",
                JOptionPane.YES_NO_OPTION, JOptionPane.WARNING_MESSAGE)
                != JOptionPane.YES_OPTION) return;
        try {
            PreparedStatement ps = con.prepareStatement(
                "DELETE FROM enrollment WHERE student_id=?");
            ps.setInt(1, Integer.parseInt(txtId.getText().trim()));
            ps.executeUpdate();
            JOptionPane.showMessageDialog(this, "Record deleted.", "Deleted",
                JOptionPane.INFORMATION_MESSAGE);
            loadTable(); resetFields();
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error: " + e.getMessage(),
                "Delete Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    void searchRecord() {
        if (txtId.getText().trim().isEmpty()) {
            JOptionPane.showMessageDialog(this, "Enter Student ID to search.",
                "Validation", JOptionPane.WARNING_MESSAGE); return;
        }
        try {
            PreparedStatement ps = con.prepareStatement(
                "SELECT * FROM enrollment WHERE student_id=?");
            ps.setInt(1, Integer.parseInt(txtId.getText().trim()));
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                txtName.setText(rs.getString(2));
                cmbLanguage.setSelectedItem(rs.getString(3));
                txtLevel.setText(rs.getString(4));
                txtBatch.setText(rs.getString(5));
                txtFees.setText(rs.getString(6));
                txtTrainer.setText(rs.getString(7));
                txtContact.setText(rs.getString(8));
                txtPerformance.setText(rs.getString(9));
                chkExam.setSelected(rs.getString(10).equals("Yes"));
                txtRemarks.setText(rs.getString(11));
                // highlight row
                for (int i = 0; i < model.getRowCount(); i++) {
                    if (model.getValueAt(i, 0).toString()
                            .equals(txtId.getText().trim())) {
                        table.setRowSelectionInterval(i, i);
                        table.scrollRectToVisible(table.getCellRect(i, 0, true));
                        break;
                    }
                }
                JOptionPane.showMessageDialog(this,
                    "Record found for ID: " + txtId.getText(),
                    "Found", JOptionPane.INFORMATION_MESSAGE);
            } else {
                JOptionPane.showMessageDialog(this,
                    "No record found for ID: " + txtId.getText(),
                    "Not Found", JOptionPane.WARNING_MESSAGE);
            }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error: " + e.getMessage(),
                "Search Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    void loadTable() {
        try {
            model.setRowCount(0);
            ResultSet rs = con.createStatement()
                .executeQuery("SELECT * FROM enrollment");
            while (rs.next()) {
                model.addRow(new Object[]{
                    rs.getInt(1), rs.getString(2), rs.getString(3),
                    rs.getString(4), rs.getString(5), rs.getDouble(6),
                    rs.getString(7), rs.getString(8), rs.getString(9),
                    rs.getString(10), rs.getString(11)
                    // col 12 (profile path) hidden from table
                });
            }
            if (lblCount != null)
                lblCount.setText(" — " + model.getRowCount() + " student"
                    + (model.getRowCount() == 1 ? "" : "s"));
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error loading data:\n" + e.getMessage(),
                "Load Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    void resetFields() {
        for (JTextField f : new JTextField[]{txtId,txtName,txtLevel,txtBatch,
                txtFees,txtTrainer,txtContact,txtPerformance})
            f.setText("");
        txtRemarks.setText("");
        cmbLanguage.setSelectedIndex(0);
        chkExam.setSelected(false);
        lblFile.setText("No file selected");
        lblFile.setForeground(C_TEXT_DIM);
        profilePath = "";
        table.clearSelection();
        txtId.requestFocus();
    }

    boolean showLogin() {

    JTextField user = new JTextField();
    JPasswordField pass = new JPasswordField();

    JPanel panel = new JPanel(new GridLayout(2,2,10,10));
    panel.add(new JLabel("Username"));
    panel.add(user);
    panel.add(new JLabel("Password"));
    panel.add(pass);

    int result = JOptionPane.showConfirmDialog(
            null,
            panel,
            "Admin Login",
            JOptionPane.OK_CANCEL_OPTION,
            JOptionPane.PLAIN_MESSAGE
    );

    if(result == JOptionPane.OK_OPTION){

        String username = user.getText();
        String password = new String(pass.getPassword());

        if(username.equals("admin") &&
                password.equals("1234")){

            JOptionPane.showMessageDialog(
                    null,
                    "Login Successful"
            );
            return true;

        } else {

            JOptionPane.showMessageDialog(
                    null,
                    "Invalid Username or Password",
                    "Login Failed",
                    JOptionPane.ERROR_MESSAGE
            );
            return false;
        }
    }

    return false;
}

    public static void main(String[] args) {
        SwingUtilities.invokeLater(LanguageInstitute::new);
    }
}