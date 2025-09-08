const bcrypt = require('bcryptjs');
const User = require('../models/user');

const SALT_ROUNDS = 12;

async function register(req, res) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Email o password inválidos' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email ya registrado' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({ email: email.toLowerCase(), passwordHash, name });
    return res.status(201).json({ id: user._id, email: user.email, name: user.name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase(), isActive: true });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    // bloqueo por intentos
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({ error: 'Cuenta bloqueada temporalmente' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      user.failedLogins = (user.failedLogins || 0) + 1;
      if (user.failedLogins >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        user.failedLogins = 0;
      }
      await user.save();
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // success
    user.failedLogins = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    req.session.userId = user._id.toString();
    req.session.role = user.role;

    return res.json({ message: 'Login ok', user: { id: user._id, email: user.email, name: user.name, role: user.role }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function me(req, res) {
  try {
    if (!req.session || !req.session.userId) return res.status(401).json({ error: 'No autenticado' });
    const user = await User.findById(req.session.userId).select('-passwordHash').lean();
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('sid');
    return res.json({ message: 'Logout ok' });
  });
}

module.exports = { register, login, me, logout };
