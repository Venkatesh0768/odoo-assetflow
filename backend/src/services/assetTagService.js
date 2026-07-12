import { query } from '../config/db.js';

/**
 * Asset Tag generation service.
 * Format: AF-XXXX (zero-padded sequence number)
 */
export const AssetTagService = {
  async generate() {
    const { rows } = await query(`SELECT nextval('asset_tag_seq') AS n`);
    return `AF-${String(rows[0].n).padStart(4, '0')}`;
  },

  /** Preview next tag without incrementing sequence */
  async peek() {
    const { rows } = await query(`SELECT last_value + 1 AS n FROM asset_tag_seq`);
    return `AF-${String(rows[0].n).padStart(4, '0')}`;
  },
};
