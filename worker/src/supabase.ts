import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }

  supabaseClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return supabaseClient
}

export async function uploadToSupabase(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  const client = getSupabaseClient()

  const { error } = await client.storage
    .from('ai-outputs')
    .upload(path, buffer, {
      contentType,
      upsert: true,
    })

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`)
  }

  const { data } = client.storage.from('ai-outputs').getPublicUrl(path)
  return data.publicUrl
}
