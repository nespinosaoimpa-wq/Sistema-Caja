export async function generateMetadata({ params }) {
  const { slug } = await params
  return {
    title: `Tienda | Smart Caja`,
    description: `Realizá tu pedido online`,
    robots: 'index, follow',
  }
}

export default function TiendaLayout({ children }) {
  return children
}
