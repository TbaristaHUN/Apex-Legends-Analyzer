function calculateMetaScore(weapon) {
    let score = 0;

    const bodyDamage = Number(weapon.damage?.body) || 0;
    const rpm = Number(weapon.rpm) || 0;
    const magazine = Number(weapon.mag_sizes?.level3) || 0;
    const weaponClass = String(weapon.class || "").trim();
    const dps = Math.round((bodyDamage * rpm) / 60);

    if (bodyDamage >= 40) {
        score += 3;
    } else if (bodyDamage >= 25) {
        score += 2;
    }

    if (rpm >= 600) {
        score += 3;
    } else if (rpm >= 300) {
        score += 2;
    }

    if (magazine >= 25) {
        score += 2;
    }

    if (dps >= 200) {
        score += 2;
    } else if (dps >= 150) {
        score += 1;
    }

    switch (weaponClass) {
        case "Assault Rifle":
        case "SMG":
        case "Marksman":
            score += 1;
            break;

        case "Shotgun":
        case "LMG":
            score += 0.5;
            break;

        default:
            break;
    }

    score = Math.min(score, 10);
    score = Number(score.toFixed(1));

    let tier;

    if (score >= 9) {
        tier = "S";
    } else if (score >= 7) {
        tier = "A";
    } else if (score >= 5) {
        tier = "B";
    } else {
        tier = "C";
    }

    const filledStars = Math.round(score / 2);

    return {
        score,
        tier,
        stars:
            "★".repeat(filledStars) +
            "☆".repeat(5 - filledStars)
    };
}

module.exports = calculateMetaScore;