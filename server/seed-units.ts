import 'dotenv/config';
import { connectDB } from './db';
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const collections = ['events', 'tasks', 'finances', 'employees', 'contractors', 'supplies', 'utensils'];

const UserSchema = new Schema({
  name: String, email: String, passwordHash: String,
  isAdmin: Boolean, permissions: [String],
  unit: { type: String, default: 'main' },
}, { collection: 'users' });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
  await connectDB();
  console.log('✅ Conectado');

  // 1. Migrate existing documents without unit field
  for (const col of collections) {
    const db = mongoose.connection.db!;
    const result = await db.collection(col).updateMany(
      { unit: { $exists: false } },
      { $set: { unit: 'main' } }
    );
    console.log(`${col}: ${result.modifiedCount} documentos atualizados`);
  }

  // 2. Create franchise user if not exists
  const franchiseExists = await User.findOne({ email: 'franquia@soul540.com' });
  if (!franchiseExists) {
    const hash = await bcrypt.hash('franquia123', 10);
    await User.create({
      name: 'Admin Franquia',
      email: 'franquia@soul540.com',
      passwordHash: hash,
      isAdmin: false,
      permissions: [],
      unit: 'franchise',
    });
    console.log('✅ Usuário franquia criado');
  } else {
    console.log('ℹ️ Usuário franquia já existe');
  }

  // 3. Create factory user if not exists
  const factoryExists = await User.findOne({ email: 'fabrica@soul540.com' });
  if (!factoryExists) {
    const hash = await bcrypt.hash('fabrica123', 10);
    await User.create({
      name: 'Admin Fábrica',
      email: 'fabrica@soul540.com',
      passwordHash: hash,
      isAdmin: false,
      permissions: [],
      unit: 'factory',
    });
    console.log('✅ Usuário fábrica criado');
  } else {
    console.log('ℹ️ Usuário fábrica já existe');
  }

  console.log('✅ Migração concluída');
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
