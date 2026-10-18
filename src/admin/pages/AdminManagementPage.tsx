import { Plus, Search } from 'lucide-react'

type Props = { section: 'Products' | 'Categories' | 'Inventory' | 'Orders' | 'Reports' }

const config: Record<Props['section'], { description: string; columns: string[]; empty: string }> = {
  Products: { description: 'Create and update the products customers can browse.', columns: ['PRODUCT', 'CATEGORY', 'PRICE', 'AVAILABILITY', 'ACTIONS'], empty: 'Product records will appear here when a database is connected.' },
  Categories: { description: 'Organize catalogue products into browseable categories.', columns: ['CATEGORY', 'PRODUCTS', 'UPDATED', 'ACTIONS'], empty: 'No categories are loaded. Connect the product catalogue to manage real categories.' },
  Inventory: { description: 'Review stock levels and identify items that need attention.', columns: ['PRODUCT', 'REFERENCE', 'ON HAND', 'STATUS', 'UPDATED'], empty: 'Live inventory and low-stock alerts require connected stock records.' },
  Orders: { description: 'Review order records and customer enquiries.', columns: ['REFERENCE', 'CUSTOMER', 'DATE', 'STATUS', 'TOTAL'], empty: 'Incoming enquiries and orders will appear here when recorded in the backend.' },
  Reports: { description: 'Review recorded sales for a selected reporting period.', columns: ['PERIOD', 'ORDERS', 'RECORDED SALES', 'STATUS'], empty: 'There are no sales records to summarize. No sample revenue is shown.' },
}

export function AdminManagementPage({ section }: Props) {
  const page = config[section]
  return (
    <>
      <div className="admin-page-heading"><div><h1>{section}</h1><p>{page.description}</p></div>{section === 'Products' && <button className="button button-primary" disabled title="Available when the backend is connected"><Plus size={14} /> ADD PRODUCT</button>}</div>
      {section === 'Reports' && <div className="admin-actions"><span className="prototype-note">Sales summaries are based on actual backend transactions.</span><label>From <input type="date" disabled aria-label="Report start date" /></label><label>To <input type="date" disabled aria-label="Report end date" /></label></div>}
      {(section === 'Products' || section === 'Orders') && <div className="admin-actions"><label className="search-field"><Search size={14} /><input disabled placeholder={`Search ${section.toLowerCase()} (backend required)`} /></label><span className="prototype-note">No live records</span></div>}
      <section className="admin-panel"><table className="admin-table"><thead><tr>{page.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody><tr><td colSpan={page.columns.length}><div className="admin-empty">{page.empty}</div></td></tr></tbody></table></section>
      <div className="admin-warning">Preview interface only. Product changes, image uploads, stock updates, order management, and reports require authenticated backend services.</div>
    </>
  )
}
