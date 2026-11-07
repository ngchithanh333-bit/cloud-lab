"""Browser CRUD smoke test for the Docker MERN app. Requires: pip install playwright."""
import os
import time
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("LAB_URL", "http://localhost:5173")
PREFIX = "LAB03-TEST-" + str(time.time_ns())


def run():
    with sync_playwright() as p:
        api = p.request.new_context(base_url=BASE)
        browser = None
        original = api.get("/api/students")
        assert original.ok, "Students API unavailable"
        original_ids = {s["_id"] for s in original.json()}
        try:
            browser = p.chromium.launch(channel="msedge", headless=True)
            page = browser.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("dialog", lambda dialog: dialog.accept())
            page.goto(BASE)
            expect(page.get_by_role("heading", name="Quản lý sinh viên")).to_be_visible()
            expect(page.get_by_role("button", name="Thêm sinh viên", exact=True)).to_be_enabled()
            for index in range(3):
                page.get_by_label("MSSV", exact=True).fill(PREFIX + "-" + str(index))
                page.get_by_label("Họ tên", exact=True).fill("Sinh viên kiểm thử " + str(index))
                page.get_by_label("Email", exact=True).fill("lab03-" + str(index) + "@example.com")
                page.get_by_role("button", name="Thêm sinh viên", exact=True).click()
                expect(page.get_by_role("cell", name=PREFIX + "-" + str(index), exact=True)).to_be_visible()
            students = api.get("/api/students").json()
            assert len([s for s in students if s["studentId"].startswith(PREFIX)]) == 3
            print("PASS: 3 students created using React form and retrieved through Docker API.")
            row = page.get_by_role("row").filter(has=page.get_by_role("cell", name=PREFIX + "-0", exact=True))
            row.get_by_role("button", name="Sửa", exact=True).click()
            page.get_by_label("Họ tên", exact=True).fill("Đã cập nhật kiểm thử")
            page.get_by_role("button", name="Lưu thay đổi", exact=True).click()
            expect(row.get_by_role("cell", name="Đã cập nhật kiểm thử", exact=True)).to_be_visible()
            assert next(s for s in api.get("/api/students").json() if s["studentId"] == PREFIX + "-0")["name"] == "Đã cập nhật kiểm thử"
            print("PASS: edit student through React; persisted value verified.")
            row.get_by_role("button", name="Xóa", exact=True).click()
            expect(page.get_by_role("cell", name=PREFIX + "-0", exact=True)).to_have_count(0)
            assert not any(s["studentId"] == PREFIX + "-0" for s in api.get("/api/students").json())
            page.reload()
            expect(page.get_by_role("cell", name=PREFIX + "-1", exact=True)).to_be_visible()
            assert not errors, errors
            print("PASS: delete confirmation, list refresh, page reload; no browser JS errors.")
        finally:
            remaining = api.get("/api/students")
            assert remaining.ok
            for student in remaining.json():
                if student["studentId"].startswith(PREFIX):
                    response = api.delete("/api/students/" + student["_id"])
                    assert response.ok, "Temporary test record cleanup failed"
            final = api.get("/api/students")
            assert final.ok
            assert {s["_id"] for s in final.json()} == original_ids, "Original student list changed"
            if browser:
                browser.close()
            api.dispose()
            print("PASS: test data cleaned; existing student records preserved.")


if __name__ == "__main__":
    run()
