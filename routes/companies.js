const express = require("express");
const slugify = require("slugify");
const ExpressError = require("../expressError");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const companyResult = await db.query(`SELECT * FROM companies WHERE code=$1`, [code]);
    if (companyResult.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }
    const invoiceResult = await db.query("SELECT * FROM invoices WHERE comp_code=$1", [code]);
    return res.json({ company: companyResult.rows[0], invoices: invoiceResult.rows });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const code = slugify(name, { lower: true });
    const result = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description", [code, name, description]);
    return res.status(201).json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const result = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`, [name, description, code]);
    if (result.rows.length === 0) {
      throw new ExpressError(`No company with code: ${code}`, 404);
    }
    return res.json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const result = db.query("DELETE FROM companies WHERE code=$1 RETURNING code", [req.params.code]);
    if (result.rows.length === 0) {
      throw new ExpressError(`Company with code of ${req.params.code} doesn't exist`, 404);
    }
    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
