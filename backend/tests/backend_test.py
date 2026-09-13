"""End-to-end backend tests for the DSB Fast Food API.

Covers: health, catalog (items/updates), OTP auth, orders CRUD & rating,
coupons, admin routes (login, orders, status, sold-out toggle, updates).
"""
import os
import time
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / "frontend/.env")

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL must be set"
API = f"{BASE_URL}/api"
ADMIN_PIN = "dsb2025"

# ------------------------------------------------------------------
# Fixtures
# ------------------------------------------------------------------

@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(f"{API}/admin/login", json={"pin": ADMIN_PIN})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


def _fresh_phone() -> str:
    # 10 digit phone based on timestamp
    return "9" + str(int(time.time() * 1000))[-9:]


@pytest.fixture(scope="session")
def user_creds(api):
    """Create a fresh user session via OTP flow. Waits >30s if cooldown triggers."""
    phone = _fresh_phone()
    r = api.post(f"{API}/otp/send", json={"phone": phone})
    assert r.status_code == 200, r.text
    otp = r.json()["devOtp"]
    r2 = api.post(f"{API}/otp/verify", json={"phone": phone, "otp": otp})
    assert r2.status_code == 200, r2.text
    data = r2.json()
    return {"phone": phone, "token": data["token"], "headers": {"Authorization": f"Bearer {data['token']}", "Content-Type": "application/json"}}


# ------------------------------------------------------------------
# Health & Catalog
# ------------------------------------------------------------------

class TestHealth:
    def test_health(self, api):
        r = api.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_items_nursi_seeded(self, api):
        r = api.get(f"{API}/items", params={"branchId": "nursi"})
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 10, f"expected 10 seeded items, got {len(items)}"
        for it in items:
            assert "soldOut" in it
            assert "name" in it and "price" in it


# ------------------------------------------------------------------
# OTP auth
# ------------------------------------------------------------------

class TestOtp:
    def test_send_returns_devotp_and_cooldown_429(self, api):
        phone = _fresh_phone()
        r = api.post(f"{API}/otp/send", json={"phone": phone})
        assert r.status_code == 200
        assert r.json().get("devOtp") and len(r.json()["devOtp"]) == 6
        r2 = api.post(f"{API}/otp/send", json={"phone": phone})
        assert r2.status_code == 429

    def test_verify_wrong_otp_401(self, api):
        phone = _fresh_phone()
        time.sleep(0.2)
        r = api.post(f"{API}/otp/send", json={"phone": phone})
        assert r.status_code == 200
        r2 = api.post(f"{API}/otp/verify", json={"phone": phone, "otp": "000000"})
        # 000000 is technically valid random possibility; if it happens to match, retry
        assert r2.status_code == 401

    def test_verify_success_then_reuse_401(self, api):
        phone = _fresh_phone()
        r = api.post(f"{API}/otp/send", json={"phone": phone})
        assert r.status_code == 200
        otp = r.json()["devOtp"]
        r2 = api.post(f"{API}/otp/verify", json={"phone": phone, "otp": otp})
        assert r2.status_code == 200
        data = r2.json()
        assert "token" in data and "user" in data
        assert data["user"]["phone"] == phone
        # reuse same OTP
        r3 = api.post(f"{API}/otp/verify", json={"phone": phone, "otp": otp})
        assert r3.status_code == 401


# ------------------------------------------------------------------
# Coupons
# ------------------------------------------------------------------

class TestCoupons:
    def test_valid_lowercase_code(self, api):
        r = api.post(f"{API}/orders/coupon/validate", json={"code": "dsb10"})
        assert r.status_code == 200
        data = r.json()
        assert data["valid"] is True
        assert data["discount"] == 10

    def test_invalid_code(self, api):
        r = api.post(f"{API}/orders/coupon/validate", json={"code": "NOPE"})
        assert r.status_code == 200
        assert r.json()["valid"] is False


# ------------------------------------------------------------------
# Orders (user)
# ------------------------------------------------------------------

def _order_payload(phone: str, branch: str = "nursi") -> dict:
    return {
        "customerName": "TEST_User",
        "phoneNumber": phone,
        "address": "Test address 123",
        "itemsOrdered": [{"name": "Chicken Noodles", "price": 80, "quantity": 2}],
        "totalAmount": 160,
        "couponCode": "",
        "discount": 0,
        "deliveryCharge": 0,
        "paymentMethod": "cod",
        "branchId": branch,
        "branchName": "DSB Fast Food – Nursi",
        "branchAddress": "Nursi",
    }


class TestOrdersUser:
    def test_create_order_no_token_401(self, api, user_creds):
        r = api.post(f"{API}/orders", json=_order_payload(user_creds["phone"]))
        assert r.status_code == 401

    def test_create_order_mismatched_phone_403(self, api, user_creds):
        payload = _order_payload("9000000001")  # not user's phone
        r = api.post(f"{API}/orders", json=payload, headers=user_creds["headers"])
        assert r.status_code == 403

    def test_create_order_inactive_branch_400(self, api, user_creds):
        payload = _order_payload(user_creds["phone"], branch="deglur")
        r = api.post(f"{API}/orders", json=payload, headers=user_creds["headers"])
        assert r.status_code == 400

    def test_create_order_success_and_get(self, api, user_creds):
        payload = _order_payload(user_creds["phone"])
        r = api.post(f"{API}/orders", json=payload, headers=user_creds["headers"])
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert data["orderId"].startswith("DSB-")
        assert data["prepTime"] > 0
        order_id = data["orderId"]

        # GET public order
        g = api.get(f"{API}/orders/{order_id}")
        assert g.status_code == 200
        got = g.json()
        assert got["orderId"] == order_id
        assert got["status"] == "Order Received"
        assert got["customerName"] == "TEST_User"
        pytest.order_id = order_id

    def test_by_phone_own(self, api, user_creds):
        r = api.get(f"{API}/orders/by-phone/{user_creds['phone']}", headers=user_creds["headers"])
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert any(o["phoneNumber"] == user_creds["phone"] for o in r.json())

    def test_by_phone_other_403(self, api, user_creds):
        r = api.get(f"{API}/orders/by-phone/9000000009", headers=user_creds["headers"])
        assert r.status_code == 403


