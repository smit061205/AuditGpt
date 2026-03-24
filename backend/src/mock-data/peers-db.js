/**
 * Mock Peer Companies Database
 * Used for industry benchmarking
 */
const peersDb = [
  // IT Services Peers
  {
    id: "infosys",
    name: "Infosys",
    cin: "L85110KA1981PLC013115",
    industry: "IT Services",
    naceCode: "62",
    latestRevenue: 15000000000,
    latestYear: 2009,
    marketCap: 200000000000,
    metrics: {
      debtToEquity: 0.05,
      revenueGrowth: 0.12,
      profitMargin: 0.22,
      operatingCFtoRevenue: 0.2,
      roe: 0.3,
      currentRatio: 2.8,
      assetTurnover: 1.1,
      cfToRevenue: 0.2,
    },
  },
  {
    id: "wipro",
    name: "Wipro",
    cin: "L32102KA1945PLC020800",
    industry: "IT Services",
    naceCode: "62",
    latestRevenue: 12000000000,
    latestYear: 2009,
    marketCap: 150000000000,
    metrics: {
      debtToEquity: 0.08,
      revenueGrowth: 0.1,
      profitMargin: 0.18,
      operatingCFtoRevenue: 0.16,
      roe: 0.25,
      currentRatio: 2.5,
      assetTurnover: 1.0,
      cfToRevenue: 0.16,
    },
  },
  {
    id: "hcltech",
    name: "HCL Technologies",
    cin: "L74140DL1991PLC046369",
    industry: "IT Services",
    naceCode: "62",
    latestRevenue: 10000000000,
    latestYear: 2009,
    marketCap: 120000000000,
    metrics: {
      debtToEquity: 0.12,
      revenueGrowth: 0.14,
      profitMargin: 0.15,
      operatingCFtoRevenue: 0.13,
      roe: 0.22,
      currentRatio: 2.2,
      assetTurnover: 0.9,
      cfToRevenue: 0.13,
    },
  },
  {
    id: "techm",
    name: "Tech Mahindra",
    cin: "L72200MH1986PLC041370",
    industry: "IT Services",
    naceCode: "62",
    latestRevenue: 6000000000,
    latestYear: 2009,
    marketCap: 80000000000,
    metrics: {
      debtToEquity: 0.2,
      revenueGrowth: 0.15,
      profitMargin: 0.12,
      operatingCFtoRevenue: 0.11,
      roe: 0.2,
      currentRatio: 2.0,
      assetTurnover: 0.85,
      cfToRevenue: 0.11,
    },
  },

  // Banking Peers
  {
    id: "hdfc",
    name: "HDFC Bank",
    cin: "L65920MH1994PLC080618",
    industry: "Banking",
    naceCode: "64",
    latestRevenue: 50000000000,
    latestYear: 2009,
    marketCap: 800000000000,
    metrics: {
      debtToEquity: 8.5,
      revenueGrowth: 0.22,
      profitMargin: 0.2,
      operatingCFtoRevenue: 0.18,
      roe: 0.17,
      currentRatio: 0.15,
      assetTurnover: 0.09,
      cfToRevenue: 0.18,
    },
  },
  {
    id: "icici",
    name: "ICICI Bank",
    cin: "L65190GJ1994PLC021012",
    industry: "Banking",
    naceCode: "64",
    latestRevenue: 45000000000,
    latestYear: 2009,
    marketCap: 600000000000,
    metrics: {
      debtToEquity: 7.5,
      revenueGrowth: 0.15,
      profitMargin: 0.18,
      operatingCFtoRevenue: 0.15,
      roe: 0.14,
      currentRatio: 0.12,
      assetTurnover: 0.08,
      cfToRevenue: 0.15,
    },
  },

  // Housing Finance Peers
  {
    id: "lichf",
    name: "LIC Housing Finance",
    cin: "L65922MH1989PLC052257",
    industry: "Housing Finance",
    naceCode: "66",
    latestRevenue: 25000000000,
    latestYear: 2009,
    marketCap: 150000000000,
    metrics: {
      debtToEquity: 9.0,
      revenueGrowth: 0.18,
      profitMargin: 0.2,
      operatingCFtoRevenue: 0.16,
      roe: 0.18,
      currentRatio: 0.08,
      assetTurnover: 0.12,
      cfToRevenue: 0.16,
    },
  },
  {
    id: "canfin",
    name: "Can Fin Homes",
    cin: "L65910KA1987PLC008699",
    industry: "Housing Finance",
    naceCode: "66",
    latestRevenue: 8000000000,
    latestYear: 2009,
    marketCap: 50000000000,
    metrics: {
      debtToEquity: 8.5,
      revenueGrowth: 0.15,
      profitMargin: 0.18,
      operatingCFtoRevenue: 0.14,
      roe: 0.15,
      currentRatio: 0.07,
      assetTurnover: 0.1,
      cfToRevenue: 0.14,
    },
  },

  // Infrastructure Peers
  {
    id: "larsentoubro",
    name: "Larsen & Toubro",
    cin: "L99999MH1946PLC004768",
    industry: "Infrastructure",
    naceCode: "41",
    latestRevenue: 80000000000,
    latestYear: 2009,
    marketCap: 700000000000,
    metrics: {
      debtToEquity: 1.2,
      revenueGrowth: 0.2,
      profitMargin: 0.08,
      operatingCFtoRevenue: 0.07,
      roe: 0.18,
      currentRatio: 1.3,
      assetTurnover: 0.85,
      cfToRevenue: 0.07,
    },
  },
  {
    id: "gmrinfra",
    name: "GMR Infrastructure",
    cin: "L45203KA1996PLC040300",
    industry: "Infrastructure",
    naceCode: "41",
    latestRevenue: 30000000000,
    latestYear: 2009,
    marketCap: 200000000000,
    metrics: {
      debtToEquity: 2.0,
      revenueGrowth: 0.25,
      profitMargin: 0.05,
      operatingCFtoRevenue: 0.05,
      roe: 0.1,
      currentRatio: 1.1,
      assetTurnover: 0.7,
      cfToRevenue: 0.05,
    },
  },
];

/**
 * Get peers by industry (NACE code)
 * @param {string} naceCode
 * @returns {Array}
 */
function getPeersByIndustry(naceCode) {
  return peersDb.filter((p) => p.naceCode === naceCode);
}

/**
 * Get sector name from NACE code
 * @param {string} naceCode
 * @returns {string}
 */
function getSectorName(naceCode) {
  const sectors = {
    62: "IT Services",
    64: "Banking & Financial Services",
    66: "Housing Finance",
    41: "Infrastructure",
  };
  return sectors[naceCode] || "General";
}

module.exports = { peersDb, getPeersByIndustry, getSectorName };
