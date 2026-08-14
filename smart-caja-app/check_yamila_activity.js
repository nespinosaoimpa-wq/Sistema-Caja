const fs = require('fs');
const path = require('path');

// Read config from .env.local
const envPath = path.join(__dirname, '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)$/m);
  const keyMatch = envContent.match(/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)$/m);
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) supabaseKey = keyMatch[1].trim();
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Could not load Supabase URL or Key from .env.local');
  process.exit(1);
}

async function request(pathStr, options = {}) {
  const url = `${supabaseUrl}/rest/v1${pathStr}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP error ${response.status}: ${text}`);
  }
  return response.json();
}

async function main() {
  const tenantId = '5ef6e317-9065-4a82-8f08-93e95ec25aa8'; // Yamila's tenant ID
  console.log(`Buscando actividad para el comercio con ID: ${tenantId}\n`);

  const tables = [
    { name: 'categories', label: 'Categorías registradas' },
    { name: 'products', label: 'Productos cargados' },
    { name: 'customers', label: 'Clientes creados' },
    { name: 'shifts', label: 'Turnos / Cierres de Caja' },
    { name: 'sales', label: 'Ventas registradas' },
    { name: 'cash_movements', label: 'Movimientos de caja manuales' },
    { name: 'stock_movements', label: 'Movimientos de stock' },
    { name: 'work_orders', label: 'Órdenes de Trabajo' },
    { name: 'branches', label: 'Sucursales' }
  ];

  try {
    const activityReport = [];

    for (const table of tables) {
      // Query count and order by created_at desc to find latest activity
      const url = `/${table.name}?tenant_id=eq.${tenantId}&order=created_at.desc&select=created_at`;
      const records = await request(url);
      
      const count = records.length;
      const latest = count > 0 ? new Date(records[0].created_at) : null;

      activityReport.push({
        label: table.label,
        count,
        latest
      });
    }

    console.log('--- REPORTE DE ACTIVIDAD POR COMPONENTE ---');
    let maxDate = null;
    let lastActionType = '';

    activityReport.forEach(item => {
      const dateStr = item.latest ? item.latest.toLocaleString('es-AR') : 'Nunca';
      console.log(`- ${item.label}: ${item.count} (Última vez: ${dateStr})`);
      if (item.latest) {
        if (!maxDate || item.latest > maxDate) {
          maxDate = item.latest;
          lastActionType = item.label;
        }
      }
    });

    console.log('\n--- CONCLUSIÓN ---');
    if (maxDate) {
      console.log(`Última interacción detectada: ${maxDate.toLocaleString('es-AR')} en "${lastActionType}".`);
    } else {
      console.log('No se detectó ninguna interacción en base de datos. Es posible que solo haya navegado la interfaz sin realizar registros o que aún esté configurando la cuenta.');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
