// prisma/seed.ts — Seeds a test app, API key, and product for E2E testing
import { PrismaClient } from '@prisma/client'
import { createHash, randomBytes } from 'crypto'
import Stripe from 'stripe'

const prisma = new PrismaClient()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

async function main() {
  console.log('Seeding database...')

  // 1. Create test app
  const app = await prisma.app.upsert({
    where: { bundleId: 'com.eupay.testapp' },
    update: {},
    create: {
      name: 'EUPay Test App',
      bundleId: 'com.eupay.testapp',
      clerkUserId: 'test_clerk_user_001',
    },
  })
  console.log('App created:', app.id)

  // 2. Generate API key
  const rawKey = `eupay_${randomBytes(32).toString('hex')}`
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.slice(0, 12)

  const existingKey = await prisma.apiKey.findFirst({
    where: { appId: app.id, name: 'Development' },
  })

  if (!existingKey) {
    await prisma.apiKey.create({
      data: {
        appId: app.id,
        keyPrefix,
        keyHash,
        name: 'Development',
        isActive: true,
      },
    })
    console.log('')
    console.log('=== API KEY (save this — shown only once) ===')
    console.log(rawKey)
    console.log('==============================================')
    console.log('')
  } else {
    console.log('API key already exists, skipping generation')
  }

  // 3. Create Stripe product + price, then save to DB
  const existingProduct = await prisma.product.findFirst({
    where: { appId: app.id, name: 'Pro Monthly' },
  })

  if (!existingProduct) {
    const stripeProduct = await stripe.products.create({
      name: 'EUPay Test — Pro Monthly',
      tax_code: 'txcd_10103001', // SaaS
      metadata: { appId: app.id },
    })

    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: 999, // €9.99
      currency: 'eur',
      recurring: { interval: 'month' },
      tax_behavior: 'exclusive',
    })

    const product = await prisma.product.create({
      data: {
        appId: app.id,
        name: 'Pro Monthly',
        description: 'Pro subscription — billed monthly',
        productType: 'SUBSCRIPTION',
        stripePriceId: stripePrice.id,
        stripeProductId: stripeProduct.id,
        amountCents: 999,
        currency: 'eur',
        interval: 'month',
        intervalCount: 1,
        trialDays: 7,
        isActive: true,
      },
    })
    console.log('Product created:', product.id, '(Stripe Price:', stripePrice.id, ')')
  } else {
    console.log('Product already exists:', existingProduct.id)
  }

  // 4. Create a one-time product too
  const existingOneTime = await prisma.product.findFirst({
    where: { appId: app.id, name: 'Lifetime Pro' },
  })

  if (!existingOneTime) {
    const stripeProduct2 = await stripe.products.create({
      name: 'EUPay Test — Lifetime Pro',
      tax_code: 'txcd_10103001',
      metadata: { appId: app.id },
    })

    const stripePrice2 = await stripe.prices.create({
      product: stripeProduct2.id,
      unit_amount: 4999, // €49.99
      currency: 'eur',
      tax_behavior: 'exclusive',
    })

    const product2 = await prisma.product.create({
      data: {
        appId: app.id,
        name: 'Lifetime Pro',
        description: 'One-time lifetime pro access',
        productType: 'ONE_TIME',
        stripePriceId: stripePrice2.id,
        stripeProductId: stripeProduct2.id,
        amountCents: 4999,
        currency: 'eur',
        isActive: true,
      },
    })
    console.log('Product created:', product2.id, '(Stripe Price:', stripePrice2.id, ')')
  } else {
    console.log('One-time product already exists:', existingOneTime.id)
  }

  console.log('\nSeed complete! App ID:', app.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
