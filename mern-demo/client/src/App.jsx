import { useEffect, useState } from "react";
import "./App.css";

const API = "/api/students";
const emptyForm = { studentId: "", name: "", email: "" };

async function request(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Yêu cầu không thành công");
  return data;
}

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadStudents() {
    setLoading(true);
    try {
      const data = await request(API);
      if (!Array.isArray(data)) throw new Error("Dữ liệu danh sách không hợp lệ");
      setStudents(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    request(API, { signal: controller.signal })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Dữ liệu danh sách không hợp lệ");
        setStudents(data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await request(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setMessage(editingId ? "Đã cập nhật sinh viên." : "Đã thêm sinh viên.");
      resetForm();
      await loadStudents();
    } catch (err) {
      setError(err.message || "Không kết nối được backend");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(student) {
    if (!window.confirm(`Xóa sinh viên ${student.name} (${student.studentId})?`)) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await request(`${API}/${student._id}`, { method: "DELETE" });
      if (editingId === student._id) resetForm();
      setMessage("Đã xóa sinh viên.");
      await loadStudents();
    } catch (err) {
      setError(err.message || "Không kết nối được backend");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="student-app">
      <h1>Quản lý sinh viên</h1>
      <h2>{editingId ? "Chỉnh sửa sinh viên" : "Thêm sinh viên"}</h2>
      <form onSubmit={handleSubmit}>
        <fieldset disabled={busy || loading}>
          {[
            ["studentId", "MSSV", "text"],
            ["name", "Họ tên", "text"],
            ["email", "Email", "email"],
          ].map(([name, label, type]) => (
            <label key={name}>
              {label}
              <input name={name} type={type} value={form[name]} required
                onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
            </label>
          ))}
          <div className="actions">
            <button type="submit">{busy ? "Đang xử lý…" : editingId ? "Lưu thay đổi" : "Thêm sinh viên"}</button>
            {editingId && <button type="button" onClick={resetForm}>Hủy chỉnh sửa</button>}
          </div>
        </fieldset>
      </form>
      {error && <p role="alert" className="error">{error}</p>}
      {message && <p role="status" className="success">{message}</p>}
      <div className="list-heading">
        <h2>Danh sách sinh viên ({students.length})</h2>
        <button disabled={busy || loading} onClick={() => {
          setError("");
          loadStudents().catch(() => setError("Không tải được danh sách. Vui lòng thử lại."));
        }}>Tải lại</button>
      </div>
      {loading && <p role="status">Đang tải danh sách…</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>MSSV</th><th>Họ tên</th><th>Email</th><th>Thao tác</th></tr></thead>
          <tbody>
            {!loading && students.length === 0 && <tr><td colSpan="4">Chưa có sinh viên.</td></tr>}
            {students.map((student) => (
              <tr key={student._id}>
                <td>{student.studentId}</td><td>{student.name}</td><td>{student.email}</td>
                <td className="actions">
                  <button disabled={busy || loading} onClick={() => {
                    setEditingId(student._id);
                    setForm({ studentId: student.studentId, name: student.name, email: student.email });
                    setError("");
                    setMessage("");
                  }}>Sửa</button>
                  <button className="danger" disabled={busy || loading} onClick={() => handleDelete(student)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default App;
