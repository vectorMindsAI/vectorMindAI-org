/**
 * Database Migration Script
 * Run this script once to drop the old unique index on invites.code
 * 
 * Execute with: node scripts/drop-invites-index.js
 */

require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

async function dropInvitesIndex() {
  try {
    // Connect to MongoDB using MONGODB_URI from .env.local
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables')
    }
    
    console.log('Connecting to MongoDB Atlas...')
    await mongoose.connect(mongoUri)
    
    console.log('Connected successfully')
    
    // Get the organizations collection
    const db = mongoose.connection.db
    const collection = db.collection('organizations')
    
    // Check if collection exists
    const collections = await db.listCollections({ name: 'organizations' }).toArray()
    if (collections.length === 0) {
      console.log('\n✓ Collection "organizations" does not exist yet.')
      console.log('No migration needed. The correct indexes will be created when you first use the app.\n')
      return
    }
    
    // List existing indexes
    console.log('\nExisting indexes:')
    const indexes = await collection.indexes()
    indexes.forEach(index => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key))
    })
    
    // Drop the problematic index
    try {
      console.log('\nDropping invites.code_1 index...')
      await collection.dropIndex('invites.code_1')
      console.log('✓ Successfully dropped invites.code_1 index')
    } catch (error) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('Index invites.code_1 does not exist (already dropped)')
      } else {
        throw error
      }
    }
    
    // List indexes after dropping
    console.log('\nIndexes after dropping:')
    const newIndexes = await collection.indexes()
    newIndexes.forEach(index => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key))
    })
    
    console.log('\n✓ Migration completed successfully!')
    console.log('The new sparse index will be created automatically when the app starts.\n')
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('Database connection closed')
    process.exit(0)
  }
}

dropInvitesIndex()
