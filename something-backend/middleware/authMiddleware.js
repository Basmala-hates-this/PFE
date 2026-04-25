//so middleware will only check for token of jwt from the login/register if it passed then ok if now then block"get da hellouta here"
//The token will come from the request headers. Specifically a header called Authorization that looks like this:
// Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
// The word Bearer is just a convention that means "the person bearing this token." You strip that word out and you're left with the actual token to verify.
const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    if (!req.headers.authorization) {
    return res.status(401).json({ message: "No token provided" });
}
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }
    
   try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
} catch (err) {
  return res.status(401).json({ message: "Token is not valid" });
}
  
}
const guestBlock = (req, res, next) => {
  if (req.user?.role === "guest") {
    return res.status(403).json({ message: "Guests cannot perform this action" });
  }
  next();
};



const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  
  const token = authHeader.split(' ')[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // invalid token, continue as guest
  }
  next();
};

module.exports = protect;
module.exports.guestBlock = guestBlock;
module.exports.optionalAuth = optionalAuth;