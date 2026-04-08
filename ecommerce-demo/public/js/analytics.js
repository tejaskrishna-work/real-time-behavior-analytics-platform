(function () {
  function getOrCreateLocalValue(key, prefix) {
    let value = localStorage.getItem(key);

    if (!value) {
      value = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, value);
    }

    return value;
  }

  const sessionId = getOrCreateLocalValue("demo_session_id", "sess");
  const userId = getOrCreateLocalValue("demo_user_id", "guest");

  async function track(eventName, properties = {}) {
    const payload = {
      eventName,
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      properties
    };

    try {
      const response = await fetch("/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Analytics track failed:", data);
        return;
      }

      console.log("Tracked:", eventName, data);
    } catch (error) {
      console.error("Analytics network error:", error);
    }
  }

  window.Analytics = {
    track,
    sessionId,
    userId
  };
})();