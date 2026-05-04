const axios = require('axios')

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'
const TOKEN = process.env.TEST_API_TOKEN || ''

const client = axios.create({ baseURL: API, headers: { Authorization: TOKEN ? `Bearer ${TOKEN}` : undefined } })

async function run() {
  try {
    console.log('API:', API)

    // 1. Create rental request (sample payload)
    const createRes = await client.post('/contract/rental-requests', {
      propertyId: process.env.TEST_PROPERTY_ID || 'test-property',
      ownerId: process.env.TEST_OWNER_ID || 'test-owner',
      startDate: '2026-06-01',
      endDate: '2027-06-01',
      proposedRent: 5000000,
      message: 'E2E test request'
    })

    console.log('Create rental request response:', createRes.data)
    const requestId = createRes.data?.requestId || createRes.data?.id

    if (!requestId) throw new Error('No requestId returned')

    // 2. Open holding deposit window (optional)
    const openRes = await client.post('/contract/holding-deposits/open', { requestIds: [requestId], expireMinutes: 60 })
    console.log('Open holding deposit response:', openRes.data)

    // 3. Simulate pay holding deposit
    const payRes = await client.post('/contract/holding-deposits/pay', { requestId, method: 'wallet' })
    console.log('Pay holding deposit response:', payRes.data)

    // 4. Try to fetch my contracts
    const contracts = await client.get('/contract/rental-contracts/my')
    console.log('My contracts count:', Array.isArray(contracts.data) ? contracts.data.length : Object.keys(contracts.data || {}).length)

    console.log('E2E flow finished successfully')
  } catch (e) {
    console.error('E2E flow failed', e.response ? e.response.data : e.message)
    process.exit(1)
  }
}

if (require.main === module) run()
