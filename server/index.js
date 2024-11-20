const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const dotenv = require('dotenv');
const connectDB = require('./db/database');
const EmployeeModel = require("./models/Employee");
const passport = require('passport');
const passportJWT = require('passport-jwt');
const jwt = require('jsonwebtoken');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const resultRoutes = require('./routes/results'); 
const clientInformationRoutes = require('./routes/ClientInformation');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET, 
};

passport.use(new JwtStrategy(jwtOptions, (jwtPayload, done) => {
  EmployeeModel.findById(jwtPayload.id)
    .then(user => {
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    })
    .catch(err => done(err, false));
}));

app.use(passport.initialize());

const checkUserRole = (requiredRoles) => (req, res, next) => {
  if (req.user && requiredRoles.includes(req.user.role)) {
    return next();
  } else {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
};

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  EmployeeModel.findOne({ email: email })
    .then(user => {
      if (user) {
        if (user.password === password) {
          const token = jwt.sign({ id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
          res.json({ token });
        } else {
          res.json("The password is incorrect");
        }
      } else {
        res.json("No record existed");
      }
    })
    .catch(err => res.json(err));
});

app.post("/register", (req, res) => {
  const { name, email, password, role = "user" } = req.body;
  EmployeeModel.create({ name, email, password, role })
    .then(employee => res.json(employee))
    .catch(err => res.json(err));
});

app.get('/admin-dashboard', passport.authenticate('jwt', { session: false }), checkUserRole(['admin', 'superadmin']), (req, res) => {
  EmployeeModel.find()
    .then(employees => res.json({ employees }))
    .catch(err => res.status(500).json({ message: "Server error", error: err }));
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get('/api/current-user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await EmployeeModel.findById(userId).select('name');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ name: user.name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  if (!token) {
    return res.status(401).send({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Invalid token' });
  }
};

app.use('/api', authMiddleware, resultRoutes);
app.use('/api', clientInformationRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.listen(3001, () => {
  console.log("Server is Running");
});
