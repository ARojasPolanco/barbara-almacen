import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sequelize } from '../../src/config/database.js';
import User from '../../src/models/User.js';

const VENDOR_PASSWORD = process.env.VENDOR_PASSWORD || 'mostrador123';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'barbara123';

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const vendorHash = await bcrypt.hash(VENDOR_PASSWORD, 10);
    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await sequelize.sync();

    const [, createdVendor] = await User.findOrCreate({
      where: { username: 'mostrador' },
      defaults: {
        username: 'mostrador',
        passwordHash: vendorHash,
        role: 'vendedor',
      },
    });

    const [, createdAdmin] = await User.findOrCreate({
      where: { username: 'barbara' },
      defaults: {
        username: 'barbara',
        passwordHash: adminHash,
        role: 'administrador',
      },
    });

    console.log(`Vendedor (mostrador): ${createdVendor ? 'created' : 'already exists'}`);
    console.log(`Admin (barbara): ${createdAdmin ? 'created' : 'already exists'}`);

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
