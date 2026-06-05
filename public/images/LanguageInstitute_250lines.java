import javax.swing.*;import javax.swing.table.*;import java.awt.*;import java.awt.event.*;import java.io.*;import java.sql.*;
public class LanguageInstitute extends JFrame{
Color bg=new Color(15,23,42),fg=Color.white,card=new Color(30,41,59),acc=new Color(99,179,237);
JTextField id=new JTextField(),name=new JTextField(),level=new JTextField(),batch=new JTextField(),fees=new JTextField(),trainer=new JTextField(),contact=new JTextField(),perf=new JTextField();
JComboBox<String> lang=new JComboBox<>(new String[]{"English","French","Russian","Hindi","German","Spanish","Japanese"});
JCheckBox exam=new JCheckBox("Exam");JTextArea rem=new JTextArea();JLabel file=new JLabel("No file");String path="";
DefaultTableModel m=new DefaultTableModel(new String[]{"ID","Name","Lang","Level","Batch","Fees","Trainer","Contact","Perf","Exam","Remarks"},0){public boolean isCellEditable(int r,int c){return false;}};
JTable t=new JTable(m);Connection con;
LanguageInstitute(){
if(!login())System.exit(0);db();
setTitle("Language Institute");setSize(1200,700);setDefaultCloseOperation(3);setLayout(new BorderLayout());getContentPane().setBackground(bg);
JPanel left=new JPanel(new GridLayout(0,1,5,5));left.setBackground(card);
for(JComponent c:new JComponent[]{id,name,lang,level,batch,fees,trainer,contact,perf,exam,new JScrollPane(rem),file})left.add(c);
JButton up=b("Upload"),add=b("Add"),upd=b("Update"),del=b("Delete"),sea=b("Search"),res=b("Reset"),ex=b("Exit");
left.add(up);
add(left,BorderLayout.WEST);
t.setRowHeight(28);add(new JScrollPane(t),BorderLayout.CENTER);
JPanel p=new JPanel();for(JButton x:new JButton[]{add,upd,del,sea,res,ex})p.add(x);add(p,BorderLayout.SOUTH);
up.addActionListener(e->{JFileChooser c=new JFileChooser();if(c.showOpenDialog(this)==0){File f=c.getSelectedFile();path=f.getAbsolutePath();file.setText(f.getName());}});
add.addActionListener(e->addRec());upd.addActionListener(e->updRec());del.addActionListener(e->delRec());sea.addActionListener(e->seaRec());res.addActionListener(e->reset());ex.addActionListener(e->System.exit(0));
t.addMouseListener(new MouseAdapter(){public void mouseClicked(MouseEvent e){int r=t.getSelectedRow();if(r<0)return;id.setText(v(r,0));name.setText(v(r,1));lang.setSelectedItem(v(r,2));level.setText(v(r,3));batch.setText(v(r,4));fees.setText(v(r,5));trainer.setText(v(r,6));contact.setText(v(r,7));perf.setText(v(r,8));exam.setSelected(v(r,9).equals("Yes"));rem.setText(v(r,10));}});
load();setVisible(true);}
String v(int r,int c){return m.getValueAt(r,c).toString();}
JButton b(String s){return new JButton(s);}
void db(){try{Class.forName("com.mysql.cj.jdbc.Driver");con=DriverManager.getConnection("jdbc:mysql://localhost:3306/language_institute","root","");}catch(Exception e){msg(e);}}
void addRec(){try{PreparedStatement p=con.prepareStatement("insert into enrollment values(?,?,?,?,?,?,?,?,?,?,?,?)");set(p);p.executeUpdate();load();reset();msg("Added");}catch(Exception e){msg(e);}}
void updRec(){try{PreparedStatement p=con.prepareStatement("update enrollment set student_name=?,language_selected=?,course_level=?,batch_timing=?,fees_paid=?,trainer_name=?,contact_number=?,performance_status=?,certification_exam=?,remarks=?,profile_path=? where student_id=?");
p.setString(1,name.getText());p.setString(2,lang.getSelectedItem()+"");p.setString(3,level.getText());p.setString(4,batch.getText());p.setDouble(5,d(fees));p.setString(6,trainer.getText());p.setString(7,contact.getText());p.setString(8,perf.getText());p.setString(9,exam.isSelected()?"Yes":"No");p.setString(10,rem.getText());p.setString(11,path);p.setInt(12,Integer.parseInt(id.getText()));p.executeUpdate();load();msg("Updated");}catch(Exception e){msg(e);}}
void delRec(){try{PreparedStatement p=con.prepareStatement("delete from enrollment where student_id=?");p.setInt(1,Integer.parseInt(id.getText()));p.executeUpdate();load();reset();msg("Deleted");}catch(Exception e){msg(e);}}
void seaRec(){try{PreparedStatement p=con.prepareStatement("select * from enrollment where student_id=?");p.setInt(1,Integer.parseInt(id.getText()));ResultSet r=p.executeQuery();if(r.next()){name.setText(r.getString(2));lang.setSelectedItem(r.getString(3));level.setText(r.getString(4));batch.setText(r.getString(5));fees.setText(r.getString(6));trainer.setText(r.getString(7));contact.setText(r.getString(8));perf.setText(r.getString(9));exam.setSelected(r.getString(10).equals("Yes"));rem.setText(r.getString(11));msg("Found");}else msg("Not Found");}catch(Exception e){msg(e);}}
void set(PreparedStatement p)throws Exception{p.setInt(1,Integer.parseInt(id.getText()));p.setString(2,name.getText());p.setString(3,lang.getSelectedItem()+"");p.setString(4,level.getText());p.setString(5,batch.getText());p.setDouble(6,d(fees));p.setString(7,trainer.getText());p.setString(8,contact.getText());p.setString(9,perf.getText());p.setString(10,exam.isSelected()?"Yes":"No");p.setString(11,rem.getText());p.setString(12,path);}
double d(JTextField f){return f.getText().isEmpty()?0:Double.parseDouble(f.getText());}
void load(){try{m.setRowCount(0);ResultSet r=con.createStatement().executeQuery("select * from enrollment");while(r.next())m.addRow(new Object[]{r.getInt(1),r.getString(2),r.getString(3),r.getString(4),r.getString(5),r.getDouble(6),r.getString(7),r.getString(8),r.getString(9),r.getString(10),r.getString(11)});}catch(Exception e){msg(e);}}
void reset(){for(JTextField f:new JTextField[]{id,name,level,batch,fees,trainer,contact,perf})f.setText("");rem.setText("");exam.setSelected(false);lang.setSelectedIndex(0);file.setText("No file");path="";}
boolean login(){JTextField u=new JTextField();JPasswordField p=new JPasswordField();JPanel x=new JPanel(new GridLayout(2,2));x.add(new JLabel("User"));x.add(u);x.add(new JLabel("Pass"));x.add(p);if(JOptionPane.showConfirmDialog(null,x,"Login",2)!=0)return false;return u.getText().equals("admin")&&new String(p.getPassword()).equals("1234");}
void msg(Object o){JOptionPane.showMessageDialog(this,o);}
public static void main(String[]a){SwingUtilities.invokeLater(LanguageInstitute::new);}
}