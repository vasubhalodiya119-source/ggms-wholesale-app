import { NextResponse } from 'next/server'

export async function GET() {
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const response: any = {
    hasEnvVar: !!envJson,
    envVarLength: envJson ? envJson.length : 0,
    errors: []
  }

  try {
    const admin = require('firebase-admin')
    response.firebaseAdminLoaded = true

    if (envJson) {
      try {
        const serviceAccount = JSON.parse(envJson)
        response.jsonParsed = true
        response.projectId = serviceAccount.project_id
        response.clientEmail = serviceAccount.client_email

        try {
          const { cert } = require('firebase-admin/app')
          if (!admin.apps.length) {
            admin.initializeApp({
              credential: cert(serviceAccount)
            })
          }
          response.initialized = true
        } catch (initErr: any) {
          response.errors.push('Init Error: ' + initErr.message)
        }
      } catch (parseErr: any) {
        response.errors.push('JSON Parse Error: ' + parseErr.message)
      }
    } else {
      response.errors.push('FIREBASE_SERVICE_ACCOUNT_JSON env var is missing')
    }
  } catch (e: any) {
    response.errors.push('General Error: ' + e.message)
  }

  return NextResponse.json(response)
}
