import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "../../360kids-backend/node_modules/@electric-sql/pglite/dist/index.js";
import { createApp } from "../../360kids-backend/src/app.js";
import { migrate } from "../../360kids-backend/src/migrations.js";
import { Platform } from "../../360kids-backend/src/platform.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(__dirname, "..");

function makeJwt(sub: string, email: string, aal: "aal1" | "aal2" = "aal1") {
  const b64 = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
    sub,
    email,
    aal,
    exp: Math.floor(Date.now() / 1000) + 86400,
  })}.sig`;
}

async function main() {
  const pg = new PGlite();
  const runQuery = (sql: string, params?: unknown[]) =>
    params === undefined
      ? pg.exec(sql).then((r) => r[0] ?? { rows: [] })
      : pg.query(sql, params);
  const db = {
    query: runQuery,
    connect: async () => ({ query: runQuery, release() {} }),
    end: () => pg.close(),
  } as unknown as Parameters<typeof migrate>[0];

  await migrate(db);
  const platform = new Platform(
    db as unknown as ConstructorParameters<typeof Platform>[0],
    true,
  );

  const users = new Map<
    string,
    { id: string; email: string; password: string; aal: "aal1" | "aal2" }
  >();

  async function seedUser(
    email: string,
    password: string,
    aal: "aal1" | "aal2" = "aal1",
  ) {
    const id = randomUUID();
    users.set(email, { id, email, password, aal });
    return platform.me(id, email);
  }

  // 1. Seed Admin
  const admin = await seedUser("admin@360kids.test", "AdminPass123!", "aal2");
  await pg.query("UPDATE app.profiles SET role='admin' WHERE id=$1", [admin.id]);
  await pg.query(
    `INSERT INTO app.platform_role_grants(user_id,role,granted_by,reason)
     SELECT $1,role,$1,'Local staging test admin'
     FROM (VALUES ('content'),('support'),('finance')) AS g(role)
     ON CONFLICT DO NOTHING`,
    [admin.id],
  );
  const adminActor = await platform.me(admin.id, admin.email);

  // 2. Seed 2 Partners with approved organizations and published activities
  const p1 = await seedUser("partner1@360kids.test", "PartnerPass123!");
  const org1 = await platform.apply(p1, {
    name: "Dubai Robotics Academy",
    description: "STEM, robotics, and coding classes for ages 6–14 in Dubai Marina.",
  });
  await platform.approve(adminActor, org1.id, "approved");
  await platform.createActivity(adminActor, {
    providerId: org1.id,
    title: "Junior Robotics & Coding",
    description: "Build and program interactive robots in small guided groups.",
    category: "Learning",
    area: "Dubai Marina",
    minAge: 6,
    maxAge: 14,
    priceFils: 15000,
    policy: "Full refund up to 48 hours before session start.",
    published: true,
    startsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    cutoffAt: new Date(Date.now() + 6 * 86400000).toISOString(),
    capacity: 10,
  });

  const p2 = await seedUser("partner2@360kids.test", "PartnerPass123!");
  const org2 = await platform.apply(p2, {
    name: "Jumeirah Swim Club",
    description: "Certified swimming and water confidence lessons in Jumeirah.",
  });
  await platform.approve(adminActor, org2.id, "approved");
  await platform.createActivity(adminActor, {
    providerId: org2.id,
    title: "Kids Swimming Foundations",
    description: "Fun, safety-first swimming lessons for beginners and intermediates.",
    category: "Sports",
    area: "Jumeirah",
    minAge: 4,
    maxAge: 10,
    priceFils: 12000,
    policy: "Full refund up to 24 hours before session start.",
    published: true,
    startsAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    cutoffAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    capacity: 8,
  });

  // 3. Seed 2 Parents with 2 children each
  const fam1 = await seedUser("parent1@360kids.test", "ParentPass123!");
  await platform.addChild(fam1, { firstName: "Zayd", surname: "Al Mansoor", ageYears: 8 });
  await platform.addChild(fam1, { firstName: "Lina", surname: "Al Mansoor", birthDate: "2019-04-12" });

  const fam2 = await seedUser("parent2@360kids.test", "ParentPass123!");
  await platform.addChild(fam2, { firstName: "Omar", surname: "Hassan", ageYears: 7 });
  await platform.addChild(fam2, { firstName: "Maya", surname: "Hassan", birthDate: "2020-06-15" });

  // 4. Start local Auth stub
  const authServer = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = chunks.length
      ? JSON.parse(Buffer.concat(chunks).toString("utf8"))
      : {};
    const json = (status: number, data: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    };

    if (req.method === "POST" && url.pathname === "/auth/v1/signup") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      if (!email || password.length < 8) {
        return json(422, { code: "weak_password", message: "Invalid signup" });
      }
      if (users.has(email)) {
        return json(422, { code: "user_already_exists", message: "Exists" });
      }
      const id = randomUUID();
      users.set(email, { id, email, password, aal: "aal1" });
      const token = makeJwt(id, email, "aal1");
      return json(200, {
        access_token: token,
        token_type: "bearer",
        expires_in: 86400,
        refresh_token: `refresh-${id}`,
        user: { id, email, email_confirmed_at: new Date().toISOString(), aud: "authenticated", role: "authenticated" },
        session: { access_token: token, token_type: "bearer", expires_in: 86400, refresh_token: `refresh-${id}`, user: { id, email, email_confirmed_at: new Date().toISOString() } },
      });
    }

    if (req.method === "POST" && url.pathname === "/auth/v1/token") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const u = users.get(email);
      if (!u || u.password !== password) {
        return json(400, { error: "invalid_grant", error_description: "Invalid login credentials" });
      }
      const token = makeJwt(u.id, u.email, u.aal);
      return json(200, {
        access_token: token,
        token_type: "bearer",
        expires_in: 86400,
        refresh_token: `refresh-${u.id}`,
        user: { id: u.id, email: u.email, email_confirmed_at: new Date().toISOString() },
      });
    }

    if (req.method === "GET" && url.pathname === "/auth/v1/user") {
      const token = req.headers.authorization?.replace(/^Bearer /, "");
      if (!token) return json(401, { message: "Unauthorized" });
      try {
        const claims = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"));
        return json(200, { id: claims.sub, email: claims.email, email_confirmed_at: new Date().toISOString(), aud: "authenticated", role: "authenticated" });
      } catch {
        return json(401, { message: "Invalid token" });
      }
    }

    if (req.method === "POST" && url.pathname === "/auth/v1/logout") {
      return json(204, {});
    }

    return json(404, { message: "Not handled in stub" });
  });

  authServer.listen(0, "127.0.0.1");
  await once(authServer, "listening");
  const authPort = (authServer.address() as { port: number }).port;
  const authOrigin = `http://127.0.0.1:${authPort}`;

  const testAuth = async (token: string) => {
    const claims = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"));
    return {
      id: claims.sub as string,
      email: claims.email as string,
      assuranceLevel: (claims.aal ?? "aal1") as "aal1" | "aal2",
      emailVerified: true,
    };
  };

  const webPort = 3000;
  const apiPort = 4000;
  const webOrigin = `http://localhost:${webPort}`;
  const apiOrigin = `http://127.0.0.1:${apiPort}`;

  const apiServer = createApp(webOrigin, platform, testAuth).listen(apiPort, "127.0.0.1");
  await once(apiServer, "listening");

  const nextProc = spawn(
    process.execPath,
    [path.join(webDir, "node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(webPort)],
    {
      cwd: webDir,
      env: {
        ...process.env,
        API_URL: apiOrigin,
        NEXT_PUBLIC_API_URL: apiOrigin,
        SUPABASE_URL: authOrigin,
        SUPABASE_PUBLISHABLE_KEY: "synthetic-anon-key",
        NEXT_PUBLIC_SUPABASE_URL: authOrigin,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic-anon-key",
      },
      stdio: "inherit",
    },
  );

  console.log(`Local staging server ready at ${webOrigin} (API ${apiOrigin}, Auth ${authOrigin})`);
  nextProc.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
