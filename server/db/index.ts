// NOTE: Modul ini SENGAJA tidak lagi membuat pool pg sendiri. Sebelumnya ia
// mendefinisikan Pool kedua (max 10) yang, bila terimpor, menggandakan koneksi
// per-instance dan berisiko menembus plafon Postgres di autoscale. Sekarang ia
// hanya me-re-export satu pool/db kanonik dari server/db.ts.
import * as schema from "./schema";

export { db, pool } from "../db";
export { schema };
