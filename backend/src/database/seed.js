/**
 * Comprehensive seed for AssetFlow development environment.
 * Run via: npm run db:seed
 */

import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';

(async () => {
  logger.info('Seeding database…');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    /* ── 1. Users ──────────────────────────────────────────────────── */
    const adminPwd    = await bcrypt.hash('Admin@1234', 12);
    const managerPwd  = await bcrypt.hash('Manager@1234', 12);
    const headPwd     = await bcrypt.hash('Head@1234', 12);
    const employeePwd = await bcrypt.hash('Employee@1234', 12);

    const { rows: [admin] } = await client.query(`
      INSERT INTO users (name, email, password, role, employee_id, phone)
      VALUES ('System Admin', 'admin@assetflow.com', $1, 'admin', 'EMP-0001', '+1-555-0100')
      ON CONFLICT (email) DO UPDATE
        SET password = EXCLUDED.password, role = EXCLUDED.role, employee_id = EXCLUDED.employee_id
      RETURNING id
    `, [adminPwd]);

    const { rows: [manager] } = await client.query(`
      INSERT INTO users (name, email, password, role, employee_id, phone)
      VALUES ('Alice Manager', 'alice@assetflow.com', $1, 'asset_manager', 'EMP-0002', '+1-555-0101')
      ON CONFLICT (email) DO UPDATE
        SET password = EXCLUDED.password, role = EXCLUDED.role, employee_id = EXCLUDED.employee_id
      RETURNING id
    `, [managerPwd]);

    const { rows: [deptHead] } = await client.query(`
      INSERT INTO users (name, email, password, role, employee_id, phone)
      VALUES ('Bob Head', 'bob@assetflow.com', $1, 'department_head', 'EMP-0003', '+1-555-0102')
      ON CONFLICT (email) DO UPDATE
        SET password = EXCLUDED.password, role = EXCLUDED.role, employee_id = EXCLUDED.employee_id
      RETURNING id
    `, [headPwd]);

    const { rows: [emp1] } = await client.query(`
      INSERT INTO users (name, email, password, role, employee_id, phone)
      VALUES ('Carol Smith', 'carol@assetflow.com', $1, 'employee', 'EMP-0004', '+1-555-0103')
      ON CONFLICT (email) DO UPDATE
        SET password = EXCLUDED.password, role = EXCLUDED.role, employee_id = EXCLUDED.employee_id
      RETURNING id
    `, [employeePwd]);

    const { rows: [emp2] } = await client.query(`
      INSERT INTO users (name, email, password, role, employee_id, phone)
      VALUES ('Dave Jones', 'dave@assetflow.com', $1, 'employee', 'EMP-0005', '+1-555-0104')
      ON CONFLICT (email) DO UPDATE
        SET password = EXCLUDED.password, role = EXCLUDED.role, employee_id = EXCLUDED.employee_id
      RETURNING id
    `, [employeePwd]);

    logger.info('Seeded: users');

    /* ── 2. Departments ────────────────────────────────────────────── */
    const { rows: [itDept] } = await client.query(`
      INSERT INTO departments (name, description, head_id, status)
      VALUES ('Information Technology', 'Manages all IT infrastructure', $1, 'active')
      ON CONFLICT (name) DO UPDATE SET head_id = EXCLUDED.head_id
      RETURNING id
    `, [deptHead.id]);

    const { rows: [hrDept] } = await client.query(`
      INSERT INTO departments (name, description, status)
      VALUES ('Human Resources', 'Manages people and culture', 'active')
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `);

    const { rows: [finDept] } = await client.query(`
      INSERT INTO departments (name, description, status)
      VALUES ('Finance', 'Manages financial operations', 'active')
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `);

    /* Assign dept head and employees to IT */
    const itId = itDept?.id ?? (await client.query(`SELECT id FROM departments WHERE name='Information Technology'`)).rows[0].id;
    const hrId = hrDept?.id ?? (await client.query(`SELECT id FROM departments WHERE name='Human Resources'`)).rows[0].id;

    await client.query(`UPDATE users SET department_id=$1 WHERE id=$2`, [itId, deptHead.id]);
    await client.query(`UPDATE users SET department_id=$1 WHERE id=$2`, [itId, emp1.id]);
    await client.query(`UPDATE users SET department_id=$1 WHERE id=$2`, [hrId, emp2.id]);
    await client.query(`UPDATE users SET department_id=$1 WHERE id=$2`, [itId, manager.id]);

    logger.info('Seeded: departments');

    /* ── 3. Asset Categories ───────────────────────────────────────── */
    const { rows: [laptopCat] } = await client.query(`
      INSERT INTO asset_categories (name, description, custom_fields, status)
      VALUES ('Laptops', 'Portable computers', '[{"name":"RAM","type":"text"},{"name":"Storage","type":"text"},{"name":"OS","type":"text"}]', 'active')
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `);

    const { rows: [furnitureCat] } = await client.query(`
      INSERT INTO asset_categories (name, description, custom_fields, status)
      VALUES ('Furniture', 'Office furniture and fixtures', '[{"name":"Material","type":"text"},{"name":"Color","type":"text"}]', 'active')
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `);

    const { rows: [vehicleCat] } = await client.query(`
      INSERT INTO asset_categories (name, description, custom_fields, status)
      VALUES ('Vehicles', 'Company-owned vehicles', '[{"name":"Make","type":"text"},{"name":"Model","type":"text"},{"name":"Year","type":"number"},{"name":"Plate","type":"text"}]', 'active')
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `);

    const { rows: [confRoomCat] } = await client.query(`
      INSERT INTO asset_categories (name, description, custom_fields, status)
      VALUES ('Conference Rooms', 'Bookable meeting rooms', '[{"name":"Capacity","type":"number"},{"name":"Floor","type":"text"}]', 'active')
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `);

    logger.info('Seeded: asset_categories');

    const laptopCatId    = laptopCat?.id    ?? (await client.query(`SELECT id FROM asset_categories WHERE name='Laptops'`)).rows[0].id;
    const furnitureCatId = furnitureCat?.id ?? (await client.query(`SELECT id FROM asset_categories WHERE name='Furniture'`)).rows[0].id;
    const vehicleCatId   = vehicleCat?.id   ?? (await client.query(`SELECT id FROM asset_categories WHERE name='Vehicles'`)).rows[0].id;
    const confRoomCatId  = confRoomCat?.id  ?? (await client.query(`SELECT id FROM asset_categories WHERE name='Conference Rooms'`)).rows[0].id;

    /* ── 4. Assets ─────────────────────────────────────────────────── */
    const assetRows = [
      {
        name: 'Dell XPS 15 Laptop', category_id: laptopCatId,
        serial_number: 'SN-DELL-001', acquisition_date: '2023-01-15',
        acquisition_cost: 1800.00, condition: 'excellent', status: 'available',
        location: 'IT Storage Room A', department_id: itId,
        is_bookable: false, created_by: admin.id,
        custom_fields: JSON.stringify({ RAM: '16GB', Storage: '512GB SSD', OS: 'Windows 11' }),
      },
      {
        name: 'MacBook Pro 14"', category_id: laptopCatId,
        serial_number: 'SN-MBP-001', acquisition_date: '2023-03-20',
        acquisition_cost: 2400.00, condition: 'excellent', status: 'available',
        location: 'IT Storage Room A', department_id: itId,
        is_bookable: false, created_by: admin.id,
        custom_fields: JSON.stringify({ RAM: '32GB', Storage: '1TB SSD', OS: 'macOS' }),
      },
      {
        name: 'HP EliteDesk Desktop', category_id: laptopCatId,
        serial_number: 'SN-HP-001', acquisition_date: '2022-11-10',
        acquisition_cost: 1200.00, condition: 'good', status: 'available',
        location: 'HR Office', department_id: hrId,
        is_bookable: false, created_by: admin.id,
        custom_fields: JSON.stringify({ RAM: '8GB', Storage: '256GB SSD', OS: 'Windows 10' }),
      },
      {
        name: 'Executive Office Chair', category_id: furnitureCatId,
        serial_number: 'SN-CHAIR-001', acquisition_date: '2022-06-01',
        acquisition_cost: 450.00, condition: 'good', status: 'available',
        location: 'Conference Room 1', department_id: itId,
        is_bookable: false, created_by: admin.id,
        custom_fields: JSON.stringify({ Material: 'Leather', Color: 'Black' }),
      },
      {
        name: 'Conference Room Alpha', category_id: confRoomCatId,
        serial_number: null, acquisition_date: '2021-01-01',
        acquisition_cost: 0.00, condition: 'excellent', status: 'available',
        location: 'Floor 3, Building A', department_id: itId,
        is_bookable: true, created_by: admin.id,
        custom_fields: JSON.stringify({ Capacity: 12, Floor: '3rd' }),
      },
      {
        name: 'Conference Room Beta', category_id: confRoomCatId,
        serial_number: null, acquisition_date: '2021-01-01',
        acquisition_cost: 0.00, condition: 'good', status: 'available',
        location: 'Floor 2, Building A', department_id: hrId,
        is_bookable: true, created_by: admin.id,
        custom_fields: JSON.stringify({ Capacity: 8, Floor: '2nd' }),
      },
      {
        name: 'Toyota Camry 2022', category_id: vehicleCatId,
        serial_number: 'VIN-TOYOTA-001', acquisition_date: '2022-08-15',
        acquisition_cost: 28000.00, condition: 'good', status: 'available',
        location: 'Parking Lot B', department_id: null,
        is_bookable: false, created_by: admin.id,
        custom_fields: JSON.stringify({ Make: 'Toyota', Model: 'Camry', Year: 2022, Plate: 'ABC-1234' }),
      },
    ];

    const assetIds = [];
    for (const a of assetRows) {
      const seq = (await client.query(`SELECT nextval('asset_tag_seq') AS n`)).rows[0].n;
      const tag = `AF-${String(seq).padStart(4, '0')}`;
      const { rows } = await client.query(`
        INSERT INTO assets
          (asset_tag, name, category_id, serial_number, acquisition_date, acquisition_cost,
           condition, status, location, department_id, is_bookable, created_by, custom_fields)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (asset_tag) DO NOTHING
        RETURNING id
      `, [tag, a.name, a.category_id, a.serial_number, a.acquisition_date, a.acquisition_cost,
          a.condition, a.status, a.location, a.department_id, a.is_bookable, a.created_by, a.custom_fields]);
      if (rows[0]) assetIds.push(rows[0].id);
    }

    logger.info('Seeded: assets');

    /* ── 5. Allocations ────────────────────────────────────────────── */
    if (assetIds.length >= 2) {
      /* Allocate laptop to carol */
      await client.query(`
        INSERT INTO allocations
          (asset_id, allocated_to_user, allocated_by, expected_return_date, status)
        VALUES ($1, $2, $3, $4, 'active')
      `, [assetIds[0], emp1.id, manager.id, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]);

      await client.query(`UPDATE assets SET status='allocated' WHERE id=$1`, [assetIds[0]]);

      logger.info('Seeded: allocations');
    }

    /* ── 6. Bookings ───────────────────────────────────────────────── */
    if (assetIds.length >= 5) {
      const confRoomId = assetIds[4];
      const tomorrow = new Date(Date.now() + 86400000);
      const bookStart = new Date(tomorrow.setHours(9, 0, 0, 0));
      const bookEnd   = new Date(tomorrow.setHours(11, 0, 0, 0));

      await client.query(`
        INSERT INTO bookings
          (asset_id, booked_by, department_id, start_time, end_time, purpose, status)
        VALUES ($1, $2, $3, $4, $5, 'Sprint Planning', 'upcoming')
      `, [confRoomId, emp1.id, itId, bookStart, bookEnd]);

      logger.info('Seeded: bookings');
    }

    /* ── 7. Maintenance Request ────────────────────────────────────── */
    if (assetIds.length >= 3) {
      await client.query(`
        INSERT INTO maintenance_requests
          (asset_id, raised_by, issue_description, priority, status)
        VALUES ($1, $2, 'Screen flickering intermittently, needs inspection', 'high', 'pending')
      `, [assetIds[2], emp2.id]);

      logger.info('Seeded: maintenance_requests');
    }

    /* ── 8. Notifications ──────────────────────────────────────────── */
    await client.query(`
      INSERT INTO notifications (user_id, type, title, message, reference_type, is_read)
      VALUES ($1, 'asset_assigned', 'Asset Assigned to You',
        'A laptop (Dell XPS 15) has been allocated to you.', 'allocation', false)
    `, [emp1.id]);

    logger.info('Seeded: notifications');

    /* ── 9. Activity Logs ──────────────────────────────────────────── */
    await client.query(`
      INSERT INTO activity_logs (user_id, action, entity_type, description, metadata)
      VALUES ($1, 'asset_allocated', 'allocation',
        'Alice Manager allocated Dell XPS 15 Laptop to Carol Smith',
        '{"asset":"Dell XPS 15 Laptop","allocatedTo":"Carol Smith"}')
    `, [manager.id]);

    logger.info('Seeded: activity_logs');

    await client.query('COMMIT');
    logger.info('Database seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Seed failed', { error: err.message, stack: err.stack });
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