# ------------------------------------------------------------------
# Admin: login, order status, sold-out, updates
# ------------------------------------------------------------------

class TestAdminAuth:
    def test_admin_login_wrong(self, api):
        r = api.post(f"{API}/admin/login", json={"pin": "wrong123"})
        assert r.status_code == 401

    def test_admin_login_ok(self, admin_token):
        assert admin_token and len(admin_token) > 20

    def test_user_token_on_admin_403(self, api, user_creds):
        r = api.get(f"{API}/admin/orders", headers=user_creds["headers"])
        assert r.status_code == 403


class TestAdminOrders:
    def test_summary_and_active(self, api, admin_headers):
        r = api.get(f"{API}/admin/orders/summary", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        for s in ["Order Received", "Preparing", "Ready", "Completed"]:
            assert s in d
        r2 = api.get(f"{API}/admin/orders", params={"status": "active"}, headers=admin_headers)
        assert r2.status_code == 200
        assert isinstance(r2.json(), list)

    def test_status_transitions_and_delivery_confirm(self, api, admin_headers, user_creds):
        # Create a dedicated order for this transition test (works with xdist workers)
        r_new = api.post(f"{API}/orders", json=_order_payload(user_creds["phone"]), headers=user_creds["headers"])
        assert r_new.status_code == 200, r_new.text
        order_id = r_new.json()["orderId"]

        # invalid status -> 400
        r_bad = api.patch(f"{API}/admin/orders/{order_id}/status", json={"status": "Wat"}, headers=admin_headers)
        assert r_bad.status_code == 400

        for status in ["Preparing", "Ready"]:
            r = api.patch(f"{API}/admin/orders/{order_id}/status", json={"status": status}, headers=admin_headers)
            assert r.status_code == 200
            assert r.json()["status"] == status

        # delivery-confirm should work now that Ready
        r_dc = api.patch(f"{API}/orders/{order_id}/delivery-confirm", headers=user_creds["headers"])
        assert r_dc.status_code == 200
        assert r_dc.json()["order"]["status"] == "Completed"

        # rating on completed order
        r_rate = api.patch(f"{API}/orders/{order_id}/rating", json={"rating": 5, "review": "great"}, headers=user_creds["headers"])
        assert r_rate.status_code == 200
        assert r_rate.json()["order"]["rating"] == 5

    def test_delivery_confirm_when_not_ready_400(self, api, admin_headers, user_creds):
        # Make a fresh order and try to confirm delivery immediately
        payload = _order_payload(user_creds["phone"])
        r = api.post(f"{API}/orders", json=payload, headers=user_creds["headers"])
        assert r.status_code == 200
        oid = r.json()["orderId"]
        r_dc = api.patch(f"{API}/orders/{oid}/delivery-confirm", headers=user_creds["headers"])
        assert r_dc.status_code == 400

    def test_rating_when_not_completed_400(self, api, user_creds):
        payload = _order_payload(user_creds["phone"])
        r = api.post(f"{API}/orders", json=payload, headers=user_creds["headers"])
        assert r.status_code == 200
        oid = r.json()["orderId"]
        r_rate = api.patch(f"{API}/orders/{oid}/rating", json={"rating": 4, "review": "x"}, headers=user_creds["headers"])
        assert r_rate.status_code == 400


class TestAdminItems:
    def test_sold_out_toggle_reflects_on_public_items(self, api, admin_headers):
        items = api.get(f"{API}/items", params={"branchId": "nursi"}).json()
        item = items[0]
        item_id = item["_id"]

        r = api.patch(f"{API}/admin/items/{item_id}/sold-out", json={"soldOut": True}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["soldOut"] is True

        refreshed = {i["_id"]: i for i in api.get(f"{API}/items", params={"branchId": "nursi"}).json()}
        assert refreshed[item_id]["soldOut"] is True

        # revert
        r2 = api.patch(f"{API}/admin/items/{item_id}/sold-out", json={"soldOut": False}, headers=admin_headers)
        assert r2.status_code == 200
        assert r2.json()["soldOut"] is False


class TestAdminUpdates:
    def test_create_toggle_delete(self, api, admin_headers):
        payload = {"title": "TEST_Update", "description": "TEST desc", "branchId": None}
        r = api.post(f"{API}/admin/updates", json=payload, headers=admin_headers)
        assert r.status_code == 200
        u = r.json()
        uid = u["id"]

        # visible in /updates?branchId=nursi
        pub = api.get(f"{API}/updates", params={"branchId": "nursi"}).json()
        assert any(x["id"] == uid for x in pub)

        # hide -> not visible
        r_hide = api.patch(f"{API}/admin/updates/{uid}", json={"active": False}, headers=admin_headers)
        assert r_hide.status_code == 200
        pub2 = api.get(f"{API}/updates", params={"branchId": "nursi"}).json()
        assert not any(x["id"] == uid for x in pub2)

        # delete
        r_del = api.delete(f"{API}/admin/updates/{uid}", headers=admin_headers)
        assert r_del.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
