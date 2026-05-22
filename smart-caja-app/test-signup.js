const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cdaqvqhcfuyxitnpsesq.supabase.co',
  'sb_publishable_IPq6vXe2V1VZ9dgk_WLgdw_d7eL_pwm'
);

async function testSignup() {
  console.log('1. Signing up user...');
  const email = `test-${Date.now()}@example.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: { data: { full_name: 'Test User' } }
  });

  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }
  
  const userId = authData.user?.id;
  console.log('User created:', userId);

  console.log('2. Creating tenant...');
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: 'Test Business',
      slug: `test-${Date.now()}`,
      business_type: 'general',
      email,
    })
    .select()
    .single();

  if (tenantError) {
    console.error('Tenant Error:', tenantError);
    return;
  }
  console.log('Tenant created:', tenantData.id);

  console.log('3. Creating profile...');
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      tenant_id: tenantData.id,
      full_name: 'Test User',
      email,
      role: 'owner',
    });

  if (profileError) {
    console.error('Profile Error:', profileError);
    return;
  }
  console.log('Profile created');

  console.log('4. Creating category...');
  const { error: catError } = await supabase.from('categories').insert({
    tenant_id: tenantData.id,
    name: 'General',
    icon: '📦',
    color: '#7C3AED',
  });

  if (catError) {
    console.error('Category Error:', catError);
    return;
  }
  console.log('Category created. ALL SUCCESS!');
}

testSignup();
