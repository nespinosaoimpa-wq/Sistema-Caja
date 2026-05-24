import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://cdaqvqhcfuyxitnpsesq.supabase.co',
  'sb_publishable_IPq6vXe2V1VZ9dgk_WLgdw_d7eL_pwm'
)

async function test() {
  const { data: user } = await supabase.auth.signInWithPassword({
    email: 'test@example.com', // wait, I don't know their user. 
  })
  
  // Without auth, let's just do a select
  const { data, error } = await supabase.from('products').select('*')
  console.log('Products:', data, error)
  
  const { data: cat, error: catErr } = await supabase.from('categories').select('*')
  console.log('Categories:', cat, catErr)
}

test()
