export function storeSession(session) {
    localStorage.setItem("token", session.token);
    localStorage.setItem("businessSlug", session.slug);
    localStorage.setItem("businessName", session.businessName);
    localStorage.setItem("role", session.role);
    localStorage.setItem(
        "mustChangePassword",
        String(session.mustChangePassword === true)
    );
}

export function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("businessSlug");
    localStorage.removeItem("businessName");
    localStorage.removeItem("role");
    localStorage.removeItem("mustChangePassword");
}
