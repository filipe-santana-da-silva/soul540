import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './db';
import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: String, email: String, passwordHash: String,
  isAdmin: Boolean, permissions: [String],
});
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
  await connectDB();
  const count = await UserModel.countDocuments();
  if (count > 0) { console.log('Usuarios ja existem, seed ignorado.'); process.exit(0); }
  const ALL_PERMISSIONS = ['dashboard','eventos','tarefas','funcionarios','contratantes','financeiro','notas-fiscais','contratos','franquias','cardapios','estoque-insumos','estoque-utensilios','chat','usuario'];
  const passwordHash = await bcrypt.hash('123456', 10);
  await UserModel.create({ name: 'Administrador', email: 'admin@soul540.com', passwordHash, isAdmin: true, permissions: ALL_PERMISSIONS });
  console.log('Admin criado: admin@soul540.com / 123456');
  process.exit(0);
}

seed().catch(console.error);
