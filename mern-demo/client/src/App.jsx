import { useEffect, useState } from "react";

const API = "http://localhost:5000/api/students";

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ studentId: "", name: "", email: "" });
  const [error, setError] = useState("");

  const loadStudents = () => {
    fetch(API)
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Câu 48: cập nhật state khi gõ vào ô input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Câu 49: gửi dữ liệu đến API POST
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Có lỗi xảy ra");
        return;
      }
      setForm({ studentId: "", name: "", email: "" });
      loadStudents();
    } catch (err) {
      setError("Không kết nối được Backend");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Quản lý sinh viên</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          name="studentId"
          placeholder="MSSV"
          value={form.studentId}
          onChange={handleChange}
          required
        />{" "}
        <input
          name="name"
          placeholder="Họ tên"
          value={form.name}
          onChange={handleChange}
          required
        />{" "}
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />{" "}
        <button type="submit">Thêm sinh viên</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>MSSV</th>
            <th>Họ tên</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s._id}>
              <td>{s.studentId}</td>
              <td>{s.name}</td>
              <td>{s.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;