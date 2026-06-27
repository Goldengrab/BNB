import db from "../config/db.js";

/**
 * Register a client profile
 */
export async function registerClient(req, res) {
  try {
    const { name, city, contact, avatar, interest } = req.body;

    const errors = [];
    if (!name || name.trim() === "") errors.push("Full Name is required.");
    if (!city || city.trim() === "") errors.push("City is required.");
    if (!contact || contact.trim() === "") errors.push("Contact value is required.");
    if (!interest || interest.trim() === "") errors.push("Primary Legal Concern is required.");

    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation Failed", details: errors });
    }

    let slugId = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    if (slugId.startsWith("-")) slugId = slugId.substring(1);
    if (slugId.endsWith("-")) slugId = slugId.slice(0, -1);
    if (slugId === "") slugId = "client-" + Math.floor(Math.random() * 1000);

    // Ensure unique ID
    const idCheck = await db.execute({
      sql: "SELECT COUNT(*) as count FROM clients WHERE id = ?",
      args: [slugId]
    });
    let finalId = slugId;
    if (idCheck.rows[0].count > 0) {
      finalId = `${slugId}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await db.execute({
      sql: "INSERT INTO clients (id, name, city, contact, avatar, interest) VALUES (?, ?, ?, ?, ?, ?)",
      args: [finalId, name.trim(), city.trim(), contact.trim(), avatar || null, interest]
    });

    return res.status(201).json({
      message: "Client profile registered successfully.",
      client: {
        id: finalId,
        name: name.trim(),
        city: city.trim(),
        contact: contact.trim(),
        avatar: avatar || null,
        interest
      }
    });
  } catch (error) {
    console.error("Error registering client:", error);
    return res.status(500).json({ error: "Internal Server Error registering client profile." });
  }
}
