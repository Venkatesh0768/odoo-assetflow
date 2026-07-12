/**
 * Comprehensive seed for AssetFlow — enough data to test pagination on every page.
 * Run: npm run db:seed  (from backend/)
 */

import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';

async function q(client, sql, params = []) {
  return client.query(sql, params);
}

(async () => {
  logger.info('Seeding database…');
  const client = await pool.connect();
  try {
    await q(client, 'BEGIN');

    /* ── 1. Users ─────────────────────────────────────────────────── */
    const pw = async (p) => bcrypt.hash(p, 10);
    const users = [
      { name: 'System Admin',     email: 'admin@assetflow.com',   role: 'admin',           eid: 'EMP-0001', pwd: await pw('Admin@1234') },
      { name: 'Alice Manager',    email: 'alice@assetflow.com',   role: 'asset_manager',   eid: 'EMP-0002', pwd: await pw('Manager@1234') },
      { name: 'Bob Head IT',      email: 'bob@assetflow.com',     role: 'department_head', eid: 'EMP-0003', pwd: await pw('Head@1234') },
      { name: 'Carol Smith',      email: 'carol@assetflow.com',   role: 'employee',        eid: 'EMP-0004', pwd: await pw('Employee@1234') },
      { name: 'Dave Jones',       email: 'dave@assetflow.com',    role: 'employee',        eid: 'EMP-0005', pwd: await pw('Employee@1234') },
      { name: 'Eve Wilson',       email: 'eve@assetflow.com',     role: 'employee',        eid: 'EMP-0006', pwd: await pw('Employee@1234') },
      { name: 'Frank Lee',        email: 'frank@assetflow.com',   role: 'employee',        eid: 'EMP-0007', pwd: await pw('Employee@1234') },
      { name: 'Grace Kim',        email: 'grace@assetflow.com',   role: 'employee',        eid: 'EMP-0008', pwd: await pw('Employee@1234') },
      { name: 'Hank Brown',       email: 'hank@assetflow.com',    role: 'department_head', eid: 'EMP-0009', pwd: await pw('Head@1234') },
      { name: 'Ivy Chen',         email: 'ivy@assetflow.com',     role: 'employee',        eid: 'EMP-0010', pwd: await pw('Employee@1234') },
    ];

    const uids = {};
    for (const u of users) {
      const { rows: [row] } = await q(client,
        `INSERT INTO users (name,email,password,role,employee_id,phone,is_active)
         VALUES ($1,$2,$3,$4,$5,$6,true)
         ON CONFLICT(email) DO UPDATE SET password=EXCLUDED.password,role=EXCLUDED.role,employee_id=EXCLUDED.employee_id
         RETURNING id`,
        [u.name, u.email, u.pwd, u.role, u.eid, '+1-555-' + u.eid.slice(-4)]
      );
      uids[u.email] = row.id;
    }
    logger.info('Seeded: users (10)');

    const admin   = uids['admin@assetflow.com'];
    const manager = uids['alice@assetflow.com'];
    const bobHead = uids['bob@assetflow.com'];
    const carol   = uids['carol@assetflow.com'];
    const dave    = uids['dave@assetflow.com'];
    const eve     = uids['eve@assetflow.com'];
    const frank   = uids['frank@assetflow.com'];
    const grace   = uids['grace@assetflow.com'];
    const hank    = uids['hank@assetflow.com'];
    const ivy     = uids['ivy@assetflow.com'];

    /* ── 2. Departments ──────────────────────────────────────────── */
    const depts = [
      { name: 'Information Technology', desc: 'IT infrastructure & support', head: bobHead },
      { name: 'Human Resources',        desc: 'People & culture',            head: hank },
      { name: 'Finance',                desc: 'Financial operations',         head: null },
      { name: 'Operations',             desc: 'Day-to-day operations',        head: null },
      { name: 'Marketing',              desc: 'Brand & growth',               head: null },
    ];
    const dids = {};
    for (const d of depts) {
      const { rows: [row] } = await q(client,
        `INSERT INTO departments(name,description,head_id,status)
         VALUES($1,$2,$3,'active') ON CONFLICT(name) DO UPDATE SET head_id=EXCLUDED.head_id
         RETURNING id`, [d.name, d.desc, d.head]);
      dids[d.name] = row.id;
    }
    // Sub-department to show parent_dept
    const { rows: [itEast] } = await q(client,
      `INSERT INTO departments(name,description,parent_id,status)
       VALUES('IT East Region','Eastern region IT',${dids['Information Technology'] ? `'${dids['Information Technology']}'` : 'NULL'},'active')
       ON CONFLICT(name) DO NOTHING RETURNING id`
    );
    const itEastId = itEast?.id;

    // Assign users to departments
    await q(client, `UPDATE users SET department_id=$1 WHERE id=ANY($2::uuid[])`,
      [dids['Information Technology'], [bobHead, carol, frank, ivy]]);
    await q(client, `UPDATE users SET department_id=$1 WHERE id=ANY($2::uuid[])`,
      [dids['Human Resources'], [hank, dave, eve]]);
    await q(client, `UPDATE users SET department_id=$1 WHERE id=ANY($2::uuid[])`,
      [dids['Finance'], [grace]]);
    await q(client, `UPDATE users SET department_id=$1 WHERE id=$2`,
      [dids['Information Technology'], manager]);

    logger.info('Seeded: departments (5 + 1 sub)');

    /* ── 3. Categories ───────────────────────────────────────────── */
    const cats = [
      { name: 'Laptops',          desc: 'Portable computers',       cf: '[{"label":"RAM","type":"text"},{"label":"Storage","type":"text"},{"label":"OS","type":"text"}]' },
      { name: 'Desktops',         desc: 'Desktop workstations',     cf: '[{"label":"RAM","type":"text"},{"label":"CPU","type":"text"}]' },
      { name: 'Furniture',        desc: 'Office furniture',          cf: '[{"label":"Material","type":"text"},{"label":"Color","type":"text"}]' },
      { name: 'Vehicles',         desc: 'Company vehicles',          cf: '[{"label":"Make","type":"text"},{"label":"Year","type":"number"},{"label":"Plate","type":"text"}]' },
      { name: 'Conference Rooms', desc: 'Bookable meeting rooms',    cf: '[{"label":"Capacity","type":"number"},{"label":"Floor","type":"text"}]' },
      { name: 'AV Equipment',     desc: 'Audio/visual equipment',    cf: '[{"label":"Resolution","type":"text"}]' },
      { name: 'Networking',       desc: 'Switches, routers, APs',   cf: '[]' },
    ];
    const cids = {};
    for (const c of cats) {
      const { rows: [row] } = await q(client,
        `INSERT INTO asset_categories(name,description,custom_fields,status)
         VALUES($1,$2,$3::jsonb,'active') ON CONFLICT(name) DO NOTHING RETURNING id`,
        [c.name, c.desc, c.cf]);
      if (row) cids[c.name] = row.id;
    }
    // Fetch any that already existed
    for (const c of cats) {
      if (!cids[c.name]) {
        const { rows: [r] } = await q(client, `SELECT id FROM asset_categories WHERE name=$1`, [c.name]);
        if (r) cids[c.name] = r.id;
      }
    }
    logger.info('Seeded: categories (7)');

    /* ── 4. Assets (25 assets) ───────────────────────────────────── */
    const assetDefs = [
      { name: 'Dell XPS 15 Laptop',        cat: 'Laptops',          sn: 'SN-DELL-001', cost: 1800, cond: 'excellent', loc: 'IT Storage Room A',   dept: 'Information Technology', bookable: false },
      { name: 'MacBook Pro 14"',            cat: 'Laptops',          sn: 'SN-MBP-001',  cost: 2400, cond: 'excellent', loc: 'IT Storage Room A',   dept: 'Information Technology', bookable: false },
      { name: 'HP EliteDesk Desktop',       cat: 'Desktops',         sn: 'SN-HP-001',   cost: 1200, cond: 'good',      loc: 'HR Office',            dept: 'Human Resources',        bookable: false },
      { name: 'Lenovo ThinkPad X1',         cat: 'Laptops',          sn: 'SN-LEN-001',  cost: 1600, cond: 'good',      loc: 'IT Storage Room B',   dept: 'Information Technology', bookable: false },
      { name: 'Dell Latitude 5520',         cat: 'Laptops',          sn: 'SN-DELL-002', cost: 1100, cond: 'fair',      loc: 'Finance Office',       dept: 'Finance',                bookable: false },
      { name: 'Apple Mac Mini M2',          cat: 'Desktops',         sn: 'SN-MINI-001', cost: 900,  cond: 'excellent', loc: 'Design Studio',        dept: 'Marketing',              bookable: false },
      { name: 'HP ProDesk 600',             cat: 'Desktops',         sn: 'SN-HP-002',   cost: 800,  cond: 'good',      loc: 'Operations Floor',     dept: 'Operations',             bookable: false },
      { name: 'Executive Office Chair',     cat: 'Furniture',        sn: 'SN-CHAIR-001',cost: 450,  cond: 'good',      loc: 'Conference Room 1',    dept: 'Human Resources',        bookable: false },
      { name: 'Standing Desk Pro',          cat: 'Furniture',        sn: 'SN-DESK-001', cost: 750,  cond: 'excellent', loc: 'IT Area',              dept: 'Information Technology', bookable: false },
      { name: 'Ergonomic Task Chair',       cat: 'Furniture',        sn: 'SN-CHAIR-002',cost: 380,  cond: 'good',      loc: 'HR Office',            dept: 'Human Resources',        bookable: false },
      { name: 'Conference Room Alpha',      cat: 'Conference Rooms', sn: null,           cost: 0,    cond: 'excellent', loc: 'Floor 3, Building A',  dept: 'Information Technology', bookable: true },
      { name: 'Conference Room Beta',       cat: 'Conference Rooms', sn: null,           cost: 0,    cond: 'good',      loc: 'Floor 2, Building A',  dept: 'Human Resources',        bookable: true },
      { name: 'Board Room',                 cat: 'Conference Rooms', sn: null,           cost: 0,    cond: 'excellent', loc: 'Floor 5, HQ',          dept: 'Finance',                bookable: true },
      { name: 'Toyota Camry 2022',          cat: 'Vehicles',         sn: 'VIN-TOY-001', cost: 28000,cond: 'good',      loc: 'Parking Lot B',        dept: null,                     bookable: false },
      { name: 'Honda City 2023',            cat: 'Vehicles',         sn: 'VIN-HON-001', cost: 22000,cond: 'excellent', loc: 'Parking Lot A',        dept: null,                     bookable: false },
      { name: 'Projector BenQ MH550',       cat: 'AV Equipment',     sn: 'SN-PROJ-001', cost: 620,  cond: 'good',      loc: 'AV Storage',           dept: 'Operations',             bookable: false },
      { name: 'Sony 4K Display 55"',        cat: 'AV Equipment',     sn: 'SN-TV-001',   cost: 1400, cond: 'excellent', loc: 'Board Room',           dept: 'Finance',                bookable: false },
      { name: 'Cisco Switch 24P',           cat: 'Networking',       sn: 'SN-SW-001',   cost: 900,  cond: 'good',      loc: 'Server Room',          dept: 'Information Technology', bookable: false },
      { name: 'Ubiquiti AP AC Pro',         cat: 'Networking',       sn: 'SN-AP-001',   cost: 220,  cond: 'excellent', loc: 'Floor 2 Ceiling',      dept: 'Information Technology', bookable: false },
      { name: 'Dell Latitude 3420',         cat: 'Laptops',          sn: 'SN-DELL-003', cost: 950,  cond: 'fair',      loc: 'Spare Storage',        dept: 'Operations',             bookable: false },
      { name: 'Canon DSLR EOS R50',         cat: 'AV Equipment',     sn: 'SN-CAM-001',  cost: 1100, cond: 'good',      loc: 'Marketing Office',     dept: 'Marketing',              bookable: false },
      { name: 'Printer HP LaserJet 4003',   cat: 'Desktops',         sn: 'SN-PRNT-001', cost: 550,  cond: 'good',      loc: 'HR Office',            dept: 'Human Resources',        bookable: false },
      { name: 'UPS APC 1500VA',             cat: 'Networking',       sn: 'SN-UPS-001',  cost: 320,  cond: 'good',      loc: 'Server Room',          dept: 'Information Technology', bookable: false },
      { name: 'Seminar Room A',             cat: 'Conference Rooms', sn: null,           cost: 0,    cond: 'good',      loc: 'Floor 1, Annex',       dept: 'Human Resources',        bookable: true },
      { name: 'MacBook Air M2',             cat: 'Laptops',          sn: 'SN-MBA-001',  cost: 1300, cond: 'excellent', loc: 'IT Storage Room A',    dept: 'Information Technology', bookable: false },
    ];

    const assetIds = [];
    for (const a of assetDefs) {
      const { rows: [seqRow] } = await q(client, `SELECT nextval('asset_tag_seq') AS n`);
      const tag = `AF-${String(seqRow.n).padStart(4, '0')}`;
      const deptId = a.dept ? dids[a.dept] ?? null : null;
      const { rows: [row] } = await q(client,
        `INSERT INTO assets(asset_tag,name,category_id,serial_number,acquisition_date,acquisition_cost,
            condition,status,location,department_id,is_bookable,created_by,custom_fields)
         VALUES($1,$2,$3,$4,$5,$6,$7,'available',$8,$9,$10,$11,'{}')
         ON CONFLICT(asset_tag) DO NOTHING RETURNING id`,
        [tag, a.name, cids[a.cat], a.sn,
         new Date(Date.now() - Math.random()*365*24*3600000*2).toISOString().split('T')[0],
         a.cost, a.cond, a.loc, deptId, a.bookable, admin]
      );
      if (row) assetIds.push({ id: row.id, name: a.name, bookable: a.bookable, dept: a.dept });
    }
    logger.info(`Seeded: assets (${assetIds.length})`);

    /* ── 5. Allocations (12 active, 5 returned) ───────────────────── */
    const nonBookable = assetIds.filter(a => !a.bookable);
    const allocTargets = [
      { asset: 0, user: carol,  days: 30 },
      { asset: 1, user: dave,   days: 14 },
      { asset: 3, user: frank,  days: 60 },
      { asset: 4, user: grace,  days: 7  },
      { asset: 5, user: ivy,    days: 45 },
      { asset: 6, user: hank,   days: 20 },
      { asset: 7, user: carol,  days: 90 },
      { asset: 8, user: dave,   days: 30 },
      { asset: 9, user: eve,    days: 15 },
      { asset: 13,user: frank,  days: 180},
      { asset: 14,user: grace,  days: 180},
      { asset: 19,user: ivy,    days: 30 },
    ];
    const returnedTargets = [
      { asset: 20, user: carol },
      { asset: 21, user: dave  },
      { asset: 22, user: frank },
      { asset: 23, user: grace },
    ];

    for (const t of allocTargets) {
      const aObj = nonBookable[t.asset] ?? nonBookable[0];
      if (!aObj) continue;
      await q(client,
        `INSERT INTO allocations(asset_id,allocated_to_user,allocated_by,expected_return_date,status)
         VALUES($1,$2,$3,$4,'active') ON CONFLICT DO NOTHING`,
        [aObj.id, t.user, manager,
         new Date(Date.now() + t.days * 86400000).toISOString().split('T')[0]]);
      await q(client, `UPDATE assets SET status='allocated' WHERE id=$1`, [aObj.id]);
    }

    for (const t of returnedTargets) {
      const aObj = assetIds[t.asset] ?? assetIds[0];
      if (!aObj) continue;
      await q(client,
        `INSERT INTO allocations(asset_id,allocated_to_user,allocated_by,expected_return_date,
             actual_return_date,condition_on_return,return_notes,status)
         VALUES($1,$2,$3,$4,$5,'good','Returned in good condition','returned') ON CONFLICT DO NOTHING`,
        [aObj.id, t.user, manager,
         new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
         new Date(Date.now() - 5  * 86400000).toISOString().split('T')[0]]);
    }
    logger.info('Seeded: allocations (12 active, 4 returned)');

    /* ── 6. Transfer requests (3) ─────────────────────────────────── */
    const allocedAsset = nonBookable[0];
    if (allocedAsset) {
      await q(client,
        `INSERT INTO transfer_requests(asset_id,from_user,to_user,requested_by,reason,status)
         VALUES($1,$2,$3,$4,'Need for remote work','requested') ON CONFLICT DO NOTHING`,
        [allocedAsset.id, carol, dave, carol]);
    }
    const allocedAsset2 = nonBookable[1];
    if (allocedAsset2) {
      await q(client,
        `INSERT INTO transfer_requests(asset_id,from_user,to_user,requested_by,reason,status)
         VALUES($1,$2,$3,$4,'Project relocation','approved') ON CONFLICT DO NOTHING`,
        [allocedAsset2.id, dave, frank, dave]);
      await q(client,
        `INSERT INTO transfer_requests(asset_id,from_user,to_user,requested_by,reason,status)
         VALUES($1,$2,$3,$4,'Temporary reassignment','rejected') ON CONFLICT DO NOTHING`,
        [allocedAsset2.id, frank, grace, frank]);
    }
    logger.info('Seeded: transfer requests (3)');

    /* ── 7. Bookings (8 bookings across 3 rooms) ──────────────────── */
    const bookableIds = assetIds.filter(a => a.bookable).map(a => a.id);
    const now = Date.now();
    const bookingDefs = [
      { asset: 0, user: carol,  hoursFromNow: 2,    dur: 1,   purpose: 'Sprint Planning' },
      { asset: 0, user: dave,   hoursFromNow: 26,   dur: 2,   purpose: 'Architecture Review' },
      { asset: 0, user: frank,  hoursFromNow: 50,   dur: 1.5, purpose: 'Client Demo' },
      { asset: 1, user: grace,  hoursFromNow: 3,    dur: 1,   purpose: 'HR Town Hall' },
      { asset: 1, user: hank,   hoursFromNow: 28,   dur: 2,   purpose: 'Team Retrospective' },
      { asset: 1, user: ivy,    hoursFromNow: 54,   dur: 1,   purpose: 'Onboarding Session' },
      { asset: 2, user: manager,hoursFromNow: 5,    dur: 3,   purpose: 'Board Meeting' },
      { asset: 2, user: admin,  hoursFromNow: -24,  dur: 2,   purpose: 'Quarterly Review' },
    ];

    for (const b of bookingDefs) {
      const assetId = bookableIds[b.asset];
      if (!assetId) continue;
      const start = new Date(now + b.hoursFromNow * 3600000);
      const end   = new Date(now + (b.hoursFromNow + b.dur) * 3600000);
      const status = start < new Date(now) ? 'completed' : 'upcoming';
      await q(client,
        `INSERT INTO bookings(asset_id,booked_by,start_time,end_time,purpose,status)
         VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
        [assetId, b.user, start, end, b.purpose, status]);
    }
    logger.info('Seeded: bookings (8)');

    /* ── 8. Maintenance requests (8 across all statuses) ─────────── */
    const maintenanceDefs = [
      { asset: 16, user: dave,  issue: 'Projector bulb not turning on',         priority: 'high',     status: 'pending' },
      { asset: 17, user: carol, issue: 'Display has dead pixels on left side',  priority: 'medium',   status: 'pending' },
      { asset: 2,  user: eve,   issue: 'AC unit making loud noise',             priority: 'high',     status: 'approved' },
      { asset: 3,  user: frank, issue: 'Keyboard keys sticking intermittently', priority: 'low',      status: 'approved' },
      { asset: 0,  user: grace, issue: 'Screen flickering intermittently',      priority: 'high',     status: 'technician_assigned' },
      { asset: 6,  user: ivy,   issue: 'Printer jam — parts ordered',           priority: 'medium',   status: 'in_progress' },
      { asset: 8,  user: carol, issue: 'Standing desk motor not working',       priority: 'low',      status: 'resolved' },
      { asset: 13, user: dave,  issue: 'AC not cooling below 25°C',             priority: 'critical', status: 'resolved' },
    ];

    for (const m of maintenanceDefs) {
      const aObj = assetIds[m.asset] ?? assetIds[0];
      if (!aObj) continue;
      const techId = m.status === 'technician_assigned' || m.status === 'in_progress' ? manager : null;
      const approvedById = ['approved','technician_assigned','in_progress','resolved'].includes(m.status) ? admin : null;
      const resolvedAt = m.status === 'resolved' ? new Date(Date.now() - 5*86400000) : null;
      await q(client,
        `INSERT INTO maintenance_requests
           (asset_id,raised_by,issue_description,priority,status,approved_by,technician_id,resolved_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
        [aObj.id, m.user, m.issue, m.priority, m.status, approvedById, techId, resolvedAt]);
      if (m.status === 'approved' || m.status === 'technician_assigned' || m.status === 'in_progress') {
        await q(client, `UPDATE assets SET status='under_maintenance' WHERE id=$1`, [aObj.id]);
      }
    }
    logger.info('Seeded: maintenance requests (8)');

    /* ── 9. Audit cycle ──────────────────────────────────────────── */
    const { rows: [audit] } = await q(client,
      `INSERT INTO audit_cycles(title,scope_type,scope_department_id,start_date,end_date,status,created_by,total_assets)
       VALUES('Q3 Engineering Audit','department',$1,
         CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days',
         'active',$2,3)
       ON CONFLICT DO NOTHING RETURNING id`,
      [dids['Information Technology'], admin]);
    if (audit) {
      await q(client, `INSERT INTO audit_auditors(audit_cycle_id,auditor_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [audit.id, bobHead]);
      await q(client, `INSERT INTO audit_auditors(audit_cycle_id,auditor_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [audit.id, carol]);
      // Audit items
      for (let i = 0; i < 3 && i < assetIds.length; i++) {
        const vs = ['verified','missing','damaged'][i];
        await q(client,
          `INSERT INTO audit_items(audit_cycle_id,asset_id,expected_location,verification_status,auditor_id)
           VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
          [audit.id, assetIds[i].id, 'IT Storage Room A', vs, bobHead]);
      }
    }
    logger.info('Seeded: audit cycle + items');

    /* ── 10. Notifications ───────────────────────────────────────── */
    const notifs = [
      { uid: carol,   type: 'allocation',  title: 'Asset Assigned to You',          msg: 'Dell XPS 15 Laptop has been allocated to you.' },
      { uid: dave,    type: 'allocation',  title: 'Asset Assigned to You',          msg: 'MacBook Pro 14" has been allocated to you.' },
      { uid: carol,   type: 'maintenance', title: 'Maintenance Request Approved',   msg: 'Your request for Screen flickering has been approved.' },
      { uid: frank,   type: 'transfer',    title: 'Transfer Approved',              msg: 'Transfer of Lenovo ThinkPad X1 has been approved.' },
      { uid: manager, type: 'alert',       title: 'Overdue Return Alert',           msg: '3 assets are overdue for return.' },
      { uid: admin,   type: 'audit',       title: 'Audit Discrepancy Flagged',      msg: '2 assets flagged in Q3 Engineering Audit.' },
      { uid: grace,   type: 'booking',     title: 'Booking Confirmed',              msg: 'Conference Room Alpha booked for HR Town Hall.' },
      { uid: hank,    type: 'booking',     title: 'Booking Reminder',               msg: 'Your booking for Team Retrospective starts in 30 minutes.' },
    ];
    for (const n of notifs) {
      await q(client,
        `INSERT INTO notifications(user_id,type,title,message,is_read) VALUES($1,$2,$3,$4,false) ON CONFLICT DO NOTHING`,
        [n.uid, n.type, n.title, n.msg]);
    }
    logger.info('Seeded: notifications (8)');

    /* ── 11. Activity Logs ───────────────────────────────────────── */
    const logs = [
      { uid: manager, action: 'asset_allocated',     desc: 'Alice Manager allocated Dell XPS 15 Laptop to Carol Smith' },
      { uid: manager, action: 'asset_allocated',     desc: 'Alice Manager allocated MacBook Pro 14" to Dave Jones' },
      { uid: admin,   action: 'department_created',  desc: 'Department "Information Technology" created' },
      { uid: admin,   action: 'user_role_changed',   desc: 'User "Bob Head IT" role changed from "employee" to "department_head"' },
      { uid: carol,   action: 'maintenance_requested',desc: 'Maintenance requested for Screen flickering intermittently' },
      { uid: admin,   action: 'maintenance_approved', desc: 'Maintenance request for AC unit approved' },
      { uid: carol,   action: 'booking_created',     desc: 'Booking created for Conference Room Alpha — Sprint Planning' },
      { uid: dave,    action: 'transfer_requested',  desc: 'Transfer request for Dell XPS 15 Laptop submitted' },
      { uid: manager, action: 'asset_returned',      desc: 'Asset Dell Latitude 3420 returned from allocation' },
      { uid: admin,   action: 'audit_cycle_created', desc: 'Audit cycle "Q3 Engineering Audit" created' },
    ];
    for (const l of logs) {
      await q(client,
        `INSERT INTO activity_logs(user_id,action,entity_type,description,metadata)
         VALUES($1,$2,'general',$3,'{}') ON CONFLICT DO NOTHING`,
        [l.uid, l.action, l.desc]);
    }
    logger.info('Seeded: activity logs (10)');

    await q(client, 'COMMIT');
    logger.info('✅ Database seeded successfully.');
    logger.info('');
    logger.info('Login credentials:');
    logger.info('  admin@assetflow.com    / Admin@1234');
    logger.info('  alice@assetflow.com    / Manager@1234  (asset_manager)');
    logger.info('  bob@assetflow.com      / Head@1234     (department_head)');
    logger.info('  carol@assetflow.com    / Employee@1234 (employee)');
  } catch (err) {
    await q(client, 'ROLLBACK');
    logger.error('Seed failed', { error: err.message, stack: err.stack });
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
