const express = require("express");
const ExpressError = require("../expressError");
const db = require("../db");

const router = express.Router();

// Get all industries
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM industries`);
    return res.json({ industries: results.rows });
  } catch (e) {
    return next(e);
  }
});

// Add a new industry
router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;

    const result = await db.query("INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry", [code, industry]);

    return res.status(201).json({ industry: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// Associate a company with an industry
router.post("/:comp_code", async (req, res, next) => {
  try {
    const { comp_code } = req.params;
    const industry_code = req.body.industry_code;
    if (!req.body.industry_code) throw new ExpressError("Please enter an industry code");

    const companyResult = await db.query("SELECT * FROM companies WHERE code=$1", [comp_code]);
    const industryResult = await db.query("SELECT * FROM industries WHERE code=$1", [industry_code]);
    if (companyResult.rows.length === 0) throw new ExpressError(`No company found with code ${comp_code}`, 404);
    if (industryResult.rows.length === 0) throw new ExpressError(`No industry found with code ${industry_code}`, 404);

    const result = await db.query("INSERT INTO industries_companies (industry_code, comp_code) VALUES ($1, $2) RETURNING *", [industry_code, comp_code]);

    return res.status(201).json({ status: `${industryResult.rows[0].industry} industry added to ${companyResult.rows[0].name}` });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
