// Vercel function: the whole Market API (src/app.js) behind one function.
// vercel.json sends every path here; Express routes on the original URL.
import app from "../src/app.js";

export default app;
