// Local / self-hosted API server (npm start). On Vercel, api/index.js serves
// the same app as a function.
import app from "./app.js";

const PORT = process.env.PORT || 8090;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Zarai Mandi API listening on :${PORT}`);
});
