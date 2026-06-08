# Guía de Configuración e Implementación en Producción

Esta guía detalla los pasos necesarios para desplegar **Smart Caja** en un entorno de producción utilizando un dominio personalizado (ej. `.com`), configurando la autenticación, los pagos con Mercado Pago y asegurando la base de datos de Supabase.

---

## 1. Variables de Entorno de Producción

Debes configurar las siguientes variables de entorno en tu plataforma de hosting (por ejemplo, Vercel) y en tus funciones serverless:

| Variable | Tipo | Descripción | Ejemplo / Valor Recomendado |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública (Client) | URL del proyecto de Supabase. | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública (Client) | Clave anónima pública de Supabase. | Clave API `anon` de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Privada (Server) | Clave de servicio para omitir políticas de RLS en operaciones administrativas (como invitaciones por email). | **¡Mantener en secreto!** (Clave `service_role`) |
| `NEXT_PUBLIC_APP_URL` | Pública (Client) | URL base de la aplicación en producción. | `https://www.cajasmart.com.ar` |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | Pública (Client) | Número de soporte para el botón flotante (con código de país sin +). | `543425162372` (Ejemplo de Argentina) |
| `MERCADOPAGO_ACCESS_TOKEN` | Privada (Server) | Access Token de Mercado Pago (Credenciales de Producción o Sandbox). | `APP_USR-XXXXXX-XXXXXX-...` |
| `RESEND_API_KEY` | Privada (Server) | Clave API de Resend para el envío de correos electrónicos. | `re_XXXXXX...` |

---

## 2. Configuración de Dominio Personalizado en Vercel

Si vas a migrar o lanzar el sitio bajo un dominio propio como `cajasmart.com.ar` en Vercel, sigue estos pasos:

1. **Agregar el dominio en Vercel**:
   - Ve al panel de control de tu proyecto en Vercel.
   - Navega a **Settings > Domains**.
   - Ingresa tu dominio (ej. `cajasmart.com.ar`) y haz clic en **Add**.
   - Vercel te sugerirá agregar tanto `cajasmart.com.ar` como `www.cajasmart.com.ar` (con redirección automática de uno a otro). Se recomienda tener ambos.

2. **Configurar los registros DNS**:
   En el proveedor donde compraste tu dominio (ej. Nic.ar, GoDaddy, Namecheap), edita la zona DNS para apuntar a Vercel:
   - **Registro A** (para el dominio raíz `cajasmart.com.ar`):
     - Name: `@`
     - Value: `76.76.21.21`
   - **Registro CNAME** (para el subdominio `www.cajasmart.com.ar`):
     - Name: `www`
     - Value: `cname.vercel-dns.com`

3. **Verificación y SSL**:
   - Vercel validará automáticamente la propagación de los registros DNS y generará un certificado SSL gratuito mediante Let's Encrypt para habilitar **HTTPS** de forma automática y obligatoria.
   - Una vez propagado (puede tomar de 5 minutos a 24 horas), tu aplicación estará disponible bajo `https://www.cajasmart.com.ar`.

---

## 3. Configuración de Autenticación (Supabase Auth)

Cuando cambies el dominio de la aplicación (de `localhost` o el subdominio provisional de Vercel al dominio final `.com`), debes actualizar los redireccionamientos de Supabase para evitar fallas al iniciar sesión o registrarse:

1. Ve a la consola de [Supabase](https://supabase.com).
2. Selecciona tu proyecto y ve a **Authentication > URL Configuration**.
3. Modifica la **Site URL**:
   - Cámbiala al dominio de tu producción: `https://www.cajasmart.com.ar`
4. En **Redirect URLs**, agrega las URLs de redireccionamiento adicionales para el flujo de autenticación, tales como:
   - `https://www.cajasmart.com.ar/**`
   - `https://www.cajasmart.com.ar/login`
5. Si utilizas proveedores OAuth (como Google o Facebook):
   - Ve a **Authentication > Providers** en Supabase.
   - Asegúrate de actualizar las credenciales del cliente en la consola respectiva (Google Cloud, Meta for Developers) y configurar el callback URL provisto por Supabase.

---

## 4. Mercado Pago (Checkout Pro y Webhooks)

### A. Credenciales de Producción
1. Ve al panel de [Mercado Pago Developers](https://www.mercadopago.com.ar/developers).
2. Accede a **Tus Integraciones** y selecciona tu aplicación de Smart Caja.
3. Ve a **Credenciales de producción**.
4. Copia el **Access Token** y asígnalo a la variable `MERCADOPAGO_ACCESS_TOKEN` en las variables de entorno de tu servidor de producción.

### B. Configuración del Webhook para Notificación Instantánea de Pago (IPN)
Mercado Pago notifica a tu servidor cuando un pago es aprobado para actualizar la suscripción del negocio en la base de datos:

1. En el panel de Mercado Pago Developers, ve a **Webhooks** o **Notificaciones IPN**.
2. Configura la URL de producción del webhook. El endpoint en tu app de Smart Caja es:
   `https://www.cajasmart.com.ar/api/webhooks/mercadopago`
3. Selecciona los eventos que deseas recibir:
   - `payment` (Pago)
   - `subscription_authorized` (Suscripción autorizada - si aplica)
4. Asegúrate de que el endpoint sea accesible públicamente y no esté bloqueado por algún firewall. El webhook procesará el estado `approved` para activar/renovar el plan correspondiente en la tabla `tenants`.

---

## 5. Seguridad en Supabase (Políticas de Seguridad a Nivel de Fila - RLS)

En producción, la base de datos **debe tener activado RLS** en todas las tablas sensibles para garantizar que un negocio (tenant) no pueda ver ni alterar datos de otro negocio.

### Lista de Control de RLS:
1. **Verificar RLS habilitado**:
   Asegúrate de que las políticas RLS estén activas (`Enable Row Level Security`) en las tablas clave:
   - `tenants`
   - `users`
   - `branches`
   - `products`
   - `categories`
   - `sales`
   - `sale_items`
   - `orders`
   - `order_items`
   - `installment_plans`
   - `shifts`
   
2. **Ejemplo de Política para Multi-inquilino (Multi-tenant)**:
   Las filas de datos deben filtrarse usando el ID del tenant asociado al usuario actual. Por ejemplo, para la tabla `products`:
   ```sql
   -- Política de Selección (Lectura)
   CREATE POLICY "Users can view products of their tenant" ON products
   FOR SELECT USING (
     tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
   );

   -- Política de Inserción (Escritura)
   CREATE POLICY "Users can insert products into their tenant" ON products
   FOR INSERT WITH CHECK (
     tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
   );
   ```

---

## 6. Monitoreo y Mantenimiento

- **Logs de Servidor (Vercel)**: Configura herramientas como Logflare o Datadog si necesitas auditoría de logs detallados.
- **Sentry / Error Tracking**: Integra Sentry en el archivo `next.config.js` para detectar errores en el cliente o llamadas API fallidas en tiempo real.
- **Backups automatizados**: Habilita copias de seguridad diarias en el panel de Supabase (disponibles en planes Pro o superiores) para evitar pérdidas de datos en caso de incidentes.
