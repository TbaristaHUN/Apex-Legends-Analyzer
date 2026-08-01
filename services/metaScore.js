function calculateMetaScore(weapon){

    let score = 0;

    if (weapon.damage?.body >= 40) {
        score += 3;
    }
    else if (weapon.damage?.body >= 25) {
        score += 2;
    }

    if (weapon.rpm >= 600) {
        score += 3;
    }
    else if (weapon.rpm >= 300) {
        score += 2;
    }

    if (weapon.mag_sizes?.level3 >= 25) {
        score += 2;
    }

    if(score > 10){
        score = 10;
    }


    let tier;

    if(score >= 9){
        tier="S";
    }
    else if(score >=7){
        tier="A";
    }
    else if(score >=5){
        tier="B";
    }
    else{
        tier="C";
    }


    return {

        score: score,

        tier: tier,

        stars:
            "★".repeat(Math.round(score/2))
            +
            "☆".repeat(5-Math.round(score/2))
    };

}

module.exports = calculateMetaScore;