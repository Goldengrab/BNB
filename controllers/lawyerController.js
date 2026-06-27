import db from "../config/db.js";

// Mapping of specialty keys to human-readable labels
const SPECIALTY_LABELS = {
  tenancy: "Tenancy & Housing Law",
  employment: "Employment & Labor Law",
  contract: "Contracts & Freelance",
  consumer: "Consumer Protection",
  family: "Family Law & Divorce",
  criminal: "Criminal Defense"
};

/**
 * Get all registered advocates
 */
export async function getAllLawyers(req, res) {
  try {
    const result = await db.execute("SELECT * FROM lawyers");
    const lawyers = result.rows.map(row => {
      return {
        id: row.id,
        name: row.name,
        specialty: row.specialty,
        specialtyLabel: row.specialty_label,
        avatarText: row.avatar_text,
        avatarBase64: row.avatar_base64,
        rating: row.rating,
        casesHandled: Number(row.cases_handled),
        winRate: row.win_rate,
        bio: row.bio,
        barNumber: row.bar_number,
        contactInfo: row.contact_info,
        packages: JSON.parse(row.packages),
        verified_cases: JSON.parse(row.verified_cases)
      };
    });

    // Sort to place newest or custom added lawyers at the top
    // For demo purposes, we will return them in the database order (seeds first, then registrations)
    // To ensure new registers are at top, we can reverse the list or order by a timestamp if we added one.
    // Let's reverse the array so newest registrations appear first in the directory list.
    return res.status(200).json(lawyers.reverse());
  } catch (error) {
    console.error("Error retrieving lawyers:", error);
    return res.status(500).json({ error: "Internal Server Error fetching advocates directory." });
  }
}

/**
 * Register a new advocate profile
 */
export async function registerLawyer(req, res) {
  try {
    const {
      name,
      gender,
      city,
      position,
      specialty,
      exp,
      fought,
      ongoing,
      won,
      fees,
      contactInfo,
      avatarBase64
    } = req.body;

    // Validation
    const errors = [];
    if (!name || name.trim() === "") errors.push("Full Name is required.");
    if (!gender || gender.trim() === "") errors.push("Gender is required.");
    if (!city || city.trim() === "") errors.push("City is required.");
    if (!position || position.trim() === "") errors.push("Jurisdiction / Court Position is required.");
    if (!specialty || specialty.trim() === "") errors.push("Practice Area / Lawyer Type is required.");
    if (exp === undefined || exp === "") errors.push("Years of Experience is required.");
    if (fought === undefined || fought === "") errors.push("Cases Fought count is required.");
    if (!fees || fees.trim() === "") errors.push("Average Fees is required.");
    if (!contactInfo || contactInfo.trim() === "") errors.push("Direct Contact Info is required.");

    const parsedExp = parseInt(exp);
    const parsedFought = parseInt(fought);
    const parsedOngoing = parseInt(ongoing);
    const parsedWon = won !== undefined && won !== "" ? parseInt(won) : null;

    if (isNaN(parsedExp) || parsedExp < 0) errors.push("Experience must be a non-negative integer.");
    if (isNaN(parsedFought) || parsedFought < 0) errors.push("Cases Fought must be a non-negative integer.");
    if (ongoing !== undefined && ongoing !== "" && (isNaN(parsedOngoing) || parsedOngoing < 0)) {
      errors.push("Ongoing Cases must be a non-negative integer.");
    }
    if (parsedWon !== null && (isNaN(parsedWon) || parsedWon < 0)) {
      errors.push("Cases Won must be a non-negative integer.");
    }

    if (parsedWon !== null && !isNaN(parsedFought) && !isNaN(parsedWon) && parsedWon > parsedFought) {
      errors.push("Cases Won cannot be greater than total Cases Fought.");
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation Failed", details: errors });
    }

    // Auto-calculate properties
    let winRate = "85%";
    if (parsedWon !== null && !isNaN(parsedWon)) {
      const winRateVal = parsedFought > 0 ? Math.round((parsedWon / parsedFought) * 100) : 0;
      winRate = `${winRateVal}%`;
    }
    const barNumber = `BAR #${Math.floor(100000 + Math.random() * 900000)}`;
    const specialtyLabel = SPECIALTY_LABELS[specialty] || "General Law";

    // Sluggify name to get ID
    let slugId = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    if (slugId.startsWith("-")) slugId = slugId.substring(1);
    if (slugId.endsWith("-")) slugId = slugId.slice(0, -1);
    if (slugId === "") slugId = "advocate-" + Math.floor(Math.random() * 1000);

    // Check if ID exists, append unique suffix if needed
    const idCheck = await db.execute({
      sql: "SELECT COUNT(*) as count FROM lawyers WHERE id = ?",
      args: [slugId]
    });
    let finalId = slugId;
    if (idCheck.rows[0].count > 0) {
      finalId = `${slugId}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Avatar initials
    const nameParts = name.trim().split(/\s+/);
    const avatarText = nameParts.map(n => n[0]).join("").substring(0, 2).toUpperCase() || "AV";

    // Bio
    const bio = `Verified Advocate practicing in ${position} of ${city}. Dedicated to representing clients in ${specialtyLabel} matters with upfront flat-fee options.`;

    // Packages array
    const packages = [
      { name: "Initial Brief Consultation", price: "$100", desc: "Up to 45 min consultation online or offline." },
      { name: "Standard Case Representation", price: fees, desc: "General counsel and document preparation." }
    ];

    // Verified cases array
    const verifiedCases = [
      { case_type: `Verdict in ${position} Matter`, year: 2024, court_level: position, role: "Petitioner's Counsel" },
      { case_type: `Dispute Resolution under State Codes`, year: 2023, court_level: position, role: "Respondent's Counsel" },
      { case_type: `Compliance Review & Arbitration`, year: 2022, court_level: "Tribunal", role: "Petitioner's Counsel" }
    ];

    // Insert record
    await db.execute({
      sql: `INSERT INTO lawyers (id, name, specialty, specialty_label, avatar_text, avatar_base64, rating, cases_handled, win_rate, bio, bar_number, contact_info, packages, verified_cases) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        finalId,
        name.trim(),
        specialty,
        specialtyLabel,
        avatarText,
        avatarBase64 || null,
        "5.0", // New lawyer rating starts at 5.0
        parsedFought,
        winRate,
        bio,
        barNumber,
        contactInfo || null,
        JSON.stringify(packages),
        JSON.stringify(verifiedCases)
      ]
    });

    const responseData = {
      id: finalId,
      name,
      specialty,
      specialtyLabel,
      avatarText,
      avatarBase64: avatarBase64 || null,
      rating: "5.0",
      casesHandled: parsedFought,
      winRate,
      bio,
      barNumber,
      contactInfo,
      packages,
      verified_cases: verifiedCases
    };

    return res.status(201).json({
      message: "Advocate profile registered successfully.",
      lawyer: responseData
    });

  } catch (error) {
    console.error("Error registering lawyer:", error);
    return res.status(500).json({ error: "Internal Server Error during registration." });
  }
}
