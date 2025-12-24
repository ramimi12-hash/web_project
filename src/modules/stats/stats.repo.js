const { prisma } = require("../common/prisma");

// MySQL DATE / DATE_FORMAT 기반 집계
async function donationsDaily({ from, to }) {
  const whereFrom = from ? from : new Date("1970-01-01");
  const whereTo = to ? to : new Date("2999-12-31");

  // parameterized raw query (SQL injection 방지)
  const rows = await prisma.$queryRaw`
    SELECT DATE(donatedAt) AS day,
           SUM(amount) AS totalAmount,
           COUNT(*) AS donationCount
    FROM Donation
    WHERE donatedAt BETWEEN ${whereFrom} AND ${whereTo}
    GROUP BY DATE(donatedAt)
    ORDER BY day ASC
  `;
  return rows;
}

async function donationsMonthly({ from, to }) {
  const whereFrom = from ? from : new Date("1970-01-01");
  const whereTo = to ? to : new Date("2999-12-31");

  const rows = await prisma.$queryRaw`
    SELECT DATE_FORMAT(donatedAt, '%Y-%m') AS month,
           SUM(amount) AS totalAmount,
           COUNT(*) AS donationCount
    FROM Donation
    WHERE donatedAt BETWEEN ${whereFrom} AND ${whereTo}
    GROUP BY DATE_FORMAT(donatedAt, '%Y-%m')
    ORDER BY month ASC
  `;
  return rows;
}

async function topDonors({ from, to, limit }) {
  const whereFrom = from ? from : new Date("1970-01-01");
  const whereTo = to ? to : new Date("2999-12-31");
  const lim = Number(limit);

  const rows = await prisma.$queryRaw`
    SELECT donorName,
           SUM(amount) AS totalAmount,
           COUNT(*) AS donationCount
    FROM Donation
    WHERE donatedAt BETWEEN ${whereFrom} AND ${whereTo}
    GROUP BY donorName
    ORDER BY totalAmount DESC
    LIMIT ${lim}
  `;
  return rows;
}

module.exports = { donationsDaily, donationsMonthly, topDonors };
