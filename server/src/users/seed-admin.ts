
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User, UserSchema, UserRole } from './schemas/user.schema';

async function seedAdmin() {
  const mongoUri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Administrator';

  if (!mongoUri || !email || !password) {
    throw new Error(
      'MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD must be configured.',
    );
  }

  await mongoose.connect(mongoUri);

  try {
    const UserModel =
      mongoose.models[User.name] ||
      mongoose.model(User.name, UserSchema);

    const existingUser = await UserModel.findOne({ email }).exec();

    if (existingUser) {
      if (existingUser.role === UserRole.ADMIN) {
        console.log('This admin account already exists.');
        return;
      }

      throw new Error(
        'This email already belongs to a non-admin account. No changes were made.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isEmailVerified: true,
      isActive: true,
    });

    console.log(`Admin account created for ${email}.`);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin().catch((error: unknown) => {
  console.error('Admin seeding failed:', error);
  process.exitCode = 1;
});
