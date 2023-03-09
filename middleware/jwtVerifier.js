import OktaJwtVerifier from "@okta/jwt-verifier";

const OKTA_DOMAIN = process.env.OKTA_DOMAIN;
const AUTH_SERVER_ID = process.env.AUTH_SERVER_ID;

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: `https://${OKTA_DOMAIN}/oauth2/${AUTH_SERVER_ID}`,
});

export const oktaAuthRequired = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/Bearer (.+)/);

  if (!match) {
    res.status(401);
    return next("Unauthorized");
  }

  const accessToken = match[1];
  const audience = "api://default";
  return oktaJwtVerifier
    .verifyAccessToken(accessToken, audience)
    .then((jwt) => {
      req.jwt = jwt;
      next();
    })
    .catch((err) => {
      res.status(401).json(err.message);
    });
};
