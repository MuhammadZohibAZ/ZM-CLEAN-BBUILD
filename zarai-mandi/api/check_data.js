import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ host: 'localhost', port: 5432, database: 'zarai_mandi', user: 'postgres', password: 'admin' });

async function run() {
  // 1. Check Popcorn
  const popcorn = await pool.query(
    "SELECT id, division, by_product, record_count, has_data FROM by_products WHERE LOWER(by_product) LIKE $1",
    ['%popcorn%']
  );
  console.log("=== POPCORN ===");
  console.log(JSON.stringify(popcorn.rows, null, 2));

  // 2. Check total record count vs by_products table
  const totalRecs = await pool.query("SELECT COUNT(*) as total FROM price_records");
  console.log("\n=== TOTAL RECORDS ===");
  console.log(JSON.stringify(totalRecs.rows[0]));

  // 3. All by_products with has_data=true but 0 actual records
  const mismatch = await pool.query(`
    SELECT bp.id, bp.division, bp.by_product, bp.record_count, bp.has_data,
           COUNT(pr.id) as actual_count
    FROM by_products bp
    LEFT JOIN price_records pr ON pr.by_product_id = bp.id
    WHERE bp.has_data = true
    GROUP BY bp.id, bp.division, bp.by_product, bp.record_count, bp.has_data
    HAVING COUNT(pr.id) = 0
    ORDER BY bp.division, bp.by_product
    LIMIT 30
  `);
  console.log("\n=== has_data=true BUT 0 ACTUAL RECORDS (first 30) ===");
  console.log(JSON.stringify(mismatch.rows, null, 2));

  // 4. All by_products with has_data=false but >0 actual records
  const mismatch2 = await pool.query(`
    SELECT bp.id, bp.division, bp.by_product, bp.record_count, bp.has_data,
           COUNT(pr.id) as actual_count
    FROM by_products bp
    LEFT JOIN price_records pr ON pr.by_product_id = bp.id
    WHERE bp.has_data = false
    GROUP BY bp.id, bp.division, bp.by_product, bp.record_count, bp.has_data
    HAVING COUNT(pr.id) > 0
    ORDER BY bp.division, bp.by_product
    LIMIT 30
  `);
  console.log("\n=== has_data=false BUT HAS ACTUAL RECORDS (first 30) ===");
  console.log(JSON.stringify(mismatch2.rows, null, 2));

  // 5. Maize by_products with their actual counts
  const maize = await pool.query(`
    SELECT bp.id, bp.division, bp.by_product, bp.record_count, bp.has_data,
           COUNT(pr.id) as actual_count
    FROM by_products bp
    LEFT JOIN price_records pr ON pr.by_product_id = bp.id
    WHERE bp.division = 'Maize'
    GROUP BY bp.id, bp.division, bp.by_product, bp.record_count, bp.has_data
    ORDER BY bp.by_product
  `);
  console.log("\n=== MAIZE BY-PRODUCTS ===");
  console.log(JSON.stringify(maize.rows, null, 2));

  // 6. Wheat by_products with their actual counts
  const wheat = await pool.query(`
    SELECT bp.id, bp.division, bp.by_product, bp.record_count, bp.has_data,
           COUNT(pr.id) as actual_count
    FROM by_products bp
    LEFT JOIN price_records pr ON pr.by_product_id = bp.id
    WHERE bp.division = 'Wheat'
    GROUP BY bp.id, bp.division, bp.by_product, bp.record_count, bp.has_data
    ORDER BY bp.by_product
  `);
  console.log("\n=== WHEAT BY-PRODUCTS ===");
  console.log(JSON.stringify(wheat.rows, null, 2));

  // 7. Summary - all divisions with counts
  const allDivSummary = await pool.query(`
    SELECT bp.division, 
           COUNT(*) as total_byprods, 
           SUM(CASE WHEN bp.has_data = true THEN 1 ELSE 0 END) as has_data_count,
           SUM(COUNT(pr.id)) OVER (PARTITION BY bp.division) / COUNT(*) as avg_records_per_bp,
           SUM(COUNT(pr.id)) OVER (PARTITION BY bp.division) as total_records
    FROM by_products bp
    LEFT JOIN price_records pr ON pr.by_product_id = bp.id
    GROUP BY bp.division, bp.id
    ORDER BY bp.division
  `);

  // Simpler summary
  const divSummary = await pool.query(`
    SELECT bp.division, 
           COUNT(DISTINCT bp.id) as total_byprods, 
           COUNT(pr.id) as total_records,
           SUM(CASE WHEN bp.has_data = true THEN 1 ELSE 0 END) as has_data_true_count
    FROM by_products bp
    LEFT JOIN price_records pr ON pr.by_product_id = bp.id
    GROUP BY bp.division
    ORDER BY bp.division
  `);
  console.log("\n=== ALL DIVISIONS SUMMARY ===");
  console.log(JSON.stringify(divSummary.rows, null, 2));

  await pool.end();
}

run().catch(console.error);
