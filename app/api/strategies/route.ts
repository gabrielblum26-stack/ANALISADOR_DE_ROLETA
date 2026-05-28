import { NextResponse } from "next/server";
import { q, ensureDbInit } from "../_lib/db";
import { ok, created, bad } from "../_lib/responses";

export async function GET() {
  try {
    await ensureDbInit();
    const { rows } = await q("SELECT * FROM strategies ORDER BY id ASC");
    return ok(rows);
  } catch (err: any) {
    return bad(err.message);
  }
}

export async function POST(req: Request) {
  try {
    await ensureDbInit();
    const { name, nums, color } = await req.json();

    if (!name || !nums || !Array.isArray(nums)) {
      return bad("Nome e números são obrigatórios");
    }

    const { rows } = await q(
      "INSERT INTO strategies (name, nums, color) VALUES ($1, $2, $3) RETURNING *",
      [name, nums, color || "#3b82f6"]
    );

    return created(rows[0]);
  } catch (err: any) {
    return bad(err.message);
  }
}
