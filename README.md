Apex//Analyzer - Játékos- és fegyverelemző webalkalmazás

Egyetemi (Mérnökinformatikus szak) szakdolgozati projektem, mely az Apex Legends e-sport videojáték fegyverstatisztikáit, valós idejű DPS kalkulációt, valamint játékoskövetési adatait kezeli. 
Az alkalmazás célja a komplex játékmenet-adatok strukturált tárolása, feldolgozása és vizualizációja. 

Az oldal főbb funkciói: 

- Dinamikus DPS/Mag Damage Calculator: Valós idejű matematikai számítások a fegyverek tűzgyorsasága, alap- és         kritikus sebzései, valamint a tárak méretei alapján.
- Hibrid Adatbázis-Kezelés: Relációs és dokumentum-alapú adatok strukturált, nagyteljesítményűkezelése.
- Real-Time Statisztikai Játékoskövetés: API-integráció a külső játékos-adatok aszinkron lekérésére és                feldolgozására. 

Technológiai Architektúra (Tech Stack)

Backend & Adatbázis
- Node.js: Skálázható, eseményvezérelt háttérszerver az API végpontok kiszolgálására.
- PostgreSQL:** Helyi adatbázis-motor a fegyveradatok perzisztens tárolására.
- Axios: Aszinkron HTTP-kliens a külső szerverekkel való kommunikációhoz és proxy-kezeléshez.

Frontend
- HTML5 & CSS3 (Flexbox & Grid): Szemantikus struktúra és teljesen egyedi, reszponzív UI kialakítás.
- JavaScript: DOM-manipuláció, aszinkron API hívások (`fetch`), valamint dinamikus kalkulációs logika.

---

Adatbázis Architektúra & Biztonság

Az alkalmazás egy helyi PostgreSQL relációs adatbázisra épül, amely hibrid adatmodellt alkalmaz a fegyverek tulajdonságainak tárolására:

- JSONB Adattípus Alkalmazása:** A fegyverek sebzés-profiljai (`damage`: head, body, leg) és a különböző szintű       tárméretek (`mag_sizes`) strukturált JSONB mezőkben tárolódnak. Ez biztosítja a sémamentes rugalmasságot a          relációs környezeten belül, minimalizálva a bonyolult JOIN műveleteket.
- Paraméterezett Lekérdezések: A backend és az adatbázis közötti kommunikáció során a SQL injekciós (SQL            Injection) támadások elleni védelem érdekében kizárólag parametrizált query-k futnak.
- Környezeti Változók (.env): Az érzékeny adatok (adatbázis-hitelesítés, portok) el vannak zárva a forráskódtól a     biztonságos deployment érdekében.

  Futtatás: https://apex-legends-analyzer-1.onrender.com

  Függőségek telepítése: npm install
  .env fájl beállítása az adatbázis-hitelesítési adatokkal
  Szerver indítása: node server.js

  <img width="1920" height="1243" alt="Képernyőfotó 2026-07-06 - 11 31 56" src="https://github.com/user-attachments/assets/811e10b7-7303-4672-8d05-86ab42c7175f" />
<img width="1920" height="1243" alt="Képernyőfotó 2026-07-06 - 11 31 36" src="https://github.com/user-attachments/assets/f66eea13-87d7-41a4-a690-8339198c8d18" />
<img width="1920" height="1243" alt="Képernyőfotó 2026-07-06 - 11 31 29" src="https://github.com/user-attachments/assets/9c5c65b1-8df9-498b-afc7-b27e6422ee7c" />
