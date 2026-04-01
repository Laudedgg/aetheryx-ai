import { NextRequest, NextResponse } from 'next/server'

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || ''
const HUBSPOT_API = 'https://api.hubapi.com'

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
  }
}

/**
 * POST /api/hubspot
 * Actions: create_contact, create_deal, update_deal, get_contact, search_contact
 */
export async function POST(request: NextRequest) {
  if (!HUBSPOT_TOKEN) {
    return NextResponse.json({ success: false, error: 'HUBSPOT_ACCESS_TOKEN not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create_contact': {
        const { email, firstname, lastname, phone, company } = body
        if (!email) return NextResponse.json({ success: false, error: 'email required' }, { status: 400 })

        const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            properties: {
              email,
              firstname: firstname || '',
              lastname: lastname || '',
              phone: phone || '',
              company: company || '',
            },
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          // If contact exists, try to find and return it
          if (res.status === 409) {
            const existing = await searchContact(email)
            if (existing) return NextResponse.json({ success: true, action: 'existing_contact', contact: existing })
          }
          return NextResponse.json({ success: false, error: err.message || `HubSpot error ${res.status}`, details: err }, { status: res.status })
        }

        const contact = await res.json()
        return NextResponse.json({ success: true, action: 'contact_created', contact })
      }

      case 'create_deal': {
        const { dealname, amount, pipeline, dealstage, contact_id } = body
        if (!dealname) return NextResponse.json({ success: false, error: 'dealname required' }, { status: 400 })

        const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/deals`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            properties: {
              dealname,
              amount: amount || '',
              pipeline: pipeline || 'default',
              dealstage: dealstage || 'appointmentscheduled',
            },
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          return NextResponse.json({ success: false, error: err.message || `HubSpot error ${res.status}`, details: err }, { status: res.status })
        }

        const deal = await res.json()

        // Associate deal with contact if contact_id provided
        if (contact_id) {
          await fetch(`${HUBSPOT_API}/crm/v3/objects/deals/${deal.id}/associations/contacts/${contact_id}/3`, {
            method: 'PUT',
            headers: headers(),
          })
        }

        return NextResponse.json({ success: true, action: 'deal_created', deal })
      }

      case 'update_deal': {
        const { deal_id, properties } = body
        if (!deal_id) return NextResponse.json({ success: false, error: 'deal_id required' }, { status: 400 })

        const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/deals/${deal_id}`, {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({ properties }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          return NextResponse.json({ success: false, error: err.message || `HubSpot error ${res.status}` }, { status: res.status })
        }

        const deal = await res.json()
        return NextResponse.json({ success: true, action: 'deal_updated', deal })
      }

      case 'get_contact': {
        const { contact_id, email } = body
        if (contact_id) {
          const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/${contact_id}`, { headers: headers() })
          if (!res.ok) return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 })
          const contact = await res.json()
          return NextResponse.json({ success: true, contact })
        }
        if (email) {
          const contact = await searchContact(email)
          if (contact) return NextResponse.json({ success: true, contact })
          return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 })
        }
        return NextResponse.json({ success: false, error: 'contact_id or email required' }, { status: 400 })
      }

      case 'search_contact': {
        const { query } = body
        if (!query) return NextResponse.json({ success: false, error: 'query required' }, { status: 400 })
        const contact = await searchContact(query)
        return NextResponse.json({ success: true, contact: contact || null })
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}. Use: create_contact, create_deal, update_deal, get_contact, search_contact` }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'HubSpot error' }, { status: 500 })
  }
}

async function searchContact(email: string) {
  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      filterGroups: [{
        filters: [{ propertyName: 'email', operator: 'EQ', value: email }],
      }],
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.results?.[0] || null
}
