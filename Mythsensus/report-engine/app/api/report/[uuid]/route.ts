// ============================================================
//  GET /api/report/[uuid] — Fetch report HTML by public UUID
//  No auth required — UUID is the access token
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .from('reports')
      .select('html_content, report_type, generated_at, expires_at')
      .eq('report_uuid', params.uuid)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Report has expired' }, { status: 410 })
    }

    return NextResponse.json({
      html_content:  data.html_content,
      report_type:   data.report_type,
      generated_at:  data.generated_at,
    })

  } catch (err) {
    console.error('[/api/report/uuid]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
