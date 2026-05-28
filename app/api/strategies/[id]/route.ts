import { NextResponse } from "next/server";
import { q, ensureDbInit } from "../../_lib/db";
import { ok, bad } from "../../_lib/responses";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await ensureDbInit();
    const { name, nums, color } = await req.json();

    if (!name || !nums || !Array.isArray(nums)) {
      return bad("Nome e números são obrigatórios");
    }

    const { rows } = await q(
      "UPDATE strategies SET name = $1, nums = $2, color = $3, updated_at = now() WHERE id = $4 RETURNING *",
      [name, nums, color, params.id]
    );

    if (rows.length === 0) return bad("Estratégia não encontrada", 404);

    return ok(rows[0]);
  } catch (err: any) {
    return bad(err.message);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await ensureDbInit();
    const { rowCount } = await q("DELETE FROM strategies WHERE id = $1", [params.id]);

    if (rowCount === 0) return bad("Estratégia não encontrada", 404);

    return ok({ success: true });
  } catch (err: any) {
    return bad(err.message);
  }
}
