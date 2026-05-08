/**
 * 🔍 Diagnostic Tool — Verifica lo stato della connessione API
 * 
 * Usa nel browser console (F12):
 * 1. Copia tutto il contenuto di questo file
 * 2. Incolla nella console del browser
 * 3. Esegui: runDiagnostics()
 */

async function runDiagnostics() {
  console.clear();
  console.log("%c🔍 MARE CALMO - API DIAGNOSTICS", "font-size: 16px; font-weight: bold; color: #2E5C76;");
  console.log("%c═════════════════════════════════════════════════════════════", "color: #2E5C76;");

  const results = {
    checks: [],
    errors: [],
  };

  // 1. Environment Info
  console.log("\n📋 ENVIRONMENT");
  console.log("Browser:", navigator.userAgent.split(" ").slice(-1)[0]);
  console.log("URL:", window.location.href);
  console.log("Protocol:", window.location.protocol);
  console.log("Host:", window.location.host);

  // 2. Check Backend Health
  console.log("\n🔗 BACKEND HEALTH CHECK");
  try {
    console.log("Connecting to http://localhost:8000...");
    const response = await fetch("http://localhost:8000", {
      method: "GET",
    });
    const data = await response.json();
    console.log("✅ Backend is ONLINE");
    console.log("Response:", data);
    results.checks.push({ name: "Backend Health", status: "✅ OK" });
  } catch (error) {
    console.error("❌ Backend is OFFLINE or not reachable");
    console.error("Error:", error.message);
    results.checks.push({ name: "Backend Health", status: `❌ ${error.message}` });
    results.errors.push(error.message);
  }

  // 3. Check API Endpoints
  console.log("\n🔐 API ENDPOINTS CHECK");

  const endpoints = [
    { method: "GET", url: "http://localhost:8000/docs", label: "Swagger Docs" },
    { method: "POST", url: "http://localhost:8000/api/auth/register", label: "Auth Register" },
    { method: "POST", url: "http://localhost:8000/api/auth/login", label: "Auth Login" },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: { "Content-Type": "application/json" },
      });
      console.log(`✅ ${endpoint.label}: ${response.status} ${response.statusText}`);
      results.checks.push({
        name: endpoint.label,
        status: `✅ ${response.status}`,
      });
    } catch (error) {
      console.error(`❌ ${endpoint.label}: ${error.message}`);
      results.checks.push({
        name: endpoint.label,
        status: `❌ ${error.message}`,
      });
    }
  }

  // 4. Check CORS
  console.log("\n🔒 CORS CHECK");
  try {
    const response = await fetch("http://localhost:8000/", {
      method: "OPTIONS",
    });
    const corsHeaders = {
      "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
      "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
      "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
    };
    console.log("CORS Headers:", corsHeaders);
    if (corsHeaders["Access-Control-Allow-Origin"]) {
      console.log("✅ CORS is properly configured");
      results.checks.push({ name: "CORS", status: "✅ OK" });
    } else {
      console.warn("⚠️ CORS headers not found");
      results.checks.push({ name: "CORS", status: "⚠️ Not configured" });
    }
  } catch (error) {
    console.error("❌ CORS check failed:", error.message);
  }

  // 5. Check Local Storage
  console.log("\n💾 LOCAL STORAGE");
  const token = localStorage.getItem("auth_token");
  const user = localStorage.getItem("auth_user");
  console.log("Token stored:", token ? "✅ Yes" : "❌ No");
  console.log("User stored:", user ? "✅ Yes" : "❌ No");
  if (user) {
    console.log("User data:", JSON.parse(user));
  }

  // 6. Summary
  console.log("\n%c═════════════════════════════════════════════════════════════", "color: #2E5C76;");
  console.log("%c📊 SUMMARY", "font-size: 14px; font-weight: bold; color: #2E5C76;");

  results.checks.forEach((check) => {
    console.log(`${check.status} ${check.name}`);
  });

  if (results.errors.length === 0) {
    console.log("\n✅ All checks passed! API should be working.");
  } else {
    console.error("\n❌ Some checks failed. Errors:");
    results.errors.forEach((error, i) => {
      console.error(`${i + 1}. ${error}`);
    });
  }

  // 7. Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  if (results.errors.length > 0) {
    if (results.errors.some((e) => e.includes("fetch"))) {
      console.log("1. Backend might not be running. Start it with:");
      console.log("   cd backend && uvicorn app.main:app --reload --port 8000");
    }
    if (results.errors.some((e) => e.includes("CORS"))) {
      console.log("2. CORS might be blocked. Check backend/app/main.py CORS configuration.");
    }
  } else {
    console.log("✅ Your setup looks good!");
    console.log("Try: ");
    console.log("1. Registering a new account in the app");
    console.log("2. Check browser Network tab for any failed requests");
  }

  console.log("\n%c═════════════════════════════════════════════════════════════", "color: #2E5C76;");

  return results;
}

// Esegui automaticamente
console.log("Running diagnostics...\n");
runDiagnostics().then((results) => {
  console.log("\n✨ Diagnostics complete. Check results above.");
});
